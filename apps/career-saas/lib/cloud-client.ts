import { z } from "zod";
import { exportResume, type Resume } from "./workspace";

const cloudUserSchema = z.object({ id: z.string(), name: z.string(), email: z.string() });
const cloudResumeSchema = z.object({
	id: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
	name: z.string(),
	updatedAt: z.string(),
	isPublic: z.boolean(),
});
const readinessSchema = z.discriminatedUnion("configured", [
	z.object({ configured: z.literal(false) }),
	z.object({ configured: z.literal(true), origin: z.string().url() }),
]);

export type CloudUser = z.infer<typeof cloudUserSchema>;
export type CloudResume = z.infer<typeof cloudResumeSchema>;
export type CloudReadiness = z.infer<typeof readinessSchema>;
const capabilitiesSchema = z.object({
	disableSignups: z.boolean(),
	disableEmailAuth: z.boolean(),
	smtpEnabled: z.boolean(),
	appUrl: z.string().url(),
});
export type CloudCapabilities = z.infer<typeof capabilitiesSchema>;

export class CloudRequestError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
		this.name = "CloudRequestError";
	}
}

async function cloudRequest(path: string, body?: unknown, accountId?: string): Promise<Response> {
	const response = await fetch(path, {
		method: body === undefined ? "GET" : "POST",
		credentials: "same-origin",
		cache: "no-store",
		headers: {
			accept: "application/json",
			...(body === undefined ? {} : { "content-type": "application/json" }),
			...(accountId ? { "x-account-id": accountId } : {}),
		},
		...(body === undefined ? {} : { body: JSON.stringify(body) }),
		signal: AbortSignal.timeout(50_000),
	});
	if (!response.ok) {
		const payload: unknown = await response.json().catch(() => null);
		const message = z.object({ message: z.string().max(1_000) }).safeParse(payload);
		throw new CloudRequestError(
			response.status,
			message.success ? message.data.message : "Couldn't complete this cloud request. Try again.",
		);
	}
	return response;
}

export async function getCloudReadiness(): Promise<CloudReadiness> {
	return readinessSchema.parse(await (await cloudRequest("/api/cloud/readiness")).json());
}

export async function getCloudCapabilities(): Promise<CloudCapabilities> {
	return capabilitiesSchema.parse(await (await cloudRequest("/api/cloud/flags")).json());
}

export async function getCloudUser(): Promise<CloudUser | null> {
	try {
		return cloudUserSchema.parse(await (await cloudRequest("/api/cloud/auth/profile")).json());
	} catch (error) {
		if (error instanceof CloudRequestError && error.status === 401) return null;
		throw error;
	}
}

export async function authenticateCloud(
	mode: "sign-in" | "sign-up",
	input: { name: string; email: string; password: string },
) {
	const response = await cloudRequest(`/api/auth/${mode}/email`, {
		email: input.email,
		password: input.password,
		...(mode === "sign-up" ? { name: input.name, username: "", displayUsername: "" } : {}),
		callbackURL: `${window.location.origin}/#cloud`,
	});
	return z.object({ twoFactorRedirect: z.boolean().optional() }).parse(await response.json());
}

export async function verifyCloudSecondFactor(code: string, backupCode: boolean) {
	await cloudRequest(`/api/auth/two-factor/${backupCode ? "verify-backup-code" : "verify-totp"}`, { code });
}

export async function signOutCloud(accountId: string) {
	await cloudRequest("/api/auth/sign-out", {}, accountId);
}

export async function requestCloudPasswordReset(email: string) {
	await cloudRequest("/api/auth/request-password-reset", {
		email,
		redirectTo: `${window.location.origin}/auth/reset-password`,
	});
}

export async function resetCloudPassword(token: string, newPassword: string) {
	await cloudRequest("/api/auth/reset-password", { token, newPassword });
}

export async function listCloudResumes(offset: number, accountId: string) {
	const response = await cloudRequest(`/api/cloud/resumes?limit=20&offset=${offset}`, undefined, accountId);
	const resumes = z.array(cloudResumeSchema).parse(await response.json());
	const rawTotal = response.headers.get("x-total-count");
	const total = rawTotal && /^\d+$/.test(rawTotal) ? Number(rawTotal) : offset + resumes.length;
	return { resumes, total };
}

export async function uploadCloudResume(resume: Resume, accountId: string): Promise<string> {
	try {
		return z
			.string()
			.regex(/^[A-Za-z0-9_-]{1,128}$/)
			.parse(await (await cloudRequest("/api/cloud/resumes/import", { data: exportResume(resume) }, accountId)).json());
	} catch (failure) {
		if (failure instanceof CloudRequestError && failure.status >= 400 && failure.status < 500) throw failure;
		throw new CloudRequestError(
			502,
			"Couldn't confirm the upload. It may have completed. Refresh your cloud list before uploading another copy.",
		);
	}
}

export async function readCloudResume(id: string, accountId: string): Promise<unknown> {
	if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error("Choose a valid cloud resume and try again.");
	return (await cloudRequest(`/api/cloud/resumes/${id}`, undefined, accountId)).json();
}

export async function downloadCloudResumePdf(id: string, accountId: string): Promise<Blob> {
	if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error("Choose a valid cloud resume and try again.");
	const response = await cloudRequest(`/api/cloud/resumes/${id}/pdf`, undefined, accountId);
	if (!response.headers.get("content-type")?.startsWith("application/pdf"))
		throw new Error("Couldn't read the generated PDF. Try again.");
	return response.blob();
}
