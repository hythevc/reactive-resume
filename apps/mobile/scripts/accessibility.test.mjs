// Host proof for native accessibility props and minimum targets; device layout still needs native QA.
import assert from "node:assert/strict";
import { test } from "node:test";
import { load, tag } from "./harness.mjs";

const react = {
	createElement: (type, props, ...children) => ({
		type,
		props: { ...props, children: (children.length ? children : [props?.children]).flat(Infinity) },
	}),
	useState: (value) => [value, () => {}],
	useRef: (current) => ({ current }),
	useEffect() {},
};

function render(node) {
	if (typeof node?.type === "function") return render(node.type(node.props));
	if (!node?.props) return node;
	return { ...node, props: { ...node.props, children: node.props.children.map(render) } };
}

function nodes(node) {
	if (!node?.props) return [];
	return [node, ...node.props.children.flatMap(nodes)];
}

function fixture(platform) {
	const native = {
		Platform: { OS: platform },
		Easing: { bezier: () => null },
		I18nManager: { isRTL: false },
		Pressable: "Pressable",
		View: "View",
		Text: "NativeText",
		TextInput: "TextInput",
		StyleSheet: { hairlineWidth: 1 },
		useWindowDimensions: () => ({ width: 390, height: 844, fontScale: 3 }),
	};
	const mocks = {
		react,
		"react-native": native,
		"react-native-reanimated": {},
		"@lingui/react/macro": { useLingui: () => ({ t: tag, i18n: { number: String } }) },
		"expo-image": { Image: "Image" },
		"@reactive-resume/utils/string": {},
		"./icon": { Icon: "Icon" },
		"./motion": { haptics: { selection() {} } },
		"./pressable": { FeedbackPressable: "FeedbackPressable" },
		"./text": { Text: "Text" },
		"./overlays": { Sheet: "Sheet" },
		"./switch": {},
	};
	const source = (path, extra = {}, append = "") =>
		load(`../src/${path}`, { ...mocks, ...extra }, { jsx: "transform", globals: { React: react }, append });
	const tokens = source("ui/tokens.ts");
	const theme = { ...tokens, colors: tokens.colors.light, shadows: tokens.shadows.light };
	mocks["./theme"] = { useTheme: () => theme };
	const buttons = source("ui/button.tsx");
	mocks["./button"] = buttons;
	const layout = source("ui/layout.tsx");
	mocks["./layout"] = layout;
	const fields = source("ui/fields.tsx");
	return { source, theme, native, buttons, layout, fields };
}

test("SelectSheet announces named radio choices, preserves selection and calls the chosen value", () => {
	const { fields, layout } = fixture("ios");
	let selected = "science";
	const props = {
		label: "Degree",
		value: selected,
		options: [
			{ value: "arts", label: "Bachelor of Arts" },
			{ value: "science", label: "Bachelor of Science" },
		],
		onChange: (value) => {
			selected = value;
		},
	};
	const choices = (value) => {
		const tree = render(react.createElement(fields.SelectSheet, { ...props, value }));
		const group = nodes(tree).find((node) => node.props.accessibilityRole === "radiogroup");
		assert.equal(group.props.accessibilityLabel, "Degree");
		return nodes(group).filter((node) => node.props.accessibilityRole === "radio");
	};
	let radios = choices(selected);
	assert.equal(radios.length, 2);
	assert.deepEqual(
		radios.map((node) => node.props.accessibilityState),
		[
			{ disabled: false, checked: false },
			{ disabled: false, checked: true },
		],
	);
	radios[0].props.onPress();
	assert.equal(selected, "arts");
	radios = choices(selected);
	assert.deepEqual(
		radios.map((node) => node.props.accessibilityState.checked),
		[true, false],
	);
	const action = layout.ListRow({ title: "Open settings", selected: true, onPress() {} });
	assert.equal(action.props.accessibilityRole, "button");
	assert.deepEqual(action.props.accessibilityState, { disabled: false, selected: true });
	const disabledChoice = layout.ListRow({
		title: "Unavailable",
		accessibilityRole: "radio",
		disabled: true,
		onPress() {},
	});
	assert.equal(disabledChoice.props.accessibilityState.disabled, true);
});

for (const [platform, minimum] of [
	["ios", 44],
	["android", 48],
]) {
	test(`${platform} shared buttons, compact controls and selectors retain ${minimum} point targets`, () => {
		const { fields, buttons } = fixture(platform);
		for (const size of ["default", "lg", "sm"]) {
			const button = buttons.Button({ label: "Go", size, onPress() {} });
			const style = button.props.style({ pressed: false });
			assert.ok(style.minHeight + (button.props.hitSlop?.top ?? 0) + (button.props.hitSlop?.bottom ?? 0) >= minimum);
			assert.ok(style.minWidth >= minimum, `${size} buttons keep their target even with short labels`);
		}
		const icon = buttons.IconButton({ icon: "x", label: "Close", onPress() {} });
		const iconStyle = icon.props.style({ pressed: false });
		assert.ok(iconStyle.width >= minimum && iconStyle.height >= minimum);
		const chip = fields.Chip({ label: "A", onPress() {} });
		const chipStyle = chip.props.style({ pressed: false });
		assert.ok(chipStyle.minHeight + chip.props.hitSlop.top + chip.props.hitSlop.bottom >= minimum);
		assert.ok(chipStyle.minWidth >= minimum, "Short chips retain a wide enough target");
		const select = render(
			react.createElement(fields.SelectSheet, {
				label: "Degree",
				value: "arts",
				options: [{ value: "arts", label: "Arts" }],
				onChange() {},
			}),
		);
		const trigger = nodes(select).find(
			(node) => node.props.accessibilityLabel === "Degree" && node.type === "Pressable",
		);
		assert.ok(trigger.props.style({ pressed: false }).minHeight >= minimum);
	});
}

test("tab labels wrap and honor system text scaling without shrinking their font", () => {
	const { source, theme, native } = fixture("ios");
	const text = source("ui/text.tsx", {
		"react-native-keyboard-controller": {},
		"react-native-safe-area-context": {},
		"./keyboard": {},
		"./use-pull-refresh": {},
	});
	const { BarItem, SidebarItem } = source(
		"shell/app-tabs.tsx",
		{
			"expo-router": {},
			"react-native-safe-area-context": {},
			"./use-new-action": {},
			"@/routes": {},
			"@/ui/keyboard": {},
			"@/ui/bottom-bar": {},
			"@/ui": { ...text, Icon: "Icon", useTheme: () => theme },
		},
		"\nmodule.exports.SidebarItem = SidebarItem;",
	);
	for (const [component, props] of [
		[BarItem, { focused: true }],
		[SidebarItem, { active: true, compact: true }],
	]) {
		const tree = render(
			react.createElement(component, {
				label: "Applications",
				icon: "briefcase",
				onPress() {},
				...props,
			}),
		);
		const label = nodes(tree).find((node) => node.type === native.Text && node.props.children.includes("Applications"));
		assert.ok(label, "Full tab name remains rendered");
		assert.equal(label.props.maxFontSizeMultiplier, 0, "Native 0 means system scaling has no artificial cap");
		assert.equal(label.props.adjustsFontSizeToFit, undefined);
		assert.equal(label.props.minimumFontScale, undefined);
		assert.equal(label.props.numberOfLines, undefined, "Labels may grow to additional lines");
		assert.equal(
			tree.props.style({ pressed: false }).height,
			undefined,
			"Growing labels have no fixed-height clipping",
		);
	}
});
