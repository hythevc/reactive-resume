import { z } from "zod";

const text = z.string().max(50_000);
const shortText = z.string().max(500);
const id = z.string().min(1).max(100);
const timestamp = z.string().datetime();
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
export const resumeSchema = z
	.object({
		id,
		title: shortText,
		updatedAt: timestamp,
		profile: profileSchema,
	})
	.strict();
export const linkedinSchema = z.object({ headline: shortText, about: text, experience: text, skills: text }).strict();
const jobSchema = z
	.object({
		id,
		company: shortText,
		role: shortText,
		location: shortText,
		url: webUrl,
		description: text,
		status: z.enum(["Saved", "Draft", "Applied", "Interview"]),
		notes: text,
		createdAt: timestamp,
	})
	.strict();
const contactSchema = z
	.object({
		id,
		name: shortText,
		company: shortText,
		role: shortText,
		email: shortText,
		status: z.enum(["Draft", "Contacted", "Replied"]),
		message: text,
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
		goals: z
			.object({
				role: shortText,
				location: shortText,
				minSalary: z.number().finite().min(0).max(10_000_000),
			})
			.strict(),
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
	});

export type Profile = z.infer<typeof profileSchema>;
export type Resume = z.infer<typeof resumeSchema>;
export type Job = z.infer<typeof jobSchema>;
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
			},
			{
				id: "resume-systems",
				title: "Design systems · Focused resume",
				updatedAt: "2026-11-06T14:00:00.000Z",
				profile: {
					...profile,
					role: "Senior Product Designer · Design Systems",
				},
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
			notes: index === 2 ? "Example interview stage. Add your own interview details here." : "",
			createdAt: now,
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
			},
			{
				id: "contact-2",
				name: "Taylor Brooks",
				company: "Arcwell",
				role: "Talent Partner",
				email: "taylor@example.test",
				status: "Draft",
				message: "",
			},
			{
				id: "contact-3",
				name: "Jordan Lee",
				company: "Northline",
				role: "Executive Recruiter",
				email: "jordan@example.test",
				status: "Draft",
				message: "",
			},
			{
				id: "contact-4",
				name: "Sam Rivera",
				company: "Layers",
				role: "Design Talent Lead",
				email: "sam@example.test",
				status: "Draft",
				message: "",
			},
		],
		goals: {
			role: "Senior Product Designer",
			location: "Remote · US",
			minSalary: 150_000,
		},
		autopilot: {
			enabled: false,
			dailyLimit: 5,
			minMatch: 60,
			preparationDate: "",
			preparationCount: 0,
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
	const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(text);
}

/** Local keyword overlap only. A score is not a hiring probability or an AI evaluation. */
export function scoreJob(profile: Profile, job: Job): number {
	const terms = [
		...new Set([...splitSkills(profile.skills), ...profile.role.split(/\s+/).filter((word) => word.length >= 4)]),
	];
	if (!terms.length) return 0;
	const posting = `${job.role} ${job.description}`;
	return Math.round((terms.filter((term) => includesTerm(posting, term)).length / terms.length) * 100);
}

export function buildOutreach(profile: Profile, contact: Contact): string {
	const greeting = contact.name.trim() ? `Hi ${contact.name.trim().split(/\s+/)[0]},` : "Hello,";
	const intro = [
		profile.name.trim() ? `I'm ${profile.name.trim()}` : "I'm exploring my next opportunity",
		profile.role.trim() ? `a ${profile.role.trim()}` : "",
	]
		.filter(Boolean)
		.join(", ");
	const skills = splitSkills(profile.skills).slice(0, 3);
	return `${greeting}\n\n${intro}.${skills.length ? ` My skills include ${skills.join(", ")}.` : ""}\n\nI'm interested in opportunities${contact.company.trim() ? ` at ${contact.company.trim()}` : " you are recruiting for"}. Would you be open to a short conversation about roles that might fit?\n\nThank you,\n${profile.name.trim()}`;
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
			phone: "",
			location: profile.location,
			website: { url: "", label: "" },
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
	const profile: Profile = {
		name: parsed.basics.name,
		role: parsed.basics.headline ?? "",
		email: parsed.basics.email ?? "",
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
