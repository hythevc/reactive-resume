"use client";

import {
	ArrowDownToLine,
	Check,
	CircleAlert,
	Copy,
	FileText,
	Plus,
	Printer,
	Sparkles,
	Target,
	Trash2,
	Upload,
} from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { ProfileUrlField } from "@/components/career-ui";
import { careerProfileFromResume, updateResumeProfile } from "@/lib/workflow-safety";
import {
	compareResumeToJob,
	extractJobKeywords,
	exportResume,
	importResume,
	profileFieldMaxLength,
	resumeSchema,
	MAX_RESUMES,
	TARGET_KEYWORDS_MAX_LENGTH,
	TARGET_KEYWORD_LIMIT,
	splitSkills,
	type Job,
	type Profile,
	type Resume,
} from "@/lib/workspace";
import { useWorkspace } from "@/lib/workspace-context";

function downloadJson(value: unknown, name: string) {
	const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
	const link = document.createElement("a");
	link.href = url;
	link.download = name;
	link.click();
	window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function resumeFileName(title: string) {
	return `${
		title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "") || "resume"
	}.json`;
}

type ProfileFieldProps = {
	label: string;
	field: keyof Profile;
	profile: Profile;
	onChange: (field: keyof Profile, value: string) => void;
	multiline?: boolean;
	rows?: number;
	type?: string;
	help?: string;
};

function ProfileField({
	label,
	field,
	profile,
	onChange,
	multiline = false,
	rows = 4,
	type = "text",
	help,
}: ProfileFieldProps) {
	const id = `resume-${field}`;
	return (
		<label className="field" htmlFor={id}>
			<span>{label}</span>
			{multiline ? (
				<textarea
					className="textarea"
					id={id}
					rows={rows}
					maxLength={profileFieldMaxLength(field)}
					value={profile[field]}
					onChange={(event) => onChange(field, event.target.value)}
				/>
			) : (
				<input
					className="input"
					id={id}
					type={type}
					maxLength={profileFieldMaxLength(field)}
					value={profile[field]}
					onChange={(event) => onChange(field, event.target.value)}
				/>
			)}
			{help ? <small className="muted">{help}</small> : null}
		</label>
	);
}

type ResumeTargetPanelProps = {
	resume: Resume;
	jobs: Job[];
	onChange: (updates: Partial<Resume>) => void;
	onCommit: (updates: Partial<Resume>) => Promise<boolean>;
	onDuplicate: (job: Job) => void;
};

export function ResumeTargetPanel({ resume, jobs, onChange, onCommit, onDuplicate }: ResumeTargetPanelProps) {
	const [notice, setNotice] = useState("");
	const [error, setError] = useState("");
	const job = jobs.find((item) => item.id === resume.targetJobId);
	const comparison = compareResumeToJob(resume.profile, resume.targetKeywords);

	function updateKeywords(value: string) {
		if (value.length > TARGET_KEYWORDS_MAX_LENGTH || splitSkills(value).length > TARGET_KEYWORD_LIMIT) {
			setError(
				`Use up to ${TARGET_KEYWORD_LIMIT} target terms and ${TARGET_KEYWORDS_MAX_LENGTH.toLocaleString()} characters. Remove a term before adding another.`,
			);
			return;
		}
		onChange({ targetKeywords: value });
		setNotice("");
		setError("");
	}

	async function suggestKeywords() {
		if (!job) return;
		const suggestions = extractJobKeywords(job);
		if (!suggestions.length) {
			setNotice(
				"No terms in the local skill dictionary were found in this posting. Add the specific terms you want to check below.",
			);
			return;
		}
		const current = splitSkills(resume.targetKeywords);
		const existing = new Set(current.map((term) => term.toLowerCase()));
		const added = suggestions.filter((term) => !existing.has(term.toLowerCase()));
		const terms = [...current, ...added];
		const value = terms.join(", ");
		if (terms.length > TARGET_KEYWORD_LIMIT || value.length > TARGET_KEYWORDS_MAX_LENGTH) {
			setError("The suggested terms would exceed the keyword limit. Remove some existing terms, then try again.");
			return;
		}
		setNotice("");
		if (!(await onCommit({ targetKeywords: value }))) {
			setError("Couldn't save the suggested terms. Check the storage notice before trying again.");
			return;
		}
		setError("");
		setNotice(
			added.length
				? `Added ${added.length} dictionary ${added.length === 1 ? "term" : "terms"} found in the job title or description. Your existing target terms were kept.`
				: "The dictionary terms found in this posting are already in your list.",
		);
	}

	return (
		<section className="panel resume-target-panel" aria-label="Resume job targeting">
			<div className="panel-heading">
				<div>
					<h2 className="section-title">Tailor this version to a role.</h2>
					<p className="muted">Compare your resume with specific terms from a job you care about.</p>
				</div>
				<Target size={21} />
			</div>
			<div className="form-grid">
				<div>
					<label className="field" htmlFor="resume-target-job">
						<span>Target job</span>
						<select
							id="resume-target-job"
							className="input"
							value={job?.id ?? ""}
							onChange={async (event) => {
								setNotice("");
								if (!(await onCommit({ targetJobId: event.target.value || null }))) {
									setError("Couldn't save the target job. Check the storage notice before trying again.");
									return;
								}
								setError("");
								setNotice("Target job updated. Review your target terms or add suggestions from this posting.");
							}}
						>
							<option value="">No target job</option>
							{jobs.map((item) => (
								<option key={item.id} value={item.id}>
									{item.company} · {item.role}
								</option>
							))}
						</select>
					</label>
					{resume.targetJobId && !job ? (
						<p className="muted small-print">
							The linked job is no longer in your workspace. Your saved target terms are retained; choose another job or
							keep checking them.
						</p>
					) : null}
					{!jobs.length ? (
						<p className="muted small-print">
							Save a role in{" "}
							<a className="text-button" href="#jobs">
								Applications
							</a>{" "}
							to link its description. You can also enter target terms directly.
						</p>
					) : null}
					{job ? (
						<details>
							<summary className="text-button">View job description</summary>
							<p
								className="muted preserve-lines small-print"
								style={{ marginTop: 12, maxHeight: 180, overflowY: "auto" }}
							>
								{job.description || "This job has no description yet. Edit it in Applications to add the requirements."}
							</p>
						</details>
					) : null}
					<div className="resume-actions" style={{ marginTop: 15 }}>
						<button className="button secondary small" onClick={suggestKeywords} disabled={!job}>
							<Sparkles size={15} />
							Suggest from job
						</button>
						<button className="button secondary small" onClick={() => job && onDuplicate(job)} disabled={!job}>
							<Copy size={15} />
							Duplicate as job version
						</button>
					</div>
					<p className="muted small-print" style={{ marginTop: 12 }}>
						Suggestions use a fixed local skill dictionary and only add terms found in the posting. They never add
						skills or claims to your resume.
					</p>
				</div>
				<div>
					<label className="field" htmlFor="resume-target-keywords">
						<span>
							Target terms{" "}
							<small className="muted">
								{comparison.total} / {TARGET_KEYWORD_LIMIT}
							</small>
						</span>
						<textarea
							id="resume-target-keywords"
							className="textarea"
							rows={4}
							maxLength={TARGET_KEYWORDS_MAX_LENGTH}
							value={resume.targetKeywords}
							onChange={(event) => updateKeywords(event.target.value)}
							placeholder="For example: Figma, user research, accessibility"
						/>
						<small className="muted">
							Separate terms with commas or newlines. Edit this list to reflect the requirements you want to review.
						</small>
					</label>
					<div className="target-summary" aria-live="polite">
						<strong>
							{comparison.coverage === null ? "No target terms yet" : `${comparison.coverage}% explicit-term coverage`}
						</strong>
						<span className="muted">
							{comparison.total
								? `${comparison.matched.length} of ${comparison.total} terms found in this resume`
								: "Add terms to begin comparing your resume."}
						</span>
					</div>
				</div>
			</div>
			{notice ? (
				<div className="notice" role="status" style={{ marginTop: 18 }}>
					<Check size={16} />
					{notice}
				</div>
			) : null}
			{error ? (
				<div className="notice error" role="alert" style={{ marginTop: 18 }}>
					{error}
				</div>
			) : null}
			{comparison.total ? (
				<div className="form-grid" style={{ marginTop: 20 }}>
					<div>
						<h3>In your resume</h3>
						{comparison.matched.length ? (
							<ul className="keyword-list">
								{comparison.matched.map((term) => (
									<li className="keyword-chip matched" key={term}>
										<Check size={13} />
										{term}
									</li>
								))}
							</ul>
						) : (
							<p className="muted small-print">None of these terms were found yet.</p>
						)}
					</div>
					<div>
						<h3>To review</h3>
						{comparison.missing.length ? (
							<ul className="keyword-list">
								{comparison.missing.map((term) => (
									<li className="keyword-chip missing" key={term}>
										<CircleAlert size={13} />
										{term}
									</li>
								))}
							</ul>
						) : (
							<p className="muted small-print">Every target term appears in the resume text.</p>
						)}
					</div>
				</div>
			) : null}
			<p className="muted small-print" style={{ marginTop: 18 }}>
				This check covers only the terms you enter, not every job qualification. It is not an ATS score or a hiring
				prediction. Add a term to your resume only when your experience supports it.
			</p>
		</section>
	);
}

type ResumePaperProps = { resume: Resume; template: "classic" | "modern" };

function ResumePaper({ resume, template }: ResumePaperProps) {
	const profile = resume.profile;
	return (
		<article className={`resume-paper ${template}`} aria-label="Resume preview">
			<header>
				<h2>{profile.name || "Your name"}</h2>
				<p className="resume-role">{profile.role || "Your professional title"}</p>
				<p className="resume-contact">
					{[profile.email, profile.phone, profile.location, profile.website, profile.linkedinUrl]
						.filter(Boolean)
						.join(" · ")}
				</p>
			</header>
			{profile.summary ? (
				<section className="resume-section">
					<h3>Profile</h3>
					<p>{profile.summary}</p>
				</section>
			) : null}
			{profile.experience ? (
				<section className="resume-section">
					<h3>Experience</h3>
					<p className="preserve-lines">{profile.experience}</p>
				</section>
			) : null}
			{profile.education ? (
				<section className="resume-section">
					<h3>Education</h3>
					<p className="preserve-lines">{profile.education}</p>
				</section>
			) : null}
			{profile.skills ? (
				<section className="resume-section">
					<h3>Skills</h3>
					<p>{profile.skills}</p>
				</section>
			) : null}
		</article>
	);
}

export function ResumesView() {
	const { data, setData, mutate, persistenceStatus } = useWorkspace();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [template, setTemplate] = useState<"classic" | "modern">("classic");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const importRef = useRef<HTMLInputElement>(null);
	const selected = data.resumes.find((resume) => resume.id === selectedId) || data.resumes[0];

	function canAddResume() {
		if (data.resumes.length < MAX_RESUMES) return true;
		setMessage("");
		setError(
			`This workspace has reached ${MAX_RESUMES} resumes. Export or remove an old resume before adding another.`,
		);
		return false;
	}

	async function createResume() {
		if (!canAddResume()) return;
		const resume: Resume = {
			id: crypto.randomUUID(),
			title: `Resume ${data.resumes.length + 1}`,
			updatedAt: new Date().toISOString(),
			profile: { ...data.profile },
			targetJobId: null,
			targetKeywords: "",
		};
		setMessage("");
		if (
			!(await mutate((current) => ({
				...current,
				resumes: [
					...current.resumes,
					{ ...resume, title: `Resume ${current.resumes.length + 1}`, profile: { ...current.profile } },
				],
			})))
		) {
			setError("Couldn't save this resume. Keep your input and check the storage notice before trying again.");
			return;
		}
		setSelectedId(resume.id);
		setMessage("New resume created. Your edits are saved on this device.");
		setError("");
	}

	function updateResume(updates: Partial<Resume>) {
		if (!selected) return;
		setData((current) => ({
			...current,
			resumes: current.resumes.map((resume) =>
				resume.id === selected.id ? { ...resume, ...updates, updatedAt: new Date().toISOString() } : resume,
			),
		}));
	}

	function commitResume(updates: Partial<Resume>): Promise<boolean> {
		if (!selected) return Promise.resolve(false);
		return mutate((current) => ({
			...current,
			resumes: current.resumes.map((resume) =>
				resume.id === selected.id ? { ...resume, ...updates, updatedAt: new Date().toISOString() } : resume,
			),
		}));
	}

	function updateProfile(field: keyof Profile, value: string) {
		if (!selected) return;
		setData((current) => updateResumeProfile(current, selected.id, field, value));
		setMessage("");
	}

	async function useAsCareerProfile() {
		if (!selected) return;
		if (
			!window.confirm(
				`Use “${selected.title}” as your shared career profile? Matching, new resumes, recruiter drafts and introductions will use these facts. Existing resume versions and edited drafts will stay unchanged.`,
			)
		)
			return;
		setMessage("");
		if (
			!(await mutate((current) => {
				const source = current.resumes.find((resume) => resume.id === selected.id);
				if (!source) throw new Error("Resume is no longer available.");
				return careerProfileFromResume(current, source);
			}))
		) {
			setError(
				"Couldn't save the shared career profile. Your resume is kept; check the storage notice before trying again.",
			);
			return;
		}
		setMessage(
			"Shared career profile updated from this resume. Review existing outreach and introduction drafts against your new facts.",
		);
		setError("");
	}

	async function duplicateResume() {
		if (!selected || !canAddResume()) return;
		const copyTitle = `${selected.title} (copy)`;
		const title = copyTitle.length <= (resumeSchema.shape.title.maxLength ?? Infinity) ? copyTitle : selected.title;
		const resume: Resume = {
			...selected,
			id: crypto.randomUUID(),
			title,
			updatedAt: new Date().toISOString(),
			profile: { ...selected.profile },
		};
		setMessage("");
		if (
			!(await mutate((current) => ({
				...current,
				resumes: [...current.resumes, resume],
			})))
		) {
			setError("Couldn't save this resume. Keep your input and check the storage notice before trying again.");
			return;
		}
		setSelectedId(resume.id);
		setError("");
		setMessage("Resume duplicated.");
	}

	async function duplicateForJob(job: Job) {
		if (!selected || !canAddResume()) return;
		const jobTitle = `${job.company} · ${job.role}`;
		const title =
			jobTitle.length <= (resumeSchema.shape.title.maxLength ?? Infinity) ? jobTitle : "Job-specific resume";
		const resume: Resume = {
			...selected,
			id: crypto.randomUUID(),
			title,
			targetJobId: job.id,
			updatedAt: new Date().toISOString(),
			profile: { ...selected.profile },
		};
		setMessage("");
		if (!(await mutate((current) => ({ ...current, resumes: [...current.resumes, resume] })))) {
			setError("Couldn't save this resume copy. Check the storage notice before trying again.");
			return;
		}
		setSelectedId(resume.id);
		setError("");
		setMessage(
			"Job-specific version created. Your original resume is kept; edit this copy using only experience you can substantiate.",
		);
	}

	async function removeResume() {
		if (!selected || !window.confirm(`Delete “${selected.title}”? This removes it from this device.`)) return;
		setMessage("");
		if (
			!(await mutate((current) => ({
				...current,
				resumes: current.resumes.filter((resume) => resume.id !== selected.id),
			})))
		) {
			setError("Couldn't delete this resume. Check the storage notice before trying again.");
			return;
		}
		setSelectedId(null);
		setError("");
		setMessage("Resume deleted.");
	}

	async function importFile(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		setError("");
		if (!canAddResume()) return;
		if (file.size > 2 * 1024 * 1024) {
			setError("Choose a JSON file smaller than 2 MB.");
			return;
		}
		try {
			const resume = importResume(JSON.parse(await file.text()));
			setMessage("");
			if (
				!(await mutate((current) => ({
					...current,
					resumes: [...current.resumes, resume],
				})))
			) {
				setError(
					"Couldn't save the imported resume. Keep the original file and check the storage notice before trying again.",
				);
				return;
			}
			setSelectedId(resume.id);
			setMessage(
				"Supported resume text imported. Review the fields, then choose “Use as career profile” if matching and new outreach should use these facts. Existing shared facts have not changed.",
			);
		} catch {
			setError("Couldn’t import this resume. Choose a valid Reactive Resume JSON file.");
		}
	}

	return (
		<div className="feature-view resumes-view">
			<div className="feature-heading">
				<div>
					<h1>Make your experience count.</h1>
					<p className="muted">Build, tailor, and export a resume that tells your story.</p>
				</div>
				<div className="resume-actions">
					<button className="button secondary" onClick={() => importRef.current?.click()}>
						<Upload size={16} />
						Import JSON
					</button>
					<button className="button primary" onClick={createResume}>
						<Plus size={16} />
						Create a resume
					</button>
				</div>
			</div>
			<p className="muted small-print" style={{ marginBottom: 20 }}>
				JSON import brings in supported contact details, LinkedIn/website links, summary, experience, education, and
				skills. Other sections and original formatting are not retained. Keep your original file, then check the
				imported details before sharing.
			</p>
			<input
				ref={importRef}
				aria-label="Import Reactive Resume JSON"
				type="file"
				accept=".json,application/json"
				hidden
				onChange={importFile}
			/>
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
			<div className="resume-library" aria-label="Your resumes">
				{data.resumes.map((resume) => (
					<button
						key={resume.id}
						className={`resume-list-item ${selected?.id === resume.id ? "selected" : ""}`}
						onClick={() => {
							setSelectedId(resume.id);
							setMessage("");
						}}
						aria-pressed={selected?.id === resume.id}
					>
						<FileText size={20} />
						<span>
							<strong>{resume.title}</strong>
							<small>{resume.profile.role || "Untitled role"}</small>
						</span>
						{selected?.id === resume.id ? <Check size={16} /> : null}
					</button>
				))}
			</div>
			{selected ? (
				<ResumeTargetPanel
					key={selected.id}
					resume={selected}
					jobs={data.jobs}
					onChange={updateResume}
					onCommit={commitResume}
					onDuplicate={duplicateForJob}
				/>
			) : null}
			{selected ? (
				<div className="resume-workspace">
					<section className="panel resume-editor" aria-label="Resume editor">
						<div className="panel-heading">
							<h2 className="section-title">Your story, in your words</h2>
							<span className="status">
								{persistenceStatus === "saved"
									? "Saved locally"
									: persistenceStatus === "saving"
										? "Saving…"
										: "Not saved — check the workspace notice"}
							</span>
						</div>
						<p className="muted small-print">
							Editing this resume changes this version only. Matching and outreach use your shared career profile:{" "}
							{data.profile.name || "No name added"} · {data.profile.role || "No role added"}.
						</p>
						<button className="button secondary small" onClick={useAsCareerProfile}>
							Use as career profile
						</button>
						<label className="field" htmlFor="resume-title">
							<span>Resume name</span>
							<input
								id="resume-title"
								className="input"
								maxLength={resumeSchema.shape.title.maxLength ?? undefined}
								value={selected.title}
								onChange={(event) => updateResume({ title: event.target.value })}
							/>
						</label>
						<div className="form-grid">
							<ProfileField label="Full name" field="name" profile={selected.profile} onChange={updateProfile} />
							<ProfileField
								label="Professional title"
								field="role"
								profile={selected.profile}
								onChange={updateProfile}
							/>
							<ProfileField
								label="Email"
								field="email"
								type="email"
								profile={selected.profile}
								onChange={updateProfile}
							/>
							<ProfileField
								label="Phone"
								field="phone"
								type="tel"
								profile={selected.profile}
								onChange={updateProfile}
							/>
							<ProfileField label="Location" field="location" profile={selected.profile} onChange={updateProfile} />
							<ProfileUrlField
								key={selected.id + selected.profile.website}
								label="Website"
								value={selected.profile.website}
								maxLength={profileFieldMaxLength("website")}
								onCommit={(value) => mutate((current) => updateResumeProfile(current, selected.id, "website", value))}
							/>
							<ProfileUrlField
								key={selected.id + selected.profile.linkedinUrl}
								label="LinkedIn URL"
								value={selected.profile.linkedinUrl}
								maxLength={profileFieldMaxLength("linkedinUrl")}
								onCommit={(value) =>
									mutate((current) => updateResumeProfile(current, selected.id, "linkedinUrl", value))
								}
							/>
						</div>
						<ProfileField
							label="Professional summary"
							field="summary"
							multiline
							rows={4}
							profile={selected.profile}
							onChange={updateProfile}
							help="Keep it specific to your experience and the role you want."
						/>
						<ProfileField
							label="Experience"
							field="experience"
							multiline
							rows={7}
							profile={selected.profile}
							onChange={updateProfile}
							help="Add each role, company, dates, and accomplishments on separate lines."
						/>
						<ProfileField
							label="Education"
							field="education"
							multiline
							rows={3}
							profile={selected.profile}
							onChange={updateProfile}
						/>
						<ProfileField
							label="Skills"
							field="skills"
							profile={selected.profile}
							onChange={updateProfile}
							help="Separate skills with commas."
						/>
						<div className="resume-actions">
							<button className="button secondary small" onClick={duplicateResume}>
								<Copy size={15} />
								Duplicate
							</button>
							<button className="button secondary small danger" onClick={removeResume}>
								<Trash2 size={15} />
								Delete resume
							</button>
						</div>
					</section>
					<section className="resume-preview-wrap" aria-label="Resume appearance and export">
						<div className="resume-preview-toolbar">
							<div className="tabs" aria-label="Resume template">
								<button
									className={`tab ${template === "classic" ? "active" : ""}`}
									aria-pressed={template === "classic"}
									onClick={() => setTemplate("classic")}
								>
									Classic
								</button>
								<button
									className={`tab ${template === "modern" ? "active" : ""}`}
									aria-pressed={template === "modern"}
									onClick={() => setTemplate("modern")}
								>
									Modern
								</button>
							</div>
							<div className="resume-actions">
								<button
									className="button secondary small"
									onClick={() => downloadJson(exportResume(selected), resumeFileName(selected.title))}
								>
									<ArrowDownToLine size={15} />
									JSON
								</button>
								<button className="button primary small" onClick={() => window.print()}>
									<Printer size={15} />
									Print / PDF
								</button>
							</div>
						</div>
						<ResumePaper resume={selected} template={template} />
						<p className="muted resume-export-note">
							Check your contact details, dates, metrics and every page before sharing. Choose “Save as PDF” in the
							print dialog. JSON exports share these supported text fields with Reactive Resume; the selected preview
							template is not exported.
						</p>
					</section>
				</div>
			) : (
				<section className="panel empty-state">
					<FileText size={36} />
					<h2>Your next chapter starts with a page.</h2>
					<p className="muted">Create your first resume or import an existing Reactive Resume JSON file.</p>
					<button className="button primary" onClick={createResume}>
						<Plus size={16} />
						Create a resume
					</button>
				</section>
			)}
		</div>
	);
}
