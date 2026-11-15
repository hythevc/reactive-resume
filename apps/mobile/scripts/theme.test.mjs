// Storage and native Appearance are host boundaries; execute the shipped theme owner and settings caller.
import assert from "node:assert/strict";
import { test } from "node:test";
import { load, tag } from "./harness.mjs";

function fixture({ stored = null, readFails = false, platform = "ios", system = "light" } = {}) {
	let value = stored;
	let writeFails = false;
	let deleteFails = false;
	let subscribe;
	const appearances = [];
	const writes = [];
	const react = {
		createElement: (type, props, ...children) => ({ type, props: { ...props, children: children.flat(Infinity) } }),
		useState: (initial) => [typeof initial === "function" ? initial() : initial, () => {}],
		useSyncExternalStore: (listen, snapshot) => {
			subscribe = listen;
			return snapshot();
		},
	};
	const native = {
		Appearance: { setColorScheme: (scheme) => appearances.push(scheme) },
		Easing: { bezier: () => null },
		Platform: { OS: platform },
		useColorScheme: () => system,
		useWindowDimensions: () => ({ width: 390, height: 844, fontScale: 1 }),
		View: "View",
		DevSettings: { reload() {} },
	};
	const tokens = load("../src/ui/tokens.ts", { "react-native": native });
	const storage = {
		getItemSync() {
			if (readFails) throw new Error("Storage unavailable");
			return value;
		},
		setItemSync(key, next) {
			writes.push({ key, value: next });
			if (writeFails) throw new Error("Write unavailable");
			value = next;
		},
		removeItemSync(key) {
			writes.push({ key, removed: true });
			if (deleteFails) throw new Error("Delete unavailable");
			value = null;
		},
	};
	const theme = load("../src/ui/theme.tsx", {
		"expo-sqlite/kv-store": storage,
		react,
		"react-native": native,
		"./tokens": tokens,
	});
	return {
		theme,
		react,
		native,
		appearances,
		writes,
		get stored() {
			return value;
		},
		set writeFails(value) {
			writeFails = value;
		},
		set deleteFails(value) {
			deleteFails = value;
		},
		subscribe: (listener) => {
			theme.useThemePreference();
			return subscribe(listener);
		},
	};
}

test("unavailable theme storage falls back to system without breaking startup or native Appearance", () => {
	const { theme, appearances } = fixture({ readFails: true, system: "dark" });
	assert.equal(theme.useThemePreference(), "system");
	assert.equal(theme.useThemePersistenceStatus(), "session-only");
	assert.equal(theme.useTheme().scheme, "dark");
	assert.doesNotThrow(() => theme.initTheme());
	assert.deepEqual(appearances, ["unspecified"]);
});

test("a failed write still applies and announces the chosen theme; retry clears session-only status", () => {
	const f = fixture({ stored: "light" });
	const changes = [];
	const unsubscribe = f.subscribe(() =>
		changes.push([f.theme.useThemePreference(), f.theme.useThemePersistenceStatus()]),
	);
	f.writeFails = true;
	assert.equal(f.theme.setThemePreference("dark"), false);
	assert.equal(f.stored, "light", "Failure must not claim the stored preference changed");
	assert.equal(f.theme.useTheme().scheme, "dark");
	assert.deepEqual(f.appearances, ["dark"]);
	assert.deepEqual(changes, [["dark", "session-only"]]);
	f.writeFails = false;
	assert.equal(f.theme.setThemePreference("dark"), true);
	assert.equal(f.stored, "dark");
	assert.equal(f.theme.useThemePersistenceStatus(), "saved");
	assert.deepEqual(
		changes,
		[
			["dark", "session-only"],
			["dark", "saved"],
		],
		"Retry notifies status-only changes too",
	);
	unsubscribe();
	f.theme.setThemePreference("light");
	assert.equal(changes.length, 2);
});

