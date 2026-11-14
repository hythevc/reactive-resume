const workspaceViews = new Set([
	"overview",
	"discovery",
	"resumes",
	"linkedin",
	"photo",
	"jobs",
	"outreach",
	"cloud",
	"settings",
	"plans",
]);

/** Preserve previous workspace bookmarks without consuming public-page anchors. */
export function legacyWorkspacePath(hash: string, search = ""): string | null {
	const view = hash.replace(/^#/, "");
	return workspaceViews.has(view) ? `/app${search}#${view}` : null;
}
