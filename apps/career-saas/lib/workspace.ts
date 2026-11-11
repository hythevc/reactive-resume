import { z } from "zod";

const text = z.string().max(50_000);
const shortText = z.string().max(500);
const id = z.string().min(1).max(100);
const timestamp = z.string().datetime();
const timezone = z
	.string()
	.max(100)
	.refine((value) => {
		try {
			new Intl.DateTimeFormat("en", { timeZone: value });
			return true;
		} catch {
			return false;
		}
	}, "Choose a valid timezone.");
const webUrl = z
	.string()
	.max(2_000)
	.refine((value) => {
		if (!value) return true;
		try {
			return ["https:", "http:"].includes(new URL(value).protocol);
		} catch {
			return false;
		}
	}, "Use an http or https URL.");

export const profileSchema = z
	.object({
		name: shortText,
		email: shortText,
		phone: shortText.default(""),
		website: webUrl.default(""),
		linkedinUrl: webUrl.default(""),
		role: shortText,
		location: shortText,
		summary: text,
		skills: text,
		experience: text,
		education: text,
	})
	.strict();
export const RESUME_LIMIT = 200;
export const MAX_RESUMES = RESUME_LIMIT;
export const TARGET_KEYWORDS_MAX_LENGTH = 10_000;
export const TARGET_KEYWORD_LIMIT = 100;
export const targetKeywordsSchema = z
	.string()
	.max(TARGET_KEYWORDS_MAX_LENGTH)
	.refine((value) => splitSkills(value).length <= TARGET_KEYWORD_LIMIT, "Use at most 100 target keywords.");
export const resumeSchema = z
	.object({
		id,
		title: shortText,
		updatedAt: timestamp,
		profile: profileSchema,
		targetJobId: id.nullable().default(null),
		targetKeywords: targetKeywordsSchema.default(""),
	})
	.strict();
export const linkedinSchema = z.object({ headline: shortText, about: text, experience: text, skills: text }).strict();
export const CAREER_BRIEF_MAX_LENGTH = 2_000;
export const INTEREST_REASON_MAX_LENGTH = 2_000;
export const JOB_INTRODUCTION_MAX_LENGTH = 20_000;
export const goalsSchema = z
	.object({
		role: shortText,
		location: shortText,
		minSalary: z.number().finite().min(0).max(10_000_000),
		currency: z.enum(["GBP", "USD", "EUR"]).default("USD"),
		problem: z.string().max(CAREER_BRIEF_MAX_LENGTH).default(""),
		team: z.string().max(CAREER_BRIEF_MAX_LENGTH).default(""),
		scope: z.string().max(CAREER_BRIEF_MAX_LENGTH).default(""),
		environment: z.string().max(CAREER_BRIEF_MAX_LENGTH).default(""),
	})
	.strict();
export const APPLICATION_COVER_LETTER_MAX_LENGTH = 20_000;
export const APPLICATION_REVIEW_SUMMARY_MAX_LENGTH = 5_000;
export const APPLICATION_REVIEW_ISSUE_MAX_LENGTH = 2_000;
export const APPLICATION_REVIEW_ISSUE_LIMIT = 50;
export const applicationSourceJobSchema = z
	.object({ company: shortText, role: shortText, location: shortText, url: webUrl, description: text })
	.strict();
export const applicationAgentReviewSchema = z
	.object({
		summary: z.string().max(APPLICATION_REVIEW_SUMMARY_MAX_LENGTH),
		issues: z.array(z.string().max(APPLICATION_REVIEW_ISSUE_MAX_LENGTH)).max(APPLICATION_REVIEW_ISSUE_LIMIT),
		reviewedResume: profileSchema,
		reviewedCoverLetter: z.string().max(APPLICATION_COVER_LETTER_MAX_LENGTH),
	})
	.strict();
export const applicationSchema = z
	.object({
		id,
		createdAt: timestamp,
		sourceResumeId: id.nullable(),
		sourceProfile: profileSchema,
		sourceJob: applicationSourceJobSchema,
		targetKeywords: targetKeywordsSchema,
		resume: profileSchema,
		coverLetter: z.string().max(APPLICATION_COVER_LETTER_MAX_LENGTH),
		agentReview: applicationAgentReviewSchema.nullable().default(null),
	})
	.strict();
