import assert from "node:assert/strict";
import test from "node:test";
import {
	legacyWorkspacePath,
	matchesApplicationStage,
	readWorkspaceLocation,
	workspaceHash,
} from "./workspace-navigation";

test("legacy workspace bookmarks reach the new app while public anchors stay public", () => {
	for (const view of [
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
	])
		assert.equal(legacyWorkspacePath(`#${view}`), `/app#${view}`);
	for (const anchor of ["", "#tools", "#faq", "#how-it-works", "#main-content", "#unknown"])
		assert.equal(legacyWorkspacePath(anchor), null);
	assert.equal(legacyWorkspacePath("#jobs", "?from=bookmark"), "/app?from=bookmark#jobs");
});

test("stage and record links survive refresh and legacy entry without accepting unrelated state", () => {
	const hash = workspaceHash("jobs", { stage: "In progress", jobId: "job & one" });
	assert.deepEqual(readWorkspaceLocation(hash), {
		view: "jobs",
		stage: "In progress",
		jobId: "job & one",
		resumeId: undefined,
	});
	assert.equal(legacyWorkspacePath(hash, "?from=bookmark"), `/app?from=bookmark${hash}`);
	assert.deepEqual(
		["Saved", "Draft", "Applied", "Interview"].filter((stage) =>
			matchesApplicationStage(stage as "Saved" | "Draft" | "Applied" | "Interview", readWorkspaceLocation(hash).stage),
		),
		["Draft", "Applied"],
	);
	assert.equal(readWorkspaceLocation("#jobs?stage=unknown").stage, "All");
	assert.equal(readWorkspaceLocation("#unknown?job=private&stage=Interview").view, "overview");
	assert.equal(readWorkspaceLocation("#settings?job=private&resume=other&stage=Interview").jobId, undefined);
	assert.equal(
		readWorkspaceLocation(workspaceHash("resumes", { resumeId: "resume / selected" })).resumeId,
		"resume / selected",
	);
	assert.equal(workspaceHash("settings", { stage: "Interview", jobId: "job-one" }), "#settings");
});
