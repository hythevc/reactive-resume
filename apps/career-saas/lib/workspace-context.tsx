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
import { createWorkspace, parseWorkspace, STORAGE_KEY, type Workspace } from "./workspace";
import { encodeWorkspaceBackup } from "./workspace-backup";
import {
	clearWorkspaceRecovery,
	discardResetLegacyWorkspace,
	loadWorkspaceStorage,
	resetWorkspaceStorage,
	saveWorkspaceStorage,
	WORKSPACE_ACTIVE_KEY,
	WORKSPACE_GENERATION_KEY,
	WORKSPACE_RECOVERY_KEY,
	WorkspaceConflictError,
	type WorkspaceStorageSnapshot,
} from "./workspace-storage";

type PersistenceStatus = "loading" | "saved" | "saving" | "unsaved" | "conflict" | "unavailable";
type WorkspaceContextValue = {
	data: Workspace;
	setData: Dispatch<SetStateAction<Workspace>>;
	mutate: (value: SetStateAction<Workspace>) => Promise<boolean>;
	ready: boolean;
	persistenceStatus: PersistenceStatus;
	restore: (data: Workspace) => Promise<boolean>;
	reset: () => Promise<boolean>;
};
type WorkspaceProviderProps = { children: ReactNode };
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
	const [data, updateData] = useState<Workspace>(createWorkspace);
	const dataRef = useRef(data);
	const baseline = useRef<WorkspaceStorageSnapshot | null>(null);
	const [ready, setReady] = useState(false);
	const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>("loading");
	const [recoveryValue, setRecoveryValue] = useState<string | null>(null);
	const [recoveryBlocked, setRecoveryBlocked] = useState(false);
	const [notice, setNotice] = useState("");
	const [error, setError] = useState("");
	const queue = useRef<Promise<unknown>>(Promise.resolve());
	const pending = useRef(0);
	const externalEpoch = useRef(0);
	const unsaved = useRef(false);
	const mounted = useRef(false);
	const resetting = useRef(false);

	const publish = useCallback((snapshot: WorkspaceStorageSnapshot) => {
		baseline.current = snapshot;
		dataRef.current = snapshot.data;
		updateData(snapshot.data);
		setRecoveryValue(snapshot.recovery);
		setRecoveryBlocked(snapshot.invalid);
		unsaved.current = false;
		setPersistenceStatus("saved");
	}, []);

	/* oxlint-disable react/set-state-in-effect -- Hydrate and synchronize external browser storage after SSR, with visible read failures. */
	useEffect(() => {
		mounted.current = true;
		try {
			discardResetLegacyWorkspace(localStorage);
			publish(loadWorkspaceStorage(localStorage));
		} catch {
			setPersistenceStatus("unavailable");
			setError("Browser storage couldn't be read. Changes remain in this tab only. Export a backup before leaving.");
		}
		setReady(true);
		const sync = (event: StorageEvent) => {
			if (
				event.key !== null &&
				![STORAGE_KEY, WORKSPACE_ACTIVE_KEY, WORKSPACE_GENERATION_KEY, WORKSPACE_RECOVERY_KEY].includes(event.key)
			)
				return;
			if (event.key === STORAGE_KEY) {
				try {
					if (localStorage.getItem(WORKSPACE_ACTIVE_KEY) !== null) {
						// A pre-upgrade tab cannot change the active workspace.
						discardResetLegacyWorkspace(localStorage);
						return;
					}
				} catch {
					setError("An older tab is retaining data. Close and reload older tabs before resetting again.");
					return;
				}
			}
			externalEpoch.current += 1;
			if (unsaved.current || pending.current > 0) {
				setPersistenceStatus("conflict");
				setError(
					"Another tab changed or reset this workspace. Export this tab's unsaved work, then load the latest workspace.",
				);
				return;
			}
			try {
				discardResetLegacyWorkspace(localStorage);
				publish(loadWorkspaceStorage(localStorage));
				setNotice("Another tab changed or reset this workspace. Its latest data is now loaded.");
			} catch {
				setPersistenceStatus("unavailable");
				setError("Browser storage couldn't be read. Export a backup before leaving.");
			}
		};
		const beforeUnload = (event: BeforeUnloadEvent) => {
			if (!unsaved.current && pending.current === 0) return;
			event.preventDefault();
		};
		window.addEventListener("storage", sync);
		window.addEventListener("beforeunload", beforeUnload);
		return () => {
			mounted.current = false;
			window.removeEventListener("storage", sync);
			window.removeEventListener("beforeunload", beforeUnload);
		};
	}, [publish]);
	/* oxlint-enable react/set-state-in-effect */

	const change = useCallback(
		(value: SetStateAction<Workspace>, preserveFailed = false): Promise<boolean> => {
			if (resetting.current) return Promise.resolve(false);
			const epoch = externalEpoch.current;
			pending.current += 1;
			setPersistenceStatus("saving");
			const operation = queue.current.then(async () => {
				let attempted: Workspace | null = null;
				try {
					if (!mounted.current) return false;
					const next = parseWorkspace(typeof value === "function" ? value(dataRef.current) : value);
					encodeWorkspaceBackup(next);
					attempted = next;
					if (epoch !== externalEpoch.current) throw new WorkspaceConflictError();
					if (!baseline.current || !navigator.locks) {
						if (preserveFailed) {
							dataRef.current = next;
							updateData(next);
							unsaved.current = true;
						}
						setPersistenceStatus("unavailable");
						setError(
							"Safe browser storage isn't available. Changes remain in this tab only. Export a backup before leaving.",
						);
						return false;
					}
					return await navigator.locks.request(STORAGE_KEY, () => {
						if (epoch !== externalEpoch.current || !baseline.current) throw new WorkspaceConflictError();
						try {
							publish(saveWorkspaceStorage(localStorage, baseline.current, next));
							setError("");
							return true;
						} catch (cause) {
							if (preserveFailed && !(cause instanceof WorkspaceConflictError)) {
								dataRef.current = next;
								updateData(next);
								unsaved.current = true;
							}
							throw cause;
						}
					});
				} catch (cause) {
					if (cause instanceof WorkspaceConflictError) {
						if (preserveFailed && attempted !== null) {
							dataRef.current = attempted;
							updateData(attempted);
							unsaved.current = true;
						}
						setPersistenceStatus("conflict");
						setError(
							"Another tab changed or reset this workspace. Load the latest data before editing. Export this tab first if needed.",
						);
					} else {
						setPersistenceStatus(unsaved.current ? "unsaved" : "unavailable");
						setError(
							"Couldn't save this change. Previous saved data is retained. Check field limits and browser storage, or export a backup before leaving.",
						);
					}
					return false;
				} finally {
					pending.current -= 1;
				}
			});
			queue.current = operation;
			return operation;
		},
		[publish],
	);
	const setData = useCallback<Dispatch<SetStateAction<Workspace>>>(
		(value) => {
			void change(value, true);
		},
		[change],
	);

	const reset = useCallback(async (): Promise<boolean> => {
		if (resetting.current) return false;
		resetting.current = true;
		externalEpoch.current += 1;
		try {
			await queue.current;
			if (!navigator.locks) {
				setError(
					"Safe browser storage isn't available. Close other tabs and clear this site's browser data to remove saved copies.",
				);
				setPersistenceStatus("unavailable");
				return false;
			}
			return await navigator.locks.request(STORAGE_KEY, () => {
				const result = resetWorkspaceStorage(localStorage);
				if (!result.ok) {
					setPersistenceStatus("unavailable");
					setError(
						"Some saved data couldn't be deleted. Close other tabs and clear this site's browser data, then reload.",
					);
					return false;
				}
				externalEpoch.current += 1;
				publish(loadWorkspaceStorage(localStorage));
				setError("");
				setNotice(
					"Local workspace and recovery data deleted. Sample data is loaded. Downloaded files, clipboard contents and email drafts are separate copies.",
				);
				return true;
			});
		} catch {
			setPersistenceStatus("unavailable");
			setError("Couldn't delete saved data. Clear this site's browser data, then reload.");
			return false;
		} finally {
			resetting.current = false;
		}
	}, [publish]);

	function reloadLatest() {
		if (
			unsaved.current &&
			!window.confirm(
				"Discard this tab's unsaved changes and load the latest saved workspace? Export a backup first if needed.",
			)
		)
			return;
		externalEpoch.current += 1;
		try {
			publish(loadWorkspaceStorage(localStorage));
			setError("");
			setNotice("Latest saved workspace loaded.");
		} catch {
			setError("Couldn't load saved data. Export this tab's work and check browser storage.");
		}
	}
	function exportRecovery() {
		if (recoveryValue === null) return;
		const url = URL.createObjectURL(new Blob([recoveryValue], { type: "text/plain;charset=utf-8" }));
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "careeros-workspace-recovery.txt";
		anchor.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
	async function removeRecovery() {
		if (unsaved.current || pending.current > 0 || resetting.current || persistenceStatus === "conflict") {
			setError("Recovery wasn't deleted. Export unsaved work and load the latest saved workspace first.");
			return;
		}
		if (!baseline.current || !navigator.locks) {
			setError("Recovery couldn't be deleted. Check browser storage and try again.");
			return;
		}
		if (!window.confirm("Delete the older recovery copy? Keep a private recovery export first if needed.")) return;
		try {
			await navigator.locks.request(STORAGE_KEY, () => {
				if (!baseline.current || unsaved.current || pending.current > 0 || resetting.current) {
					throw new Error("Unsaved work must be resolved first.");
				}
				const snapshot = clearWorkspaceRecovery(localStorage, baseline.current);
				// Recovery deletion only updates storage metadata, never the user's current working draft.
				baseline.current = snapshot;
				setRecoveryValue(snapshot.recovery);
				setRecoveryBlocked(snapshot.invalid);
			});
			setNotice("Recovery copy deleted.");
			setError("");
		} catch {
			setError(
				"Couldn't delete recovery data. Resolve unsaved changes and restore a valid workspace first, or reset all local data.",
			);
		}
	}

	return (
		<WorkspaceContext.Provider
			value={{ data, setData, mutate: change, ready, persistenceStatus, restore: change, reset }}
		>
			{recoveryValue !== null ? (
				<div className="storage-notice" role="alert">
					<p>
						An older or unreadable workspace is retained for recovery. It may contain personal data removed from the
						current view. Valid known-format recovery files can be restored in Settings; damaged files need repair.
						Photos are excluded.
					</p>
					<div className="button-row">
						<button className="button secondary small" onClick={exportRecovery}>
							Export recovery
						</button>
						<button
							className="button secondary small"
							disabled={recoveryBlocked || persistenceStatus !== "saved"}
							onClick={() => void removeRecovery()}
						>
							Delete recovery copy
						</button>
					</div>
				</div>
			) : null}
			{error ? (
				<div className="storage-notice" role="alert">
					<p>{error}</p>
					<button className="button secondary small" onClick={reloadLatest}>
						Load latest saved workspace
					</button>
				</div>
			) : null}
			{notice ? (
				<div className="storage-notice" role="status">
					<p>{notice}</p>
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
