import assert from "node:assert/strict";
import { test } from "node:test";
import {
	applicationSourceChanged,
	createApplication,
	exportApplicationPacket,
	parseApplicationResult,
	reviewApplication,
	type ApplicationPacket,
} from "./application";
import { applicationSchema, createWorkspace, parseWorkspace, type Application, type Profile } from "./workspace";

function fixture() {
	const workspace = createWorkspace();
	const profile: Profile = { ...workspace.profile, skills: "Payroll, Figma, C++, Figma" };
	const job = {
		...workspace.jobs[0],
		description: "Use Figma and C++. The employer asks for 10 years and 90% growth.",
	};
	const application = createApplication(profile, job, "resume-main", "packet-a", "2026-11-10T09:00:00.000Z");
	return { workspace, profile, job, application };
}

function resultFor(packet: ApplicationPacket) {
	return {
		format: "careeros.application-result.v1",
		packetId: packet.packetId,
		input: structuredClone(packet.input),
		resume: structuredClone(packet.input.resume),
		coverLetter: packet.input.coverLetter,
		review: {
			summary: "Compared the final documents with the provided facts and target posting.",
			issues: [] as string[],
		},
	};
}

function withReview(profile: Profile, job: ReturnType<typeof fixture>["job"], application: Application) {
	const packet = exportApplicationPacket(profile, job, application);
	return { ...application, ...parseApplicationResult(resultFor(packet), packet) };
}

test("older workspace jobs receive no application while new snapshots survive validated backups", () => {
	const { workspace, application } = fixture();
	const legacy = {
		...workspace,
		jobs: workspace.jobs.map(({ application: _application, ...job }) => job),
	};
	assert.equal(parseWorkspace(legacy).jobs[0].application, null);
	workspace.jobs[0].application = application;
	assert.deepEqual(parseWorkspace(JSON.parse(JSON.stringify(workspace))).jobs[0].application, application);
	assert.throws(() =>
		parseWorkspace({
			...workspace,
			jobs: workspace.jobs.map((job, index) => (index === 1 ? { ...job, application } : job)),
		}),
	);
	assert.throws(() => applicationSchema.parse({ ...application, approved: true }));
});

test("local tailoring reorders only provided skill labels and preserves identity, history, qualifications and originals", () => {
	const { profile, job } = fixture();
	const before = structuredClone({ profile, job });
	const application = createApplication(profile, job, null, "packet-b", "2026-11-10T09:00:00.000Z");
	assert.equal(application.resume.skills, "Figma, C++, Figma, Payroll");
	assert.equal(application.sourceProfile.skills, profile.skills);
	for (const field of Object.keys(profile) as (keyof Profile)[]) {
		if (field !== "skills") assert.equal(application.resume[field], profile[field]);
	}
	assert.deepEqual({ profile, job }, before);
	assert.ok(!/10 years|90%|grew|increased revenue/i.test(application.coverLetter));
	assert.ok(application.coverLetter.includes(job.company));
	assert.ok(application.coverLetter.includes(job.role));
	assert.ok(application.coverLetter.includes(profile.summary));
	application.resume.summary = "An edited draft.";
	assert.equal(application.sourceProfile.summary, before.profile.summary);
	assert.equal(profile.summary, before.profile.summary);
});

test("source comparison ignores tracker changes but detects all relevant factual edits and missing sources", () => {
	const { profile, job, application } = fixture();
	assert.equal(
		applicationSourceChanged(
			profile,
			{ ...job, status: "Offer", notes: "A new note.", interest: "Passed", interviewAt: "2026-11-11T09:00:00.000Z" },
			application,
		),
		false,
	);
	assert.equal(applicationSourceChanged(null, job, application), true);
	for (const field of ["name", "phone", "experience", "education", "summary", "skills"] as const) {
		assert.equal(
			applicationSourceChanged({ ...profile, [field]: `${profile[field]} changed` }, job, application),
			true,
		);
	}
	for (const field of ["company", "role", "description", "location"] as const) {
		assert.equal(applicationSourceChanged(profile, { ...job, [field]: `${job[field]} changed` }, application), true);
	}
	assert.equal(
		applicationSourceChanged(profile, { ...job, url: "https://changed.example.test/role" }, application),
		true,
	);
});

test("packet export precedes review but rejects stale and missing factual sources", () => {
	const { profile, job, application } = fixture();
	assert.equal(reviewApplication(profile, job, application).canExport, false);
	const packet = exportApplicationPacket(profile, job, application);
	assert.equal(packet.format, "careeros.application-packet.v1");
	assert.equal(packet.packetId, application.id);
	assert.deepEqual(packet.input.sourceProfile, profile);
	assert.throws(() => exportApplicationPacket(null, job, application));
	assert.throws(() => exportApplicationPacket({ ...profile, phone: "123" }, job, application));
	assert.throws(() => exportApplicationPacket(profile, { ...job, description: "A revised posting." }, application));
});