export const jobSchema = z
	.object({
		id,
		company: shortText,
		role: shortText,
		location: shortText,
		url: webUrl,
		description: text,
		status: z.enum(["Saved", "Draft", "Applied", "Interview", "Offer", "Rejected", "Withdrawn"]),
		interviewAt: timestamp.nullable().default(null),
		interviewTimezone: timezone.default("Europe/London"),
		notes: text,
		createdAt: timestamp,
		interest: z.enum(["Unreviewed", "Shortlisted", "Passed"]).default("Unreviewed"),
		interestReason: z.string().max(INTEREST_REASON_MAX_LENGTH).default(""),
		introduction: z.string().max(JOB_INTRODUCTION_MAX_LENGTH).default(""),
		application: applicationSchema.nullable().default(null),
	})
	.strict();
export const CONTACT_CONTEXT_MAX_LENGTH = 5_000;
export const CONTACT_SOURCE_MAX_LENGTH = 2_000;
export const contactSchema = z
	.object({
		id,
		name: shortText,
		company: shortText,
		role: shortText,
		email: shortText,
		status: z.enum(["Draft", "Contacted", "Replied"]),
		message: text,
		sourceUrl: z
			.string()
			.trim()
			.max(CONTACT_SOURCE_MAX_LENGTH)
			.refine((value) => {
				if (!value) return true;
				try {
					const url = new URL(value);
					return /^https:\/\//i.test(value) && url.protocol === "https:" && !url.username && !url.password;
				} catch {
					return false;
				}
			}, "Use a full HTTPS URL without a username or password.")
			.default(""),
		context: z.string().max(CONTACT_CONTEXT_MAX_LENGTH).default(""),
	})
	.strict();
export const workspaceSchema = z
	.object({
		profile: profileSchema,
		linkedin: linkedinSchema.default({
			headline: "",
			about: "",
			experience: "",
			skills: "",
		}),
		resumes: z.array(resumeSchema).max(RESUME_LIMIT),
		jobs: z.array(jobSchema).max(2_000),
		contacts: z.array(contactSchema).max(2_000),
		goals: goalsSchema,
		autopilot: z
			.object({
				enabled: z.boolean(),
				dailyLimit: z.number().int().min(1).max(100),
				minMatch: z.number().int().min(0).max(100),
				preparationDate: z
					.string()
					.regex(/^(?:\d{4}-\d{2}-\d{2})?$/)
					.default(""),
				preparationCount: z.number().int().min(0).max(100_000).default(0),
				excludedCompanies: z.array(z.string().trim().min(1).max(500)).max(100).default([]),
				locations: z.array(z.string().trim().min(1).max(500)).max(50).default([]),
			})
			.strict(),
		plan: z.enum(["Free", "Pro", "Momentum"]),
	})
	.strict()
	.superRefine((value, ctx) => {
		for (const key of ["resumes", "jobs", "contacts"] as const) {
			if (new Set(value[key].map((item) => item.id)).size !== value[key].length) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: [key],
					message: "Each item must have a unique ID.",
				});
			}
		}
		const applicationIds = value.jobs.flatMap((job) => (job.application ? [job.application.id] : []));
		if (new Set(applicationIds).size !== applicationIds.length) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["jobs"],
				message: "Application packages must have unique IDs.",
			});
		}
	});

export type Profile = z.infer<typeof profileSchema>;

export function profileFieldMaxLength(field: keyof Profile): number | undefined {
	const schema = profileSchema.shape[field];
	return (schema instanceof z.ZodDefault ? schema.unwrap() : schema).maxLength ?? undefined;
}
export type Resume = z.infer<typeof resumeSchema>;
export type Job = z.infer<typeof jobSchema>;
export type JobInterest = Job["interest"];
export type Application = z.infer<typeof applicationSchema>;
export type ApplicationAgentReview = z.infer<typeof applicationAgentReviewSchema>;
export type ApplicationSourceJob = z.infer<typeof applicationSourceJobSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;

/** Backups contain only local app data. Unknown fields and invalid status values fail closed. */
export function parseWorkspace(value: unknown): Workspace {
	const result = workspaceSchema.parse(value);
	if (typeof value === "object" && value !== null && !("linkedin" in value)) {
		result.linkedin = {
			headline: result.profile.role,
			about: result.profile.summary,
			experience: result.profile.experience,
			skills: result.profile.skills,
		};
	}
	return result;
}

