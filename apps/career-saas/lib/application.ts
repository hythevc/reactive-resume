import { z } from "zod";
import {
	applicationSchema,
	applicationSourceJobSchema,
	compareResumeToJob,
	extractJobKeywords,
	profileSchema,
	targetKeywordsSchema,
	APPLICATION_COVER_LETTER_MAX_LENGTH,
	APPLICATION_REVIEW_ISSUE_LIMIT,
	APPLICATION_REVIEW_ISSUE_MAX_LENGTH,
	APPLICATION_REVIEW_SUMMARY_MAX_LENGTH,
	type Application,
	type ApplicationAgentReview,
	type ApplicationSourceJob,
	type Job,
	type Profile,
	type ResumeJobComparison,
} from "./workspace";

function same(first: unknown, second: unknown): boolean {
	return JSON.stringify(first) === JSON.stringify(second);
}

function normalize(value: string): string {
	return value.normalize("NFKC").trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

function termMatcher(term: string): RegExp {
	const escaped = normalize(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, "u");
}

function skillUnits(value: string): string[] {
	return value
		.split(/[,;\n]/)
		.map((skill) => skill.trim())
		.filter(Boolean);
}

function sourceJob(job: Job): ApplicationSourceJob {
	return applicationSourceJobSchema.parse({
		company: job.company,
		role: job.role,
		location: job.location,
		url: job.url,
		description: job.description,
	});
}

/** Local tailoring only reorders existing skill labels; history and identity remain exact source text. */
export function createApplication(
	sourceProfile: Profile,
	job: Job,
	sourceResumeId: string | null,
	id: string,
	now: string,
): Application {
	const profile = profileSchema.parse(sourceProfile);
	const target = sourceJob(job);
	const keywords = extractJobKeywords(job);
	const matchers = keywords.map(termMatcher);
	const units = skillUnits(profile.skills);
	const scored = units.map((skill, index) => ({
		skill,
		index,
		matched: matchers.some((matcher) => matcher.test(normalize(skill))),
	}));
	const ordered = [...scored].sort(
		(first, second) => Number(second.matched) - Number(first.matched) || first.index - second.index,
	);
	const reordered = ordered.map((item) => item.skill).join(", ");
	const changedOrder = ordered.some((item, index) => item.index !== index);
	const resume = profileSchema.parse({
		...profile,
		skills: changedOrder && reordered.length <= 50_000 ? reordered : profile.skills,
	});
	const conciseSkills = ordered
		.filter((item) => item.skill.length <= 500)
		.slice(0, 5)
		.map((item) => item.skill);
	const experience = profile.experience
		.split(/\n\s*\n/)
		.map((block) => block.trim())
		.filter((block) => block && block.length <= 3_000);
	const excerpt =
		experience.find((block) => matchers.some((matcher) => matcher.test(normalize(block)))) ?? experience[0];
	const summary = profile.summary.trim();
	const background =
		summary && summary.length <= 3_000
			? summary
			: profile.role.trim()
				? `My professional title is ${profile.role.trim()}.`
				: "";
	const role = target.role.trim() ? `the ${target.role.trim()} role` : "this opportunity";
	const company = target.company.trim() ? ` at ${target.company.trim()}` : "";
	const paragraphs = [
		"Dear hiring team,",
		`I am interested in ${role}${company}.`,
		background,
		conciseSkills.length ? `My listed skills include ${conciseSkills.join(", ")}.` : "",
		excerpt ? `Experience from my resume:\n${excerpt}` : "",
		"Thank you for considering my application. I would welcome a conversation about the role.",
		profile.name.trim(),
	].filter(Boolean);
	return applicationSchema.parse({
		id,
		createdAt: now,
		sourceResumeId,
		sourceProfile: profile,
		sourceJob: target,
		targetKeywords: keywords.join(", "),
		resume,
		coverLetter: paragraphs.join("\n\n"),
		agentReview: null,
	});
}

/** Tracker status, notes, interest and interview scheduling do not change a factual source snapshot. */
export function applicationSourceChanged(sourceProfile: Profile | null, job: Job, application: Application): boolean {
	if (!sourceProfile) return true;
	const current = profileSchema.safeParse(sourceProfile);
	return (
		!current.success || !same(current.data, application.sourceProfile) || !same(sourceJob(job), application.sourceJob)
	);
}

export type ApplicationCheck = { id: string; label: string; passed: boolean; detail: string; blocking: boolean };
export type ApplicationReview = { checks: ApplicationCheck[]; comparison: ResumeJobComparison; canExport: boolean };

function numericTokens(value: string): string[] {
	return value.match(/\d+(?:[.,]\d+)*(?:%|\+)?/g) ?? [];
}

export function reviewApplication(sourceProfile: Profile | null, job: Job, value: Application): ApplicationReview {
	const application = applicationSchema.parse(value);
	const review = application.agentReview;
	const identityFields = ["name", "email", "phone", "website", "linkedinUrl", "role", "location"] as const;
	const identityPreserved = identityFields.every(
		(field) => application.resume[field] === application.sourceProfile[field],
	);
	const allowedNumbers = new Set(numericTokens(Object.values(application.sourceProfile).join("\n")));
	const newNumbers = [
		...new Set(numericTokens(`${Object.values(application.resume).join("\n")}\n${application.coverLetter}`)),
	].filter((token) => !allowedNumbers.has(token));
	const sourceSkills = new Set(skillUnits(application.sourceProfile.skills).map(normalize));
	const addedSkills = skillUnits(application.resume.skills).filter((skill) => !sourceSkills.has(normalize(skill)));
	const fieldsUnchanged = ["summary", "experience", "education"].every(
		(field) =>
			application.resume[field as "summary" | "experience" | "education"] ===
			application.sourceProfile[field as "summary" | "experience" | "education"],
	);
	const checks: ApplicationCheck[] = [
		{
			id: "source-present",
			label: "Source profile available",
			passed: sourceProfile !== null,
			blocking: true,
			detail: "The selected source resume or master profile must still be available.",
		},
		{
			id: "source-current",
			label: "Source and job unchanged",
			passed: !applicationSourceChanged(sourceProfile, job, application),
			blocking: true,
			detail:
				"Regenerate the package if its source profile or the posting changes. Tracker stages and notes are independent.",
		},
		{
			id: "job-target",
			label: "Job target is complete",
			passed: Boolean(job.company.trim() && job.role.trim() && job.description.trim()),
			blocking: true,
			detail: "Supply the company, role and posting description before preparing a reviewed application package.",
		},
		{
			id: "resume-content",
			label: "Resume has identifying content",
			passed: Boolean(
				application.resume.name.trim() &&
				[
					application.resume.summary,
					application.resume.skills,
					application.resume.experience,
					application.resume.education,
				].some((field) => field.trim()),
			),
			blocking: true,
			detail: "Add your name and substantive resume content to the source before creating a package.",
		},
		{
			id: "cover-letter-content",
			label: "Cover letter is present",
			passed: Boolean(application.coverLetter.trim()),
			blocking: true,
			detail: "The reviewed package must contain a cover-letter draft.",
		},
		{
			id: "identity-preserved",
			label: "Identity and professional title retained",
			passed: identityPreserved,
			blocking: true,
			detail:
				"Name, contact details, location and actual professional title must match the supplied source. A target job title is not a qualification.",
		},
		{
			id: "report-present",
			label: "Imported reviewer report present",
			passed: review !== null,
			blocking: true,
			detail:
				"Import an independent reviewer report through the application packet workflow. The app does not call or verify a reviewer service.",
		},
		{
			id: "report-current",
			label: "Report matches the final documents",
			passed: Boolean(
				review &&
				same(review.reviewedResume, application.resume) &&
				review.reviewedCoverLetter === application.coverLetter,
			),
			blocking: true,
			detail: "Any document edit after review requires a new imported report.",
		},
		{
			id: "report-summary",
			label: "Reviewer summary supplied",
			passed: Boolean(review?.summary.trim()),
			blocking: true,
			detail: "The imported report must explain what was reviewed.",
		},
		{
			id: "report-issues",
			label: "No unresolved reviewer issues",
			passed: Boolean(review && review.issues.length === 0),
			blocking: true,
			detail:
				"Resolve actionable draft problems and request another review. Qualification gaps belong in the summary and fit comparison.",
		},
		{
			id: "history-unchanged",
			label: "History and summary match the source",
			passed: fieldsUnchanged,
			blocking: false,
			detail:
				"Literal text comparison only. Reworded summaries, experience or education require your direct comparison with the source; this check cannot establish semantic truth.",
		},
		{
			id: "skills-from-source",
			label: "Skill labels come from the source",
			passed: addedSkills.length === 0,
			blocking: false,
			detail: addedSkills.length
				? `Review added or reworded skill labels: ${addedSkills.join(", ")}. This is a literal heuristic, not a factual verdict.`
				: "No additional literal skill labels were found. This does not verify proficiency.",
		},
		{
			id: "numbers-from-source",
			label: "Numbers appear in supplied facts",
			passed: newNumbers.length === 0,
			blocking: false,
			detail: newNumbers.length
				? `Review numbers absent from the source profile: ${newNumbers.join(", ")}. Dates, formatting and target names can trigger this heuristic; it cannot verify achievements.`
				: "No additional numeric tokens were found. Shared numbers do not prove that a claim is true.",
		},
		{
			id: "target-mentioned",
			label: "Cover letter names this role and company",
			passed: Boolean(
				job.company.trim() &&
				job.role.trim() &&
				normalize(application.coverLetter).includes(normalize(job.company)) &&
				normalize(application.coverLetter).includes(normalize(job.role)),
			),
			blocking: false,
			detail: "Check the intended recipient and role yourself; a literal name match does not establish relevance.",
		},
		{
			id: "no-placeholders",
			label: "No common drafting placeholders found",
			passed: !/\b(?:TODO|TBD)\b|\[(?:your name|company|job title|insert[^\]]*)\]/i.test(
				`${Object.values(application.resume).join("\n")}\n${application.coverLetter}`,
			),
			blocking: false,
			detail: "A small placeholder check cannot catch every unfinished sentence. Read both documents before exporting.",
		},
	];
	return {
		checks,
		comparison: compareResumeToJob(application.resume, application.targetKeywords),
		canExport: checks.every((check) => !check.blocking || check.passed),
	};
}

