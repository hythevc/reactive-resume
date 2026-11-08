import assert from "node:assert/strict";
import { test } from "node:test";
import {
	auditLinkedIn,
	buildOutreach,
	compareResumeToJob,
	createWorkspace,
	evaluatePreparationJob,
	exportResume,
	extractJobKeywords,
	importResume,
	parseStoredWorkspace,
	parseWorkspace,
	scoreJob,
	TARGET_KEYWORD_LIMIT,
	TARGET_KEYWORDS_MAX_LENGTH,
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

test("current version-one backups migrate new resume, preparation and contact fields without losing facts", () => {
	// The field set below predates targeting, preparation filters and contact sources.
	const profile = {
		name: "Example Candidate",
		email: "candidate@example.test",
		role: "Designer",
		location: "Remote",
		summary: "I design workflows.",
		skills: "Figma",
		experience: "Designed a research prototype.",
		education: "Design studies",
	};
	const backup = {
		version: 1,
		data: {
			profile,
			linkedin: {
				headline: profile.role,
				about: profile.summary,
				experience: profile.experience,
				skills: profile.skills,
			},
			resumes: [{ id: "legacy-resume", title: "Existing resume", updatedAt: "2026-11-08T09:00:00.000Z", profile }],
			jobs: [],
			contacts: [
				{
					id: "legacy-contact",
					name: "Example Recruiter",
					company: "Example Studio",
					role: "Recruiter",
					email: "recruiter@example.test",
					status: "Draft",
					message: "Existing user-authored draft.",
				},
			],
			goals: { role: "Designer", location: "Remote", minSalary: 0 },
			autopilot: { enabled: false, dailyLimit: 5, minMatch: 60, preparationDate: "", preparationCount: 0 },
			plan: "Free",
		},
	};
	const result = parseStoredWorkspace(JSON.parse(JSON.stringify(backup)));
	assert.deepEqual(result.profile, profile);
	assert.deepEqual(result.resumes[0].profile, profile);
	assert.equal(result.resumes[0].targetJobId, null);
	assert.equal(result.resumes[0].targetKeywords, "");
	assert.deepEqual(result.autopilot.excludedCompanies, []);
	assert.deepEqual(result.autopilot.locations, []);
	assert.equal(result.contacts[0].sourceUrl, "");
	assert.equal(result.contacts[0].context, "");
	assert.equal(result.contacts[0].message, "Existing user-authored draft.");
});

test("targeting, exclusions and contact context survive backup and reject malformed present fields", () => {
	const workspace = createWorkspace();
	workspace.resumes[0].targetJobId = workspace.jobs[0].id;
	workspace.resumes[0].targetKeywords = "Figma, Accessibility";
	workspace.autopilot.excludedCompanies = ["Example Studio"];
	workspace.autopilot.locations = ["Remote", "San Francisco"];
	workspace.contacts[0].sourceUrl = "https://www.example.test/team/recruiter";
	workspace.contacts[0].context = "I am interested in your design hiring process.";
	assert.deepEqual(parseStoredWorkspace(JSON.parse(JSON.stringify({ version: 1, data: workspace }))), workspace);
	assert.throws(() => parseWorkspace({ ...workspace, autopilot: { ...workspace.autopilot, excludedCompanies: [""] } }));
	assert.throws(() =>
		parseWorkspace({ ...workspace, autopilot: { ...workspace.autopilot, excludedCompanies: "Example Studio" } }),
	);
	assert.throws(() =>
		parseWorkspace({ ...workspace, autopilot: { ...workspace.autopilot, locations: Array(51).fill("Remote") } }),
	);
	assert.throws(() => parseWorkspace({ ...workspace, resumes: [{ ...workspace.resumes[0], targetJobId: 42 }] }));
	const tooManyTerms = Array.from({ length: TARGET_KEYWORD_LIMIT + 1 }, (_, index) => `Term ${index}`).join(",");
	for (const targetKeywords of [tooManyTerms, "x".repeat(TARGET_KEYWORDS_MAX_LENGTH + 1)]) {
		assert.throws(() => parseWorkspace({ ...workspace, resumes: [{ ...workspace.resumes[0], targetKeywords }] }));
	}
	for (const sourceUrl of [
		"javascript:alert(1)",
		"http://example.test",
		"https://name:password@example.test",
		"https:example.test",
	]) {
		assert.throws(() => parseWorkspace({ ...workspace, contacts: [{ ...workspace.contacts[0], sourceUrl }] }));
	}
	assert.throws(() =>
		parseWorkspace({ ...workspace, contacts: [{ ...workspace.contacts[0], context: "x".repeat(5_001) }] }),
	);
});

test("resume comparison exposes literal keyword gaps without modifying facts or counting identity fields", () => {
	const profile = {
		...createWorkspace().profile,
		name: "Python Candidate",
		email: "python@example.test",
		role: "Product Designer",
		location: "Java",
		summary: "Uses Figma and JavaScript.",
		skills: "C++, SQL",
		experience: "Conducted user research.",
		education: "Design studies",
	};
	const before = structuredClone(profile);
	const comparison = compareResumeToJob(profile, "Figma, C++, Java, SQL, Python, user research, FIGMA");
	assert.deepEqual(comparison.matched, ["Figma", "C++", "SQL", "user research"]);
	assert.deepEqual(comparison.missing, ["Java", "Python"]);
	assert.equal(comparison.total, 6);
	assert.equal(comparison.coverage, 67);
	assert.deepEqual(profile, before);
	assert.deepEqual(compareResumeToJob(profile, ""), { matched: [], missing: [], total: 0, coverage: null });
});

test("keyword suggestions return only literal dictionary terms present in the posting", () => {
	const terms = extractJobKeywords({
		role: "Designer",
		description: "Work with FIGMA, JavaScript, C++, and PostgreSQL.",
	});
	assert.ok(terms.includes("Figma"));
	assert.ok(terms.includes("JavaScript"));
	assert.ok(terms.includes("C++"));
	assert.ok(terms.includes("PostgreSQL"));
	assert.ok(!terms.includes("Java"));
	assert.ok(!terms.includes("SQL"));
	assert.deepEqual(extractJobKeywords({ role: "", description: "" }), []);
});

test("preparation exclusions and locations override keyword overlap and preserve complete-term boundaries", () => {
	const workspace = createWorkspace();
	const profile = { ...workspace.profile, role: "", skills: "Figma" };
	const job = {
		...workspace.jobs[0],
		company: "Forma",
		role: "Designer",
		description: "Figma",
		location: "Remote · US",
	};
	const settings = { ...workspace.autopilot, minMatch: 100 };
	assert.deepEqual(evaluatePreparationJob(profile, job, settings), { eligible: true, score: 100, reasons: [] });
	assert.deepEqual(evaluatePreparationJob(profile, job, { ...settings, excludedCompanies: ["  FORMA  "] }).reasons, [
		"excluded-company",
	]);
	assert.equal(evaluatePreparationJob(profile, job, { ...settings, excludedCompanies: ["Form"] }).eligible, true);
	assert.equal(evaluatePreparationJob(profile, job, { ...settings, locations: ["us"] }).eligible, true);
	assert.deepEqual(
		evaluatePreparationJob(profile, { ...job, location: "Australia" }, { ...settings, locations: ["US"] }).reasons,
		["location-mismatch"],
	);
	assert.equal(
		evaluatePreparationJob(profile, { ...job, location: "" }, { ...settings, locations: [] }).eligible,
		true,
	);
	const invalid = evaluatePreparationJob(profile, { ...job, status: "Draft", description: "" }, settings);
	assert.ok(invalid.reasons.includes("not-saved"));
	assert.ok(invalid.reasons.includes("missing-description"));
	assert.ok(invalid.reasons.includes("below-minimum-match"));
});

test("outreach includes supplied context literally without inventing facts from a source URL", () => {
	const workspace = createWorkspace();
	const original = workspace.contacts[0];
	const sourceOnly = { ...original, sourceUrl: "https://www.example.test/team/recruiter" };
	assert.equal(buildOutreach(workspace.profile, sourceOnly), buildOutreach(workspace.profile, original));
	const context = "I would like to learn about your accessibility hiring needs.";
	const message = buildOutreach(workspace.profile, { ...sourceOnly, context });
	assert.ok(message.includes(`\n\n${context}\n\n`));
	assert.ok(!message.includes(sourceOnly.sourceUrl));
	assert.ok(!/verified|previous conversation|met you|email validation/i.test(message));
	const longProfile = { ...workspace.profile, skills: "x".repeat(50_000) };
	const boundedDraft = buildOutreach(longProfile, { ...sourceOnly, context: "a".repeat(5_000) });
	assert.ok(boundedDraft.length <= 50_000);
	assert.equal(longProfile.skills.length, 50_000);
});