export const STORAGE_KEY = "career-saas.workspace.v1";
export const STORAGE_VERSION = 1;
export function parseStoredWorkspace(value: unknown): Workspace {
	const stored = z
		.object({ version: z.literal(STORAGE_VERSION), data: z.unknown() })
		.strict()
		.parse(value);
	return parseWorkspace(stored.data);
}

/** Fictional example data. All addresses and postings use reserved example.test domains. */
export function createWorkspace(): Workspace {
	const profile: Profile = {
		name: "Alex Morgan",
		email: "alex.morgan@example.test",
		phone: "",
		website: "",
		linkedinUrl: "",
		role: "Senior Product Designer",
		location: "San Francisco, CA",
		summary:
			"Product designer turning complex workflows into clear, thoughtful experiences. I work across research, interaction design, and design systems, partnering with product and engineering teams from discovery to delivery.",
		skills: "Product design, User research, Figma, Prototyping, Design systems, Accessibility",
		experience:
			"Senior Product Designer · Northstar Studio\n2022 – Present\nPartner with product and engineering on research, interaction design, and a shared design system.\n\nProduct Designer · Fieldwork Labs\n2019 – 2022\nDesigned onboarding and collaboration workflows, from early prototypes through usability testing.",
		education: "BFA, Interaction Design\nPacific Design Institute · 2015 – 2019",
	};
	const now = "2026-11-08T09:00:00.000Z";
	const companies = ["Forma", "Arcwell", "Northline", "Layers", "Goodkind", "Orbit", "Daylight", "Common Ground"];
	const roles = [
		"Senior Product Designer",
		"Product Designer, Growth",
		"Staff Product Designer",
		"Senior Product Designer",
		"Design Systems Designer",
		"Lead Product Designer",
		"Senior UX Designer",
		"Product Designer",
	];
	const statuses: Job["status"][] = ["Saved", "Saved", "Interview", "Saved", "Applied", "Draft", "Applied", "Saved"];
	return {
		profile,
		linkedin: {
			headline: profile.role,
			about: profile.summary,
			experience: profile.experience,
			skills: profile.skills,
		},
		resumes: [
			{
				id: "resume-main",
				title: "Product design · Master resume",
				updatedAt: now,
				profile: { ...profile },
				targetJobId: null,
				targetKeywords: "",
			},
			{
				id: "resume-systems",
				title: "Design systems · Focused resume",
				updatedAt: "2026-11-06T14:00:00.000Z",
				profile: {
					...profile,
					role: "Senior Product Designer · Design Systems",
				},
				targetJobId: null,
				targetKeywords: "",
			},
		],
		jobs: companies.map((company, index) => ({
			id: `job-${index + 1}`,
			company,
			role: roles[index],
			location: index % 3 === 0 ? "San Francisco, CA" : "Remote · US",
			url: `https://jobs.example.test/${company.toLowerCase().replaceAll(" ", "-")}`,
			description: `${company} is a fictional example company seeking a ${roles[index]}. Work with product and engineering teams on ${index % 2 ? "user research, prototyping, and accessible interaction design" : "Figma, design systems, and product design"}. This is sample data; replace it with a real posting.`,
			status: statuses[index],
			interviewAt: null,
			interviewTimezone: "Europe/London",
			notes: index === 2 ? "Example interview stage. Add your own interview details here." : "",
			createdAt: now,
			interest: "Unreviewed",
			interestReason: "",
			introduction: "",
			application: null,
		})),
		contacts: [
			{
				id: "contact-1",
				name: "Jamie Chen",
				company: "Forma",
				role: "Design Recruiter",
				email: "jamie@example.test",
				status: "Draft",
				message: "",
				sourceUrl: "",
				context: "",
			},
			{
				id: "contact-2",
				name: "Taylor Brooks",
				company: "Arcwell",
				role: "Talent Partner",
				email: "taylor@example.test",
				status: "Draft",
				message: "",
				sourceUrl: "",
				context: "",
			},
			{
				id: "contact-3",
				name: "Jordan Lee",
				company: "Northline",
				role: "Executive Recruiter",
				email: "jordan@example.test",
				status: "Draft",
				message: "",
				sourceUrl: "",
				context: "",
			},
			{
				id: "contact-4",
				name: "Sam Rivera",
				company: "Layers",
				role: "Design Talent Lead",
				email: "sam@example.test",
				status: "Draft",
				message: "",
				sourceUrl: "",
				context: "",
			},
		],
		goals: {
			role: "Senior Product Designer",
			location: "Remote · US",
			minSalary: 150_000,
			currency: "USD",
			problem: "",
			team: "",
			scope: "",
			environment: "",
		},
		autopilot: {
			enabled: false,
			dailyLimit: 5,
			minMatch: 60,
			preparationDate: "",
			preparationCount: 0,
			excludedCompanies: [],
			locations: [],
		},
		plan: "Free",
	};
}