const packetInputSchema = z
	.object({
		sourceProfile: profileSchema,
		sourceJob: applicationSourceJobSchema,
		targetKeywords: targetKeywordsSchema,
		resume: profileSchema,
		coverLetter: z.string().max(APPLICATION_COVER_LETTER_MAX_LENGTH),
	})
	.strict();
export const applicationPacketSchema = z
	.object({
		format: z.literal("careeros.application-packet.v1"),
		packetId: z.string().min(1).max(100),
		input: packetInputSchema,
	})
	.strict();
const applicationResultSchema = z
	.object({
		format: z.literal("careeros.application-result.v1"),
		packetId: z.string().min(1).max(100),
		input: packetInputSchema,
		resume: profileSchema,
		coverLetter: z.string().max(APPLICATION_COVER_LETTER_MAX_LENGTH),
		review: z
			.object({
				summary: z
					.string()
					.max(APPLICATION_REVIEW_SUMMARY_MAX_LENGTH)
					.refine((value) => Boolean(value.trim()), "Supply a nonempty reviewer summary."),
				issues: z.array(z.string().max(APPLICATION_REVIEW_ISSUE_MAX_LENGTH)).max(APPLICATION_REVIEW_ISSUE_LIMIT),
			})
			.strict(),
	})
	.strict();