test("a failed system-preference deletion still follows system and can be retried", () => {
	const f = fixture({ stored: "dark", system: "light" });
	f.deleteFails = true;
	assert.equal(f.theme.setThemePreference("system"), false);
	assert.equal(f.stored, "dark");
	assert.equal(f.theme.useThemePreference(), "system");
	assert.equal(f.theme.useTheme().scheme, "light");
	assert.equal(f.theme.useThemePersistenceStatus(), "session-only");
	assert.deepEqual(f.appearances, ["unspecified"]);
	f.deleteFails = false;
	assert.equal(f.theme.setThemePreference("system"), true);
	assert.equal(f.stored, null);
	assert.equal(f.theme.useThemePersistenceStatus(), "saved");
});

test("valid stored preferences stay intact and web skips native Appearance overrides", () => {
	const f = fixture({ stored: "dark", platform: "web" });
	assert.equal(f.theme.useThemePreference(), "dark");
	assert.equal(f.theme.useThemePersistenceStatus(), "saved");
	f.theme.initTheme();
	f.theme.setThemePreference("light");
	assert.deepEqual(f.appearances, []);
	assert.deepEqual(f.writes, [{ key: "theme", value: "light" }]);
});

const nodes = (node) => (!node?.props ? [] : [node, ...node.props.children.flatMap(nodes)]);

test("Appearance settings retain the chosen value, explain session-only persistence and retry the current choice", () => {
	const f = fixture({ stored: "light" });
	const ui = Object.fromEntries(
		["Banner", "Button", "ConfirmDialog", "ListRow", "Segmented", "Sheet", "Switch", "Text", "TextField"].map(
			(name) => [name, name],
		),
	);
	Object.assign(ui, f.theme, {
		haptics: { selection() {} },
		setHapticsEnabled() {},
		showToast() {},
		useHapticsEnabled: () => true,
	});
	const { default: PreferencesScreen } = load(
		"../app/(tabs)/settings/preferences.tsx",
		{
			react: f.react,
			"react-native": f.native,
			"@lingui/react/macro": { useLingui: () => ({ t: tag, i18n: {} }) },
			"@tanstack/react-query": {
				useMutation: () => ({ isPending: false }),
				useQueryClient: () => ({ invalidateQueries() {} }),
			},
			"@reactive-resume/utils/locale": { isLocale: (value) => value === "en-US" },
			"@reactive-resume/utils/string": { filterOptions: (options) => options },
			"@reactive-resume/utils/timezone": { timezoneSchema: { safeParse: () => ({ success: false }) } },
			"@/api/client": { client: {}, orpc: {} },
			"@/features/settings/layout": { SettingsGroup: "SettingsGroup", SettingsPage: "SettingsPage" },
			"@/features/settings/locale-names": { getLocaleOptions: () => [{ value: "en-US", label: "English" }] },
			"@/features/settings/queries": { useProfile: () => ({ data: { locale: "en-US", timezone: "UTC" } }) },
			"@/i18n": {
				getDeviceLocale: () => "en-US",
				getLocalePreference: () => null,
				hasLocalePreference: () => false,
				selectableLocales: ["en-US"],
				setLocalePreference() {},
			},
			"@/lib/timezones": { timeZones: [] },
			"@/shell/shortcut-help": { CharacterShortcutSetting: "CharacterShortcutSetting" },
			"@/ui": ui,
		},
		{ jsx: "transform", globals: { React: f.react, __DEV__: false } },
	);
	const render = () => nodes(PreferencesScreen());
	assert.equal(
		render().some(
			(node) => node.props.message === "Appearance applies for this session. Retry saving to keep this choice.",
		),
		false,
	);
	f.writeFails = true;
	assert.doesNotThrow(() =>
		render()
			.find((node) => node.type === "Segmented")
			.props.onChange("dark"),
	);
	assert.equal(render().find((node) => node.type === "Segmented").props.value, "dark");
	const recovery = render().find(
		(node) => node.type === "Banner" && node.props.action?.label === "Retry saving appearance",
	);
	assert.ok(recovery);
	assert.equal(recovery.props.message, "Appearance applies for this session. Retry saving to keep this choice.");
	f.writeFails = false;
	recovery.props.action.onPress();
	assert.equal(f.stored, "dark", "Retry uses the currently displayed choice");
	assert.equal(
		render().some((node) => node.props.action?.label === "Retry saving appearance"),
		false,
	);
});
