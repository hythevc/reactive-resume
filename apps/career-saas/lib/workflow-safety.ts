import type { Contact, Job, Profile, Resume, Workspace } from "./workspace";

/** Resume versions are snapshots. Promoting one changes only the shared career facts. */
export function careerProfileFromResume(workspace: Workspace, resume: Resume): Workspace {
	return { ...workspace, profile: { ...resume.profile } };
}

export function updateResumeProfile(
	workspace: Workspace,
	resumeId: string,
	field: keyof Profile,
	value: string,
): Workspace {
	return {
		...workspace,
		resumes: workspace.resumes.map((resume) =>
			resume.id === resumeId
				? {
						...resume,
						profile: { ...resume.profile, [field]: value },
						updatedAt: new Date().toISOString(),
					}
				: resume,
		),
	};
}

function reservedSampleAddress(value: string) {
	return /(?:^|[.@])(?:example\.test|invalid|localhost)(?:$|[/:])/i.test(value.trim());
}

type OutboundTarget = { email?: string; url?: string };

/** Keep seeded demonstration facts out of an external draft until the user replaces them. */
export function outboundBlockReason(profile: Profile, message: string, target: OutboundTarget = {}): string | null {
	if (reservedSampleAddress(profile.email) || (!profile.email && profile.name === "Alex Morgan")) {
		return "Replace the sample career profile in Settings, or use a reviewed resume as your career profile, before sharing a draft.";
	}
	if (target.email && reservedSampleAddress(target.email)) {
		return "Replace this sample contact with a researched recipient before sharing a draft.";
	}
	if (target.url) {
		try {
			if (reservedSampleAddress(new URL(target.url).hostname)) {
				return "Replace this sample job with a real posting before sharing an introduction.";
			}
		} catch {
			return "Check the job URL before sharing this introduction.";
		}
	}
	if (/\bAlex Morgan\b|\balex\.morgan@example\.test\b|\bNorthstar Studio\b|\bFieldwork Labs\b/i.test(message)) {
		return "This draft still contains sample facts. Edit or refresh it from your reviewed career profile before sharing.";
	}
	return null;
}

/** Approval belongs to exact current facts and content; it is never a delivery receipt. */
export function outreachReviewKey(profile: Profile, contact: Contact): string {
	return JSON.stringify([
		profile,
		contact.id,
		contact.name,
		contact.company,
		contact.role,
		contact.email,
		contact.sourceUrl,
		contact.context,
		contact.message,
	]);
}

export function introductionReviewKey(profile: Profile, goals: Workspace["goals"], job: Job): string {
	return JSON.stringify([profile, goals, job.id, job.company, job.role, job.url, job.introduction]);
}

/** An explicit offset avoids interpreting an interview in whichever time zone the editing device uses. */
export function parseInterviewSchedule(
	value: string,
	timeZone: string,
): { interviewAt: string | null; interviewTimezone: string } {
	const interviewTimezone = timeZone.trim() || "Europe/London";
	try {
		new Intl.DateTimeFormat("en-GB", { timeZone: interviewTimezone });
	} catch {
		throw new Error("Use a valid display time zone, such as Europe/London.");
	}
	const input = value.trim();
	if (!input) return { interviewAt: null, interviewTimezone };
	if (
		!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(input) ||
		!Number.isFinite(Date.parse(input))
	) {
		throw new Error("Include the interview date, time and UTC offset, such as 2026-11-20T14:00:00+00:00.");
	}
	const [year, month, day] = input.slice(0, 10).split("-").map(Number);
	const calendarDay = new Date(`${input.slice(0, 10)}T00:00:00Z`);
	if (
		calendarDay.getUTCFullYear() !== year ||
		calendarDay.getUTCMonth() + 1 !== month ||
		calendarDay.getUTCDate() !== day ||
		Number(input.slice(11, 13)) > 23
	) {
		throw new Error("Use a valid calendar date and time for the interview.");
	}
	return { interviewAt: new Date(input).toISOString(), interviewTimezone };
}
