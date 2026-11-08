import assert from "node:assert/strict";
import { test } from "node:test";
import {
	auditLinkedIn,
	buildOutreach,
	createWorkspace,
	exportResume,
	importResume,
	parseStoredWorkspace,
	parseWorkspace,
	scoreJob,
} from "./workspace";

test("workspace backups reject malformed fields, invalid statuses and duplicate IDs", () => {
	const original = createWorkspace();
	assert.deepEqual(parseWorkspace(JSON.parse(JSON.stringify(original))), original);
	assert.throws(() => parseWorkspace({ ...original, profile: { ...original.profile, name: 42 } }));
	assert.throws(() =>
		parseWorkspace({
			...original,
			jobs: [{ ...original.jobs[0], status: "Sent" }],
		}),
	);
	assert.throws(() =>
		parseWorkspace({
			...original,
			contacts: [{ ...original.contacts[0], status: ["Draft"] }],
		}),
	);
	assert.throws(() => parseWorkspace({ ...original, jobs: [original.jobs[0], original.jobs[0]] }));
	assert.throws(() =>
		parseWorkspace({
			...original,
			jobs: [{ ...original.jobs[0], url: "javascript:alert(1)" }],
		}),
	);
	assert.throws(() =>
		parseWorkspace({
			...original,
			autopilot: { enabled: true, dailyLimit: -1 },
		}),
	);
	assert.throws(() => parseStoredWorkspace({ version: 2, data: original }));
	assert.deepEqual(parseStoredWorkspace({ version: 1, data: original }), original);
	assert.throws(() =>
		parseWorkspace({
			...original,
			linkedin: { ...original.linkedin, headline: "x".repeat(501) },
		}),
	);
	assert.throws(() =>
		parseWorkspace({
			...original,
			autopilot: { ...original.autopilot, preparationCount: -1 },
		}),
	);
	const { linkedin, ...legacy } = original;
	const {
		preparationDate: _preparationDate,
		preparationCount: _preparationCount,
		...legacyAutopilot
	} = legacy.autopilot;
	assert.deepEqual(parseWorkspace({ ...legacy, autopilot: legacyAutopilot }).linkedin, linkedin);
	assert.equal(parseWorkspace({ ...legacy, autopilot: legacyAutopilot }).autopilot.preparationCount, 0);
});

test("resume exchange round trip preserves entered facts and escapes markup", () => {
	const resume = createWorkspace().resumes[0];
	resume.profile.summary = 'Research & design for <teams> "together".';
	const exported = exportResume(resume);
	assert.equal(exported.sections.experience.items.length, 2);
	assert.ok(exported.summary.content.includes("&lt;teams&gt;"));
	assert.deepEqual(importResume(exported).profile, resume.profile);
	assert.deepEqual(importResume({ data: exported }).profile, resume.profile);
	resume.profile.name = "N".repeat(500);
	const longName = importResume(exportResume(resume));
	assert.equal(longName.title, "Imported resume");
	assert.equal(longName.profile.name, resume.profile.name);
});

test("resume import rejects malformed schemas and retains valid v5/v6 text fields", () => {
	assert.throws(() => importResume({ basics: { name: "Someone" } }));
	const exported = exportResume(createWorkspace().resumes[0]);
	assert.throws(() =>
		importResume({
			...exported,
			sections: { ...exported.sections, experience: { items: ["bad"] } },
		}),
	);
	exported.sections.experience.items = [
		{
			id: "experience",
			company: "Example Studio",
			position: "Designer",
			description: "<p>Researched needs.</p><script>danger()</script>",
			roles: [
				{
					position: "Associate",
					period: "2020",
					description: "<p>Prototyped flows.</p>",
				},
			],
		},
	];
	const result = importResume(exported);
	assert.ok(
		result.profile.experience.includes(
			"Example Studio\nDesigner\nResearched needs.\nAssociate\n2020\nPrototyped flows.",
		),
	);
	assert.ok(!result.profile.experience.includes("danger"));
});

test("LinkedIn audit is deterministic and never fabricates experience or metrics", () => {
	const profile = {
		headline: "Product designer",
		about: "I design useful things.",
		experience: "I research workflows.",
		skills: "Research, Prototyping, Accessibility",
	};
	const audit = auditLinkedIn(profile);
	assert.deepEqual(audit, auditLinkedIn(profile));
	assert.equal(audit.about, profile.about);
	assert.equal(audit.headline, "Product designer | Research · Prototyping");
	assert.equal(audit.checks.find((check) => check.label === "Evidence of impact")?.passed, false);
	assert.ok(!/\d|senior|years|led/i.test(audit.about));
	const empty = auditLinkedIn({
		headline: "",
		about: "",
		experience: "",
		skills: "",
	});
	assert.equal(empty.score, 0);
	assert.equal(empty.headline, "");
	assert.equal(empty.about, "");
	const longHeadline = "Designer ".repeat(40).trim();
	assert.equal(auditLinkedIn({ ...profile, headline: longHeadline }).headline, longHeadline);
});

test("job score responds to actual keyword overlap and does not match inside words", () => {
	const workspace = createWorkspace();
	const profile = { ...workspace.profile, role: "", skills: "Java, Figma" };
	const job = {
		...workspace.jobs[0],
		role: "Developer",
		description: "JavaScript and Figma",
	};
	assert.equal(scoreJob(profile, job), 50);
	assert.equal(scoreJob({ ...profile, skills: "" }, job), 0);
});

test("outreach uses only supplied identity, skills and company, without claims of achievements", () => {
	const workspace = createWorkspace();
	const message = buildOutreach(workspace.profile, workspace.contacts[0]);
	assert.ok(message.startsWith("Hi Jamie,"));
	assert.ok(message.includes("I'm Alex Morgan, a Senior Product Designer."));
	assert.ok(message.includes("at Forma"));
	assert.ok(!/\d|increased|grew|award|expert|years/i.test(message));
});
