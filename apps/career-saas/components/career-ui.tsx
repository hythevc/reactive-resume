import type { ButtonHTMLAttributes, ReactNode } from "react";
export function Button({
	children,
	variant = "secondary",
	className = "",
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
	return (
		<button className={`button ${variant} ${className}`} {...props}>
			{children}
		</button>
	);
}
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
	return <section className={`panel ${className}`}>{children}</section>;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<label className="field">
			<span>{label}</span>
			{children}
		</label>
	);
}
export function PageHeading({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children?: ReactNode;
}) {
	return (
		<div className="feature-heading">
			<div>
				<h1>{title}</h1>
				{description ? <p className="muted">{description}</p> : null}
			</div>
			{children}
		</div>
	);
}
export function EmptyState({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children?: ReactNode;
}) {
	return (
		<div className="empty">
			<h3>{title}</h3>
			<p className="muted">{description}</p>
			{children}
		</div>
	);
}
