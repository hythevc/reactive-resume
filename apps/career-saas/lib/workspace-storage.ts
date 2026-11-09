import { createWorkspace, parseWorkspace, STORAGE_KEY, type Workspace } from "./workspace";
import { decodeWorkspaceBackup, encodeWorkspaceBackup } from "./workspace-backup";

export const WORKSPACE_ACTIVE_KEY = "career-saas.workspace.v2";
export const WORKSPACE_RECOVERY_KEY = `${STORAGE_KEY}.recovery`;
export const WORKSPACE_GENERATION_KEY = `${STORAGE_KEY}.generation`;
const LEGACY_KEYS = ["careeros:linkedin:v1", "career-saas:preparation-ledger:v1"];

export type WorkspaceStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type WorkspaceStorageSnapshot = {
	data: Workspace;
	value: string | null;
	legacyValue: string | null;
	generation: string;
	recovery: string | null;
	invalid: boolean;
};

export class WorkspaceConflictError extends Error {
	constructor() {
		super("Another tab changed or reset this workspace. Reload its latest data before editing.");
		this.name = "WorkspaceConflictError";
	}
}

/** Reads never write sample state. Old JavaScript can write v1, but cannot replace active v2. */
export function loadWorkspaceStorage(storage: WorkspaceStorage): WorkspaceStorageSnapshot {
	const value = storage.getItem(WORKSPACE_ACTIVE_KEY);
	const legacyValue = storage.getItem(STORAGE_KEY);
	const generation = storage.getItem(WORKSPACE_GENERATION_KEY) ?? "legacy";
	const recovery = storage.getItem(WORKSPACE_RECOVERY_KEY);
	// A reset tombstone permanently disables automatic migration from a stale old application's key.
	const source = value ?? (generation === "legacy" ? legacyValue : null);
	if (source === null) return { data: createWorkspace(), value, legacyValue, generation, recovery, invalid: false };
	try {
		const parsed: unknown = JSON.parse(source);
		if (
			value !== null &&
			(typeof parsed !== "object" || parsed === null || !("generation" in parsed) || parsed.generation !== generation)
		) {
			throw new WorkspaceConflictError();
		}
		return {
			data: decodeWorkspaceBackup(source),
			value,
			legacyValue,
			generation,
			recovery: recovery ?? (value !== null ? legacyValue : null),
			invalid: false,
		};
	} catch {
		return { data: createWorkspace(), value, legacyValue, generation, recovery: source, invalid: true };
	}
}

function assertCurrent(storage: WorkspaceStorage, expected: WorkspaceStorageSnapshot) {
	if (
		storage.getItem(WORKSPACE_ACTIVE_KEY) !== expected.value ||
		(storage.getItem(WORKSPACE_GENERATION_KEY) ?? "legacy") !== expected.generation ||
		(expected.value === null &&
			expected.generation === "legacy" &&
			storage.getItem(STORAGE_KEY) !== expected.legacyValue)
	) {
		throw new WorkspaceConflictError();
	}
}

/** Call under the origin's exclusive Web Lock. Revision comparison also rejects stale clients. */
export function saveWorkspaceStorage(
	storage: WorkspaceStorage,
	expected: WorkspaceStorageSnapshot,
	data: Workspace,
): WorkspaceStorageSnapshot {
	assertCurrent(storage, expected);
	const parsed = parseWorkspace(data);
	// The same limit is applied before accepting an edit and before downloading/restoring a backup.
	encodeWorkspaceBackup(parsed);
	if (expected.invalid) {
		const original = expected.value ?? expected.legacyValue;
		if (original !== null) {
			storage.setItem(WORKSPACE_RECOVERY_KEY, original);
			if (storage.getItem(WORKSPACE_RECOVERY_KEY) !== original) throw new Error("Couldn't preserve recovery data.");
		}
	}
	const value = JSON.stringify({
		version: 2,
		revision: crypto.randomUUID(),
		generation: expected.generation,
		data: parsed,
	});
	storage.setItem(WORKSPACE_ACTIVE_KEY, value);
	if (storage.getItem(WORKSPACE_ACTIVE_KEY) !== value) throw new WorkspaceConflictError();
	return loadWorkspaceStorage(storage);
}

export function resetWorkspaceStorage(storage: WorkspaceStorage): { ok: boolean; failedKeys: string[] } {
	const failedKeys: string[] = [];
	// This nonpersonal marker invalidates even empty stale tabs and disables old-client migration.
	try {
		const generation = crypto.randomUUID();
		storage.setItem(WORKSPACE_GENERATION_KEY, generation);
		if (storage.getItem(WORKSPACE_GENERATION_KEY) !== generation) failedKeys.push(WORKSPACE_GENERATION_KEY);
	} catch {
		failedKeys.push(WORKSPACE_GENERATION_KEY);
	}
	for (const key of [WORKSPACE_ACTIVE_KEY, STORAGE_KEY, WORKSPACE_RECOVERY_KEY, ...LEGACY_KEYS]) {
		try {
			storage.removeItem(key);
			if (storage.getItem(key) !== null) failedKeys.push(key);
		} catch {
			failedKeys.push(key);
		}
	}
	return { ok: failedKeys.length === 0, failedKeys };
}

/** Remove stale v1 rewrites after reset. The active v2 key is never affected. */
export function discardResetLegacyWorkspace(storage: WorkspaceStorage): void {
	if (storage.getItem(WORKSPACE_GENERATION_KEY) === null) return;
	storage.removeItem(STORAGE_KEY);
	if (storage.getItem(STORAGE_KEY) !== null) throw new Error("Couldn't remove older browser data.");
}

export function clearWorkspaceRecovery(
	storage: WorkspaceStorage,
	expected: WorkspaceStorageSnapshot,
): WorkspaceStorageSnapshot {
	assertCurrent(storage, expected);
	if (expected.invalid) throw new Error("Restore a valid workspace before deleting its recovery copy.");
	for (const key of [
		WORKSPACE_RECOVERY_KEY,
		...(expected.value !== null || expected.generation !== "legacy" ? [STORAGE_KEY] : []),
	]) {
		storage.removeItem(key);
		if (storage.getItem(key) !== null) throw new Error("Couldn't delete recovery data. Try again.");
	}
	return loadWorkspaceStorage(storage);
}
