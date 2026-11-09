"use client";
import { ArrowDownToLine, Check, CheckCircle2, ExternalLink, RotateCcw, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { ProfileUrlField } from "@/components/career-ui";
import { profileFieldMaxLength, type Profile } from "@/lib/workspace";
import { decodeWorkspaceBackup, encodeWorkspaceBackup, WORKSPACE_BACKUP_MAX_BYTES } from "@/lib/workspace-backup";
import { useWorkspace } from "@/lib/workspace-context";

export function SettingsView() {
	const { data, setData, mutate, reset, restore: restoreWorkspace, persistenceStatus } = useWorkspace();
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const importRef = useRef<HTMLInputElement>(null);
	function update(field: keyof Profile, value: string) {
		setData((d) => ({ ...d, profile: { ...d.profile, [field]: value } }));
	}
	function backup() {
		setError("");
		try {
			const text = encodeWorkspaceBackup(data);
			const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = "careeros-workspace.json";
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
			setMessage(
				"Workspace backup downloaded. It contains private career data; store it somewhere private. Photos are excluded.",
			);
		} catch {
			setError(
				"Couldn't export this workspace. Shorten or remove entries to stay within the 64 MiB backup limit, then try again.",
			);
		}
	}
	async function restore(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		setError("");
		setMessage("");
		try {
			if (file.size > WORKSPACE_BACKUP_MAX_BYTES) {
				setError("Choose a backup within the 64 MiB limit. Existing workspace data has been kept.");
				return;
			}
			const next = decodeWorkspaceBackup(await file.text());
			if (
				!window.confirm(
					"Replace this browser's workspace with this backup? Export the current workspace first if needed.",
				)
			)
				return;
			if (await restoreWorkspace(next)) setMessage("Workspace restored and saved in this browser.");
			else setError("Workspace couldn't be saved. Check the storage notice before leaving this page.");
		} catch {
			setError(
				"Couldn't read this backup. Choose a valid CareerOS backup or known-format recovery file. Existing workspace data has been kept.",
			);
		}
	}
	return (
		<>
			<div className="feature-heading">
				<div>
					<h1>A workspace that knows your goals.</h1>
					<p className="muted">Your profile connects every next step. Changes save on this device.</p>
				</div>
			</div>
			{message ? (
				<div className="notice" role="status">
					<Check size={16} />
					{message}
				</div>
			) : null}
			{error ? (
				<div className="notice error" role="alert">
					{error}
				</div>
			) : null}
			<div className="two-column">
				<section className="panel">
					<h2>Your career profile</h2>
					<p className="muted">Used as the starting point for new resumes and outreach drafts.</p>
					<div className="form-grid">
						{[
							{ key: "name", label: "Full name" },
							{ key: "role", label: "Professional title" },
							{ key: "email", label: "Email" },
							{ key: "phone", label: "Phone" },
							{ key: "location", label: "Location" },
						].map((f) => (
							<label className="field" key={f.key}>
								<span>{f.label}</span>
								<input
									className="input"
									maxLength={profileFieldMaxLength(f.key as keyof Profile)}
									type={f.key === "email" ? "email" : f.key === "phone" ? "tel" : "text"}
									value={data.profile[f.key as keyof Profile]}
									onChange={(e) => update(f.key as keyof Profile, e.target.value)}
								/>
							</label>
						))}
					</div>
					<ProfileUrlField
						key={`website-${data.profile.website}`}
						label="Website"
						value={data.profile.website}
						onCommit={(website) => mutate((current) => ({ ...current, profile: { ...current.profile, website } }))}
					/>
					<ProfileUrlField
						key={`linkedin-${data.profile.linkedinUrl}`}
						label="LinkedIn URL"
						value={data.profile.linkedinUrl}
						onCommit={(linkedinUrl) =>
							mutate((current) => ({ ...current, profile: { ...current.profile, linkedinUrl } }))
						}
					/>
					{[
						{ key: "summary", label: "Professional summary" },
						{ key: "experience", label: "Experience" },
						{ key: "education", label: "Education" },
						{ key: "skills", label: "Skills (comma separated)" },
					].map((f) => (
						<label className="field" key={f.key}>
							<span>{f.label}</span>
							<textarea
								className="textarea"
								maxLength={50000}
								rows={f.key === "experience" ? 5 : 3}
								value={data.profile[f.key as keyof Profile]}
								onChange={(e) => update(f.key as keyof Profile, e.target.value)}
							/>
						</label>
					))}
				</section>
				<div className="stack">
					<section className="panel">
						<h2>Your next role</h2>
						<p className="muted">Give your job search a clear direction.</p>
						<label className="field">
							<span>Target role</span>
							<input
								className="input"
								maxLength={500}
								value={data.goals.role}
								onChange={(e) =>
									setData((d) => ({
										...d,
										goals: { ...d.goals, role: e.target.value },
									}))
								}
							/>
						</label>
						<label className="field">
							<span>Preferred location</span>
							<input
								className="input"
								maxLength={500}
								value={data.goals.location}
								onChange={(e) =>
									setData((d) => ({
										...d,
										goals: { ...d.goals, location: e.target.value },
									}))
								}
							/>
						</label>
						<label className="field">
							<span>Minimum annual salary ({data.goals.currency})</span>
							<input
								className="input"
								type="number"
								min="0"
								max="10000000"
								value={data.goals.minSalary}
								onChange={(e) =>
									setData((d) => ({
										...d,
										goals: {
											...d.goals,
											minSalary: Math.max(0, Math.min(10000000, Number(e.target.value))),
										},
									}))
								}
							/>
						</label>
						<label className="field">
							<span>Salary currency</span>
							<select
								className="input"
								value={data.goals.currency}
								onChange={(event) =>
									setData((current) => ({
										...current,
										goals: { ...current.goals, currency: event.target.value as "GBP" | "USD" | "EUR" },
									}))
								}
							>
								<option value="GBP">GBP — British pound</option>
								<option value="USD">USD — US dollar</option>
								<option value="EUR">EUR — Euro</option>
							</select>
						</label>
						<span className="autosave-label">
							<CheckCircle2 size={15} />
							{persistenceStatus === "saved"
								? "Saved in this browser"
								: persistenceStatus === "saving"
									? "Saving…"
									: "Changes aren't saved"}
						</span>
					</section>
					<section className="panel">
						<h2>Your data, in your hands.</h2>
						<p className="muted">
							This browser profile can access your career data without an account. Backups contain private career data;
							photos are excluded. Keep a private backup before clearing browser data. Reset doesn't remove downloaded
							files, clipboard contents or email drafts.
						</p>
						<div className="button-row">
							<button className="button secondary small" onClick={backup}>
								<ArrowDownToLine size={15} />
								Export backup
							</button>
							<button className="button secondary small" onClick={() => importRef.current?.click()}>
								<Upload size={15} />
								Restore backup
							</button>
						</div>
						<input
							hidden
							type="file"
							accept="application/json,text/plain,.json,.txt"
							aria-label="Restore workspace backup"
							ref={importRef}
							onChange={restore}
						/>
						<button
							className="text-button danger reset-button"
							onClick={async () => {
								if (
									!window.confirm(
										"Delete this browser's workspace and recovery data, and load sample data? Downloaded files and other external copies aren't deleted.",
									)
								)
									return;
								setMessage("");
								if (await reset()) setMessage("Local workspace and recovery data deleted. Sample data loaded.");
								else
									setError(
										"Saved data couldn't be fully deleted. Check the storage notice and clear this site's browser data.",
									);
							}}
						>
							<RotateCcw size={15} />
							Reset sample workspace
						</button>
					</section>
					<section className="panel integrations">
						<h2>Connected services</h2>
						<p className="muted">
							Check Cloud account for optional resume-copy storage. The services below are not connected.
						</p>
						<a className="button secondary small" href="#cloud">
							Open Cloud account
						</a>
						{["AI writing & headshots", "Job submission provider", "Email delivery", "Billing"].map((s) => (
							<div key={s}>
								<span>{s}</span>
								<span className="status">Not connected</span>
							</div>
						))}
					</section>
				</div>
			</div>
		</>
	);
}

export function PlansView() {
	const { data, setData } = useWorkspace();
	const [message, setMessage] = useState("");
	return (
		<>
			<div className="feature-heading">
				<div>
					<h1>Invest in your next chapter.</h1>
					<p className="muted">Proposed launch plans. Explore what fits your next move.</p>
				</div>
			</div>
			<div className="notice">
				Plan selection is saved locally. Payments and subscriptions are not connected; selecting a plan does not charge
				you.
			</div>
			{message ? (
				<div className="notice" role="status">
					<Check size={16} />
					{message}
				</div>
			) : null}
			<div className="plans-grid">
				{[
					{
						name: "Free" as const,
						price: "$0",
						period: "to get started",
						text: "Build your career foundation.",
						features: [
							"Resume editing & PDF export",
							"LinkedIn writing checklist",
							"Local photo editing",
							"Job and contact tracking",
						],
					},
					{
						name: "Pro" as const,
						price: "$29",
						period: "/ month · proposed",
						text: "Put every next step in one place.",
						features: [
							"Everything in Free",
							"Planned: AI resume tailoring",
							"Planned: connected cloud sync",
							"Planned: recruiter draft assistance",
						],
					},
					{
						name: "Momentum" as const,
						price: "Coming soon",
						period: "pricing to be validated",
						text: "A more connected job search.",
						features: [
							"Planned: verified job delivery",
							"Planned: daily application limits",
							"Planned: authorized email sending",
							"Headshot credits sold separately",
						],
					},
				].map((plan) => (
					<section key={plan.name} className={`panel plan-card ${plan.name === "Pro" ? "featured" : ""}`}>
						<h2>{plan.name}</h2>
						<p className="muted">{plan.text}</p>
						<div className="plan-price">{plan.price}</div>
						<small className="muted">{plan.period}</small>
						<ul>
							{plan.features.map((f) => (
								<li key={f}>
									<Check size={16} />
									{f}
								</li>
							))}
						</ul>
						<button
							className={`button ${plan.name === "Pro" ? "primary" : "secondary"}`}
							onClick={() => {
								setData((d) => ({ ...d, plan: plan.name }));
								setMessage(`${plan.name} selected for preview. No subscription was created.`);
							}}
						>
							{data.plan === plan.name ? "Selected for preview" : `Preview ${plan.name}`}
						</button>
					</section>
				))}
			</div>
			<section className="panel pricing-note">
				<h2>A career tool should respect your time.</h2>
				<p className="muted">
					The proposed monthly model supports a focused job search. Prices and limits are hypotheses until paid features
					are tested. AI headshots will use separate credits.
				</p>
				<a className="text-button" href="/about">
					Explore CareerOS <ExternalLink size={15} />
				</a>
			</section>
		</>
	);
}