export type ApplicationPacket = z.infer<typeof applicationPacketSchema>;
export type ApplicationResultPatch = { resume: Profile; coverLetter: string; agentReview: ApplicationAgentReview };

/** Export is allowed before review, but never when the supplied source has disappeared or changed. */
export function exportApplicationPacket(
	sourceProfile: Profile | null,
	job: Job,
	application: Application,
): ApplicationPacket {
	const current = applicationSchema.parse(application);
	if (applicationSourceChanged(sourceProfile, job, current))
		throw new Error("The source or job changed. Regenerate this package before exporting a packet.");
	return applicationPacketSchema.parse({
		format: "careeros.application-packet.v1",
		packetId: current.id,
		input: {
			sourceProfile: current.sourceProfile,
			sourceJob: current.sourceJob,
			targetKeywords: current.targetKeywords,
			resume: current.resume,
			coverLetter: current.coverLetter,
		},
	});
}

/** Call with a freshly exported current packet. Imported approval flags and cross-packet echoes are rejected. */
export function parseApplicationResult(raw: unknown, currentPacket: ApplicationPacket): ApplicationResultPatch {
	const packet = applicationPacketSchema.parse(currentPacket);
	const result = applicationResultSchema.parse(raw);
	if (result.packetId !== packet.packetId || !same(result.input, packet.input))
		throw new Error(
			"This result does not match the current application packet. Export a fresh packet and request another review.",
		);
	return {
		resume: result.resume,
		coverLetter: result.coverLetter,
		agentReview: {
			summary: result.review.summary,
			issues: result.review.issues,
			reviewedResume: profileSchema.parse(result.resume),
			reviewedCoverLetter: result.coverLetter,
		},
	};
}
