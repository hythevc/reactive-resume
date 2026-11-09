import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { Window } from "happy-dom";
import React, { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createWorkspace } from "./workspace";
import { decodeWorkspaceBackup, encodeWorkspaceBackup } from "./workspace-backup";
import { WorkspaceProvider, useWorkspace } from "./workspace-context";
import {
	loadWorkspaceStorage,
	saveWorkspaceStorage,
	WORKSPACE_ACTIVE_KEY,
	WORKSPACE_RECOVERY_KEY,
} from "./workspace-storage";

class BrowserStorage {
	values = new Map<string, string>();
	writeBlocked = false;
	getItem(key: string) {
		return this.values.get(key) ?? null;
	}
	setItem(key: string, value: string) {
		if (this.writeBlocked && key === WORKSPACE_ACTIVE_KEY) throw new Error("Synthetic quota failure");
		this.values.set(key, value);
	}
	removeItem(key: string) {
		this.values.delete(key);
	}
}

let root: Root | null = null;
let dom: Window | null = null;
let restoreGlobals: (() => void) | null = null;

function Probe() {
	const { data, setData, mutate, persistenceStatus } = useWorkspace();
	const [result, setResult] = useState("idle");
	return createElement(
		"section",
		{},
		createElement("output", { "data-name": true }, data.profile.name),
		createElement("output", { "data-result": true }, result),
		createElement("output", { "data-status": true }, persistenceStatus),
		createElement("textarea", { "aria-label": "Current backup", value: encodeWorkspaceBackup(data), readOnly: true }),
		createElement(
			"button",
			{
				"data-edit": true,
				onClick: () => {
					setData((current) => ({
						...current,
						profile: { ...current.profile, name: "UNSAVED SYNTHETIC EDIT" },
					}));
					setResult("requested");
				},
			},
			"Make an edit",
		),
		createElement("output", { "data-resume-count": true }, String(data.resumes.length)),
		createElement(
			"button",
			{
				"data-create": true,
				onClick: async () => {
					const candidate = { ...data.resumes[0], id: crypto.randomUUID(), title: "Synthetic created resume" };
					const saved = await mutate((current) => ({ ...current, resumes: [...current.resumes, candidate] }));
					setResult(saved ? "saved" : "failed");
				},
			},
			"Create resume",
		),
	);
}

async function mount(storage: BrowserStorage) {
	dom = new Window({ url: "https://workspace.example.test" });
	const entries: Record<string, unknown> = {
		React,
		window: dom,
		document: dom.document,
		navigator: { locks: { request: async (_name: string, callback: () => unknown) => callback() } },
		localStorage: storage,
		IS_REACT_ACT_ENVIRONMENT: true,
	};
	const descriptors = Object.fromEntries(
		Object.keys(entries).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
	);
	for (const [key, value] of Object.entries(entries))
		Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
	restoreGlobals = () => {
		for (const key of Object.keys(entries)) {
			const original = descriptors[key];
			if (original) Object.defineProperty(globalThis, key, original);
			else Reflect.deleteProperty(globalThis, key);
		}
	};
	const container = dom.document.createElement("div");
	dom.document.body.appendChild(container);
	root = createRoot(container as unknown as HTMLElement);
	await act(async () => root?.render(createElement(WorkspaceProvider, null, createElement(Probe))));
	return container as unknown as HTMLElement;
}

async function edit(container: HTMLElement) {
	const button = container.querySelector<HTMLButtonElement>("button[data-edit]");
	assert.ok(button);
	await act(async () => button.click());
}

afterEach(async () => {
	await act(async () => root?.unmount());
	root = null;
	await dom?.happyDOM.abort();
	dom = null;
	restoreGlobals?.();
	restoreGlobals = null;
});

test("failed persistence reports failure and recovery deletion cannot discard the unsaved draft", async () => {
	const storage = new BrowserStorage();
	const saved = saveWorkspaceStorage(storage, loadWorkspaceStorage(storage), createWorkspace());
	storage.setItem(WORKSPACE_RECOVERY_KEY, "OLDER SYNTHETIC RECOVERY");
	const container = await mount(storage);
	storage.writeBlocked = true;
	await edit(container);
	assert.equal(container.querySelector("[data-name]")?.textContent, "UNSAVED SYNTHETIC EDIT");
	assert.equal(container.querySelector("[data-result]")?.textContent, "requested");
	assert.equal(container.querySelector("[data-status]")?.textContent, "unsaved");
	const recoveryButton = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
		(button) => button.textContent === "Delete recovery copy",
	);
	assert.ok(recoveryButton);
	assert.equal(recoveryButton.disabled, true);
	await act(async () => recoveryButton.click());
	assert.equal(container.querySelector("[data-name]")?.textContent, "UNSAVED SYNTHETIC EDIT");
	assert.equal(storage.getItem(WORKSPACE_ACTIVE_KEY), saved.value);
	assert.equal(storage.getItem(WORKSPACE_RECOVERY_KEY), "OLDER SYNTHETIC RECOVERY");
	const backup = container.querySelector("textarea");
	assert.ok(backup);
	assert.equal(decodeWorkspaceBackup(backup.value).profile.name, "UNSAVED SYNTHETIC EDIT");
});

test("conflicting edits remain exportable and never overwrite the other tab's saved workspace", async () => {
	const storage = new BrowserStorage();
	const saved = saveWorkspaceStorage(storage, loadWorkspaceStorage(storage), createWorkspace());
	const container = await mount(storage);
	const remote = saveWorkspaceStorage(storage, saved, {
		...saved.data,
		profile: { ...saved.data.profile, name: "OTHER TAB SAVED IDENTITY" },
	});
	await edit(container);
	assert.equal(container.querySelector("[data-name]")?.textContent, "UNSAVED SYNTHETIC EDIT");
	assert.equal(container.querySelector("[data-result]")?.textContent, "requested");
	assert.equal(container.querySelector("[data-status]")?.textContent, "conflict");
	assert.equal(storage.getItem(WORKSPACE_ACTIVE_KEY), remote.value);
	const backup = container.querySelector("textarea");
	assert.ok(backup);
	assert.equal(decodeWorkspaceBackup(backup.value).profile.name, "UNSAVED SYNTHETIC EDIT");
});

test("discrete creation failure leaves no phantom item and retry creates exactly one saved item", async () => {
	const storage = new BrowserStorage();
	const saved = saveWorkspaceStorage(storage, loadWorkspaceStorage(storage), createWorkspace());
	const container = await mount(storage);
	const button = container.querySelector<HTMLButtonElement>("button[data-create]");
	assert.ok(button);
	storage.writeBlocked = true;
	await act(async () => button.click());
	assert.equal(container.querySelector("[data-result]")?.textContent, "failed");
	assert.equal(container.querySelector("[data-resume-count]")?.textContent, String(saved.data.resumes.length));
	assert.equal(loadWorkspaceStorage(storage).data.resumes.length, saved.data.resumes.length);
	storage.writeBlocked = false;
	await act(async () => button.click());
	assert.equal(container.querySelector("[data-result]")?.textContent, "saved");
	assert.equal(container.querySelector("[data-resume-count]")?.textContent, String(saved.data.resumes.length + 1));
	assert.equal(
		loadWorkspaceStorage(storage).data.resumes.filter((resume) => resume.title === "Synthetic created resume").length,
		1,
	);
});
