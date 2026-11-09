import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorkspace, STORAGE_KEY } from "./workspace";
import {
	clearWorkspaceRecovery,
	discardResetLegacyWorkspace,
	loadWorkspaceStorage,
	resetWorkspaceStorage,
	saveWorkspaceStorage,
	WORKSPACE_ACTIVE_KEY,
	WORKSPACE_RECOVERY_KEY,
	WORKSPACE_GENERATION_KEY,
	WorkspaceConflictError,
} from "./workspace-storage";

class MemoryStorage {
	values = new Map<string, string>();
	blocked = new Set<string>();
	getItem(key: string) {
		return this.values.get(key) ?? null;
	}
	setItem(key: string, value: string) {
		if (this.blocked.has(key)) throw new Error("Storage unavailable");
		this.values.set(key, value);
	}
	removeItem(key: string) {
		if (this.blocked.has(key)) throw new Error("Storage unavailable");
		this.values.delete(key);
	}
}

test("stale tabs cannot overwrite a newer workspace", () => {
	const storage = new MemoryStorage();
	const first = loadWorkspaceStorage(storage);
	const stale = loadWorkspaceStorage(storage);
	const saved = saveWorkspaceStorage(storage, first, {
		...first.data,
		profile: { ...first.data.profile, name: "New synthetic identity" },
	});
	assert.throws(
		() =>
			saveWorkspaceStorage(storage, stale, { ...stale.data, profile: { ...stale.data.profile, role: "Stale role" } }),
		WorkspaceConflictError,
	);
	assert.equal(loadWorkspaceStorage(storage).data.profile.name, "New synthetic identity");
	const merged = saveWorkspaceStorage(storage, saved, {
		...saved.data,
		profile: { ...saved.data.profile, role: "Reviewed role" },
	});
	assert.equal(merged.data.profile.name, "New synthetic identity");
	assert.equal(merged.data.profile.role, "Reviewed role");
});

test("reset invalidates both populated and previously empty stale tabs", () => {
	const storage = new MemoryStorage();
	const emptyTab = loadWorkspaceStorage(storage);
	const saved = saveWorkspaceStorage(storage, emptyTab, {
		...emptyTab.data,
		profile: { ...emptyTab.data.profile, name: "PRIVATE SYNTHETIC MARKER" },
	});
	assert.equal(resetWorkspaceStorage(storage).ok, true);
	assert.equal(storage.getItem(STORAGE_KEY), null);
	assert.ok(storage.getItem(WORKSPACE_GENERATION_KEY));
	assert.throws(() => saveWorkspaceStorage(storage, saved, saved.data), WorkspaceConflictError);
	assert.throws(() => saveWorkspaceStorage(storage, emptyTab, emptyTab.data), WorkspaceConflictError);
	assert.notEqual(loadWorkspaceStorage(storage).data.profile.name, "PRIVATE SYNTHETIC MARKER");
});

test("legacy storage is readable without writing and migrates only after a deliberate edit", () => {
	const storage = new MemoryStorage();
	const data = createWorkspace();
	const original = JSON.stringify({ version: 1, data });
	storage.setItem(STORAGE_KEY, original);
	const loaded = loadWorkspaceStorage(storage);
	assert.equal(storage.getItem(STORAGE_KEY), original);
	assert.deepEqual(loaded.data, data);
	const saved = saveWorkspaceStorage(storage, loaded, {
		...data,
		profile: { ...data.profile, name: "Migrated candidate" },
	});
	assert.equal(saved.data.profile.name, "Migrated candidate");
	const revised = storage.getItem(WORKSPACE_ACTIVE_KEY);
	assert.ok(revised);
	assert.equal(JSON.parse(revised).version, 2);
});

test("corrupt originals are preserved before replacement and cannot be silently discarded", () => {
	const storage = new MemoryStorage();
	const original = '{"version":999,"private":"SYNTHETIC RECOVERY MARKER"}';
	storage.setItem(STORAGE_KEY, original);
	const loaded = loadWorkspaceStorage(storage);
	assert.equal(loaded.invalid, true);
	assert.equal(storage.getItem(STORAGE_KEY), original);
	storage.blocked.add(WORKSPACE_RECOVERY_KEY);
	assert.throws(() => saveWorkspaceStorage(storage, loaded, loaded.data));
	assert.equal(storage.getItem(STORAGE_KEY), original);
	storage.blocked.clear();
	const saved = saveWorkspaceStorage(storage, loaded, loaded.data);
	assert.equal(saved.recovery, original);
	clearWorkspaceRecovery(storage, saved);
	assert.equal(storage.getItem(WORKSPACE_RECOVERY_KEY), null);
});

