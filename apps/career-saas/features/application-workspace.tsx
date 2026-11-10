"use client";

import { Check, CheckCircle2, CircleAlert, Download, FileCheck2, FileText, RefreshCw, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { ProfileUrlField } from "@/components/career-ui";
import {
	applicationSourceChanged,
	createApplication,
	exportApplicationPacket,
	parseApplicationResult,
	reviewApplication,
} from "@/lib/application";
import {
	APPLICATION_COVER_LETTER_MAX_LENGTH,
	compareResumeToJob,
	extractJobKeywords,
	MAX_RESUMES,
	profileFieldMaxLength,
	type Application,
	type Job,
	type Profile,
	type Resume,
	type Workspace,
} from "@/lib/workspace";
import { useWorkspace } from "@/lib/workspace-context";

type ApplicationTab = "fit" | "drafts" | "review";
type ApplicationWorkspaceProps = { job: Job };
const IMPORT_LIMIT = 8 * 1024 * 1024;
const resumeFields: { field: keyof Profile; label: string; rows?: number; type?: string }[] = [
	{ field: "name", label: "Name" },
	{ field: "role", label: "Current role" },
	{ field: "email", label: "Email", type: "email" },
	{ field: "location", label: "Location" },
	{ field: "phone", label: "Phone", type: "tel" },
	{ field: "summary", label: "Summary", rows: 4 },
	{ field: "skills", label: "Skills", rows: 3 },
	{ field: "experience", label: "Experience", rows: 8 },
	{ field: "education", label: "Education", rows: 3 },
];

function downloadFile(value: string, fileName: string, type: string) {
	const url = URL.createObjectURL(new Blob([value], { type }));
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function jobFileName(job: Job) {
	return (
		`${job.company}-${job.role}`
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "")
			.slice(0, 140) || "application"
	);
}

function currentSource(workspace: Workspace, application: Application): Profile | null {
	return application.sourceResumeId
		? (workspace.resumes.find((resume) => resume.id === application.sourceResumeId)?.profile ?? null)
		: workspace.profile;
}
function reviewKey(job: Job, sourceId: string, sourceProfile: Profile | null) {
	return JSON.stringify([
		job.id,
		job.company,
		job.role,
		sourceId,
		sourceProfile,
		job.description,
		job.url,
		job.application,
	]);
}

export function ApplicationWorkspace({ job }: ApplicationWorkspaceProps) {
	const { data, setData, mutate, persistenceStatus } = useWorkspace();
	const application = job.application;
	const [tab, setTab] = useState<ApplicationTab>("fit");
	const [sourceChoice, setSourceChoice] = useState<{
		applicationId: string | null;
		value: string;
	} | null>(null);
	const [overwrite, setOverwrite] = useState(false);
	const [pending, setPending] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [importOpen, setImportOpen] = useState(false);
	const [resultText, setResultText] = useState("");
	const [acceptedFor, setAcceptedFor] = useState<string | null>(null);
	const importRef = useRef<HTMLInputElement>(null);
	const sourceSelectionVersion = useRef(0);
	const sourceId =
		sourceChoice?.applicationId === (application?.id ?? null)
			? sourceChoice.value
			: (application?.sourceResumeId ?? "");
	const sourceResume = sourceId ? data.resumes.find((resume) => resume.id === sourceId) : null;
	const sourceProfile = sourceId ? (sourceResume?.profile ?? null) : data.profile;
	const draftSourceId = application?.sourceResumeId ?? null;
	const sourceLabel = draftSourceId
		? (data.resumes.find((resume) => resume.id === draftSourceId)?.title ?? "Source resume removed; snapshot retained")
		: "Master career profile";
	const selectionChanged = Boolean(application && sourceId !== (application.sourceResumeId ?? ""));
	const sourceChanged = Boolean(
		application && (selectionChanged || applicationSourceChanged(sourceProfile, job, application)),
	);
	const currentProfile = application?.resume ?? sourceProfile;
	const comparison = currentProfile
		? compareResumeToJob(currentProfile, application?.targetKeywords || extractJobKeywords(job).join(", "))
		: null;
	const review = application ? reviewApplication(sourceProfile, job, application) : null;
	const acknowledgementKey = reviewKey(job, sourceId, sourceProfile);
	const acknowledged = acceptedFor === acknowledgementKey;
	const writable = persistenceStatus === "saved" && !pending;
	const exportAllowed = Boolean(application && review?.canExport && !sourceChanged && acknowledged && writable);

	function clearFeedback() {
		setMessage("");
		setError("");
	}
	async function generate() {
		clearFeedback();
		if (!sourceProfile) {
			setError("Choose an available resume source before creating a draft.");
			return;
		}
		setPending(true);
		try {
			let rejected = false;
			const nextId = crypto.randomUUID();
			const saved = await mutate((workspace) => {
				const currentJob = workspace.jobs.find((item) => item.id === job.id);
				const currentProfile = sourceId
					? workspace.resumes.find((resume) => resume.id === sourceId)?.profile
					: workspace.profile;
				if (!currentJob || !currentProfile || currentJob.application?.id !== application?.id) {
					rejected = true;
					return workspace;
				}
				const next = createApplication(currentProfile, currentJob, sourceId || null, nextId, new Date().toISOString());
				return {
					...workspace,
					jobs: workspace.jobs.map((item) => (item.id === job.id ? { ...item, application: next } : item)),
				};
			});
			if (!saved || rejected) {
				setError("Couldn't save the application draft. Check the workspace notice and try again.");
				return;
			}
			setOverwrite(false);
			setAcceptedFor(null);
			setTab("drafts");
			setMessage("Local starter drafts created from your source facts. They have not received an AI review.");
		} catch {
			setError("Couldn't create this draft. Review your source profile and job description, then try again.");
		} finally {
			setPending(false);
		}
	}

	function updateDocuments(updates: Partial<Pick<Application, "resume" | "coverLetter">>) {
		if (!application) return;
		setData((workspace) => ({
			...workspace,
			jobs: workspace.jobs.map((item) =>
				item.id === job.id && item.application?.id === application.id
					? { ...item, application: { ...item.application, ...updates } }
					: item,
			),
		}));
		setAcceptedFor(null);
		clearFeedback();
	}
	function updateProfile(field: keyof Profile, value: string) {
		if (!application) return;
		const limit = profileFieldMaxLength(field);
		if (limit !== undefined && value.length > limit) {
			setError(`Keep ${field} within ${limit.toLocaleString()} characters.`);
			return;
		}
		setData((workspace) => ({
			...workspace,
			jobs: workspace.jobs.map((item) =>
				item.id === job.id && item.application?.id === application.id
					? {
							...item,
							application: {
								...item.application,
								resume: { ...item.application.resume, [field]: value },
							},
						}
					: item,
			),
		}));
		setAcceptedFor(null);
		clearFeedback();
	}
	async function commitUrl(field: "website" | "linkedinUrl", value: string) {
		if (!application) return false;
		const saved = await mutate((workspace) => ({
			...workspace,
			jobs: workspace.jobs.map((item) =>
				item.id === job.id && item.application?.id === application.id
					? {
							...item,
							application: {
								...item.application,
								resume: { ...item.application.resume, [field]: value },
							},
						}
					: item,
			),
		}));
		setAcceptedFor(null);
		return saved;
	}

	function exportPacket() {
		clearFeedback();
		if (!application || sourceChanged || !sourceProfile || !writable) {
			setError("Save your current drafts and regenerate from an available source before exporting a packet.");
			return;
		}
		try {
			const packet = exportApplicationPacket(sourceProfile, job, application);
			downloadFile(JSON.stringify(packet, null, 2), `${jobFileName(job)}-review-packet.json`, "application/json");
			setMessage(
				"Review packet downloaded. Open it with Codex using the project's ai-job-search skill, then import the reviewed result.",
			);
		} catch {
			setError(
				"Couldn't export this packet. Your source facts or job changed; regenerate the drafts before continuing.",
			);
		}
	}
	async function importResult(raw: string) {
		clearFeedback();
		if (!application || !sourceProfile || sourceChanged || !writable) {
			setError("Save or regenerate your current drafts before importing a reviewed result.");
			return;
		}
		if (new TextEncoder().encode(raw).byteLength > IMPORT_LIMIT) {
			setError("Choose or paste a reviewed result smaller than 8 MiB.");
			return;
		}
		setPending(true);
		try {
			const parsed: unknown = JSON.parse(raw);
			let rejected = false;
			const saved = await mutate((workspace) => {
				const currentJob = workspace.jobs.find((item) => item.id === job.id);
				const currentApplication = currentJob?.application;
				if (
					!currentJob ||
					!currentApplication ||
					currentApplication.id !== application.id ||
					(currentApplication.sourceResumeId ?? "") !== sourceId
				) {
					rejected = true;
					return workspace;
				}
				try {
					const freshPacket = exportApplicationPacket(
						currentSource(workspace, currentApplication),
						currentJob,
						currentApplication,
					);
					const patch = parseApplicationResult(parsed, freshPacket);
					return {
						...workspace,
						jobs: workspace.jobs.map((item) =>
							item.id === job.id ? { ...item, application: { ...currentApplication, ...patch } } : item,
						),
					};
				} catch {
					rejected = true;
					return workspace;
				}
			});
			if (!saved || rejected) {
				setError(
					"Couldn't import this result. Export a fresh packet; your source, job, or document text may have changed while the file was being read.",
				);
				return;
			}
			setAcceptedFor(null);
			setResultText("");
			setImportOpen(false);
			setTab("review");
			setMessage(
				"Reviewed result imported for these documents. Check the report and every final detail before exporting.",
			);
		} catch {
			setError(
				"Couldn't import this result. Use the required result format for a newly exported packet; older packets and edited input echoes are rejected.",
			);
		} finally {
			setPending(false);
		}
	}
	async function importFile(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		if (file.size > IMPORT_LIMIT) {
			setError("Choose a reviewed result smaller than 8 MiB.");
			return;
		}
		const selectionVersion = sourceSelectionVersion.current;
		try {
			const raw = await file.text();
			if (selectionVersion !== sourceSelectionVersion.current) {
				setError(
					"The source selection changed while reading this file. Choose the result again after selecting the intended source.",
				);
				return;
			}
			await importResult(raw);
		} catch {
			setError("Couldn't read this file. Choose a JSON result from your review packet.");
		}
	}

	async function saveResumeVersion() {
		clearFeedback();
		if (!application || !exportAllowed) {
			setError("Complete the current review and confirm the final documents before saving a version.");
			return;
		}
		if (data.resumes.length >= MAX_RESUMES) {
			setError(`This workspace has reached ${MAX_RESUMES} resumes. Export or remove an old version first.`);
			return;
		}
		setPending(true);
		let rejected = false;
		const versionId = crypto.randomUUID();
		try {
			const saved = await mutate((workspace) => {
				const currentJob = workspace.jobs.find((item) => item.id === job.id);
				const currentApplication = currentJob?.application;
				if (
					!currentJob ||
					!currentApplication ||
					currentApplication.id !== application.id ||
					workspace.resumes.length >= MAX_RESUMES ||
					(currentApplication.sourceResumeId ?? "") !== sourceId
				) {
					rejected = true;
					return workspace;
				}
				const profile = currentSource(workspace, currentApplication);
				if (
					!reviewApplication(profile, currentJob, currentApplication).canExport ||
					acceptedFor !== reviewKey(currentJob, sourceId, profile)
				) {
					rejected = true;
					return workspace;
				}
				const title = `${currentJob.company} · ${currentJob.role}`;
				const resume: Resume = {
					id: versionId,
					title: title.length <= 500 ? title : "Reviewed application resume",
					updatedAt: new Date().toISOString(),
					profile: { ...currentApplication.resume },
					targetJobId: currentJob.id,
					targetKeywords: currentApplication.targetKeywords,
				};
				return { ...workspace, resumes: [...workspace.resumes, resume] };
			});
			if (saved && !rejected) setMessage("Reviewed resume version saved in Resumes. No application was submitted.");
			else setError("Couldn't save this resume version. Check the workspace notice and try again.");
		} finally {
			setPending(false);
		}
	}
	function exportLetter() {
		clearFeedback();
		if (!application || !exportAllowed) {
			setError("Complete the current review and confirm the final documents before exporting.");
			return;
		}
		downloadFile(application.coverLetter, `${jobFileName(job)}-cover-letter.txt`, "text/plain;charset=utf-8");
		setMessage("Cover letter downloaded. Submit it yourself after checking the employer's requirements.");
	}

	return (
		<section className="application-workspace" aria-label="Application workspace">
			<header className="application-heading">
				<p>
					{job.company} · {job.role}
				</p>
				<h2>Your application, thoughtfully prepared.</h2>
				<p className="muted">Draft from your career facts. Review every detail before you apply.</p>
			</header>
			<div className="tabs application-tabs" role="group" aria-label="Application workspace views">
				{(["fit", "drafts", "review"] as const).map((item) => (
					<button
						className={`tab ${tab === item ? "active" : ""}`}
						aria-pressed={tab === item}
						key={item}
						onClick={() => setTab(item)}
					>
						{item === "fit" ? "Fit" : item === "drafts" ? "Drafts" : "Review"}
					</button>
				))}
			</div>
			<div className="notice application-template-notice">
				{application?.agentReview
					? review?.checks.find((check) => check.id === "report-current")?.passed
						? "Reviewed drafts imported. Read the report and final documents before exporting."
						: "These drafts changed after the imported review. Export a fresh packet for another review."
					: "Local starter template. For an independent AI review, export a review packet."}
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
			<div className="application-source">
				<label className="field" htmlFor="application-source">
					<span>Draft source</span>
					<select
						id="application-source"
						className="input"
						disabled={pending}
						value={sourceId}
						onChange={(event) => {
							sourceSelectionVersion.current += 1;
							setSourceChoice({
								applicationId: application?.id ?? null,
								value: event.target.value,
							});
							setAcceptedFor(null);
							setOverwrite(false);
							clearFeedback();
						}}
					>
						<option value="">Master career profile</option>
						{sourceId && !sourceResume ? <option value={sourceId}>Source resume no longer available</option> : null}
						{data.resumes.map((resume) => (
							<option value={resume.id} key={resume.id}>
								{resume.title}
							</option>
						))}
					</select>
				</label>
				<button
					className="button secondary"
					disabled={!sourceProfile || !writable}
					onClick={() => (application ? setOverwrite(true) : void generate())}
				>
					<RefreshCw size={15} />
					{application ? "Regenerate drafts" : "Create local drafts"}
				</button>
			</div>
			{sourceChanged ? (
				<div className="notice error" role="alert">
					The source selection, source facts, or posting changed. Your edited drafts are kept. Regenerate explicitly
					before importing a review or exporting documents.
				</div>
			) : null}
			{overwrite ? (
				<div className="notice application-overwrite">
					<div>
						<strong>Replace the current drafts?</strong>
						<p>
							Regenerating uses the selected source and current posting. Your edited resume, cover letter, and imported
							review will be replaced.
						</p>
					</div>
					<div className="button-row">
						<button
							className="button primary small"
							disabled={pending || !sourceProfile || !writable}
							onClick={() => void generate()}
						>
							Replace drafts
						</button>
						<button className="button secondary small" onClick={() => setOverwrite(false)}>
							Keep my drafts
						</button>
					</div>
				</div>
			) : null}
			{tab === "fit" ? (
				<div className="application-fit panel">
					<div className="panel-heading">
						<div>
							<h3>Evidence to work with</h3>
							<p className="muted">
								{application ? "Checked against this resume draft." : "Checked against your selected source profile."}
							</p>
						</div>
						<FileCheck2 size={20} />
					</div>
					{comparison ? (
						<>
							<p className="application-coverage">
								{comparison.coverage === null
									? "No dictionary terms found in this posting."
									: `${comparison.matched.length} of ${comparison.total} explicit target terms appear in the text.`}
							</p>
							<div className="form-grid">
								<div>
									<h3>Supported by the current text</h3>
									<ul className="keyword-list">
										{comparison.matched.map((term) => (
											<li className="keyword-chip matched" key={term}>
												<Check size={13} />
												{term}
											</li>
										))}
									</ul>
									{!comparison.matched.length ? <p className="muted small-print">No matching terms found.</p> : null}
								</div>
								<div>
									<h3>Evidence gaps to review</h3>
									<ul className="keyword-list">
										{comparison.missing.map((term) => (
											<li className="keyword-chip missing" key={term}>
												<CircleAlert size={13} />
												{term}
											</li>
										))}
									</ul>
									{!comparison.missing.length ? <p className="muted small-print">No gaps among these terms.</p> : null}
								</div>
							</div>
						</>
					) : (
						<p className="muted">Choose an available profile to inspect the job's target terms.</p>
					)}
					<p className="muted small-print">
						This is a local keyword comparison, not an ATS score or a qualification verdict. Missing terms are prompts
						to check your evidence, never instructions to invent experience.
					</p>
					<button
						className="button primary"
						onClick={() => (application ? setTab("drafts") : void generate())}
						disabled={!sourceProfile || !writable}
					>
						{application ? "Open drafts" : "Create local drafts"} <FileText size={16} />
					</button>
				</div>
			) : null}
			{tab === "drafts" ? (
				application ? (
					<>
						<div className="application-drafts">
							<section className="panel application-resume">
								<h3>Resume draft</h3>
								<p className="muted">Source: {sourceLabel}. Edits here keep your source unchanged.</p>
								{resumeFields.map(({ field, label, rows, type }) => (
									<label className="application-field" key={field} htmlFor={`application-${field}`}>
										<span>{label}</span>
										{rows ? (
											<textarea
												className="textarea"
												id={`application-${field}`}
												rows={rows}
												maxLength={profileFieldMaxLength(field)}
												value={application.resume[field]}
												onChange={(event) => updateProfile(field, event.target.value)}
											/>
										) : (
											<input
												className="input"
												type={type ?? "text"}
												id={`application-${field}`}
												maxLength={profileFieldMaxLength(field)}
												value={application.resume[field]}
												onChange={(event) => updateProfile(field, event.target.value)}
											/>
										)}
									</label>
								))}
								<details className="application-contact-links">
									<summary className="text-button">Website and LinkedIn links</summary>
									<ProfileUrlField
										key={`website:${application.resume.website}`}
										label="Website"
										value={application.resume.website}
										maxLength={profileFieldMaxLength("website")}
										onCommit={(value) => commitUrl("website", value)}
									/>
									<ProfileUrlField
										key={`linkedin:${application.resume.linkedinUrl}`}
										label="LinkedIn URL"
										value={application.resume.linkedinUrl}
										maxLength={profileFieldMaxLength("linkedinUrl")}
										onCommit={(value) => commitUrl("linkedinUrl", value)}
									/>
								</details>
							</section>
							<section className="panel application-letter">
								<h3>Cover letter</h3>
								<label className="field" htmlFor="application-cover-letter">
									<span className="sr-only">Cover letter draft</span>
									<textarea
										id="application-cover-letter"
										className="textarea"
										rows={20}
										maxLength={APPLICATION_COVER_LETTER_MAX_LENGTH}
										value={application.coverLetter}
										onChange={(event) => updateDocuments({ coverLetter: event.target.value })}
									/>
								</label>
								<div className="button-row">
									<button
										className="button secondary small"
										onClick={exportPacket}
										disabled={sourceChanged || !writable}
									>
										<Download size={15} />
										Export review packet
									</button>
									<button className="text-button" onClick={() => setImportOpen((open) => !open)}>
										Import reviewed drafts
									</button>
								</div>
								<p className="muted small-print">
									Open the packet with Codex using the project's ai-job-search skill, then import the reviewed result.
									The packet includes source facts and current drafts.
								</p>
							</section>
						</div>
						<div className="application-bottom-actions">
							<button className="button secondary" onClick={() => setOverwrite(true)} disabled={!writable}>
								Regenerate drafts
							</button>
							<button className="button primary" onClick={() => setTab("review")}>
								Continue to review
							</button>
						</div>
					</>
				) : (
					<div className="panel empty-state">
						<h3>Create a starting draft first.</h3>
						<p>Choose your source profile and create local drafts above.</p>
					</div>
				)
			) : null}
			{tab === "review" ? (
				application && review ? (
					<section className="panel application-review">
						<div className="panel-heading">
							<h3>Review the final documents.</h3>
							<FileCheck2 size={21} />
						</div>
						<p className="muted">
							Local checks and an exact-document reviewer report are required before export. Imported reports are not
							proof of the reviewer's identity or independence.
						</p>
						<ul className="application-checks">
							{review.checks.map((check) => (
								<li key={check.id} className={check.passed ? "passed" : check.blocking ? "blocking" : ""}>
									{check.passed ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
									<div>
										<strong>
											{check.label}
											{!check.blocking ? " · advisory" : ""}
										</strong>
										<p className="muted">{check.detail}</p>
									</div>
								</li>
							))}
						</ul>
						{application.agentReview ? (
							<div className="application-report">
								<h3>Imported reviewer report</h3>
								<p className="preserve-lines">{application.agentReview.summary}</p>
								{application.agentReview.issues.length ? (
									<ul>
										{application.agentReview.issues.map((issue, index) => (
											<li key={`${index}:${issue}`}>{issue}</li>
										))}
									</ul>
								) : (
									<p className="muted small-print">
										No actionable issues were listed in this report. Changed document text makes the report stale.
									</p>
								)}
							</div>
						) : null}
						<div className="button-row">
							<button className="button secondary small" onClick={exportPacket} disabled={sourceChanged || !writable}>
								<Download size={15} />
								Export review packet
							</button>
							<button className="button secondary small" onClick={() => setImportOpen((open) => !open)}>
								<Upload size={15} />
								Import reviewed drafts
							</button>
						</div>
						<label className="application-acknowledgement">
							<input
								type="checkbox"
								checked={acknowledged}
								disabled={!review.canExport || sourceChanged || pending}
								onChange={(event) => setAcceptedFor(event.target.checked ? acknowledgementKey : null)}
							/>
							<span>
								I checked this final resume and cover letter for {job.company}, including every claim and contact
								detail.
							</span>
						</label>
						<div className="button-row">
							<button className="button primary" onClick={() => void saveResumeVersion()} disabled={!exportAllowed}>
								<FileText size={16} />
								Save resume version
							</button>
							<button className="button secondary" onClick={exportLetter} disabled={!exportAllowed}>
								<Download size={16} />
								Export cover letter
							</button>
						</div>
						<p className="muted small-print">
							Saving and exporting do not submit an application or change your application stage.
						</p>
					</section>
				) : (
					<div className="panel empty-state">
						<h3>No application drafts to review.</h3>
						<p>Create a local draft or prepare a review packet after choosing a source.</p>
					</div>
				)
			) : null}
			{importOpen && application ? (
				<section className="panel application-import" aria-label="Import reviewed application">
					<h3>Bring back your reviewed result.</h3>
					<p className="muted">
						Use the exact JSON result for a freshly exported packet. Inputs must match your current documents and source
						facts.
					</p>
					<input
						ref={importRef}
						hidden
						type="file"
						accept="application/json,.json"
						aria-label="Import application result JSON"
						onChange={importFile}
					/>
					<button
						className="button secondary small"
						disabled={pending || sourceChanged || !writable}
						onClick={() => importRef.current?.click()}
					>
						<Upload size={15} />
						Choose result JSON
					</button>
					<label className="field" htmlFor="application-result-json">
						<span>Or paste the result JSON</span>
						<textarea
							id="application-result-json"
							className="textarea"
							rows={5}
							maxLength={IMPORT_LIMIT}
							value={resultText}
							onChange={(event) => {
								const value = event.target.value;
								if (new TextEncoder().encode(value).byteLength > IMPORT_LIMIT) {
									setError("Keep the pasted result within 8 MiB of UTF-8 text.");
									return;
								}
								setResultText(value);
							}}
							placeholder="Paste the reviewed result object, without Markdown fences."
						/>
					</label>
					<div className="button-row">
						<button
							className="button primary small"
							disabled={!resultText.trim() || pending || sourceChanged || !writable}
							onClick={() => void importResult(resultText)}
						>
							Import reviewed result
						</button>
						<button className="button secondary small" onClick={() => setImportOpen(false)}>
							Close import
						</button>
					</div>
				</section>
			) : null}
		</section>
	);
}
