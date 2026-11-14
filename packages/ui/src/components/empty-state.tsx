import type { ReactNode } from "react";
import { cn } from "@reactive-resume/utils/style";

export type EmptyStateProps = {
	title: ReactNode;
	description?: ReactNode;
	/** Notices and other explanatory content, stacked above the actions. */
	children?: ReactNode;
	/** The one thing to do next; use the secondary slot for a quieter alternative. */
	action?: ReactNode;
	secondary?: ReactNode;
	/** A compact row for the absence inside a list, instead of the full surface. */
	variant?: "default" | "compact";
	className?: string;
};

/** The same "nothing here yet" moment in every module: a composed surface, or a compact row inside a list. */
export function EmptyState({
	title,
	description,
	children,
	action,
	secondary,
	variant = "default",
	className,
}: EmptyStateProps) {
	const compact = variant === "compact";
	const Title = compact ? "p" : "h2";

	return (
		<div
			data-slot="empty-state"
			data-variant={variant}
			className={cn(
				compact
					? "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3"
					: "grid justify-items-center gap-3 rounded-lg border border-line bg-surface px-6 py-10 text-center shadow-e1",
				className,
			)}
		>
			<div className={cn("grid gap-1", compact ? "min-w-0" : "justify-items-center")}>
				<Title
					className={cn(
						compact
							? "text-[13px] leading-[19px] text-ink"
							: "font-display text-[28px] leading-8 font-normal text-balance",
					)}
				>
					{title}
				</Title>
				{description && (
					<p
						className={
							compact
								? "text-[13px] leading-[19px] text-ink-2"
								: "max-w-[380px] text-sm leading-6 text-pretty text-ink-2"
						}
					>
						{description}
					</p>
				)}
			</div>
			{children && (
				<div className={cn("grid w-full justify-items-center gap-3", compact && "justify-items-start")}>{children}</div>
			)}
			{(action || secondary) && (
				<div className={cn("flex flex-wrap items-center gap-2", !compact && "justify-center")}>
					{action}
					{secondary}
				</div>
			)}
		</div>
	);
}
