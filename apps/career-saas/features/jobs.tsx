"use client";

import {
	ArrowUpRight,
	BriefcaseBusiness,
	Check,
	FileText,
	Pause,
	Pencil,
	Play,
	Plus,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { evaluatePreparationJob, type Job, type PreparationReason } from "@/lib/workspace";
import { useWorkspace } from "@/lib/workspace-context";

type JobForm = Pick<Job, "company" | "role" | "location" | "url" | "description" | "notes">;
const emptyJob: JobForm = {
	company: "",
	role: "",
	location: "",
	url: "",
	description: "",
	notes: "",
};
const stages: Job["status"][] = ["Saved", "Draft", "Applied", "Interview"];
const reasonLabels: Record<PreparationReason, string> = {
	"not-saved": "Already in your pipeline",
	"missing-description": "Add a description",
	"excluded-company": "Excluded company",
	"location-mismatch": "Outside preferred locations",
	"below-minimum-match": "Below your match threshold",
};

function criteriaTerms(value: string) {
	const terms = value
		.split(/[,\n]/)
		.map((item) => item.trim())
		.filter(Boolean);
	return [...new Map(terms.map((term) => [term.toLowerCase(), term])).values()];
}

function safeJobUrl(value: string) {
	try {
		const url = new URL(value);
		return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
	} catch {
		return null;
	}
}

export function JobsView() {
	const { data, setData, ready } = useWorkspace();
	const [search, setSearch] = useState("");
	const [stage, setStage] = useState<"All" | Job["status"]>("All");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState<JobForm>(emptyJob);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const savedCompanyCriteria = data.autopilot.excludedCompanies.join(", ");
	const savedLocationCriteria = data.autopilot.locations.join(", ");
	const criteriaKey = JSON.stringify([savedCompanyCriteria, savedLocationCriteria]);
	const [criteriaDraft, setCriteriaDraft] = useState<{ key: string; company: string; location: string } | null>(null);
	const activeCriteria =
		criteriaDraft?.key === criteriaKey
			? criteriaDraft
			: { key: criteriaKey, company: savedCompanyCriteria, location: savedLocationCriteria };
	const companyCriteria = activeCriteria.company;
	const locationCriteria = activeCriteria.location;
	const [criteriaError, setCriteriaError] = useState("");
	function setCompanyCriteria(company: string) {
		setCriteriaDraft({ key: criteriaKey, company, location: locationCriteria });
	}
	function setLocationCriteria(location: string) {
		setCriteriaDraft({ key: criteriaKey, company: companyCriteria, location });
	}
	const minimumMatch = data.autopilot.minMatch;
	const filtersDirty =
		companyCriteria !== data.autopilot.excludedCompanies.join(", ") ||
		locationCriteria !== data.autopilot.locations.join(", ");
	const evaluations = useMemo(
		() => new Map(data.jobs.map((job) => [job.id, evaluatePreparationJob(data.profile, job, data.autopilot)])),
		[data.jobs, data.profile, data.autopilot],
	);
	const eligibleCount = [...evaluations.values()].filter((evaluation) => evaluation.eligible).length;
	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase();
		return data.jobs.filter(
			(job) =>
				(stage === "All" || job.status === stage) &&
				(!query || `${job.company} ${job.role} ${job.location} ${job.notes}`.toLowerCase().includes(query)),
		);
	}, [data.jobs, search, stage]);
	const selected = data.jobs.find((job) => job.id === selectedId);
	const prepared = data.jobs.filter((job) => job.status === "Draft").length;

	function saveCriteria(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const excludedCompanies = criteriaTerms(companyCriteria);
		const locations = criteriaTerms(locationCriteria);
		if (
			excludedCompanies.length > 100 ||
			locations.length > 50 ||
			[...excludedCompanies, ...locations].some((term) => term.length > 500)
		) {
			setCriteriaError("Use up to 100 excluded companies and 50 location terms, with at most 500 characters each.");
			return;
		}
		setData((current) => ({ ...current, autopilot: { ...current.autopilot, excludedCompanies, locations } }));
		setCriteriaDraft(null);
		setCriteriaError("");
		setNotice("Preparation filters saved. Your job list explains which roles are eligible.");
	}

	function eligibilityLabel(job: Job) {
		if (job.status === "Draft") return "Ready for your review";
		if (job.status !== "Saved") return "Manually tracked";
		const evaluation = evaluationFor(job);
		return evaluation.eligible
			? "Eligible for preparation"
			: evaluation.reasons.map((reason) => reasonLabels[reason]).join(" · ");
	}
	function evaluationFor(job: Job) {
		return evaluations.get(job.id) ?? evaluatePreparationJob(data.profile, job, data.autopilot);
	}

	function openForm(job?: Job) {
		setForm(
			job
				? {
						company: job.company,
						role: job.role,
						location: job.location,
						url: job.url,
						description: job.description,
						notes: job.notes,
					}
				: emptyJob,
		);
		setEditingId(job?.id ?? null);
		setShowForm(true);
		setError("");
	}

	function saveJob(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!form.company.trim() || !form.role.trim()) {
			setError("Add a company and role to save this job.");
			return;
		}
		if (!editingId && data.jobs.length >= 2000) {
			setError("This workspace has reached 2,000 jobs. Remove an old job before adding another.");
			return;
		}
		if (form.url.trim() && !safeJobUrl(form.url.trim())) {
			setError("Use a full HTTPS application link, or leave the link blank.");
			return;
		}
		const values: JobForm = Object.fromEntries(
			Object.entries(form).map(([key, value]) => [key, value.trim()]),
		) as JobForm;
		const id = editingId ?? crypto.randomUUID();
		setData((current) => ({
			...current,
			jobs: editingId
				? current.jobs.map((job) => (job.id === editingId ? { ...job, ...values } : job))
				: [
						{
							id,
							...values,
							status: "Saved",
							createdAt: new Date().toISOString(),
						},
						...current.jobs,
					],
		}));
		setShowForm(false);
		setSelectedId(id);
		setNotice(
			editingId ? "Job updated in your workspace." : "Job saved. Add a description to see how it matches your profile.",
		);
	}

	function updateStage(id: string, status: Job["status"]) {
		setData((current) => ({
			...current,
			jobs: current.jobs.map((job) => (job.id === id ? { ...job, status } : job)),
		}));
		setNotice(
			status === "Applied"
				? "Marked as applied in your tracker. This app did not submit an application."
				: "Application stage updated.",
		);
	}

	function removeJob(id: string) {
		setData((current) => ({
			...current,
			jobs: current.jobs.filter((job) => job.id !== id),
		}));
		if (selectedId === id) setSelectedId(null);
		setDeleteId(null);
		setNotice("Job removed from your workspace.");
	}

	function prepareMatches() {
		setError("");
		if (filtersDirty) {
			setNotice("Save your filter changes before preparing jobs.");
			return;
		}
		if (!data.autopilot.enabled) {
			setNotice("Turn on preparation to create local application drafts.");
			return;
		}
		const today = new Date().toISOString().slice(0, 10);
		const used = data.autopilot.preparationDate === today ? data.autopilot.preparationCount : 0;
		const remaining = Math.max(0, data.autopilot.dailyLimit - used);
		if (!remaining) {
			setNotice(
				"Today's preparation limit is reached. Review your drafts, increase the limit, or return tomorrow (UTC).",
			);
			return;
		}
		const candidates = data.jobs
			.filter((job) => evaluatePreparationJob(data.profile, job, data.autopilot).eligible)
			.slice(0, remaining);
		if (!candidates.length) {
			setNotice(
				"No saved jobs meet your preparation criteria. Review the reasons shown beside each role and adjust your filters or profile.",
			);
			return;
		}
		setData((current) => {
			if (!current.autopilot.enabled) return current;
			const currentUsed = current.autopilot.preparationDate === today ? current.autopilot.preparationCount : 0;
			const allowance = Math.max(0, current.autopilot.dailyLimit - currentUsed);
			const ids = new Set(
				current.jobs
					.filter((job) => evaluatePreparationJob(current.profile, job, current.autopilot).eligible)
					.slice(0, allowance)
					.map((job) => job.id),
			);
			if (!ids.size) return current;
			return {
				...current,
				autopilot: {
					...current.autopilot,
					preparationDate: today,
					preparationCount: currentUsed + ids.size,
				},
				jobs: current.jobs.map((job) => (ids.has(job.id) ? { ...job, status: "Draft" } : job)),
			};
		});
		setNotice("Matching saved jobs are ready in your draft queue. No applications were submitted.");
	}

	return (
		<div>
			<div className="feature-heading">
				<div>
					<h1>Your next opportunity.</h1>
					<p className="muted">A thoughtful pipeline, from the first save to the final interview.</p>
				</div>
				<button className="button primary" type="button" onClick={() => openForm()} disabled={!ready}>
					<Plus size={16} /> Add a job
				</button>
			</div>
			{notice ? (
				<div className="notice" role="status">
					{notice}
				</div>
			) : null}
			{error && !showForm ? (
				<div className="notice" role="alert">
					{error}
				</div>
			) : null}

			{showForm ? (
				<section className="panel" style={{ marginBottom: 24 }} aria-label={editingId ? "Edit job" : "Add job"}>
					<div className="section-title">
						<h2>{editingId ? "Edit opportunity" : "Save an opportunity"}</h2>
						<button
							className="button secondary small"
							type="button"
							aria-label="Close job form"
							onClick={() => setShowForm(false)}
						>
							<X size={16} />
						</button>
					</div>
					<form onSubmit={saveJob}>
						<div className="form-grid">
							<label className="field">
								Company
								<input
									className="input"
									required
									maxLength={500}
									value={form.company}
									onChange={(event) => setForm({ ...form, company: event.target.value })}
									placeholder="e.g. Fern Studio"
								/>
							</label>
							<label className="field">
								Role
								<input
									className="input"
									required
									maxLength={500}
									value={form.role}
									onChange={(event) => setForm({ ...form, role: event.target.value })}
									placeholder="Senior product designer"
								/>
							</label>
							<label className="field">
								Location
								<input
									className="input"
									maxLength={500}
									value={form.location}
									onChange={(event) => setForm({ ...form, location: event.target.value })}
									placeholder="London · Hybrid"
								/>
							</label>
							<label className="field">
								Application link
								<input
									className="input"
									type="url"
									maxLength={2000}
									value={form.url}
									onChange={(event) => setForm({ ...form, url: event.target.value })}
									placeholder="https://company.example.test/careers"
								/>
							</label>
						</div>
						<label className="field">
							Job description
							<textarea
								className="textarea"
								rows={5}
								maxLength={50000}
								value={form.description}
								onChange={(event) => setForm({ ...form, description: event.target.value })}
								placeholder="Paste the role's requirements to compare them with your profile."
							/>
						</label>
						<label className="field">
							Your notes
							<textarea
								className="textarea"
								rows={2}
								maxLength={50000}
								value={form.notes}
								onChange={(event) => setForm({ ...form, notes: event.target.value })}
								placeholder="What interests you? Who can introduce you?"
							/>
						</label>
						{error ? (
							<p role="alert" className="notice">
								{error}
							</p>
						) : null}
						<div style={{ display: "flex", gap: 10, marginTop: 16 }}>
							<button className="button primary" type="submit">
								<Check size={15} /> Save job
							</button>
							<button className="button secondary" type="button" onClick={() => setShowForm(false)}>
								Cancel
							</button>
						</div>
					</form>
				</section>
			) : null}

			<div className="two-column" style={{ alignItems: "start" }}>
				<section className="panel">
					<div className="section-title">
						<h2>
							Application pipeline{" "}
							<span className="muted" style={{ fontSize: 14 }}>
								({data.jobs.length})
							</span>
						</h2>
						<BriefcaseBusiness size={19} />
					</div>
					<div
						role="group"
						aria-label="Filter application stage"
						style={{
							display: "flex",
							gap: 6,
							flexWrap: "wrap",
							marginBottom: 18,
						}}
					>
						{(["All", ...stages] as const).map((item) => (
							<button
								key={item}
								type="button"
								aria-pressed={stage === item}
								className={`button small ${stage === item ? "primary" : "secondary"}`}
								onClick={() => setStage(item)}
							>
								{item}
								{item !== "All" ? ` ${data.jobs.filter((job) => job.status === item).length}` : ""}
							</button>
						))}
					</div>
					<label className="field">
						<span style={{ display: "flex", gap: 7, alignItems: "center" }}>
							<Search size={14} /> Search opportunities
						</span>
						<input
							className="input"
							type="search"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Company, role, location or notes"
						/>
					</label>
					<div className="table-wrap">
						<table className="data-table">
							<thead>
								<tr>
									<th>Opportunity</th>
									<th>Match</th>
									<th>Stage</th>
									<th>
										<span className="sr-only">Details</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((job) => (
									<tr key={job.id} style={selectedId === job.id ? { background: "#f3f7ed" } : undefined}>
										<td>
											<button
												type="button"
												onClick={() => setSelectedId(job.id)}
												style={{
													background: "none",
													border: 0,
													padding: 0,
													textAlign: "left",
													cursor: "pointer",
													font: "inherit",
													color: "#173f35",
												}}
											>
												<strong>{job.role}</strong>
												<span
													className="muted"
													style={{
														display: "block",
														fontSize: 12,
														marginTop: 4,
													}}
												>
													{job.company} · {job.location || "Location not set"}
												</span>
											</button>
											{job.notes ? (
												<span
													className="muted"
													style={{
														display: "block",
														fontSize: 11,
														marginTop: 6,
														maxWidth: 280,
														whiteSpace: "nowrap",
														overflow: "hidden",
														textOverflow: "ellipsis",
													}}
												>
													{job.notes}
												</span>
											) : null}
										</td>
										<td>
											<span className="status">
												{job.description.trim() ? `${evaluationFor(job).score}%` : "Add details"}
											</span>
											<small
												className={`eligibility-reason ${evaluationFor(job).eligible ? "eligible" : ""}`}
												style={{ display: "block", maxWidth: 170, marginTop: 7, fontSize: 11, whiteSpace: "normal" }}
											>
												{eligibilityLabel(job)}
											</small>
										</td>
										<td>
											<span className="status">{job.status}</span>
										</td>
										<td>
											<button
												className="button secondary small"
												type="button"
												onClick={() => setSelectedId(job.id)}
												aria-label={`Review ${job.role} at ${job.company}`}
											>
												<ArrowUpRight size={15} />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{!filtered.length ? (
						<div className="empty">
							<Search size={24} />
							<h3>{data.jobs.length ? "No matching opportunities" : "Your next chapter starts here"}</h3>
							<p className="muted">
								{data.jobs.length
									? "Try another search or application stage."
									: "Save a role to begin building your application pipeline."}
							</p>
						</div>
					) : null}
				</section>

				<aside className="panel" style={{ background: "#edf5d5" }}>
					<div className="section-title">
						<h2>Preparation autopilot</h2>
						<FileText size={19} />
					</div>
					<p className="muted" style={{ fontSize: 13, lineHeight: 1.7 }}>
						Move matching saved roles into your draft queue. You review each application and submit it on the employer's
						website.
					</p>
					<label
						className="field"
						style={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							gap: 10,
							margin: "22px 0",
						}}
					>
						<input
							type="checkbox"
							checked={data.autopilot.enabled}
							onChange={(event) =>
								setData((current) => ({
									...current,
									autopilot: {
										...current.autopilot,
										enabled: event.target.checked,
									},
								}))
							}
						/>{" "}
						Enable local preparation
					</label>
					<label className="field">
						Daily preparation limit
						<select
							className="input"
							value={data.autopilot.dailyLimit}
							onChange={(event) =>
								setData((current) => ({
									...current,
									autopilot: {
										...current.autopilot,
										dailyLimit: Number(event.target.value),
									},
								}))
							}
						>
							{[1, 3, 5, 10, 20].map((limit) => (
								<option key={limit} value={limit}>
									{limit} {limit === 1 ? "draft" : "drafts"} / day
								</option>
							))}
						</select>
					</label>
					<label className="field">
						Minimum match: {minimumMatch}%
						<input
							type="range"
							min={0}
							max={100}
							step={5}
							value={minimumMatch}
							onChange={(event) =>
								setData((current) => ({
									...current,
									autopilot: {
										...current.autopilot,
										minMatch: Number(event.target.value),
									},
								}))
							}
							style={{ width: "100%", accentColor: "#173f35" }}
						/>
					</label>
					<form onSubmit={saveCriteria} className="preparation-filters">
						<label className="field">
							Exclude companies
							<input
								className="input"
								value={companyCriteria}
								maxLength={50100}
								onChange={(event) => setCompanyCriteria(event.target.value)}
								placeholder="e.g. Forma, Arcwell"
							/>
							<small className="muted">
								Comma-separated names. Exact company-name matches are excluded, ignoring capitalization.
							</small>
						</label>
						<label className="field">
							Preferred locations
							<input
								className="input"
								value={locationCriteria}
								maxLength={25050}
								onChange={(event) => setLocationCriteria(event.target.value)}
								placeholder="e.g. Remote, San Francisco"
							/>
							<small className="muted">
								Any listed phrase can match a job's location. Leave blank to allow all locations.
							</small>
						</label>
						{criteriaError ? (
							<p className="notice" role="alert">
								{criteriaError}
							</p>
						) : null}
						<button className="button secondary small" type="submit" disabled={!ready || !filtersDirty}>
							<Check size={14} /> Save filters
						</button>
					</form>
					<p className="muted" style={{ fontSize: 12, marginTop: 20 }}>
						{eligibleCount} saved {eligibleCount === 1 ? "role meets" : "roles meet"} your current preparation criteria.
					</p>
					<button
						className="button primary"
						style={{ width: "100%", marginTop: 12 }}
						type="button"
						onClick={prepareMatches}
						disabled={!ready || !data.autopilot.enabled || filtersDirty}
					>
						{data.autopilot.enabled ? <Play size={15} /> : <Pause size={15} />} Prepare matching jobs
					</button>
					{filtersDirty ? (
						<p className="muted" style={{ fontSize: 11 }}>
							Save your filter changes to update eligibility and prepare matching jobs.
						</p>
					) : null}
					<button
						className="button secondary small"
						type="button"
						style={{ width: "100%", marginTop: 10 }}
						onClick={() => setStage("Draft")}
					>
						Review draft queue ({prepared})
					</button>
					<p className="muted" style={{ fontSize: 11, marginTop: 15, lineHeight: 1.7 }}>
						{prepared} {prepared === 1 ? "draft" : "drafts"} awaiting review. Match is a local keyword estimate, not an
						employer's ATS score. No background applications or messages are sent.
					</p>
				</aside>
			</div>

			{selected ? (
				<section className="panel" style={{ marginTop: 24 }} aria-label="Job details">
					<div className="section-title">
						<div>
							<p className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
								{selected.company} · {selected.location || "Location not set"}
							</p>
							<h2>{selected.role}</h2>
						</div>
						<button
							className="button secondary small"
							type="button"
							aria-label="Close job details"
							onClick={() => setSelectedId(null)}
						>
							<X size={16} />
						</button>
					</div>
					<div className="two-column">
						<div>
							<h3 style={{ fontSize: 14 }}>About this role</h3>
							<p
								className="muted"
								style={{
									whiteSpace: "pre-wrap",
									fontSize: 13,
									lineHeight: 1.8,
								}}
							>
								{selected.description || "Add a job description to compare requirements with your career profile."}
							</p>
							<h3 style={{ fontSize: 14, marginTop: 24 }}>Your notes</h3>
							<p className="muted" style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
								{selected.notes || "No notes yet. Edit this job to add your research and next steps."}
							</p>
						</div>
						<div>
							<label className="field">
								Record application stage
								<select
									className="input"
									value={selected.status}
									onChange={(event) => updateStage(selected.id, event.target.value as Job["status"])}
								>
									{stages.map((item) => (
										<option key={item}>{item}</option>
									))}
								</select>
							</label>
							<p className="muted" style={{ fontSize: 12, lineHeight: 1.7 }}>
								Only record “Applied” after you submit on the employer's site. A draft is a local preparation task.
							</p>
							{selected.status === "Draft" ? (
								<div className="notice">
									<strong>Ready to prepare your application</strong>
									<p style={{ margin: "8px 0 0", fontSize: 12 }}>
										Review the requirements, tailor your resume in the resume editor, and check every answer before
										submitting.
									</p>
								</div>
							) : null}
							<div
								style={{
									display: "flex",
									flexWrap: "wrap",
									gap: 8,
									marginTop: 18,
								}}
							>
								<button className="button secondary small" type="button" onClick={() => openForm(selected)}>
									<Pencil size={14} /> Edit job
								</button>
								{safeJobUrl(selected.url) ? (
									<a
										className="button primary small"
										href={safeJobUrl(selected.url) ?? undefined}
										target="_blank"
										rel="noopener noreferrer"
									>
										Open application <ArrowUpRight size={14} />
									</a>
								) : null}
								<button className="button secondary small" type="button" onClick={() => setDeleteId(selected.id)}>
									<Trash2 size={14} /> Remove
								</button>
							</div>
							{deleteId === selected.id ? (
								<div className="notice" role="alert">
									<p>Remove this job and its notes?</p>
									<button className="button primary small" type="button" onClick={() => removeJob(selected.id)}>
										Remove job
									</button>{" "}
									<button className="button secondary small" type="button" onClick={() => setDeleteId(null)}>
										Keep job
									</button>
								</div>
							) : null}
						</div>
					</div>
				</section>
			) : null}
		</div>
	);
}
