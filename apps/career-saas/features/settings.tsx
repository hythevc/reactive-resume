"use client";
import { ArrowDownToLine, Check, CheckCircle2, ExternalLink, RotateCcw, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { parseWorkspace, type Profile } from "@/lib/workspace";
import { useWorkspace } from "@/lib/workspace-context";

export function SettingsView() {
	const { data, setData, reset } = useWorkspace();
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const importRef = useRef<HTMLInputElement>(null);
	function update(field: keyof Profile, value: string) {
		setData((d) => ({ ...d, profile: { ...d.profile, [field]: value } }));
	}
	function backup() {
		const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
		const a = document.createElement("a");
		a.href = url;
		a.download = "careeros-workspace.json";
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
		setMessage("Workspace backup downloaded. Store it somewhere private.");
	}
	async function restore(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		setError("");
		setMessage("");
		try {
			if (file.size > 4 * 1024 * 1024) throw new Error("Choose a backup smaller than 4 MB.");
			const next = parseWorkspace(JSON.parse(await file.text()));
			if (window.confirm("Replace this device’s workspace with this backup?")) {
				setData(next);
				setMessage("Workspace restored.");
			}
		} catch {
			setError("Couldn’t read this backup. Choose a valid CareerOS workspace JSON file.");
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
							{ key: "location", label: "Location" },
						].map((f) => (
							<label className="field" key={f.key}>
								<span>{f.label}</span>
								<input
									className="input"
									maxLength={500}
									type={f.key === "email" ? "email" : "text"}
									value={data.profile[f.key as keyof Profile]}
									onChange={(e) => update(f.key as keyof Profile, e.target.value)}
								/>
							</label>
						))}
					</div>
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
							<span>Minimum annual salary (USD)</span>
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
						<span className="autosave-label">
							<CheckCircle2 size={15} />
							Saved locally
						</span>
					</section>
					<section className="panel">
						<h2>Your data, in your hands.</h2>
						<p className="muted">
							This demo stores information in this browser. Back up your workspace before clearing browser data.
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
							accept="application/json,.json"
							aria-label="Restore workspace backup"
							ref={importRef}
							onChange={restore}
						/>
						<button
							className="text-button danger reset-button"
							onClick={() => {
								if (window.confirm("Delete your local workspace and restore sample data?")) {
									localStorage.removeItem("careeros:linkedin:v1");
									reset();
									setMessage("Sample workspace restored.");
								}
							}}
						>
							<RotateCcw size={15} />
							Reset sample workspace
						</button>
					</section>
					<section className="panel integrations">
						<h2>Connected services</h2>
						<p className="muted">Local tools work now. These services are not connected.</p>
						{[
							"Cloud account & sync",
							"AI writing & headshots",
							"Job submission provider",
							"Email delivery",
							"Billing",
						].map((s) => (
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
