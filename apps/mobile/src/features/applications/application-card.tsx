import type { ApplicationSummary } from "./types";
import { useLingui } from "@lingui/react/macro";
import { Platform, Pressable, View } from "react-native";
import { Avatar, Icon, IconButton, Text, useTheme } from "@/ui";

type ApplicationCardProps = {
	application: Pick<ApplicationSummary, "company" | "role" | "location" | "tags">;
	stage: { label: string; color: string };
	next: { title: string; sub?: string | undefined };
	documents: string;
	selected: boolean;
	selecting: boolean;
	disabled: boolean;
	focused: boolean;
	onPress: () => void;
	onActions: () => void;
};

/** A single application keeps its facts and primary action together; the action menu remains a separate target. */
export function ApplicationCard({
	application,
	stage,
	next,
	documents,
	selected,
	selecting,
	disabled,
	focused,
	onPress,
	onActions,
}: ApplicationCardProps) {
	const { t } = useLingui();
	const { colors, radius, size, space } = useTheme();
	const { company, role, location, tags } = application;
	const shownTags = tags.length ? `${tags.slice(0, 2).join(", ")}${tags.length > 2 ? ` +${tags.length - 2}` : ""}` : "";
	const metadata = [shownTags, documents].filter(Boolean).join(" · ");
	const background = selected ? colors.selectedFill : colors.surface;

	return (
		<View
			style={{
				borderWidth: focused ? 2 : 1,
				borderColor: focused || selected ? colors.accent : colors.line,
				borderRadius: radius.rLg,
				backgroundColor: background,
				overflow: "hidden",
			}}
		>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={[company, role, location, stage.label, next.title, next.sub, metadata]
					.filter(Boolean)
					.join(". ")}
				accessibilityHint={selecting ? t`Toggle selection` : t`Open application`}
				accessibilityState={{ selected, disabled }}
				disabled={disabled}
				onPress={onPress}
				android_ripple={{ color: colors.press }}
				style={({ pressed }) => ({
					minHeight: size.hit,
					padding: space.s4,
					gap: space.s3,
					backgroundColor: pressed && Platform.OS !== "android" ? colors.press : background,
					opacity: disabled ? 0.45 : 1,
				})}
			>
				<View
					style={{ flexDirection: "row", alignItems: "flex-start", gap: space.s3, paddingEnd: size.hit - space.s2 }}
				>
					<View
						accessibilityElementsHidden
						importantForAccessibility="no-hide-descendants"
						style={{ width: size.hit, height: size.hit, alignItems: "center", justifyContent: "center" }}
					>
						{selecting ? (
							<Icon name={selected ? "check-square" : "square"} size={size.icon.bar} color={colors.accentText} />
						) : (
							<Avatar name={company} size={size.hit} />
						)}
					</View>
					<View style={{ flex: 1, minWidth: 0, gap: space.s0 }}>
						<Text variant="title">{company}</Text>
						<Text>{role}</Text>
					</View>
				</View>
				<View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.s2 }}>
					{location ? (
						<View style={{ flexDirection: "row", alignItems: "center", gap: space.s1, flexShrink: 1 }}>
							<Icon name="map-pin" size={size.icon.meta} color={colors.ink3} />
							<Text variant="callout" color="ink2" style={{ flexShrink: 1 }}>
								{location}
							</Text>
						</View>
					) : null}
					<View
						style={{
							maxWidth: "100%",
							flexDirection: "row",
							alignItems: "center",
							gap: space.s1,
							paddingHorizontal: space.s2,
							paddingVertical: space.s1,
							borderRadius: radius.rMd,
							backgroundColor: colors.accentSoft,
						}}
					>
						<View
							style={{ width: space.s2, height: space.s2, borderRadius: radius.rSm, backgroundColor: stage.color }}
						/>
						<Text variant="caption" weight={600} color="accentText" style={{ flexShrink: 1 }}>
							{stage.label}
						</Text>
					</View>
				</View>
				<View style={{ gap: space.s1 }}>
					<Text variant="callout" color="ink2">
						{next.title}
						{next.sub ? ` · ${next.sub}` : ""}
					</Text>
					{metadata ? (
						<Text variant="caption" color="ink3">
							{metadata}
						</Text>
					) : null}
				</View>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: space.s2,
						borderTopWidth: 1,
						borderTopColor: colors.line,
						paddingTop: space.s3,
					}}
				>
					<Text variant="label" color="accentText" style={{ flex: 1 }}>
						{selecting ? t`Toggle selection` : t`Review details`}
					</Text>
					{!selecting ? <Icon name="caret-right" size={size.icon.row} color={colors.accentText} /> : null}
				</View>
			</Pressable>
			<View style={{ position: "absolute", top: 0, end: 0 }}>
				<IconButton
					icon="dots-three"
					label={t`Actions for ${role} at ${company}`}
					disabled={disabled}
					onPress={onActions}
				/>
			</View>
		</View>
	);
}
