import type { Job } from "./workspace";

const workspaceViewNames = [
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
] as const;

const workspaceViews = new Set<string>(workspaceViewNames);
const applicationStages = new Set([
	"All",
	"In progress",
	"Saved",
	"Draft",
	"Applied",
	"Interview",
	"Offer",
	"Rejected",
	"Withdrawn",
]);

export type WorkspaceView = (typeof workspaceViewNames)[number];
export type ApplicationStageFilter = "All" | "In progress" | Job["status"];
export type WorkspaceNavigationOptions = { stage?: ApplicationStageFilter; jobId?: string; resumeId?: string };
export type WorkspaceLocation = WorkspaceNavigationOptions & { view: WorkspaceView; stage: ApplicationStageFilter };

function recordId(value: string | null): string | undefined {
	return value && value.length <= 500 ? value : undefined;
}

/** Keep the selected record and stage meaningful when following a link, refreshing or going back. */
export function readWorkspaceLocation(hash: string): WorkspaceLocation {
	const [name, query = ""] = hash.replace(/^#/, "").split("?", 2);
	const view = workspaceViews.has(name) ? (name as WorkspaceView) : "overview";
	const params = new URLSearchParams(query);
	const stage = params.get("stage");
	return {
		view,
		stage: view === "jobs" && stage && applicationStages.has(stage) ? (stage as ApplicationStageFilter) : "All",
		jobId: view === "jobs" ? recordId(params.get("job")) : undefined,
		resumeId: view === "resumes" ? recordId(params.get("resume")) : undefined,
	};
}

export function workspaceHash(view: string, options: WorkspaceNavigationOptions = {}): string {
	const name = workspaceViews.has(view) ? view : "overview";
	const params = new URLSearchParams();
	if (name === "jobs") {
		if (options.stage && options.stage !== "All" && applicationStages.has(options.stage))
			params.set("stage", options.stage);
		const jobId = recordId(options.jobId ?? null);
		if (jobId) params.set("job", jobId);
	}
	const resumeId = recordId(options.resumeId ?? null);
	if (name === "resumes" && resumeId) params.set("resume", resumeId);
	return `#${name}${params.size ? `?${params.toString()}` : ""}`;
}

export function matchesApplicationStage(status: Job["status"], filter: ApplicationStageFilter): boolean {
	return (
		filter === "All" || (filter === "In progress" ? status === "Draft" || status === "Applied" : status === filter)
	);
}

/** Preserve previous workspace bookmarks without consuming public-page anchors. */
export function legacyWorkspacePath(hash: string, search = ""): string | null {
	const view = hash.replace(/^#/, "").split("?", 1)[0];
	return workspaceViews.has(view) ? `/app${search}${hash.startsWith("#") ? hash : `#${hash}`}` : null;
}