test("reset attempts every owned key and reports partial failures without claiming erasure", () => {
	const storage = new MemoryStorage();
	storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, data: createWorkspace() }));
	storage.setItem(WORKSPACE_RECOVERY_KEY, "PRIVATE SYNTHETIC RECOVERY");
	storage.setItem("careeros:linkedin:v1", "PRIVATE SYNTHETIC LEGACY");
	storage.blocked.add(STORAGE_KEY);
	const result = resetWorkspaceStorage(storage);
	assert.equal(result.ok, false);
	assert.ok(result.failedKeys.includes(STORAGE_KEY));
	assert.notEqual(storage.getItem(STORAGE_KEY), null);
	assert.equal(storage.getItem(WORKSPACE_RECOVERY_KEY), null);
	assert.equal(storage.getItem("careeros:linkedin:v1"), null);
});

test("quota failure preserves the last durable workspace", () => {
	const storage = new MemoryStorage();
	const initial = loadWorkspaceStorage(storage);
	const saved = saveWorkspaceStorage(storage, initial, initial.data);
	storage.blocked.add(WORKSPACE_ACTIVE_KEY);
	assert.throws(() =>
		saveWorkspaceStorage(storage, saved, { ...saved.data, profile: { ...saved.data.profile, name: "UNSAVED MARKER" } }),
	);
	assert.notEqual(loadWorkspaceStorage(storage).data.profile.name, "UNSAVED MARKER");
});

test("an over-budget schema-valid edit is rejected before replacing durable state", () => {
	const storage = new MemoryStorage();
	const initial = loadWorkspaceStorage(storage);
	const saved = saveWorkspaceStorage(storage, initial, initial.data);
	const tooLarge = {
		...saved.data,
		contacts: Array.from({ length: 448 }, (_, index) => ({
			...saved.data.contacts[0],
			id: `oversize-${index}`,
			message: "界".repeat(50_000),
		})),
	};
	assert.throws(() => saveWorkspaceStorage(storage, saved, tooLarge), /64 MiB/);
	assert.equal(storage.getItem(WORKSPACE_ACTIVE_KEY), saved.value);
	assert.equal(loadWorkspaceStorage(storage).data.contacts.length, saved.data.contacts.length);
});

test("pre-upgrade writers cannot replace active data or revive reset data", () => {
	const storage = new MemoryStorage();
	const original = createWorkspace();
	original.profile.name = "OLD PRIVATE SYNTHETIC MARKER";
	storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, data: original }));
	const loaded = loadWorkspaceStorage(storage);
	const current = saveWorkspaceStorage(storage, loaded, {
		...loaded.data,
		profile: { ...loaded.data.profile, name: "Current synthetic identity" },
	});
	storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, data: original }));
	assert.equal(loadWorkspaceStorage(storage).data.profile.name, "Current synthetic identity");
	assert.equal(storage.getItem(WORKSPACE_ACTIVE_KEY), current.value);
	assert.equal(resetWorkspaceStorage(storage).ok, true);
	storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, data: original }));
	assert.notEqual(loadWorkspaceStorage(storage).data.profile.name, "OLD PRIVATE SYNTHETIC MARKER");
	discardResetLegacyWorkspace(storage);
	assert.equal(storage.getItem(STORAGE_KEY), null);
});

test("clearing recovery never deletes a valid legacy workspace that has not been migrated", () => {
	const storage = new MemoryStorage();
	const original = JSON.stringify({ version: 1, data: createWorkspace() });
	storage.setItem(STORAGE_KEY, original);
	storage.setItem(WORKSPACE_RECOVERY_KEY, "Older synthetic recovery copy");
	clearWorkspaceRecovery(storage, loadWorkspaceStorage(storage));
	assert.equal(storage.getItem(STORAGE_KEY), original);
	assert.equal(storage.getItem(WORKSPACE_RECOVERY_KEY), null);
});
