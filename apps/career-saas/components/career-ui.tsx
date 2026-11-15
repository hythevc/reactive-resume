"use client";

import { useId, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

type ProfileUrlFieldProps = {
	label: string;
	value: string;
	onCommit: (value: string) => Promise<boolean>;
	maxLength?: number;
};

/** Parent keys by saved value so external workspace changes replace the editor draft. */
export function ProfileUrlField({ label, value, onCommit, maxLength = 2000 }: ProfileUrlFieldProps) {
	const id = useId();
	const [draft, setDraft] = useState(value);
	const [error, setError] = useState("");
	async function commit() {
		const next = draft.trim();
		if (next) {
			try {
				if (!["https:", "http:"].includes(new URL(next).protocol)) throw new Error("Invalid protocol");
			} catch {
				setError("Enter a complete http or https URL, or clear this field.");
				return;
			}
		}
		if (next !== value && !(await onCommit(next))) {
			setError("Couldn't save this URL. Check the workspace notice and try again.");
			return;
		}
		setError("");
	}
	return (
		<label className="field" htmlFor={id}>
			<span>{label}</span>
			<input
				id={id}
				name={label.toLowerCase().replace(/\s+/g, "-")}
				autoComplete="off"
				spellCheck={false}
				className="input"
				type="url"
				maxLength={maxLength}
				value={draft}
				onChange={(event) => {
					setDraft(event.target.value);
					setError("");
				}}
				onBlur={() => void commit()}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						event.currentTarget.blur();
					}
				}}
				aria-invalid={Boolean(error)}
				aria-describedby={`${id}-help`}
			/>
			{error ? (
				<span className="field-help" id={`${id}-help`} role="alert">
					{error}
				</span>
			) : (
				<span className="field-help" id={`${id}-help`}>
					Saved when you leave this field.
				</span>
			)}
		</label>
	);
}
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
		<header className="feature-heading">
			<div>
				<h1>{title}</h1>
				{description ? <p className="muted">{description}</p> : null}
			</div>
			{children}
		</header>
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
		<div className="empty" role="status">
			<h3>{title}</h3>
			<p className="muted">{description}</p>
			{children}
		</div>
	);
}