export type LinkedInProfile = {
	headline: string;
	about: string;
	experience: string;
	skills: string;
};
export type LinkedInAudit = {
	score: number;
	checks: { label: string; passed: boolean; detail: string }[];
	headline: string;
	about: string;
};

/** Transparent writing rules, not an AI assessment or a LinkedIn ranking prediction. */
export function auditLinkedIn(profile: LinkedInProfile): LinkedInAudit {
	const headline = profile.headline.trim();
	const about = profile.about.trim();
	const skills = splitSkills(profile.skills);
	const checks = [
		{
			label: "Clear headline",
			passed: headline.length >= 15 && headline.length <= 220,
			detail: "Use a descriptive headline between 15 and 220 characters.",
		},
		{
			label: "Specific expertise",
			passed: skills.some((skill) => includesTerm(headline, skill)),
			detail: "Include one of your listed skills in your headline, where it reads naturally.",
		},
		{
			label: "Complete About section",
			passed: about.length >= 150 && about.length <= 2_600,
			detail: "Aim for 150–2,600 characters explaining your work and interests.",
		},
		{
			label: "Concrete experience",
			passed: profile.experience.trim().length >= 100,
			detail: "Describe actual responsibilities and contributions in at least 100 characters.",
		},
		{
			label: "Skills listed",
			passed: skills.length >= 3,
			detail: "List at least three skills you can substantiate.",
		},
		{
			label: "Evidence of impact",
			passed: /\b\d+(?:[.,]\d+)?\s*(?:%|percent|users|customers|hours|days|projects|teams|people)\b|\d+%/i.test(
				profile.experience,
			),
			detail: "If you have verified outcomes, describe them. Do not invent metrics to pass this check.",
		},
		{
			label: "Readable paragraphs",
			passed: about.length > 0 && about.split(/\n\s*\n/).every((paragraph) => paragraph.length <= 600),
			detail: "Keep each About paragraph under 600 characters for easier scanning.",
		},
		{
			label: "Direct language",
			passed: headline.length > 0 && !/\b(?:guru|ninja|rockstar|visionary|world.class)\b/i.test(headline),
			detail: "Use a concrete role and expertise instead of vague superlatives.",
		},
	];
	// Suggestions only rearrange submitted words; they never supply achievements, credentials or metrics.
	const cleanHeadline = headline.replace(/\s+/g, " ");
	const expandedHeadline = `${cleanHeadline} | ${skills.slice(0, 2).join(" · ")}`;
	const suggestedHeadline =
		cleanHeadline &&
		skills.length &&
		expandedHeadline.length <= 220 &&
		!skills.some((skill) => includesTerm(cleanHeadline, skill))
			? expandedHeadline
			: cleanHeadline;
	const suggestedAbout = about
		.replace(/\r\n/g, "\n")
		.replace(/[ \t]+/g, " ")
		.replace(/\n{3,}/g, "\n\n");
	return {
		score: Math.round((checks.filter((check) => check.passed).length / checks.length) * 100),
		checks,
		headline: suggestedHeadline,
		about: suggestedAbout,
	};
}

export function splitSkills(value: string): string[] {
	return [
		...new Set(
			value
				.split(/[,;\n]/)
				.map((skill) => skill.trim())
				.filter(Boolean),
		),
	];
}
function includesTerm(text: string, term: string): boolean {
	return includesNormalizedTerm(normalizeTerm(text), term);
}

function includesNormalizedTerm(text: string, term: string): boolean {
	const normalized = normalizeTerm(term);
	if (!normalized) return false;
	const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, "u").test(text);
}

