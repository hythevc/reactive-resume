import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorkspace } from "./workspace";
import { decodeWorkspaceBackup, encodeWorkspaceBackup, WORKSPACE_BACKUP_MAX_BYTES } from "./workspace-backup";

test("downloaded backup text restores every field and known legacy formats", () => {
	const data = createWorkspace();
	data.profile.name = "Synthetic backup candidate";
	data.jobs[0].introduction = "Synthetic reviewed introduction";
	data.jobs[0].interest = "Shortlisted";
	data.linkedin.about = "Synthetic custom LinkedIn draft";
	const text = encodeWorkspaceBackup(data);
	assert.deepEqual(decodeWorkspaceBackup(text), data);
	assert.deepEqual(decodeWorkspaceBackup(JSON.stringify(data)), data);
	assert.deepEqual(decodeWorkspaceBackup(JSON.stringify({ version: 1, data })), data);
	assert.deepEqual(
		decodeWorkspaceBackup(
			JSON.stringify({ version: 2, revision: "test-revision", generation: "test-generation", data }),
		),
		data,
	);
});

test("a valid Unicode backup larger than four MiB can be exported and restored", () => {
	const data = createWorkspace();
	data.resumes = Array.from({ length: 40 }, (_, index) => ({
		...data.resumes[0],
		id: `synthetic-${index}`,
		profile: { ...data.profile, summary: "界".repeat(40_000) },
	}));
	const text = encodeWorkspaceBackup(data);
	assert.ok(new TextEncoder().encode(text).byteLength > 4 * 1024 * 1024);
	assert.deepEqual(decodeWorkspaceBackup(text), data);
});

test("invalid and future backup formats reject without accepting partial data", () => {
	const data = createWorkspace();
	assert.throws(() => decodeWorkspaceBackup("{invalid"));
	assert.throws(() =>
		decodeWorkspaceBackup(
			JSON.stringify({ format: "careeros-workspace", version: 999, createdAt: new Date().toISOString(), data }),
		),
	);
	assert.throws(() =>
		decodeWorkspaceBackup(JSON.stringify({ version: 1, data: { ...data, profile: { name: "invalid" } } })),
	);
	assert.throws(() => decodeWorkspaceBackup(" ".repeat(WORKSPACE_BACKUP_MAX_BYTES + 1)), /64 MiB/);
});
