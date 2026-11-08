"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
} from "react";
import {
	createWorkspace,
	parseStoredWorkspace,
	workspaceSchema,
	STORAGE_KEY,
	STORAGE_VERSION,
	type Workspace,
} from "./workspace";

type WorkspaceContextValue = {
	data: Workspace;
	setData: Dispatch<SetStateAction<Workspace>>;
	ready: boolean;
	reset: () => void;
};
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const RECOVERY_KEY = `${STORAGE_KEY}.recovery`;
const AUXILIARY_KEYS = ["careeros:linkedin:v1", "career-saas:preparation-ledger:v1"];

export function WorkspaceProvider({ children }: { children: ReactNode }) {
	const [workspaceState, updateWorkspaceState] = useState<{
		data: Workspace;
		validationError: string | null;
	}>(() => ({ data: createWorkspace(), validationError: null }));
	const { data, validationError } = workspaceState;
	const [ready, setReady] = useState(false);
	const [recoveryValue, setRecoveryValue] = useState<string | null>(null);
	const [storageUnavailable, setStorageUnavailable] = useState(false);
	const originalValue = useRef<string | null>(null);
	const readFailed = useRef(false);
	const userChanged = useRef(false);
	const setData = useCallback<Dispatch<SetStateAction<Workspace>>>((value) => {
		userChanged.current = true;
		updateWorkspaceState((current) => {
			const result = workspaceSchema.safeParse(typeof value === "function" ? value(current.data) : value);
			return result.success
				? { data: result.data, validationError: null }
				: {
						data: current.data,
						validationError:
							"This change exceeds workspace limits or contains an invalid value. Your previous data has been kept. Shorten the field or export a backup from Settings.",
					};
		});
	}, []);
	/* oxlint-disable react/set-state-in-effect -- These effects synchronize browser storage after SSR and expose external load/write failures. */
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored !== null) {
				try {
					updateWorkspaceState({
						data: parseStoredWorkspace(JSON.parse(stored)),
						validationError: null,
					});
				} catch {
					originalValue.current = stored;
					setRecoveryValue(stored);
					// Keep the primary key untouched until a deliberate edit or reset.
					// A backup must succeed before a later edit may replace that key.
					try {
						localStorage.setItem(RECOVERY_KEY, stored);
					} catch {
						setStorageUnavailable(true);
					}
				}
			}
			const recovery = localStorage.getItem(RECOVERY_KEY);
			if (recovery !== null && originalValue.current === null) setRecoveryValue(recovery);
		} catch {
			readFailed.current = true;
			setStorageUnavailable(true);
		}
		setReady(true);
	}, []);
	useEffect(() => {
		if (!ready) return;
		if ((originalValue.current !== null || readFailed.current) && !userChanged.current) return;
		try {
			// If reading initially failed, preserve any newly readable value before
			// saving the user's explicit changes to the temporary sample workspace.
			if (readFailed.current) {
				const stored = localStorage.getItem(STORAGE_KEY);
				if (stored !== null) {
					originalValue.current = stored;
					setRecoveryValue(stored);
				}
				readFailed.current = false;
			}
			if (originalValue.current !== null) localStorage.setItem(RECOVERY_KEY, originalValue.current);
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, data }));
			setStorageUnavailable(false);
		} catch {
			setStorageUnavailable(true);
		}
	}, [data, ready]);
	/* oxlint-enable react/set-state-in-effect */
	const reset = useCallback(() => {
		try {
			for (const key of [STORAGE_KEY, RECOVERY_KEY, ...AUXILIARY_KEYS]) localStorage.removeItem(key);
			originalValue.current = null;
			readFailed.current = false;
			setRecoveryValue(null);
			setStorageUnavailable(false);
		} catch {
			setStorageUnavailable(true);
		}
		userChanged.current = true;
		updateWorkspaceState({ data: createWorkspace(), validationError: null });
	}, []);
	function exportRecovery() {
		if (recoveryValue === null) return;
		const url = URL.createObjectURL(new Blob([recoveryValue], { type: "text/plain;charset=utf-8" }));
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "career-os-workspace-recovery.txt";
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1_000);
	}
	return (
		<WorkspaceContext.Provider value={{ data, setData, ready, reset }}>
			{recoveryValue !== null ? (
				<div className="storage-notice" role="alert">
					<p>
						A saved workspace could not be loaded. Your original data is retained for recovery. Export it before
						resetting, or continue editing the sample workspace.
					</p>
					<div className="button-row">
						<button className="button secondary small" onClick={exportRecovery}>
							Export recovery
						</button>
						<button
							className="button secondary small"
							onClick={() => {
								if (window.confirm("Delete saved workspace data and recovery copy, and restore the sample workspace?"))
									reset();
							}}
						>
							Reset demo
						</button>
					</div>
				</div>
			) : null}
			{storageUnavailable ? (
				<div className="storage-notice" role="alert">
					<p>
						Browser storage is unavailable or full. Changes may be lost when you leave. Export a backup from Settings
						before closing this page.
					</p>
				</div>
			) : null}
			{validationError ? (
				<div className="storage-notice" role="alert">
					<p>{validationError}</p>
				</div>
			) : null}
			{children}
		</WorkspaceContext.Provider>
	);
}

export function useWorkspace(): WorkspaceContextValue {
	const context = useContext(WorkspaceContext);
	if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider.");
	return context;
}
