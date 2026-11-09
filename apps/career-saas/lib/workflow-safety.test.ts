import assert from "node:assert/strict";
import { test } from "node:test";
import {
	careerProfileFromResume,
	updateResumeProfile,
	outboundBlockReason,
	outreachReviewKey,
	introductionReviewKey,
	parseInterviewSchedule,
} from "./workflow-safety";

test("queued resume edits derive each field from the latest version without losing earlier edits", () => {
	const workspace = createWorkspace();
	const id = workspace.resumes[0].id;
	const first = updateResumeProfile(workspace, id, "name", "Fictional Candidate");
	const second = updateResumeProfile(first, id, "role", "Sales Director");
	assert.equal(second.resumes[0].profile.name, "Fictional Candidate");
	assert.equal(second.resumes[0].profile.role, "Sales Director");
	assert.equal(workspace.resumes[0].profile.name, "Alex Morgan");
	assert.equal(second.resumes[1], workspace.resumes[1]);
});
import { createWorkspace } from "./workspace";

test("using a resume as the career profile preserves independent resume versions and other workspace facts", () => {
	const workspace = createWorkspace();
	const resume = {
		...workspace.resumes[0],
		profile: {
			...workspace.profile,
			name: "Fictional Candidate",
			email: "candidate@fictional-career.example",
			role: "Sales Director",
			skills: "Enterprise sales, EMEA leadership",
		},
	};
	const next = careerProfileFromResume(workspace, resume);
	assert.equal(next.profile.name, "Fictional Candidate");
	assert.equal(next.profile.role, "Sales Director");
	assert.equal(next.resumes[0].profile.name, "Alex Morgan");
	assert.equal(workspace.profile.name, "Alex Morgan");
	assert.deepEqual(next.jobs, workspace.jobs);
	assert.deepEqual(next.linkedin, workspace.linkedin);
	next.profile.name = "Changed master";
	assert.equal(resume.profile.name, "Fictional Candidate");
});

test("outbound safeguards block fictional sample identities, recipients and retained sample drafts", () => {
	const workspace = createWorkspace();
	assert.match(outboundBlockReason(workspace.profile, "Hello") ?? "", /sample career profile/i);
	const realProfile = {
		...workspace.profile,
		name: "Fictional Candidate",
		email: "candidate@fictional-career.example",
		experience: "Commercial leader",
	};
	assert.equal(outboundBlockReason(realProfile, "A reviewed introduction"), null);
	assert.match(
		outboundBlockReason(realProfile, "A reviewed introduction", { email: "recruiter@example.test" }) ?? "",
		/sample contact/i,
	);
	assert.match(
		outboundBlockReason(realProfile, "A reviewed introduction", { url: "https://jobs.example.test/example" }) ?? "",
		/sample job/i,
	);
	assert.match(outboundBlockReason(realProfile, "I'm Alex Morgan, a Senior Product Designer.") ?? "", /sample facts/i);
});

test("outreach approval follows the exact recipient, content and current career facts", () => {
	const workspace = createWorkspace();
	const contact = workspace.contacts[0];
	const key = outreachReviewKey(workspace.profile, contact);
	assert.equal(outreachReviewKey({ ...workspace.profile }, { ...contact }), key);
	for (const updates of [
		{ email: "other@example.test" },
		{ company: "Different company" },
		{ message: "Edited message" },
		{ context: "Updated context" },
	]) {
		assert.notEqual(outreachReviewKey(workspace.profile, { ...contact, ...updates }), key);
	}
	assert.notEqual(outreachReviewKey({ ...workspace.profile, role: "New role" }, contact), key);
});

test("introduction approval expires when career facts, goals, job identity or draft changes", () => {
	const workspace = createWorkspace();
	const job = workspace.jobs[0];
	const key = introductionReviewKey(workspace.profile, workspace.goals, job);
	assert.notEqual(introductionReviewKey({ ...workspace.profile, skills: "New skills" }, workspace.goals, job), key);
	assert.notEqual(
		introductionReviewKey(workspace.profile, { ...workspace.goals, team: "New team preference" }, job),
		key,
	);
	assert.notEqual(
		introductionReviewKey(workspace.profile, workspace.goals, { ...job, company: "Changed company" }),
		key,
	);
	assert.notEqual(
		introductionReviewKey(workspace.profile, workspace.goals, { ...job, introduction: "Edited introduction" }),
		key,
	);
});

test("interview scheduling preserves the entered instant and refuses dates without an explicit UTC offset", () => {
	assert.deepEqual(parseInterviewSchedule("2026-07-20T14:00:00+01:00", "Europe/London"), {
		interviewAt: "2026-07-20T13:00:00.000Z",
		interviewTimezone: "Europe/London",
	});
	assert.deepEqual(parseInterviewSchedule("2026-11-20T14:00:00Z", "Europe/London"), {
		interviewAt: "2026-11-20T14:00:00.000Z",
		interviewTimezone: "Europe/London",
	});
	assert.deepEqual(parseInterviewSchedule("", "Europe/London"), {
		interviewAt: null,
		interviewTimezone: "Europe/London",
	});
	assert.throws(() => parseInterviewSchedule("2026-11-20T14:00", "Europe/London"), /UTC offset/);
	assert.throws(() => parseInterviewSchedule("not a date", "Europe/London"), /UTC offset/);
	assert.throws(() => parseInterviewSchedule("2026-02-30T14:00:00Z", "Europe/London"), /valid calendar date/);
	assert.throws(() => parseInterviewSchedule("2026-11-20T14:00:00Z", "Invalid/Zone"), /time zone/);
});
