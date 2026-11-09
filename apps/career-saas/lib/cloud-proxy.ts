type CloudConfiguration = { configured: false } | { configured: true; origin: string };
type CloudSurface = "auth" | "service";

const privateHeaders = {
	"Cache-Control": "private, no-store",
	Pragma: "no-cache",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "no-referrer",
	Vary: "Cookie, Origin",
};
const authCookie = /^(?:__Secure-|__Host-)?better-auth\.[A-Za-z0-9_.-]+$/;
const resourceId = /^[A-Za-z0-9_-]{1,128}$/;
const authRoutes: Record<string, readonly string[]> = {
	"get-session": ["GET"],
	"sign-in/email": ["POST"],
	"sign-up/email": ["POST"],
	"sign-out": ["POST"],
	"verify-email": ["GET"],
	"send-verification-email": ["POST"],
	"request-password-reset": ["POST"],
	"reset-password": ["POST"],
	"two-factor/verify-totp": ["POST"],
	"two-factor/verify-backup-code": ["POST"],
};

export function cloudConfiguration(value: string | undefined): CloudConfiguration {
	if (!value) return { configured: false };
	try {
		const url = new URL(value);
		const local = process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
		if (
			(url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
			url.username ||
			url.password ||
			url.pathname !== "/" ||
			url.search ||
			url.hash
		)
			return { configured: false };
		return { configured: true, origin: url.origin };
	} catch {
		return { configured: false };
	}
}

/** Fixed routes reuse the parent's existing authentication and resource ownership checks. */
export function cloudTarget(surface: CloudSurface, path: readonly string[], method: string): string | null {
	if (!path.length || path.some((part) => !resourceId.test(part))) return null;
	const joined = path.join("/");
	if (surface === "auth") {
		if (path.length === 2 && path[0] === "reset-password" && method === "GET") return `/api/auth/${joined}`;
		return Object.hasOwn(authRoutes, joined) && authRoutes[joined]?.includes(method) ? `/api/auth/${joined}` : null;
	}
	if (joined === "flags" && method === "GET") return "/api/openapi/flags";
	if (joined === "auth/profile" && method === "GET") return "/api/openapi/auth/profile";
	if (joined === "resumes" && method === "GET") return "/api/openapi/resumes";
	if (joined === "resumes/import" && method === "POST") return "/api/openapi/resumes/import";
	if (path[0] === "resumes" && path.length === 2 && path[1] !== "import" && method === "GET")
		return `/api/openapi/resumes/${path[1]}`;
	if (path[0] === "resumes" && path.length === 3 && path[2] === "pdf" && method === "GET")
		return `/api/openapi/resumes/${path[1]}/pdf`;
	return null;
}

function problem(status: number, code: string, message: string) {
	return Response.json({ code, message }, { status, headers: privateHeaders });
}

async function readBoundedBody(request: Request, limit: number): Promise<Uint8Array | null> {
	if (!request.body) return new Uint8Array();
	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let length = 0;
	try {
		for (;;) {
			const next = await reader.read();
			if (next.done) break;
			length += next.value.byteLength;
			if (length > limit) {
				await reader.cancel();
				return null;
			}
			chunks.push(next.value);
		}
	} finally {
		reader.releaseLock();
	}
	const result = new Uint8Array(length);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return result;
}

export async function proxyCloudRequest(
	request: Request,
	surface: CloudSurface,
	path: readonly string[],
	backend: string | undefined,
) {
	const configuration = cloudConfiguration(backend);
	const source = new URL(request.url);
	if (!configuration.configured || configuration.origin === source.origin)
		return problem(503, "CLOUD_NOT_CONFIGURED", "Cloud accounts are unavailable. Continue locally or contact support.");
	const targetPath = cloudTarget(surface, path, request.method);
	if (!targetPath) return problem(404, "NOT_FOUND", "This cloud operation is unavailable.");
	const origin = request.headers.get("origin");
	const mutation = !["GET", "HEAD"].includes(request.method);
	const emailLinkNavigation =
		surface === "auth" &&
		request.method === "GET" &&
		((path.length === 1 && path[0] === "verify-email") || (path.length === 2 && path[0] === "reset-password")) &&
		request.headers.get("sec-fetch-mode") === "navigate" &&
		request.headers.get("sec-fetch-dest") === "document";
	if (
		(origin && origin !== source.origin) ||
		(request.headers.get("sec-fetch-site") === "cross-site" && !emailLinkNavigation) ||
		(mutation && origin !== source.origin)
	)
		return problem(403, "UNTRUSTED_ORIGIN", "Open CareerOS directly and try again.");
	const target = new URL(targetPath, configuration.origin);
	const allowedQuery =
		surface === "auth"
			? path[0] === "verify-email" || path[0] === "reset-password"
				? ["token", "callbackURL"]
				: ["disableCookieCache"]
			: path.join("/") === "resumes"
				? ["limit", "offset", "sort", "tags"]
				: path[2] === "pdf"
					? ["target"]
					: [];
	for (const [key, value] of source.searchParams) {
		if (!allowedQuery.includes(key))
			return problem(400, "INVALID_QUERY", "Remove unsupported request parameters and try again.");
		if (key === "callbackURL") {
			try {
				if (new URL(value, source.origin).origin !== source.origin)
					return problem(400, "INVALID_CALLBACK", "Return to CareerOS and try again.");
			} catch {
				return problem(400, "INVALID_CALLBACK", "Return to CareerOS and try again.");
			}
		}
		target.searchParams.append(key, value);
	}
	if (surface === "auth" && path.join("/") === "get-session") target.searchParams.set("disableCookieCache", "true");
	const headers = new Headers();
	for (const key of ["accept", "accept-language", "origin", "sec-fetch-site", "x-client-timezone", "x-account-id"]) {
		const value = request.headers.get(key);
		if (value) headers.set(key, value);
	}
	const cookies = (request.headers.get("cookie") ?? "")
		.split(";")
		.map((cookie) => cookie.trim())
		.filter((cookie) => authCookie.test(cookie.split("=", 1)[0] ?? ""));
	if (cookies.length) headers.set("cookie", cookies.join("; "));
	let body: Uint8Array | undefined;
	if (mutation) {
		if (request.headers.get("content-type")?.split(";", 1)[0]?.trim() !== "application/json")
			return problem(415, "JSON_REQUIRED", "Use a JSON request and try again.");
		let bytes: Uint8Array | null;
		try {
			bytes = await readBoundedBody(request, surface === "auth" ? 128 * 1024 : 2 * 1024 * 1024);
		} catch {
			return problem(400, "UNREADABLE_BODY", "Couldn't read this request. Try again.");
		}
		if (bytes === null)
			return problem(413, "PAYLOAD_TOO_LARGE", "This request is too large. Use a smaller resume and try again.");
		body = bytes;
		headers.set("content-type", "application/json");
	}
	try {
		const accountId = request.headers.get("x-account-id");
		if (
			(surface === "service" && !["auth/profile", "flags"].includes(path.join("/"))) ||
			(surface === "auth" && path.join("/") === "sign-out")
		) {
			if (!accountId || !resourceId.test(accountId))
				return problem(409, "ACCOUNT_REQUIRED", "Refresh your cloud account before continuing.");
			// The parent enforces write bindings too. Verify reads against the same captured cookie so a
			// stale view cannot import another account's resume after a different tab changes its session.
			const account = await fetch(new URL("/api/openapi/auth/profile", configuration.origin), {
				headers,
				redirect: "manual",
				cache: "no-store",
				signal: AbortSignal.timeout(15_000),
			});
			if (!account.ok)
				return problem(
					account.status === 401 ? 401 : 502,
					"ACCOUNT_UNAVAILABLE",
					"Your cloud session ended or is unavailable. Sign in again.",
				);
			const profile: unknown = await account.json();
			if (typeof profile !== "object" || profile === null || !("id" in profile) || profile.id !== accountId)
				return problem(409, "ACCOUNT_CHANGED", "Your cloud account changed. Refresh this page before continuing.");
		}
		const upstream = await fetch(target.toString(), {
			method: request.method,
			headers,
			body: body as BodyInit | undefined,
			redirect: "manual",
			cache: "no-store",
			signal: AbortSignal.timeout(45_000),
		});
		const contentType = upstream.headers.get("content-type")?.split(";", 1)[0]?.trim() ?? "";
		if (
			upstream.status !== 204 &&
			!(upstream.status >= 300 && upstream.status < 400) &&
			!/^application\/(?:json|[a-z0-9.+-]+\+json)$/.test(contentType) &&
			!(surface === "service" && path[2] === "pdf" && contentType === "application/pdf")
		)
			return problem(502, "INVALID_BACKEND_RESPONSE", "Cloud account settings need attention. Contact support.");
		const responseHeaders = new Headers(privateHeaders);
		for (const key of ["content-type", "content-disposition", "retry-after", "x-total-count", "x-limit", "x-offset"]) {
			const value = upstream.headers.get(key);
			if (value) responseHeaders.set(key, value);
		}
		const location = upstream.headers.get("location");
		if (location) {
			const redirect = new URL(location, source.origin);
			if (redirect.origin !== source.origin)
				return problem(502, "INVALID_BACKEND_REDIRECT", "Cloud account settings need attention. Contact support.");
			responseHeaders.set("location", redirect.toString());
		}
		for (const cookie of upstream.headers.getSetCookie()) {
			if (!authCookie.test(cookie.slice(0, cookie.indexOf("=")))) continue;
			if (/;\s*domain\s*=/i.test(cookie) || (source.protocol === "https:" && !/;\s*secure(?:;|$)/i.test(cookie)))
				return problem(502, "INVALID_BACKEND_COOKIE", "Cloud account settings need attention. Contact support.");
			responseHeaders.append("set-cookie", cookie);
		}
		return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
	} catch {
		return problem(
			502,
			"BACKEND_UNAVAILABLE",
			"Couldn't reach your cloud account. Refresh your cloud list before uploading again; the last request may have completed.",
		);
	}
}
