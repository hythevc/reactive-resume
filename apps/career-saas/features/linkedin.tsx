"use client";

import { ArrowRight, Check, CheckCircle2, CircleAlert, Copy, FileText, Linkedin, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { auditLinkedIn, linkedinSchema, type LinkedInProfile } from "@/lib/workspace";
import { useWorkspace } from "@/lib/workspace-context";

export function LinkedInView() {
	const { data, setData, mutate } = useWorkspace();
	const profile = data.linkedin;
	const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
	const reviewFrameRef = useRef<number | null>(null);
	useEffect(
		() => () => {
			if (reviewFrameRef.current !== null) cancelAnimationFrame(reviewFrameRef.current);
		},
		[],
	);
	const [report, setReport] = useState<ReturnType<typeof auditLinkedIn> | null>(null);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [previousDraft, setPreviousDraft] = useState<LinkedInProfile | null>(null);
	const [sourceId, setSourceId] = useState(data.resumes[0]?.id ?? "");
	const source = data.resumes.find((resume) => resume.id === sourceId);

	async function loadResume() {
		if (!source) return;
		const next = {
			headline: source.profile.role,
			about: source.profile.summary,
			experience: source.profile.experience,
			skills: source.profile.skills,
		};
		if (
			Object.entries(profile).some(
				([field, value]) => value.trim() && value !== next[field as keyof LinkedInProfile],
			) &&
			!window.confirm(
				"Replace your current LinkedIn draft with this resume's text? You can undo this replacement while this page stays open.",
			)
		)
			return;
		setMessage("");
		if (!(await mutate((current) => ({ ...current, linkedin: next })))) {
			setError("Couldn't save the replacement draft. Check the storage notice before trying again.");
			return;
		}
		setPreviousDraft({ ...profile });
		setReport(null);
		setError("");
		setMessage("Resume text loaded. Review each field, then run your writing checks.");
	}

	async function undoReplacement() {
		if (!previousDraft) return;
		if (!window.confirm("Restore the previous LinkedIn draft? Changes made since loading the resume will be replaced."))
			return;
		setMessage("");
		if (!(await mutate((current) => ({ ...current, linkedin: previousDraft })))) {
			setError(
				"Couldn't restore the previous draft. Your undo copy is kept; check the storage notice before trying again.",
			);
			return;
		}
		setPreviousDraft(null);
		setReport(null);
		setError("");
		setMessage("Previous LinkedIn draft restored.");
	}

	function update(field: keyof LinkedInProfile, value: string) {
		const limit = linkedinSchema.shape[field].maxLength;
		if (limit !== null && value.length > limit) {
			setError(`This field has a ${limit.toLocaleString()}-character storage limit. Shorten the text before saving.`);
			return;
		}
		setData((current) => ({
			...current,
			linkedin: { ...current.linkedin, [field]: value },
		}));
		setMessage("");
		setError("");
		setReport(null);
	}

	function reviewProfile() {
		setReport(auditLinkedIn(profile));
		setMessage("Review complete. These checks use the text you entered.");
		if (reviewFrameRef.current !== null) cancelAnimationFrame(reviewFrameRef.current);
		reviewFrameRef.current = requestAnimationFrame(() => {
			reviewHeadingRef.current?.focus({ preventScroll: true });
			reviewHeadingRef.current?.scrollIntoView({
				block: "start",
				behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
			});
			reviewFrameRef.current = null;
		});
	}

	async function copyDraft() {
		if (!report) return;
		try {
			await navigator.clipboard.writeText(`${report.headline}\n\n${report.about}`);
			setMessage("Headline and about draft copied.");
		} catch {
			setMessage("Couldn’t access the clipboard. Select and copy the draft below.");
		}
	}

	async function applyDraft() {
		if (!report) return;
		const updated = {
			...profile,
			headline: report.headline,
			about: report.about,
		};
		const parsed = linkedinSchema.safeParse(updated);
		if (!parsed.success) {
			setError("The draft exceeds a field limit. Edit the text before applying it.");
			return;
		}
		setMessage("");
		if (!(await mutate((current) => ({ ...current, linkedin: parsed.data })))) {
			setError("Couldn't save this draft. Check the storage notice before trying again.");
			return;
		}
		setError("");
		setReport(auditLinkedIn(updated));
		setMessage("Draft applied to this workspace. Copy it to LinkedIn when you are ready.");
	}

	return (
		<div className="feature-view linkedin-view">
			<div className="feature-heading">
				<div>
					<h1>LinkedIn review</h1>
					<p className="muted">Check your profile text and prepare a revised draft to copy to LinkedIn.</p>
				</div>
				<a className="button secondary" href="https://www.linkedin.com/me/" target="_blank" rel="noreferrer">
					<Linkedin size={16} />
					Open LinkedIn
					<ArrowRight size={16} />
				</a>
			</div>
			<div className="workspace-context-note">
				<Linkedin size={17} />
				<span>Paste your profile text below. Reviews run on this device; your LinkedIn account is not connected.</span>
			</div>
			{error ? (
				<div className="notice error" role="alert">
					{error}
				</div>
			) : null}
			{message ? (
				<div className="notice" role="status">
					<Check size={16} />
					{message}
				</div>
			) : null}
			<details className="context-disclosure">
				<summary>
					<FileText size={17} aria-hidden="true" />
					<strong>Start from a saved resume</strong>
					<span className="muted">Optional</span>
				</summary>
				<section className="panel linkedin-resume-source" aria-label="Start LinkedIn draft from a resume">
					<div>
						<h2>Resume source</h2>
						<p className="muted">
							Reuse a saved resume’s text for your headline, About, experience, and skills. Loading replaces the current
							draft.
						</p>
					</div>
					<label className="field" htmlFor="linkedin-resume-source">
						<span>Saved resume</span>
						<select
							className="input"
							id="linkedin-resume-source"
							value={sourceId}
							onChange={(event) => setSourceId(event.target.value)}
						>
							<option value="">Choose a resume</option>
							{data.resumes.map((resume) => (
								<option key={resume.id} value={resume.id}>
									{resume.title}
								</option>
							))}
						</select>
					</label>
					<button className="button secondary" disabled={!source} onClick={loadResume}>
						<FileText size={16} />
						Load resume text
					</button>
					{previousDraft ? (
						<button className="button secondary" onClick={undoReplacement}>
							Undo resume replacement
						</button>
					) : null}
				</section>
			</details>
			<div className="audit-layout linkedin-layout" data-has-report={Boolean(report)}>
				<section className="panel linkedin-editor">
					<div className="panel-heading">
						<div>
							<h2 className="section-title">Your profile</h2>
							<p className="muted">Paste or edit the text from your current LinkedIn profile.</p>
						</div>
						<span className="status">Local draft</span>
					</div>
					<label className="field" htmlFor="linkedin-headline">
						<span>
							Headline <small className="muted">{profile.headline.length} characters · LinkedIn limit 220</small>
						</span>
						<textarea
							className="textarea"
							id="linkedin-headline"
							rows={3}
							maxLength={linkedinSchema.shape.headline.maxLength ?? undefined}
							value={profile.headline}
							onChange={(event) => update("headline", event.target.value)}
							placeholder="Your role, strengths, and the value you bring"
						/>
					</label>
					<label className="field" htmlFor="linkedin-about">
						<span>
							About <small className="muted">{profile.about.length} characters · LinkedIn limit 2,600</small>
						</span>
						<textarea
							className="textarea"
							id="linkedin-about"
							rows={7}
							maxLength={linkedinSchema.shape.about.maxLength ?? undefined}
							value={profile.about}
							onChange={(event) => update("about", event.target.value)}
							placeholder="Tell your story in your own words"
						/>
					</label>
					<label className="field" htmlFor="linkedin-experience">
						<span>Experience</span>
						<textarea
							className="textarea"
							id="linkedin-experience"
							rows={5}
							maxLength={linkedinSchema.shape.experience.maxLength ?? undefined}
							value={profile.experience}
							onChange={(event) => update("experience", event.target.value)}
							placeholder="Roles, responsibilities, and accomplishments"
						/>
					</label>
					<label className="field" htmlFor="linkedin-skills">
						<span>Skills</span>
						<input
							className="input"
							id="linkedin-skills"
							maxLength={linkedinSchema.shape.skills.maxLength ?? undefined}
							value={profile.skills}
							onChange={(event) => update("skills", event.target.value)}
							placeholder="Product strategy, research, design systems"
						/>
						<small className="muted">
							Separate skills with commas. This draft is included in your workspace backup.
						</small>
					</label>
					<button className="button primary" onClick={reviewProfile}>
						<CheckCircle2 size={16} />
						Review my profile
						<ArrowRight size={16} />
					</button>
				</section>
				<div className="audit-results">
					{report ? (
						<>
							<section className="panel audit-score-panel">
								<div className="panel-heading">
									<h2
										className="section-title linkedin-review-title"
										ref={reviewHeadingRef}
										tabIndex={-1}
										style={{ scrollMarginTop: 80 }}
									>
										Profile clarity
									</h2>
									<span className="status">Rule-based review</span>
								</div>
								<div className="audit-check-summary">
									<strong>
										{report.checks.filter((check) => check.passed).length} of {report.checks.length} checks passed
									</strong>
									<span className="muted">Checklist score {report.score}/100</span>
								</div>
								<div className="check-list">
									{report.checks.map((check) => (
										<div className={`check-row ${check.passed ? "passed" : ""}`} key={check.label}>
											{check.passed ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
											<div>
												<strong>{check.label}</strong>
												<p className="muted">{check.detail}</p>
											</div>
										</div>
									))}
								</div>
							</section>
							<section className="panel linkedin-draft">
								<div className="panel-heading">
									<h2 className="section-title">Suggested draft</h2>
									<button className="button secondary small" onClick={copyDraft}>
										<Copy size={15} />
										Copy
									</button>
								</div>
								<p className="muted">
									An editable draft using your own details. Add specific outcomes only when you can support them.
								</p>
								<div className="draft-section">
									<h3>Headline</h3>
									<p className="preserve-lines">{report.headline || "Add your current role to create a headline."}</p>
								</div>
								<div className="draft-section">
									<h3>About</h3>
									<p className="preserve-lines">{report.about || "Add your background to create an about draft."}</p>
								</div>
								<button className="button primary" onClick={applyDraft}>
									<Check size={16} />
									Use this draft
								</button>
								<button className="button secondary" onClick={reviewProfile}>
									<RefreshCw size={15} />
									Run checks again
								</button>
							</section>
						</>
					) : (
						<p className="muted linkedin-empty-guidance">
							Review checks headline length, About structure, experience and skill coverage. This writing checklist does
							not predict LinkedIn ranking or recruiter visibility.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