function normalizeTerm(value: string): string {
	return value.normalize("NFKC").trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

export type ResumeJobComparison = {
	matched: string[];
	missing: string[];
	coverage: number | null;
	total: number;
};

/** Checks only the user's explicit target terms. No hiring probability or ATS score is inferred. */
export function compareResumeToJob(profile: Profile, keywords: string): ResumeJobComparison {
	const seen = new Set<string>();
	const terms = splitSkills(targetKeywordsSchema.parse(keywords)).filter((term) => {
		const key = normalizeTerm(term);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
	const resumeText = normalizeTerm(
		[profile.role, profile.summary, profile.skills, profile.experience, profile.education].join("\n"),
	);
	const matched: string[] = [];
	const missing: string[] = [];
	for (const term of terms) (includesNormalizedTerm(resumeText, term) ? matched : missing).push(term);
	return {
		matched,
		missing,
		coverage: terms.length ? Math.round((matched.length / terms.length) * 100) : null,
		total: terms.length,
	};
}

// A small literal dictionary provides editable starting terms, not inferred requirements.
// A posting can contain relevant terms outside this list, or mention a listed term in a negation.
const COMMON_JOB_SKILLS = [
	"Accessibility",
	"Account management",
	"Accounting",
	"Accounts payable",
	"Accounts receivable",
	"Active listening",
	"Agile",
	"Angular",
	"APIs",
	"AWS",
	"Azure",
	"B2B",
	"B2C",
	"Budgeting",
	"Business analysis",
	"C#",
	"C++",
	"Case management",
	"Clinical assessment",
	"Cloud computing",
	"Coaching",
	"Communication",
	"Content strategy",
	"Copywriting",
	"CPR",
	"CRM",
	"CSS",
	"Customer service",
	"Customer success",
	"Data analysis",
	"Data entry",
	"Data visualization",
	"Design systems",
	"Docker",
	"Electronic health records",
	"Excel",
	"Figma",
	"Financial analysis",
	"Financial reporting",
	"Forecasting",
	"Git",
	"Google Analytics",
	"Graphic design",
	"HIPAA",
	"HTML",
	"Illustrator",
	"Interaction design",
	"Inventory management",
	"Java",
	"JavaScript",
	"Jira",
	"Kubernetes",
	"Leadership",
	"Machine learning",
	"Marketing",
	"Microsoft Office",
	"Negotiation",
	"Node.js",
	"Nursing",
	"Operations",
	"Patient care",
	"Payroll",
	"Photoshop",
	"PostgreSQL",
	"Power BI",
	"Presentation",
	"Problem solving",
	"Product design",
	"Product management",
	"Project management",
	"Prototyping",
	"Python",
	"Quality assurance",
	"React",
	"Recruiting",
	"Research",
	"Risk management",
	"Ruby",
	"Sales",
	"Salesforce",
	"Scheduling",
	"SEO",
	"Social media",
	"SQL",
	"Stakeholder management",
	"Strategic planning",
	"Supply chain",
	"Tableau",
	"Teamwork",
	"Technical writing",
	"Terraform",
	"Time management",
	"TypeScript",
	"Usability testing",
	"User research",
	"UX research",
	"Visual design",
	"Vue",
	"Wireframing",
	"WordPress",
] as const;

export function extractJobKeywords(job: Pick<Job, "role" | "description">): string[] {
	const posting = normalizeTerm(`${job.role}\n${job.description}`);
	return COMMON_JOB_SKILLS.filter((term) => includesNormalizedTerm(posting, term)).slice(0, TARGET_KEYWORD_LIMIT);
}

export type PreparationReason =
	| "passed-role"
	| "not-saved"
	| "missing-description"
	| "excluded-company"
	| "location-mismatch"
	| "below-minimum-match";
export type PreparationEvaluation = { eligible: boolean; score: number; reasons: PreparationReason[] };

/** Shared candidate rules; the caller separately enforces pause state and the daily allowance. */
export function evaluatePreparationJob(
	profile: Profile,
	job: Job,
	autopilot: Workspace["autopilot"],
): PreparationEvaluation {
	const reasons: PreparationReason[] = [];
	const score = scoreJob(profile, job);
	if (job.interest === "Passed") reasons.push("passed-role");
	if (job.status !== "Saved") reasons.push("not-saved");
	if (!job.description.trim()) reasons.push("missing-description");
	if (autopilot.excludedCompanies.some((company) => normalizeTerm(company) === normalizeTerm(job.company)))
		reasons.push("excluded-company");
	if (autopilot.locations.length && !autopilot.locations.some((location) => includesTerm(job.location, location)))
		reasons.push("location-mismatch");
	if (score < autopilot.minMatch) reasons.push("below-minimum-match");
	return { eligible: reasons.length === 0, score, reasons };
}

/** Local keyword overlap only. A score is not a hiring probability or an AI evaluation. */
export function scoreJob(profile: Profile, job: Job): number {
	const terms = [
		...new Set([...splitSkills(profile.skills), ...profile.role.split(/\s+/).filter((word) => word.length >= 4)]),
	];
	if (!terms.length) return 0;
	const posting = normalizeTerm(`${job.role} ${job.description}`);
	return Math.round((terms.filter((term) => includesNormalizedTerm(posting, term)).length / terms.length) * 100);
}

export function buildOutreach(profile: Profile, contact: Contact): string {
	const greeting = contact.name.trim() ? `Hi ${contact.name.trim().split(/\s+/)[0]},` : "Hello,";
	const intro = [
		profile.name.trim() ? `I'm ${profile.name.trim()}` : "I'm exploring my next opportunity",
		profile.role.trim() ? `a ${profile.role.trim()}` : "",
	]
		.filter(Boolean)
		.join(", ");
	// Drafts select concise skill labels; the complete profile stays untouched.
	const skills = splitSkills(profile.skills)
		.filter((skill) => skill.length <= 500)
		.slice(0, 3);
	return `${greeting}\n\n${intro}.${skills.length ? ` My skills include ${skills.join(", ")}.` : ""}${contact.context.trim() ? `\n\n${contact.context.trim()}` : ""}\n\nI'm interested in opportunities${contact.company.trim() ? ` at ${contact.company.trim()}` : " you are recruiting for"}. Would you be open to a short conversation about roles that might fit?\n\nThank you,\n${profile.name.trim()}`;
}

export type JobIntroduction = { text: string; facts: { label: string; value: string }[] };

/** A candidate-controlled template from current inputs, never a claim of fit or an introduction being sent. */
export function buildJobIntroduction(profile: Profile, goals: Workspace["goals"], job: Job): JobIntroduction {
	const name = profile.name.trim();
	const role = profile.role.trim();
	const company = job.company.trim();
	const targetRole = job.role.trim();
	const skills = splitSkills(profile.skills)
		.filter((skill) => skill.length <= 500)
		.slice(0, 3)
		.join(", ");
	const preferences = [
		{ label: "Problems I want to solve", value: goals.problem.trim() },
		{ label: "Team preferences", value: goals.team.trim() },
		{ label: "Scope I want", value: goals.scope.trim() },
		{ label: "Work environment preferences", value: goals.environment.trim() },
	].filter((fact) => fact.value);
	const facts = [
		{ label: "Your name", value: name },
		{ label: "Your role", value: role },
		{ label: "Your listed skills", value: skills },
		{ label: "Target company", value: company },
		{ label: "Target role", value: targetRole },
		...preferences,
	].filter((fact) => fact.value);
	const identity = name
		? `I'm ${name}${role ? `, a ${role}` : ""}.`
		: role
			? `I'm a ${role}.`
			: "I'm exploring my next opportunity.";
	const target = targetRole ? `the ${targetRole} role` : "this opportunity";
	const preferenceText = preferences.length
		? `\n\nFor my next role, these are my preferences:\n${preferences.map((fact) => `${fact.label}: ${fact.value}`).join("\n")}`
		: "";
	return {
		text: `Hello,\n\n${identity}${skills ? ` My listed skills include ${skills}.` : ""}\n\nI'm interested in learning more about ${target}${company ? ` at ${company}` : ""}.${preferenceText}\n\nWould you be open to a conversation?\n\nThank you${name ? `,\n${name}` : "."}`,
		facts,
	};
}

// Reactive Resume v5/v6 exchange adapter. Design defaults mirror the MIT-licensed
// packages/schema/src/resume/default.ts; entered facts are kept as text blocks.
function section(icon: string, title: string) {
	return {
		title,
		icon,
		columns: 1,
		hidden: false,
		showHeading: true,
		keepTogether: false,
		startOnNewPage: false,
		items: [] as Record<string, unknown>[],
	};
}
function toHtml(value: string): string {
	return value
		.split(/\r?\n/)
		.map(
			(line) =>
				`<p>${line.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;")}</p>`,
		)
		.join("");
}
function fromHtml(value: string): string {
	return value
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
		.replace(/<br\s*\/?\s*>/gi, "\n")
		.replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
		.replace(/<[^>]*>/g, "")
		.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code: string) => {
			const point = code[0].toLowerCase() === "x" ? Number.parseInt(code.slice(1), 16) : Number(code);
			return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : "";
		})
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.trim();
}

export function exportResume(resume: Resume) {
	const parsed = resumeSchema.parse(resume);
	const profile = parsed.profile;
	const sections = {
		profiles: section("messenger-logo", "Profiles"),
		experience: section("briefcase", "Experience"),
		education: section("graduation-cap", "Education"),
		projects: section("code-simple", "Projects"),
		skills: {
			...section("compass-tool", "Skills"),
			layout: "default",
			keywordLayout: "inline",
		},
		languages: section("translate", "Languages"),
		interests: section("football", "Interests"),
		awards: section("trophy", "Awards"),
		certifications: section("certificate", "Certifications"),
		publications: section("books", "Publications"),
		volunteer: section("hand-heart", "Volunteer"),
		references: section("phone", "References"),
	};
	sections.profiles.items = profile.linkedinUrl
		? [
				{
					id: "profile-linkedin",
					hidden: false,
					icon: "linkedin-logo",
					iconColor: "",
					network: "LinkedIn",
					username: "",
					website: { url: profile.linkedinUrl, label: "LinkedIn", inlineLink: false },
				},
			]
		: [];
	sections.experience.items = profile.experience.trim()
		? profile.experience.split(/\n\s*\n/).map((block, index) => {
				const [first, ...remaining] = block.split(/\r?\n/);
				return {
					id: `experience-${index}`,
					hidden: false,
					company: first,
					position: "",
					location: "",
					period: "",
					website: { url: "", label: "", inlineLink: false },
					description: toHtml(remaining.join("\n")),
					roles: [],
				};
			})
		: [];
	sections.education.items = profile.education.trim()
		? profile.education.split(/\n\s*\n/).map((block, index) => {
				const [first, ...remaining] = block.split(/\r?\n/);
				return {
					id: `education-${index}`,
					hidden: false,
					school: first,
					degree: "",
					area: "",
					grade: "",
					location: "",
					period: "",
					website: { url: "", label: "", inlineLink: false },
					description: toHtml(remaining.join("\n")),
				};
			})
		: [];
	sections.skills.items = splitSkills(profile.skills).map((name, index) => ({
		id: `skill-${index}`,
		hidden: false,
		icon: "",
		iconColor: "",
		name,
		proficiency: "",
		level: 0,
		keywords: [],
	}));
	return {
		picture: {
			hidden: true,
			fit: "cover",
			url: "",
			size: 80,
			rotation: 0,
			aspectRatio: 1,
			borderRadius: 0,
			borderColor: "rgba(0, 0, 0, 0.5)",
			borderWidth: 0,
			shadowColor: "rgba(0, 0, 0, 0.5)",
			shadowWidth: 0,
		},
		basics: {
			name: profile.name,
			headline: profile.role,
			email: profile.email,
			phone: profile.phone,
			location: profile.location,
			website: { url: profile.website, label: "" },
			customFields: [],
		},
		summary: {
			title: "Summary",
			icon: "article",
			columns: 1,
			hidden: false,
			showHeading: true,
			keepTogether: false,
			startOnNewPage: false,
			content: toHtml(profile.summary),
		},
		sections,
		customSections: [],
		metadata: {
			template: "onyx",
			layout: {
				sidebarWidth: 35,
				pages: [
					{
						fullWidth: false,
						main: ["summary", "experience", "education", "projects", "volunteer", "references", "profiles"],
						sidebar: ["skills", "certifications", "awards", "languages", "interests", "publications"],
					},
				],
			},
			page: {
				gapX: 4,
				gapY: 6,
				marginX: 14,
				marginY: 12,
				format: "a4",
				locale: "en-US",
				dateFormat: "short",
				hideLinkUnderline: false,
				hideIcons: false,
				hideSectionIcons: true,
			},
			design: {
				colors: {
					primary: "rgba(220, 38, 38, 1)",
					text: "rgba(0, 0, 0, 1)",
					background: "rgba(255, 255, 255, 1)",
				},
				level: { icon: "star", type: "circle" },
				entry: { layout: "stacked", lead: "organization", accent: "none" },
			},
			typography: {
				body: {
					fontFamily: "IBM Plex Serif",
					fontWeights: ["400", "500"],
					fontSize: 10,
					lineHeight: 1.5,
				},
				heading: {
					fontFamily: "IBM Plex Serif",
					fontWeights: ["600"],
					fontSize: 14,
					lineHeight: 1.5,
				},
			},
			notes: "",
			styleRules: [],
		},
	};
}

const exchangeItem = z
	.object({
		id: z.string().optional(),
		hidden: z.boolean().optional(),
		company: text.optional(),
		position: text.optional(),
		school: text.optional(),
		degree: text.optional(),
		area: text.optional(),
		grade: text.optional(),
		location: text.optional(),
		period: text.optional(),
		description: text.optional(),
		name: text.optional(),
		network: shortText.optional(),
		website: z.union([webUrl, z.object({ url: webUrl, label: shortText.optional() }).passthrough()]).optional(),
		url: webUrl.optional(),
		keywords: z.array(text).max(500).optional(),
		roles: z
			.array(
				z
					.object({
						position: text,
						period: text.optional(),
						description: text.optional(),
						hidden: z.boolean().optional(),
					})
					.passthrough(),
			)
			.max(200)
			.optional(),
	})
	.passthrough();
const exchangeSection = z
	.object({
		items: z.array(exchangeItem).max(500),
		hidden: z.boolean().optional(),
	})
	.passthrough();
const exchangeSchema = z
	.object({
		basics: z
			.object({
				name: shortText,
				headline: shortText.optional(),
				email: shortText.optional(),
				phone: shortText.optional(),
				website: z.union([webUrl, z.object({ url: webUrl, label: shortText.optional() }).passthrough()]).optional(),
				location: shortText.optional(),
			})
			.passthrough(),
		summary: z.object({ content: text, hidden: z.boolean().optional() }).passthrough(),
		sections: z
			.object({
				experience: exchangeSection,
				education: exchangeSection,
				skills: exchangeSection,
			})
			.catchall(exchangeSection),
	})
	.passthrough();

/** Import supported text fields from Reactive Resume v5/v6. Never render imported HTML. */
export function importResume(value: unknown): Resume {
	// The normal download is the resume data itself; account exports may wrap it in `data`.
	const candidate =
		typeof value === "object" && value !== null && "data" in value && !("basics" in value) ? value.data : value;
	const parsed = exchangeSchema.parse(candidate);
	const visibleItems = (section: z.infer<typeof exchangeSection>) =>
		section.hidden ? [] : section.items.filter((item) => !item.hidden);
	const block = (parts: (string | undefined)[]) =>
		parts
			.filter((part): part is string => Boolean(part?.trim()))
			.map(fromHtml)
			.join("\n");
	const experience = visibleItems(parsed.sections.experience)
		.map((item) =>
			block([
				item.company,
				item.position,
				item.location,
				item.period,
				item.description,
				...(item.roles ?? [])
					.filter((role) => !role.hidden)
					.map((role) => block([role.position, role.period, role.description])),
			]),
		)
		.join("\n\n");
	const education = visibleItems(parsed.sections.education)
		.map((item) =>
			block([item.school, item.degree, item.area, item.grade, item.location, item.period, item.description]),
		)
		.join("\n\n");
	const linkedinProfile = parsed.sections.profiles
		? visibleItems(parsed.sections.profiles).find((item) => item.network?.trim().toLowerCase() === "linkedin")
		: undefined;
	const itemUrl = linkedinProfile?.website ?? linkedinProfile?.url;
	const profile: Profile = {
		name: parsed.basics.name,
		role: parsed.basics.headline ?? "",
		email: parsed.basics.email ?? "",
		phone: parsed.basics.phone ?? "",
		website: typeof parsed.basics.website === "string" ? parsed.basics.website : (parsed.basics.website?.url ?? ""),
		linkedinUrl: typeof itemUrl === "string" ? itemUrl : (itemUrl?.url ?? ""),
		location: parsed.basics.location ?? "",
		summary: parsed.summary.hidden ? "" : fromHtml(parsed.summary.content),
		experience,
		education,
		skills: visibleItems(parsed.sections.skills)
			.flatMap((item) => [item.name ?? "", ...(item.keywords ?? [])])
			.filter(Boolean)
			.join(", "),
	};
	const proposedTitle = `${profile.name || "Imported"} · Imported resume`;
	return resumeSchema.parse({
		id: crypto.randomUUID(),
		title: proposedTitle.length <= 500 ? proposedTitle : "Imported resume",
		updatedAt: new Date().toISOString(),
		profile,
	});
}
