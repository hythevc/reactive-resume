import type { WorkspaceNavigationOptions } from "./workspace-navigation";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { Window } from "happy-dom";
import React, { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { JobsView } from "../features/jobs";
import { createWorkspace, type Workspace } from "./workspace";
import { WorkspaceProvider, useWorkspace } from "./workspace-context";
import { loadWorkspaceStorage, saveWorkspaceStorage } from "./workspace-storage";

type ViewProps = Parameters<typeof JobsView>[0];
let root: Root | null = null;
let dom: Window | null = null;
let restoreGlobals: (() => void) | null = null;
function ReadyJobs(props: ViewProps) {
	const { ready } = useWorkspace();
	return ready ? createElement(JobsView, props) : null;
}
async function mount(workspace: Workspace, props: ViewProps) {
	dom = new Window({ url: "https://workspace.example.test" });
	const storage = dom.localStorage;
	saveWorkspaceStorage(storage, loadWorkspaceStorage(storage), workspace);
	Object.defineProperty(dom.HTMLElement.prototype, "scrollIntoView", { configurable: true, value: () => {} });
	const globals: Record<string, unknown> = {
		React,
		window: dom,
		document: dom.document,
		localStorage: storage,
		navigator: { locks: { request: async (_name: string, callback: () => unknown) => callback() } },
		requestAnimationFrame: (callback: (time: number) => void) => setTimeout(() => callback(0), 0),
		cancelAnimationFrame: clearTimeout,
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
		await act(async () => root?.render(createElement(WorkspaceProvider, null, createElement(ReadyJobs, next))));
		await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
	}
	await render(props);
	return { container, render };
}
afterEach(async () => {
	await act(async () => root?.unmount());
	root = null;
	await dom?.happyDOM.abort();
	dom = null;
	restoreGlobals?.();
	restoreGlobals = null;
});

test("stage links show matching roles and review returns to that stage without a second pipeline", async () => {
	const workspace = createWorkspace();
	const example = workspace.jobs[0];
	workspace.jobs = [
		{ ...example, id: "synthetic-saved", company: "Synthetic saved company", status: "Saved" },
		{ ...example, id: "synthetic-interview", company: "Synthetic interview company", status: "Interview" },
	];
	const calls: WorkspaceNavigationOptions[] = [];
	const props: ViewProps = { initialStage: "Interview", onLocationChange: (options) => calls.push(options) };
	const { container, render } = await mount(workspace, props);
	assert.equal(
		container.querySelector<HTMLSelectElement>('[aria-label="Filter application stage"]')?.value,
		"Interview",
	);
	assert.equal(container.querySelectorAll(".mobile-job-list li").length, 1);
	assert.match(container.querySelector(".mobile-job-list")?.textContent ?? "", /Synthetic interview company/);
	await act(async () => container.querySelector<HTMLButtonElement>('[data-job-id="synthetic-interview"]')?.click());
	assert.deepEqual(calls.at(-1), { stage: "Interview", jobId: "synthetic-interview" });
	await render({ ...props, initialJobId: "synthetic-interview" });
	assert.equal(container.querySelectorAll(".jobs-pipeline").length, 0);
	assert.equal(container.querySelector('[aria-label="Job details"]')?.getAttribute("tabindex"), "-1");
	assert.match(container.querySelector('[aria-label="Job details"]')?.textContent ?? "", /Synthetic interview company/);
	await act(async () => container.querySelector<HTMLAnchorElement>(".job-back-link")?.click());
	assert.deepEqual(calls.at(-1), { stage: "Interview" });
	await render(props);
	assert.equal(
		container.querySelector<HTMLSelectElement>('[aria-label="Filter application stage"]')?.value,
		"Interview",
	);
	assert.equal(container.querySelectorAll(".mobile-job-list li").length, 1);
	assert.equal(container.querySelector<HTMLDetailsElement>(".preparation-settings details")?.open, false);
});
