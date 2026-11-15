import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { Window } from "happy-dom";
import React, { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { LinkedInView } from "../features/linkedin";
import { createWorkspace, type Workspace } from "./workspace";
import { WorkspaceProvider, useWorkspace } from "./workspace-context";
import { loadWorkspaceStorage, saveWorkspaceStorage } from "./workspace-storage";

let root: Root | null = null;
let dom: Window | null = null;
let restoreGlobals: (() => void) | null = null;
function ReadyLinkedIn() {
	const { ready } = useWorkspace();
	return ready ? createElement(LinkedInView) : null;
}
async function mount(workspace: Workspace) {
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
	async function render() {
		await act(async () => root?.render(createElement(WorkspaceProvider, null, createElement(ReadyLinkedIn))));
		await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
	}
	await render();
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

test("running LinkedIn checks focuses the actual result heading and respects reduced motion", async () => {
	const { container } = await mount(createWorkspace());
	const scrolls: ScrollIntoViewOptions[] = [];
	assert.ok(dom);
	Object.defineProperty(dom, "matchMedia", { configurable: true, value: () => ({ matches: true }) });
	Object.defineProperty(dom.HTMLElement.prototype, "scrollIntoView", {
		configurable: true,
		value: (options: ScrollIntoViewOptions) => scrolls.push(options),
	});
	for (const label of ["Review my profile", "Run checks again"]) {
		const button = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
			(item) => item.textContent?.trim() === label,
		);
		assert.ok(button);
		await act(async () => button.click());
		await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
		const heading = container.querySelector<HTMLHeadingElement>(".linkedin-review-title");
		assert.ok(heading);
		assert.equal(dom.document.activeElement, heading);
		assert.equal(heading.getAttribute("tabindex"), "-1");
		assert.deepEqual(scrolls.at(-1), { block: "start", behavior: "auto" });
		assert.match(container.querySelector(".audit-check-summary")?.textContent ?? "", /6 of 8 checks passed/);
	}
});
