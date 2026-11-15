// @vitest-environment happy-dom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRootRouteWithContext,
	createRouter,
	RouterContextProvider,
	RouterProvider,
} from "@tanstack/react-router";
import { renderToString } from "react-dom/server";
import { Homepage } from "./page";
import { ThemeProvider } from "@/features/theme/provider";
import { loadLocale } from "@/libs/locale";

beforeEach(() => vi.stubGlobal("__APP_VERSION__", "test"));
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

async function fixture(signedIn: boolean, load = true) {
	await loadLocale("en-US");
	const root = createRootRouteWithContext<{ session: { user: { id: string } } | null }>()({
		component: () => (
			<ThemeProvider theme="light">
				<Homepage />
			</ThemeProvider>
		),
	});
	const router = createRouter({
		routeTree: root,
		history: createMemoryHistory({ initialEntries: ["/"] }),
		context: { session: signedIn ? { user: { id: "fictional-account" } } : null },
	});
	if (load) await router.load();
	return (
		<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { enabled: false } } })}>
			<I18nProvider i18n={i18n}>
				{load ? (
					<RouterProvider router={router} />
				) : (
					<RouterContextProvider router={router}>
						<ThemeProvider theme="light">
							<Homepage />
						</ThemeProvider>
					</RouterContextProvider>
				)}
			</I18nProvider>
		</QueryClientProvider>
	);
}

it("keeps every compact homepage entry point account-aware", async () => {
	render(await fixture(true));
	const actions = screen.getAllByRole("link", { name: "Go to dashboard" });
	expect(actions).toHaveLength(3);
	for (const action of actions) expect(action.getAttribute("href")).toBe("/dashboard");
	expect(within(screen.getByRole("banner")).queryByRole("link", { name: "Sign in" })).toBeNull();
	expect(screen.queryByRole("link", { name: "Build your resume" })).toBeNull();
});

it("offers registration and direct sign-in on the compact anonymous page", async () => {
	render(await fixture(false));
	const actions = screen.getAllByRole("link", { name: "Build your resume" });
	expect(actions).toHaveLength(3);
	for (const action of actions) expect(action.getAttribute("href")).toBe("/auth/register");
	expect(within(screen.getByRole("banner")).getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe(
		"/auth/login",
	);
});

it("prerenders anonymous factual answers, tool routes and real template evidence before a session loads", async () => {
	const html = renderToString(await fixture(true, false));
	expect(html).toContain('href="/auth/register"');
	expect(html).not.toContain('href="/dashboard"');
	expect(html).not.toContain("fictional-account");
	expect(html).toContain('href="/ats-checker"');
	expect(html).toContain('href="/resume-templates"');
	expect(html).toContain('href="/templates/pdf/azurill.pdf"');
	expect(html).toContain("Is Reactive Resume really free?");
	expect(html).toContain('"@type":"FAQPage"');
	expect(html).toContain('id="languages"');
	expect(html).toContain('href="https://go.rx.cv/ios"');
});