test("review results require a strict current packet echo and cannot approve another job or an edited draft", () => {
	const { profile, job, application } = fixture();
	const packet = exportApplicationPacket(profile, job, application);
	const raw = resultFor(packet);
	assert.throws(() => parseApplicationResult({ ...raw, packetId: "other-packet" }, packet));
	assert.throws(() =>
		parseApplicationResult(
			{ ...raw, input: { ...raw.input, sourceJob: { ...raw.input.sourceJob, company: "Another company" } } },
			packet,
		),
	);
	assert.throws(() =>
		parseApplicationResult(
			{ ...raw, input: { ...raw.input, resume: { ...raw.input.resume, summary: "Changed input." } } },
			packet,
		),
	);
	assert.throws(() => parseApplicationResult({ ...raw, approved: true }, packet));
	assert.throws(() => parseApplicationResult({ ...raw, review: { ...raw.review, approved: true } }, packet));
	assert.throws(() => parseApplicationResult({ ...raw, review: { summary: "   ", issues: [] } }, packet));
	assert.throws(() => parseApplicationResult({ ...raw, review: { summary: "s".repeat(5_001), issues: [] } }, packet));
	assert.throws(() =>
		parseApplicationResult({ ...raw, review: { summary: "Summary", issues: Array(51).fill("Problem") } }, packet),
	);
	assert.throws(() =>
		parseApplicationResult({ ...raw, review: { summary: "Summary", issues: ["p".repeat(2_001)] } }, packet),
	);
	assert.throws(() => parseApplicationResult({ ...raw, coverLetter: "x".repeat(20_001) }, packet));
	const edited = exportApplicationPacket(profile, job, {
		...application,
		coverLetter: `${application.coverLetter}\nEdited.`,
	});
	assert.throws(() => parseApplicationResult(raw, edited));
	const changedTerms = exportApplicationPacket(profile, job, { ...application, targetKeywords: "Figma" });
	assert.throws(() => parseApplicationResult(raw, changedTerms));
	const other = createApplication(
		profile,
		{ ...job, id: "other-job" },
		null,
		"packet-other",
		"2026-11-10T09:00:00.000Z",
	);
	assert.throws(() => parseApplicationResult(raw, exportApplicationPacket(profile, job, other)));
});

test("import binds the report to returned final documents and blocks unresolved issues and stale reports", () => {
	const { profile, job, application } = fixture();
	const packet = exportApplicationPacket(profile, job, application);
	const result = { ...resultFor(packet), coverLetter: `${application.coverLetter}\nI welcome your questions.` };
	const patch = parseApplicationResult(result, packet);
	const reviewed = { ...application, ...patch };
	assert.deepEqual(patch.agentReview.reviewedResume, result.resume);
	assert.equal(patch.agentReview.reviewedCoverLetter, result.coverLetter);
	assert.equal(reviewApplication(profile, job, reviewed).canExport, true);
	assert.equal(
		reviewApplication(profile, job, { ...reviewed, coverLetter: `${reviewed.coverLetter}\nAn edit.` }).canExport,
		false,
	);
	const problems = parseApplicationResult(
		{ ...result, review: { summary: "One actionable problem remains.", issues: ["Replace an unsupported claim."] } },
		packet,
	);
	const blocked = reviewApplication(profile, job, { ...application, ...problems });
	assert.equal(blocked.canExport, false);
	assert.equal(blocked.checks.find((check) => check.id === "report-issues")?.passed, false);
	patch.resume.summary = "A later mutation.";
	assert.notEqual(patch.agentReview.reviewedResume.summary, patch.resume.summary);
});

test("review blocks incomplete targets, blank documents and changes to supplied identity even with a report", () => {
	const { profile, job, application } = fixture();
	const changedIdentity = { ...application, resume: { ...application.resume, role: job.role + " Expert" } };
	const identityReport = withReview(profile, job, changedIdentity);
	const identity = reviewApplication(profile, job, identityReport);
	assert.equal(identity.canExport, false);
	assert.equal(identity.checks.find((check) => check.id === "identity-preserved")?.passed, false);
	const blankLetter = withReview(profile, job, { ...application, coverLetter: " " });
	assert.equal(reviewApplication(profile, job, blankLetter).canExport, false);
	const incompleteJob = { ...job, description: "" };
	const incomplete = createApplication(profile, incompleteJob, null, "empty-target", "2026-11-10T09:00:00.000Z");
	const checked = reviewApplication(profile, incompleteJob, withReview(profile, incompleteJob, incomplete));
	assert.equal(checked.canExport, false);
	assert.equal(checked.checks.find((check) => check.id === "job-target")?.passed, false);
	const noName = { ...profile, name: "" };
	const unnamed = createApplication(noName, job, null, "unnamed", "2026-11-10T09:00:00.000Z");
	assert.equal(reviewApplication(noName, job, withReview(noName, job, unnamed)).canExport, false);
});

test("potential claim checks stay visible heuristics rather than claiming semantic certainty", () => {
	const { profile, job, application } = fixture();
	const changed = {
		...application,
		resume: { ...application.resume, summary: "A reworded summary.", skills: `${application.resume.skills}, COBOL` },
		coverLetter: `${application.coverLetter}\nRaised revenue by 99%.`,
	};
	const report = reviewApplication(profile, job, withReview(profile, job, changed));
	assert.equal(report.canExport, true);
	for (const id of ["history-unchanged", "skills-from-source", "numbers-from-source"]) {
		assert.equal(report.checks.find((check) => check.id === id)?.passed, false);
		assert.equal(report.checks.find((check) => check.id === id)?.blocking, false);
	}
	assert.ok(report.checks.find((check) => check.id === "numbers-from-source")?.detail.includes("heuristic"));
});

test("maximum source text remains intact and generated cover letters stay bounded without copying partial facts", () => {
	const { profile, job } = fixture();
	const maximum = {
		...profile,
		summary: "s".repeat(50_000),
		experience: "e".repeat(50_000),
		skills: "k".repeat(50_000),
	};
	const application = createApplication(maximum, job, null, "large-source", "2026-11-10T09:00:00.000Z");
	assert.deepEqual(application.resume, maximum);
	assert.deepEqual(application.sourceProfile, maximum);
	assert.ok(application.coverLetter.length < 20_000);
	assert.ok(!application.coverLetter.includes("s".repeat(100)));
	assert.throws(() => createApplication(profile, job, null, "", "2026-11-10T09:00:00.000Z"));
	assert.throws(() => createApplication(profile, job, null, "bad-time", "not a date"));
});
