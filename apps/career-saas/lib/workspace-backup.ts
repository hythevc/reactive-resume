import { z } from "zod";
import { parseStoredWorkspace, parseWorkspace, type Workspace } from "./workspace";

export const WORKSPACE_BACKUP_MAX_BYTES = 64 * 1024 * 1024;

const backupSchema = z
	.object({
		format: z.literal("careeros-workspace"),
		version: z.literal(1),
		createdAt: z.string().datetime(),
		data: z.unknown(),
	})
	.strict();

const revisedStorageSchema = z
	.object({
		version: z.literal(2),
		revision: z.string().min(1),
		generation: z.string().min(1),
		data: z.unknown(),
	})
	.strict();

export function workspaceBackupBytes(text: string): number {
	return new TextEncoder().encode(text).byteLength;
}

function checkSize(text: string) {
	if (workspaceBackupBytes(text) > WORKSPACE_BACKUP_MAX_BYTES) {
		throw new Error("Workspace exceeds the 64 MiB backup limit. Shorten or remove entries before exporting.");
	}
}

export function encodeWorkspaceBackup(data: Workspace): string {
	const text = JSON.stringify(
		{
			format: "careeros-workspace",
			version: 1,
			createdAt: new Date().toISOString(),
			data: parseWorkspace(data),
		},
		null,
		2,
	);
	checkSize(text);
	return text;
}

export function decodeWorkspaceBackup(text: string): Workspace {
	checkSize(text);
	const value: unknown = JSON.parse(text);
	if (typeof value === "object" && value !== null && "format" in value) {
		return parseWorkspace(backupSchema.parse(value).data);
	}
	if (typeof value === "object" && value !== null && "version" in value) {
		if (value.version === 2) return parseWorkspace(revisedStorageSchema.parse(value).data);
		return parseStoredWorkspace(value);
	}
	return parseWorkspace(value);
}
