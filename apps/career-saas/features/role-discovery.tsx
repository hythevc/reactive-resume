"use client";

import {
	ArrowRight,
	Bookmark,
	Check,
	CheckCircle2,
	ClipboardList,
	Copy,
	FileText,
	Info,
	ListChecks,
	MapPin,
	RotateCcw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { introductionReviewKey, outboundBlockReason } from "@/lib/workflow-safety";
import {
	buildJobIntroduction,
	CAREER_BRIEF_MAX_LENGTH,
	compareResumeToJob,
	evaluatePreparationJob,
	extractJobKeywords,
	goalsSchema,
	INTEREST_REASON_MAX_LENGTH,
	JOB_INTRODUCTION_MAX_LENGTH,
	type Job,
	type JobInterest,
	type Workspace,
} from "@/lib/workspace";
import { useWorkspace } from "@/lib/workspace-context";

type DiscoveryTab = "brief" | "review" | "shortlist";
type CareerGoals = Workspace["goals"];
const briefFields = [
	{
		key: "problem",
		label: "Problems",
		prompt: "What problems do you want to solve?",
		placeholder: "The challenges or customer needs you want your work to address.",
	},
	{
		key: "team",
		label: "Team",
		prompt: "What kind of team brings out your best?",
		placeholder: "Collaboration, team size, leadership, or how you like to work together.",
	},
	{
		key: "scope",
		label: "Scope",
		prompt: "What do you want to own?",
		placeholder: "The decisions, responsibilities, and level of ownership you are looking for.",
	},
	{
		key: "environment",
		label: "Environment",
		prompt: "What working environment helps you thrive?",
		placeholder: "Location, flexibility, pace, or the space you need to do good work.",
	},
] as const;

type BriefSummaryProps = { goals: CareerGoals; onEdit: () => void };
function BriefSummary({ goals, onEdit }: BriefSummaryProps) {
	return (
		<div className="stack">
			<aside className="panel brief-summary">
				<h2>What matters next</h2>
				<dl>
					{briefFields.map((field) => (
						<div key={field.key}>
							<dt>{field.label}</dt>
							<dd className="preserve-lines">
								{goals[field.key].trim() || <span className="muted">Add in your brief</span>}
							</dd>
						</div>
					))}
				</dl>
				<button className="text-button" onClick={onEdit}>
					Edit your brief <ArrowRight size={16} />
				</button>
			</aside>
			<aside className="panel brief-summary">
				<h2>You choose the introduction.</h2>
				<p className="muted">
					Shortlist a role, review your message, and copy only what you want to share. No company receives your details
					through this workspace.
				</p>
			</aside>
		</div>
	);
}

function CareerBrief() {
	const { data, setData } = useWorkspace();
	const [error, setError] = useState("");
	function updateText(field: Exclude<keyof CareerGoals, "minSalary">, value: string) {
		const limit =
			field === "role" || field === "location" ? (goalsSchema.shape[field].maxLength ?? 500) : CAREER_BRIEF_MAX_LENGTH;
		if (value.length > limit) {
			setError(`Use ${limit.toLocaleString()} characters or fewer for this field.`);
			return;
		}
		setData((current) => ({ ...current, goals: { ...current.goals, [field]: value } }));
		setError("");
	}
	function updateSalary(value: string) {
		const salary = Number(value);
		if (!Number.isFinite(salary) || salary < 0 || salary > 10_000_000) {
			setError("Enter an annual salary between 0 and 10,000,000 in your selected currency.");
			return;
		}
		setData((current) => ({ ...current, goals: { ...current.goals, minSalary: salary } }));
		setError("");
	}
	return (
		<section className="panel brief-form">
			<div className="panel-heading">
				<div>
					<h2>A clearer picture of what comes next.</h2>
					<p className="muted">Your preferences help you ask better questions and shape introductions.</p>
				</div>
				<ClipboardList size={22} />
			</div>
			{error ? (
				<div className="notice error" role="alert">
					{error}
				</div>
			) : null}
			<div className="form-grid">
				<label className="field" htmlFor="discovery-role">
					<span>Target role</span>
					<input
						id="discovery-role"
						className="input"
						maxLength={goalsSchema.shape.role.maxLength ?? undefined}
						value={data.goals.role}
						onChange={(event) => updateText("role", event.target.value)}
					/>
				</label>
				<label className="field" htmlFor="discovery-location">
					<span>Preferred location</span>
					<input
						id="discovery-location"
						className="input"
						maxLength={goalsSchema.shape.location.maxLength ?? undefined}
						value={data.goals.location}
						onChange={(event) => updateText("location", event.target.value)}
					/>
				</label>
				<label className="field" htmlFor="discovery-currency">
					<span>Salary currency</span>
					<select
						id="discovery-currency"
						className="input"
						value={data.goals.currency}
						onChange={(event) =>
							setData((current) => ({
								...current,
								goals: { ...current.goals, currency: event.target.value as CareerGoals["currency"] },
							}))
						}
					>
						<option value="GBP">GBP — British pound</option>
						<option value="USD">USD — US dollar</option>
						<option value="EUR">EUR — Euro</option>
					</select>
					<small className="muted">Changing currency does not convert the amount.</small>
				</label>
				<label className="field" htmlFor="discovery-salary">
					<span>Minimum annual salary ({data.goals.currency})</span>
					<input
						id="discovery-salary"
						className="input"
						type="number"
						min={0}
						max={10_000_000}
						step={1000}
						value={data.goals.minSalary}
						onChange={(event) => updateSalary(event.target.value)}
					/>
					<small className="muted">A conversation preference. Salary is not checked against these postings.</small>
				</label>
			</div>
			{briefFields.map((field) => (
				<label className="field" key={field.key} htmlFor={`discovery-${field.key}`}>
					<span>
						{field.prompt}
						<small className="muted">
							{data.goals[field.key].length} / {CAREER_BRIEF_MAX_LENGTH.toLocaleString()}
						</small>
					</span>
					<textarea
						className="textarea"
						rows={3}
						id={`discovery-${field.key}`}
						maxLength={CAREER_BRIEF_MAX_LENGTH}
						value={data.goals[field.key]}
						onChange={(event) => updateText(field.key, event.target.value)}
						placeholder={field.placeholder}
					/>
				</label>
			))}
			<p className="muted small-print">
				<CheckCircle2 size={14} style={{ display: "inline", marginRight: 5 }} />
				Your brief is included in the local workspace and its backups. Review eligibility uses the profile keyword
				estimate and company/location filters in{" "}
				<a className="text-button" href="#jobs">
					Applications
				</a>
				; team culture and working conditions are not inferred.
			</p>
		</section>
	);
}

type RoleReviewCardProps = {
	job: Job;
	remaining: number;
	onDecision: (job: Job, interest: JobInterest, reason: string) => void;
};
function RoleReviewCard({ job, remaining, onDecision }: RoleReviewCardProps) {
	const { data } = useWorkspace();
	const [reason, setReason] = useState("");
	const terms = extractJobKeywords(job);
	const evidence = compareResumeToJob(data.profile, terms.join(", "));
	return (
		<section className="panel role-review-card">
			<p className="muted small-print">
				Next saved role · {remaining} {remaining === 1 ? "role" : "roles"} remaining
			</p>
			<div className="role-company">
				<span className="company-logo">{job.company.trim().charAt(0) || "?"}</span>
				<strong>{job.company}</strong>
			</div>
			<h2 className="role-title">{job.role}</h2>
			<p className="role-location">
				<MapPin size={17} />
				{job.location || "Location not specified"}
			</p>
			<p className="role-description" style={{ maxHeight: 200, overflowY: "auto" }}>
				{job.description}
			</p>
			<section>
				<h3>What matches your profile</h3>
				{evidence.matched.length ? (
					<ul className="fit-evidence">
						{evidence.matched.map((term) => (
							<li key={term}>
								<CheckCircle2 size={18} />
								<span>
									<strong>{term}</strong>
									<span className="muted"> · listed in your profile and this posting</span>
								</span>
							</li>
						))}
					</ul>
				) : (
					<p className="muted">
						No shared terms were found by the local skill dictionary. Read the posting and compare it with your
						experience.
					</p>
				)}
				{evidence.missing.length ? (
					<details>
						<summary className="text-button">
							{evidence.missing.length} posting {evidence.missing.length === 1 ? "term" : "terms"} to review
						</summary>
						<ul className="fit-evidence">
							{evidence.missing.map((term) => (
								<li key={term}>
									<Info size={16} />
									<span>
										{term}
										<span className="muted"> · not found in the profile text</span>
									</span>
								</li>
							))}
						</ul>
					</details>
				) : null}
				<p className="muted small-print">Keyword overlap only. Read the posting to confirm every requirement.</p>
			</section>
			<div className="role-questions">
				<h3>What to ask about</h3>
				<p>Ask about team culture, ownership, and working conditions; these aren't verified here.</p>
			</div>
			<details className="decision-note">
				<summary>{reason.trim() ? "Edit your decision note" : "Add a decision note (optional)"}</summary>
				<label className="field" htmlFor="role-decision-reason">
					<span>
						A note for your decision <small className="muted">Optional</small>
					</span>
					<textarea
						className="textarea"
						id="role-decision-reason"
						rows={2}
						maxLength={INTEREST_REASON_MAX_LENGTH}
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						placeholder="What appeals to you, or what makes this role less relevant?"
					/>
					<small className="muted">Saved with your decision. This feedback does not train a ranking model.</small>
				</label>
			</details>
			<div className="role-actions">
				<button className="button secondary" onClick={() => onDecision(job, "Passed", reason)}>
					Pass on this role
				</button>
				<button className="button primary" onClick={() => onDecision(job, "Shortlisted", reason)}>
					Shortlist this role <ArrowRight size={16} />
				</button>
			</div>
		</section>
	);
}

type ReviewHistoryProps = { jobs: Job[]; onUndo: (job: Job) => void };
function ReviewHistory({ jobs, onUndo }: ReviewHistoryProps) {
	if (!jobs.length) return null;
	return (
		<section className="panel discovery-history">
			<h2>Your review decisions</h2>
			<p className="muted">Your notes stay here. Undo a decision to make the role unreviewed again.</p>
			<ul>
				{jobs.map((job) => (
					<li key={job.id}>
						<div>
							<strong>
								{job.company} · {job.role}
							</strong>
							<span className="status">{job.interest}</span>
							<p className="muted preserve-lines">{job.interestReason || "No reason added."}</p>
						</div>
						<button className="button secondary small" onClick={() => onUndo(job)}>
							<RotateCcw size={14} />
							Undo decision
						</button>
					</li>
				))}
			</ul>
		</section>
	);
}

type IntroductionEditorProps = { job: Job };
function IntroductionEditor({ job }: IntroductionEditorProps) {
	const { data, setData, mutate } = useWorkspace();
	const [reviewedFor, setReviewedFor] = useState<string | null>(null);
	const acknowledgementKey = introductionReviewKey(data.profile, data.goals, job);
	const blockedReason = outboundBlockReason(data.profile, job.introduction, { url: job.url });
	const reviewed = reviewedFor === acknowledgementKey;
	const [confirmRefresh, setConfirmRefresh] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const current = buildJobIntroduction(data.profile, data.goals, job);
	function updateDraft(value: string) {
		if (value.length > JOB_INTRODUCTION_MAX_LENGTH) {
			setError(`Keep your introduction within ${JOB_INTRODUCTION_MAX_LENGTH.toLocaleString()} characters.`);
			return;
		}
		setData((workspace) => ({
			...workspace,
			jobs: workspace.jobs.map((item) => (item.id === job.id ? { ...item, introduction: value } : item)),
		}));
		setReviewedFor(null);
		setConfirmRefresh(false);
		setMessage("");
		setError("");
	}
	async function generateDraft() {
		if (current.text.length > JOB_INTRODUCTION_MAX_LENGTH) {
			setError("The current template exceeds the draft limit. Shorten your brief or profile before generating.");
			return;
		}
		setMessage("");
		if (
			!(await mutate((workspace) => ({
				...workspace,
				jobs: workspace.jobs.map((item) => {
					if (item.id !== job.id) return item;
					const text = buildJobIntroduction(workspace.profile, workspace.goals, item).text;
					if (text.length > JOB_INTRODUCTION_MAX_LENGTH) throw new Error("Draft exceeds the limit.");
					return { ...item, introduction: text };
				}),
			})))
		) {
			setError(
				"Couldn't save the introduction. Your existing draft is kept; check the storage notice before trying again.",
			);
			return;
		}
		setReviewedFor(null);
		setConfirmRefresh(false);
		setMessage("Draft created from your current inputs. Review and edit it before copying.");
	}
	async function copyIntroduction() {
		if (!reviewed || !job.introduction.trim() || blockedReason) return;
		try {
			await navigator.clipboard.writeText(job.introduction);
			setMessage("Introduction copied. No message was sent.");
		} catch {
			setError("Clipboard access is unavailable. Select the draft text and copy it with your keyboard.");
		}
	}
	return (
		<section className="panel intro-card">
			<div className="panel-heading">
				<div>
					<p className="muted small-print">Your introduction to {job.company}</p>
					<h2>{job.role}</h2>
				</div>
				<Bookmark size={21} />
			</div>
			<p className="muted">
				Write an introduction you are comfortable sharing. Generating or copying a draft does not change the application
				stage.
			</p>
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
			<p className="muted small-print">
				Career fact source: your shared profile in Settings, {data.profile.name || "No name added"} ·{" "}
				{data.profile.role || "No role added"}. Resume imports stay separate until you choose “Use as career profile”.
			</p>
			{blockedReason ? (
				<div className="notice" role="alert">
					{blockedReason}
				</div>
			) : null}
			<details className="intro-facts">
				<summary className="text-button">
					Current inputs used by the template <Info size={14} />
				</summary>
				<p className="muted small-print">
					These are the current profile, brief, and job values. They do not verify an edited draft; text you add may go
					beyond these inputs.
				</p>
				<dl>
					{current.facts.map((fact) => (
						<div key={fact.label}>
							<dt>{fact.label}</dt>
							<dd className="preserve-lines">{fact.value}</dd>
						</div>
					))}
				</dl>
			</details>
			<div className="button-row" style={{ margin: "18px 0" }}>
				<button
					className="button secondary small"
					onClick={() => (job.introduction.trim() ? setConfirmRefresh(true) : generateDraft())}
				>
					<FileText size={15} />
					{job.introduction.trim() ? "Refresh from current facts" : "Generate introduction"}
				</button>
			</div>
			{confirmRefresh ? (
				<div className="notice" style={{ display: "block" }}>
					<p>Replace this draft with a template from your current inputs? Existing edits will be replaced.</p>
					<div className="button-row" style={{ marginTop: 12 }}>
						<button className="button primary small" onClick={generateDraft}>
							Replace draft
						</button>
						<button className="button secondary small" onClick={() => setConfirmRefresh(false)}>
							Keep my draft
						</button>
					</div>
				</div>
			) : null}
			<label className="field" htmlFor="shortlist-introduction">
				<span>
					Your introduction{" "}
					<small className="muted">
						{job.introduction.length} / {JOB_INTRODUCTION_MAX_LENGTH.toLocaleString()}
					</small>
				</span>
				<textarea
					id="shortlist-introduction"
					className="textarea"
					rows={12}
					maxLength={JOB_INTRODUCTION_MAX_LENGTH}
					value={job.introduction}
					onChange={(event) => updateDraft(event.target.value)}
					placeholder="Generate a starting draft, or write your own introduction."
				/>
			</label>
			<label className="intro-review-check">
				<input
					type="checkbox"
					checked={reviewed}
					disabled={Boolean(blockedReason)}
					onChange={(event) => setReviewedFor(event.target.checked ? acknowledgementKey : null)}
					style={{ marginTop: 3 }}
				/>
				<span>I've reviewed what I want to share with {job.company}.</span>
			</label>
			<button
				className="button primary"
				disabled={!reviewed || !job.introduction.trim() || Boolean(blockedReason)}
				onClick={copyIntroduction}
			>
				<Copy size={16} />
				Copy introduction
			</button>
			<p className="muted small-print" style={{ marginTop: 13 }}>
				Copies to your clipboard only. No company contact, email delivery, or automatic sharing is connected.
			</p>
		</section>
	);
}

export function RoleDiscoveryView() {
	const { data, mutate } = useWorkspace();
	const [tab, setTab] = useState<DiscoveryTab>(() =>
		briefFields.every((field) => !data.goals[field.key].trim()) ? "brief" : "review",
	);
	const [message, setMessage] = useState("");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const queue = useMemo(() => {
		if (tab !== "review") return [];
		return data.jobs
			.filter((job) => job.interest === "Unreviewed")
			.map((job) => ({ job, evaluation: evaluatePreparationJob(data.profile, job, data.autopilot) }))
			.filter((item) => item.evaluation.eligible)
			.sort(
				(first, second) =>
					second.evaluation.score - first.evaluation.score ||
					(first.job.id < second.job.id ? -1 : first.job.id > second.job.id ? 1 : 0),
			)
			.map((item) => item.job);
	}, [data.jobs, data.profile, data.autopilot, tab]);
	const shortlist = data.jobs.filter((job) => job.interest === "Shortlisted");
	const reviewed = data.jobs.filter((job) => job.interest !== "Unreviewed");
	const selected = shortlist.find((job) => job.id === selectedId) || shortlist[0];
	async function decide(job: Job, interest: JobInterest, reason: string) {
		if (reason.length > INTEREST_REASON_MAX_LENGTH) {
			setMessage(`Keep your reason within ${INTEREST_REASON_MAX_LENGTH.toLocaleString()} characters.`);
			return;
		}
		setMessage("");
		if (
			!(await mutate((workspace) => ({
				...workspace,
				jobs: workspace.jobs.map((item) =>
					item.id === job.id ? { ...item, interest, interestReason: reason.trim() } : item,
				),
			})))
		) {
			setMessage(
				"Couldn't save this decision. Your role and note remain available; check the storage notice before trying again.",
			);
			return;
		}
		setMessage(
			`${job.company} ${interest === "Shortlisted" ? "added to your shortlist" : "marked as passed"}. No application stage changed and no details were shared.`,
		);
	}
	async function undo(job: Job) {
		setMessage("");
		if (
			!(await mutate((workspace) => ({
				...workspace,
				jobs: workspace.jobs.map((item) =>
					item.id === job.id ? { ...item, interest: "Unreviewed", interestReason: "" } : item,
				),
			})))
		) {
			setMessage("Couldn't undo this decision. Check the storage notice before trying again.");
			return;
		}
		setMessage(
			`Decision cleared for ${job.company}. The role re-enters review when it is saved and meets your filters. Any edited introduction has been kept.`,
		);
	}
	return (
		<div className="feature-view discovery-view">
			<div className="feature-heading">
				<div>
					<h1>Find work that feels like you.</h1>
					<p className="muted">Your priorities. One thoughtful next step.</p>
				</div>
			</div>
			<div className="discovery-tabs tabs" role="group" aria-label="Role discovery views">
				{(
					[
						{ id: "brief", label: "Your brief", icon: FileText },
						{ id: "review", label: "Review roles", icon: ListChecks },
						{ id: "shortlist", label: "Shortlist", icon: Bookmark },
					] as const
				).map((item) => (
					<button
						key={item.id}
						className={`tab ${tab === item.id ? "active" : ""}`}
						aria-pressed={tab === item.id}
						onClick={() => {
							setTab(item.id);
							setMessage("");
						}}
					>
						<item.icon size={18} />
						{item.label}
					</button>
				))}
			</div>
			<div className="notice">
				<Info size={17} />
				Reviewing saved jobs on this device. Introductions are drafts only.
			</div>
			{message ? (
				<div className="notice" role="status">
					<Check size={16} />
					{message}
				</div>
			) : null}
			<div className="discovery-layout">
				<div className="stack">
					{tab === "brief" ? (
						<CareerBrief />
					) : tab === "review" ? (
						<>
							{queue[0] ? (
								<RoleReviewCard key={queue[0].id} job={queue[0]} remaining={queue.length} onDecision={decide} />
							) : (
								<section className="panel discovery-empty">
									<ListChecks size={32} />
									<h2>No roles ready for review.</h2>
									<p className="muted">
										Save a job with a description, or adjust your profile and the keyword, location, or company filters
										in Applications. Already reviewed roles are in your decision history.
									</p>
									<a className="button secondary" href="#jobs">
										Open Applications <ArrowRight size={16} />
									</a>
								</section>
							)}
							<ReviewHistory jobs={reviewed} onUndo={undo} />
						</>
					) : (
						<>
							{shortlist.length && selected ? (
								<>
									<label className="field" htmlFor="shortlisted-role">
										<span>Your shortlisted role</span>
										<select
											id="shortlisted-role"
											className="input"
											value={selected.id}
											onChange={(event) => {
												setSelectedId(event.target.value);
												setMessage("");
											}}
										>
											{shortlist.map((job) => (
												<option key={job.id} value={job.id}>
													{job.company} · {job.role}
												</option>
											))}
										</select>
									</label>
									<IntroductionEditor key={selected.id} job={selected} />
									<section className="panel">
										<h2>Your note about this role</h2>
										<p className="muted preserve-lines" style={{ marginTop: 10 }}>
											{selected.interestReason || "No reason added when you shortlisted this role."}
										</p>
										<button className="text-button" style={{ marginTop: 15 }} onClick={() => undo(selected)}>
											<RotateCcw size={15} />
											Undo shortlist decision
										</button>
									</section>
								</>
							) : (
								<section className="panel discovery-empty">
									<Bookmark size={32} />
									<h2>Your shortlist starts with a good question.</h2>
									<p className="muted">
										Review saved roles and shortlist the ones you want to explore. Your application stages stay
										separate.
									</p>
									<button className="button primary" onClick={() => setTab("review")}>
										Review roles <ArrowRight size={16} />
									</button>
								</section>
							)}
						</>
					)}
				</div>
				<BriefSummary
					goals={data.goals}
					onEdit={() => {
						setTab("brief");
						setMessage("");
					}}
				/>
			</div>
		</div>
	);
}
