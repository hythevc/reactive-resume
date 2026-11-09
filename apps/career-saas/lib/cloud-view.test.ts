import assert from "node:assert/strict";
import { test } from "node:test";
import { Window } from "happy-dom";
import React, { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { CloudView } from "../features/cloud";
import { WorkspaceProvider } from "./workspace-context";

test("changing cloud identity clears the previous account's resume names even if the new list fails", async (t) => {
	const dom = new Window({ url: "https://career.example.test" });
	const globals: Record<string, unknown> = {
		React,
		window: dom,
		document: dom.document,
		localStorage: dom.localStorage,
		navigator: { locks: { request: async (_name: string, callback: () => unknown) => callback() } },
		IS_REACT_ACT_ENVIRONMENT: true,
	};
	const originals = Object.fromEntries(
		Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
	);
	for (const [key, value] of Object.entries(globals))
		Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
	let account = "account-a";
	t.mock.method(globalThis, "fetch", async (input: string | URL | Request, options?: RequestInit) => {
		const path = String(input);
		if (path.endsWith("/readiness")) return Response.json({ configured: true, origin: "https://backend.example.test" });
		if (path.endsWith("/flags"))
			return Response.json({
				disableSignups: false,
				disableEmailAuth: false,
				smtpEnabled: false,
				appUrl: "https://career.example.test",
			});
		if (path.endsWith("/auth/profile"))
			return Response.json({
				id: account,
				name: account === "account-a" ? "Account A" : "Account B",
				email: "synthetic@example.test",
			});
		if (path.includes("/resumes?")) {
			if (new Headers(options?.headers).get("x-account-id") === "account-b")
				return Response.json({ message: "List unavailable" }, { status: 502 });
			return Response.json([
				{ id: "private-a", name: "PRIVATE A RESUME", updatedAt: "2026-11-09T00:00:00.000Z", isPublic: false },
			]);
		}
		throw new Error("Unexpected request");
	});
	const container = dom.document.createElement("div") as unknown as HTMLElement;
	dom.document.body.appendChild(container as never);
	const root = createRoot(container);
	try {
		await act(async () => root.render(createElement(WorkspaceProvider, null, createElement(CloudView))));
		assert.equal(container.textContent?.includes("PRIVATE A RESUME"), true);
		account = "account-b";
		const refresh = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
			(button) => button.textContent === "Refresh list",
		);
		assert.ok(refresh);
		await act(async () => refresh.click());
		assert.equal(container.textContent?.includes("Signed in as Account B"), true);
		assert.equal(container.textContent?.includes("PRIVATE A RESUME"), false);
	} finally {
		await act(async () => root.unmount());
		await dom.happyDOM.abort();
		for (const key of Object.keys(globals)) {
			const descriptor = originals[key];
			if (descriptor) Object.defineProperty(globalThis, key, descriptor);
			else Reflect.deleteProperty(globalThis, key);
		}
	}
});
