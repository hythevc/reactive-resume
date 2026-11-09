import assert from "node:assert/strict";
import { test } from "node:test";
import { cloudConfiguration, cloudTarget, proxyCloudRequest } from "./cloud-proxy";

test("cloud configuration accepts only an explicit HTTPS backend origin", () => {
	assert.equal(cloudConfiguration(undefined).configured, false);
	for (const value of [
		"http://example.test",
		"https://user:pass@example.test",
		"https://example.test/api",
		"https://example.test/?key=secret",
		"file:///etc/passwd",
	]) {
		assert.equal(cloudConfiguration(value).configured, false);
	}
	assert.deepEqual(cloudConfiguration("https://backend.example.test"), {
		configured: true,
		origin: "https://backend.example.test",
	});
});

test("the cloud gateway exposes only selected existing auth and owned resume operations", () => {
	assert.equal(cloudTarget("auth", ["sign-in", "email"], "POST"), "/api/auth/sign-in/email");
	assert.equal(cloudTarget("service", ["resumes", "resume_123", "pdf"], "GET"), "/api/openapi/resumes/resume_123/pdf");
	assert.equal(cloudTarget("service", ["resumes", "import"], "POST"), "/api/openapi/resumes/import");
	for (const path of [
		["..", "auth"],
		["https:", "evil.test"],
		["resumes", "a/b"],
		["resumes", "%2e%2e"],
		["auth", "api-keys"],
		["career", "generate"],
	]) {
		assert.equal(cloudTarget("service", path, "GET"), null);
	}
	assert.equal(cloudTarget("service", ["resumes", "resume_123"], "DELETE"), null);
	assert.equal(cloudTarget("auth", ["sign-up", "email"], "GET"), null);
	for (const path of ["__proto__", "constructor", "toString"]) assert.equal(cloudTarget("auth", [path], "GET"), null);
});

test("cloud writes fail closed for another origin before contacting the backend", async (t) => {
	t.mock.method(globalThis, "fetch", () => {
		throw new Error("must not call backend");
	});
	const response = await proxyCloudRequest(
		new Request("https://career.example.test/api/cloud/resumes/import", {
			method: "POST",
			headers: { origin: "https://evil.example.test", "content-type": "application/json" },
			body: "{}",
		}),
		"service",
		["resumes", "import"],
		"https://backend.example.test",
	);
	assert.equal(response.status, 403);
	assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("cloud gateway delegates cookies and caller origin without a shared service credential", async (t) => {
	t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
		if (String(input).endsWith("/auth/profile")) return Response.json({ id: "account-a" });
		assert.equal(String(input), "https://backend.example.test/api/openapi/resumes?limit=20&offset=0");
		const headers = new Headers(init?.headers);
		assert.equal(headers.get("cookie"), "__Secure-better-auth.session_token=own-session");
		assert.equal(headers.get("origin"), "https://career.example.test");
		assert.equal(headers.get("x-api-key"), null);
		assert.equal(headers.get("authorization"), null);
		assert.equal(init?.redirect, "manual");
		assert.equal(init?.cache, "no-store");
		return Response.json([{ id: "own-resume", name: "Own resume" }], {
			headers: { "x-total-count": "1", "cache-control": "public,max-age=1000" },
		});
	});
	const response = await proxyCloudRequest(
		new Request("https://career.example.test/api/cloud/resumes?limit=20&offset=0", {
			headers: {
				origin: "https://career.example.test",
				cookie: "tracking=private; __Secure-better-auth.session_token=own-session",
				authorization: "Bearer arbitrary",
				"x-api-key": "arbitrary",
				"x-account-id": "account-a",
			},
		}),
		"service",
		["resumes"],
		"https://backend.example.test",
	);
	assert.equal(response.status, 200);
	assert.equal(response.headers.get("cache-control"), "private, no-store");
	assert.equal(response.headers.get("x-total-count"), "1");
});

test("a stale cloud view cannot read or upload into a newly signed-in account", async (t) => {
	let calls = 0;
	t.mock.method(globalThis, "fetch", async () => {
		calls += 1;
		return Response.json({ id: "account-b" });
	});
	const response = await proxyCloudRequest(
		new Request("https://career.example.test/api/cloud/resumes", {
			headers: { "x-account-id": "account-a" },
		}),
		"service",
		["resumes"],
		"https://backend.example.test",
	);
	assert.equal(response.status, 409);
	assert.equal(calls, 1);
});

test("cloud redirects and invalid backend destinations cannot leak a session", async (t) => {
	t.mock.method(
		globalThis,
		"fetch",
		async () => new Response(null, { status: 302, headers: { location: "https://evil.example.test/collect" } }),
	);
	const request = new Request("https://career.example.test/api/auth/get-session");
	const response = await proxyCloudRequest(request, "auth", ["get-session"], "https://backend.example.test");
	assert.equal(response.status, 502);
	assert.equal(response.headers.get("location"), null);
	assert.equal((await proxyCloudRequest(request, "auth", ["get-session"], "https://career.example.test")).status, 503);
});

