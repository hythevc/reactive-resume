import assert from "node:assert/strict";
import test from "node:test";
import { legacyWorkspacePath } from "./workspace-navigation";

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
