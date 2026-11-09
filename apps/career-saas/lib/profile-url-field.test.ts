import type { Root } from "react-dom/client";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { Window } from "happy-dom";
import React, { act, createElement } from "react";
import { ProfileUrlField } from "../components/career-ui";

let root: Root | null = null;
let dom: Window | null = null;
let restoreGlobals: (() => void) | null = null;

async function mount(onCommit: (value: string) => Promise<boolean>) {
	dom = new Window({ url: "https://workspace.example.test" });
	const entries: Record<string, unknown> = {
		React,
		window: dom,
		document: dom.document,
		navigator: dom.navigator,
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
	const { createRoot } = await import("react-dom/client");
	root = createRoot(container as unknown as HTMLElement);
	await act(async () => root?.render(createElement(ProfileUrlField, { label: "Website", value: "", onCommit })));
	const input = container.querySelector("input");
	assert.ok(input);
	return { container, input };
}

async function type(input: HTMLInputElement, value: string) {
	assert.ok(dom);
	const browser = dom;
	const setter = Object.getOwnPropertyDescriptor(browser.HTMLInputElement.prototype, "value")?.set;
	assert.ok(setter);
	await act(async () => {
		input.focus();
		input.dispatchEvent(new browser.KeyboardEvent("keydown", { key: value.at(-1), bubbles: true }) as unknown as Event);
		setter.call(input, value);
		input.dispatchEvent(
			new browser.InputEvent("input", {
				bubbles: true,
				inputType: "insertText",
				data: value.at(-1),
			}) as unknown as Event,
		);
	});
}

async function leave(input: HTMLInputElement) {
	await act(async () => input.blur());
}

afterEach(async () => {
	await act(async () => root?.unmount());
	root = null;
	await dom?.happyDOM.abort();
	dom = null;
	restoreGlobals?.();
	restoreGlobals = null;
});

test("website typing retains intermediate text and commits only the completed URL on blur", async () => {
	const commits: string[] = [];
	const { container, input } = await mount(async (value) => {
		commits.push(value);
		return true;
	});
	await type(input as unknown as HTMLInputElement, "h");
	assert.equal(input.value, "h");
	assert.deepEqual(commits, []);
	assert.equal(container.querySelector('[role="alert"]'), null);
	await type(input as unknown as HTMLInputElement, "https://candidate.example.test/profile");
	assert.equal(input.value, "https://candidate.example.test/profile");
	assert.deepEqual(commits, []);
	await leave(input as unknown as HTMLInputElement);
	assert.deepEqual(commits, ["https://candidate.example.test/profile"]);
	assert.equal(input.value, "https://candidate.example.test/profile");
	assert.equal(container.querySelector('[role="alert"]'), null);
});

test("an invalid completed website stays editable with a validation alert and never commits", async () => {
	const commits: string[] = [];
	const { container, input } = await mount(async (value) => {
		commits.push(value);
		return true;
	});
	await type(input as unknown as HTMLInputElement, "https://");
	await leave(input as unknown as HTMLInputElement);
	assert.equal(input.value, "https://");
	assert.match(container.querySelector('[role="alert"]')?.textContent ?? "", /complete http or https URL/);
	assert.equal(input.getAttribute("aria-invalid"), "true");
	assert.deepEqual(commits, []);
	await type(input as unknown as HTMLInputElement, "https://candidate.example.test/");
	await leave(input as unknown as HTMLInputElement);
	assert.deepEqual(commits, ["https://candidate.example.test/"]);
	assert.equal(container.querySelector('[role="alert"]'), null);
});

test("a rejected website persistence keeps the draft and exposes failure rather than success", async () => {
	const commits: string[] = [];
	const { container, input } = await mount(async (value) => {
		commits.push(value);
		return false;
	});
	await type(input as unknown as HTMLInputElement, "https://candidate.example.test/");
	await leave(input as unknown as HTMLInputElement);
	assert.deepEqual(commits, ["https://candidate.example.test/"]);
	assert.equal(input.value, "https://candidate.example.test/");
	assert.equal(input.getAttribute("aria-invalid"), "true");
	assert.match(container.querySelector('[role="alert"]')?.textContent ?? "", /Couldn't save this URL/);
	assert.equal(container.querySelector('[role="status"]'), null);
});
