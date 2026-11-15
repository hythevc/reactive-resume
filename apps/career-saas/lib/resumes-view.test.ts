import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { Window } from "happy-dom";
import React, { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ResumesView } from "../features/resumes";
import { createWorkspace, exportResume, type Workspace } from "./workspace";
import { WorkspaceProvider, useWorkspace } from "./workspace-context";
import { loadWorkspaceStorage, saveWorkspaceStorage } from "./workspace-storage";

type ViewProps = NonNullable<Parameters<typeof ResumesView>[0]>;
let root: Root | null = null;
let dom: Window | null = null;
let restoreGlobals: (() => void) | null = null;

function ReadyResumes(props: ViewProps) {
	const { ready } = useWorkspace();
	return ready ? createElement<ViewProps>(ResumesView, props) : null;
}

async function mount(workspace: Workspace, props: ViewProps = {}) {
	dom = new Window({ url: "https://workspace.example.test" });
	const storage = dom.localStorage;
	saveWorkspaceStorage(storage, loadWorkspaceStorage(storage), workspace);
	const globals: Record<string, unknown> = {
		React,
		window: dom,
		document: dom.document,
		localStorage: storage,
		navigator: { locks: { request: async (_name: string, callback: () => unknown) => callback() } },
		IS_REACT_ACT_ENVIRONMENT: true,
	};
	const originals = Object.fromEntries(
		Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
	);
	for (const [key, value] of Object.entries(globals))
		Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
	restoreGlobals = () => {
		for (const key of Object.keys(globals)) {
			const descriptor = originals[key];
			if (descriptor) Object.defineProperty(globalThis, key, descriptor);
			else Reflect.deleteProperty(globalThis, key);
		}
	};
	const container = dom.document.createElement("div") as unknown as HTMLElement;
	dom.document.body.appendChild(container as never);
	root = createRoot(container);
	async function render(next: ViewProps) {
		await act(async () =>
			root?.render(
				createElement(StrictMode, null, createElement(WorkspaceProvider, null, createElement(ReadyResumes, next))),
			),
		);
	}
	await render(props);
	return { container, render, saved: () => loadWorkspaceStorage(storage).data };
}

afterEach(async () => {
	await act(async () => root?.unmount());
	root = null;
	await dom?.happyDOM.abort();
	dom = null;
	restoreGlobals?.();
	restoreGlobals = null;
});

test("a file chosen from Overview imports once across rerenders and never replaces shared career facts", async () => {
	const workspace = createWorkspace();
	workspace.profile.name = "Synthetic shared candidate";
	const source = {
		...workspace.resumes[0],
		title: "Synthetic imported resume",
		profile: { ...workspace.profile, name: "Synthetic imported candidate" },
	};
	const file = new File([JSON.stringify(exportResume(source))], "synthetic-resume.json", {
		type: "application/json",
	});
	let consumed = 0;
	const props = { pendingImport: file, onImportConsumed: () => consumed++ };
	const { container, render, saved } = await mount(workspace, props);
	assert.equal(consumed, 1);
	assert.equal(saved().resumes.length, workspace.resumes.length + 1);
	assert.equal(saved().profile.name, workspace.profile.name);
	assert.equal(container.querySelector<HTMLInputElement>("#resume-name")?.value, source.profile.name);
	assert.match(container.textContent ?? "", /Existing shared facts have not changed/);
	await render({ ...props, onImportConsumed: () => consumed++ });
	assert.equal(consumed, 1);
	assert.equal(saved().resumes.length, workspace.resumes.length + 1);
	const invalid = new File(["not valid JSON"], "invalid.json", { type: "application/json" });
	await render({ pendingImport: invalid, onImportConsumed: () => consumed++ });
	assert.equal(consumed, 2);
	assert.match(container.querySelector('[role="alert"]')?.textContent ?? "", /valid Reactive Resume JSON/);
	assert.equal(saved().resumes.length, workspace.resumes.length + 1);
	assert.deepEqual(saved().profile, workspace.profile);
});

test("requested resume navigation selects the named document without resetting ordinary version selection", async () => {
	const workspace = createWorkspace();
	const first = workspace.resumes[0];
	const second = {
		...first,
		id: crypto.randomUUID(),
		title: "Synthetic second resume",
		profile: { ...first.profile, name: "Synthetic second candidate" },
	};
	const third = {
		...first,
		id: crypto.randomUUID(),
		title: "Synthetic third resume",
		profile: { ...first.profile, name: "Synthetic third candidate" },
	};
	workspace.resumes = [first, second, third];
	const { container, render } = await mount(workspace, { initialResumeId: second.id });
	const picker = container.querySelector<HTMLSelectElement>("#resume-version");
	assert.ok(picker);
	assert.equal(picker.value, second.id);
	assert.equal(container.querySelector<HTMLInputElement>("#resume-name")?.value, second.profile.name);
	assert.ok(dom);
	const browser = dom;
	await act(async () => {
		picker.value = first.id;
		picker.dispatchEvent(new browser.Event("change", { bubbles: true }) as unknown as Event);
	});
	await render({ initialResumeId: second.id });
	assert.equal(picker.value, first.id);
	await render({ initialResumeId: third.id });
	assert.equal(picker.value, third.id);
	assert.equal(container.querySelector<HTMLInputElement>("#resume-name")?.value, third.profile.name);
	await render({ initialResumeId: "unknown-resume" });
	assert.equal(picker.value, third.id);
});
