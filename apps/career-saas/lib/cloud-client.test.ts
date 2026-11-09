import assert from "node:assert/strict";
import { test } from "node:test";
import { CloudRequestError, getCloudUser, listCloudResumes, uploadCloudResume } from "./cloud-client";
import { createWorkspace } from "./workspace";

test("a cloud upload uses the existing resume import contract and binds the reviewed account", async (t) => {
	const resume = createWorkspace().resumes[0];
	resume.profile.name = "Synthetic commercial candidate";
	t.mock.method(globalThis, "fetch", async (url: string | URL | Request, options?: RequestInit) => {
		assert.equal(url, "/api/cloud/resumes/import");
		assert.equal(new Headers(options?.headers).get("x-account-id"), "account-a");
		assert.equal(options?.credentials, "same-origin");
		assert.equal(options?.cache, "no-store");
		const body = JSON.parse(String(options?.body));
		assert.equal(body.data.basics.name, "Synthetic commercial candidate");
		assert.equal("userId" in body, false);
		assert.equal("isPublic" in body, false);
		return Response.json("cloud-resume-a");
	});
	assert.equal(await uploadCloudResume(resume, "account-a"), "cloud-resume-a");
});

test("session checks distinguish signed-out from an unavailable or forbidden account", async (t) => {
	const stub = t.mock.method(globalThis, "fetch", async () =>
		Response.json({ message: "Sign in again." }, { status: 401 }),
	);
	assert.equal(await getCloudUser(), null);
	stub.mock.mockImplementation(async () => Response.json({ message: "Forbidden." }, { status: 403 }));
	await assert.rejects(getCloudUser(), (error) => error instanceof CloudRequestError && error.status === 403);
});

test("private resume pagination retains the server total and current account expectation", async (t) => {
	t.mock.method(globalThis, "fetch", async (url: string | URL | Request, options?: RequestInit) => {
		assert.equal(url, "/api/cloud/resumes?limit=20&offset=20");
		assert.equal(new Headers(options?.headers).get("x-account-id"), "account-a");
		return Response.json(
			[{ id: "resume-b", name: "Private resume", updatedAt: "2026-11-09T00:00:00.000Z", isPublic: false }],
			{ headers: { "x-total-count": "21" } },
		);
	});
	const result = await listCloudResumes(20, "account-a");
	assert.equal(result.total, 21);
	assert.equal(result.resumes[0].isPublic, false);
});

test("an uncertain upload never recommends a blind retry", async (t) => {
	t.mock.method(globalThis, "fetch", async () => {
		throw new Error("Synthetic connection loss after server acceptance");
	});
	await assert.rejects(
		uploadCloudResume(createWorkspace().resumes[0], "account-a"),
		(error) =>
			error instanceof CloudRequestError &&
			error.message.includes("may have completed") &&
			error.message.includes("Refresh your cloud list"),
	);
});
