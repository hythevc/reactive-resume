"use client";

import { ArrowDownToLine, Check, Copy, FileText, Plus, Printer, Trash2, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import {
	exportResume,
	importResume,
	profileSchema,
	resumeSchema,
	MAX_RESUMES,
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
					maxLength={profileSchema.shape[field].maxLength ?? undefined}
					value={profile[field]}
					onChange={(event) => onChange(field, event.target.value)}
				/>
			) : (
				<input
					className="input"
					id={id}
					type={type}
					maxLength={profileSchema.shape[field].maxLength ?? undefined}
					value={profile[field]}
					onChange={(event) => onChange(field, event.target.value)}
				/>
			)}
			{help ? <small className="muted">{help}</small> : null}
		</label>
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
				<p className="resume-contact">{[profile.email, profile.location].filter(Boolean).join(" · ")}</p>
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
	const { data, setData } = useWorkspace();
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

	function createResume() {
		if (!canAddResume()) return;
		const resume: Resume = {
			id: crypto.randomUUID(),
			title: `Resume ${data.resumes.length + 1}`,
			updatedAt: new Date().toISOString(),
			profile: { ...data.profile },
		};
		setData((current) => ({
			...current,
			resumes: [...current.resumes, resume],
		}));
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

	function updateProfile(field: keyof Profile, value: string) {
		if (!selected) return;
		updateResume({ profile: { ...selected.profile, [field]: value } });
		setMessage("");
	}

	function duplicateResume() {
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
		setData((current) => ({
			...current,
			resumes: [...current.resumes, resume],
		}));
		setSelectedId(resume.id);
		setMessage("Resume duplicated.");
	}

	function removeResume() {
		if (!selected || !window.confirm(`Delete “${selected.title}”? This removes it from this device.`)) return;
		setData((current) => ({
			...current,
			resumes: current.resumes.filter((resume) => resume.id !== selected.id),
		}));
		setSelectedId(null);
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
			setData((current) => ({
				...current,
				resumes: [...current.resumes, resume],
			}));
			setSelectedId(resume.id);
			setMessage(
				"Supported resume text imported. Review the fields; unsupported sections and original formatting are not retained.",
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
				JSON import brings in your name, headline, email, location, summary, experience, education, and skills. Phone
				numbers, links, other sections, and original formatting are not retained. Keep your original file.
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
				<div className="resume-workspace">
					<section className="panel resume-editor" aria-label="Resume editor">
						<div className="panel-heading">
							<h2 className="section-title">Your story, in your words</h2>
							<span className="status">Autosaved locally</span>
						</div>
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
							<ProfileField label="Location" field="location" profile={selected.profile} onChange={updateProfile} />
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
							Choose “Save as PDF” in the print dialog. JSON exports share these supported text fields with Reactive
							Resume; the selected preview template is not exported.
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