test("auth response keeps separate host-only cookies and never caches account data", async (t) => {
	const headers = new Headers({ "content-type": "application/json" });
	headers.append(
		"set-cookie",
		"__Secure-better-auth.session_token=own-session; Path=/; HttpOnly; Secure; SameSite=Lax",
	);
	headers.append("set-cookie", "better-auth.session_data=own-cache; Path=/; HttpOnly; Secure; SameSite=Lax");
	headers.append("set-cookie", "tracking=not-forwarded; Path=/");
	t.mock.method(globalThis, "fetch", async () => new Response("{}", { headers }));
	const response = await proxyCloudRequest(
		new Request("https://career.example.test/api/auth/sign-in/email", {
			method: "POST",
			headers: { origin: "https://career.example.test", "content-type": "application/json" },
			body: "{}",
		}),
		"auth",
		["sign-in", "email"],
		"https://backend.example.test",
	);
	assert.equal(response.status, 200);
	assert.equal(response.headers.getSetCookie().length, 2);
	assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("password reset links remain on the canonical app without enabling an open redirect", async (t) => {
	t.mock.method(
		globalThis,
		"fetch",
		async () =>
			new Response(null, { status: 302, headers: { location: "/auth/reset-password?token=fictional-token" } }),
	);
	const response = await proxyCloudRequest(
		new Request(
			"https://career.example.test/api/auth/reset-password/fictional-token?callbackURL=https%3A%2F%2Fcareer.example.test%2Fauth%2Freset-password",
		),
		"auth",
		["reset-password", "fictional-token"],
		"https://backend.example.test",
	);
	assert.equal(response.status, 302);
	assert.equal(
		response.headers.get("location"),
		"https://career.example.test/auth/reset-password?token=fictional-token",
	);
});

test("emailed verification and reset document links reach the existing token validator", async (t) => {
	t.mock.method(globalThis, "fetch", async (_url: string | URL | Request, options?: RequestInit) => {
		assert.equal(new Headers(options?.headers).get("sec-fetch-site"), "cross-site");
		return Response.json({ checked: true });
	});
	for (const path of [["verify-email"], ["reset-password", "fictional-token"]]) {
		const request = new Request(`https://career.example.test/api/auth/${path.join("/")}`, {
			headers: { "sec-fetch-site": "cross-site", "sec-fetch-mode": "navigate", "sec-fetch-dest": "document" },
		});
		assert.equal((await proxyCloudRequest(request, "auth", path, "https://backend.example.test")).status, 200);
	}
});

test("cross-site session reads and token-link fetches remain blocked", async (t) => {
	t.mock.method(globalThis, "fetch", () => {
		throw new Error("must not call backend");
	});
	for (const path of [["get-session"], ["verify-email"]]) {
		const request = new Request(`https://career.example.test/api/auth/${path.join("/")}`, {
			headers: { "sec-fetch-site": "cross-site", "sec-fetch-mode": "cors", "sec-fetch-dest": "empty" },
		});
		assert.equal((await proxyCloudRequest(request, "auth", path, "https://backend.example.test")).status, 403);
	}
});

test("unsafe queries and oversized bodies are refused before contacting any service", async (t) => {
	t.mock.method(globalThis, "fetch", () => {
		throw new Error("must not call backend");
	});
	const injected = await proxyCloudRequest(
		new Request("https://career.example.test/api/cloud/resumes?url=https://evil.test"),
		"service",
		["resumes"],
		"https://backend.example.test",
	);
	assert.equal(injected.status, 400);
	const large = await proxyCloudRequest(
		new Request("https://career.example.test/api/auth/sign-in/email", {
			method: "POST",
			headers: { origin: "https://career.example.test", "content-type": "application/json" },
			body: "x".repeat(128 * 1024 + 1),
		}),
		"auth",
		["sign-in", "email"],
		"https://backend.example.test",
	);
	assert.equal(large.status, 413);
});

test("domain-scoped upstream cookies fail closed rather than silently changing session ownership", async (t) => {
	t.mock.method(
		globalThis,
		"fetch",
		async () =>
			new Response("{}", {
				headers: {
					"content-type": "application/json",
					"set-cookie": "better-auth.session_token=value; Domain=backend.example.test; Path=/; Secure; HttpOnly",
				},
			}),
	);
	const response = await proxyCloudRequest(
		new Request("https://career.example.test/api/auth/get-session"),
		"auth",
		["get-session"],
		"https://backend.example.test",
	);
	assert.equal(response.status, 502);
	assert.equal(response.headers.getSetCookie().length, 0);
});

test("a platform HTML response cannot execute under the CareerOS origin", async (t) => {
	t.mock.method(
		globalThis,
		"fetch",
		async () => new Response("<script>unsafe()</script>", { headers: { "content-type": "text/html" } }),
	);
	const response = await proxyCloudRequest(
		new Request("https://career.example.test/api/auth/get-session"),
		"auth",
		["get-session"],
		"https://backend.example.test",
	);
	assert.equal(response.status, 502);
	assert.equal((await response.text()).includes("<script>"), false);
});
