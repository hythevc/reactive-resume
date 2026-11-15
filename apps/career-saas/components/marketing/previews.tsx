import { FileText, Mail, MapPin, ClipboardCheck, ArrowRight } from "lucide-react";
import { createWorkspace } from "@/lib/workspace";

const example = createWorkspace();

export function ResumePreview({ compact = false }: { compact?: boolean }) {
	const { profile } = example;
	return (
		<div className={`m-resume-sheet${compact ? " m-resume-compact" : ""}`}>
			<p className="m-doc-name">{profile.name}</p>
			<p className="m-doc-role">{profile.role}</p>
			<div className="m-doc-contact">
				<span>
					<Mail size={12} aria-hidden="true" />
					{profile.email}
				</span>
				<span>
					<MapPin size={12} aria-hidden="true" />
					{profile.location}
				</span>
			</div>
			<p className="m-doc-section">Experience</p>
			<p className="m-doc-position">Senior Product Designer</p>
			<p className="m-doc-company">Northstar Studio · 2022 – Present</p>
			<p className="m-doc-description">
				Partner with product and engineering on research, interaction design, and a shared design system.
			</p>
			{!compact && (
				<>
					<p className="m-doc-section">Skills</p>
					<p className="m-doc-description">{profile.skills}</p>
					<p className="m-doc-section">Education</p>
					<p className="m-doc-description">
						BFA, Interaction Design
						<br />
						Pacific Design Institute · 2015 – 2019
					</p>
				</>
			)}
		</div>
	);
}

export function WorkspacePreview() {
	const job = example.jobs[0];
	return (
		<figure className="m-workspace-preview" aria-label="A selected role, source resume and review steps">
			<div className="m-proof-columns">
				<div className="m-proof-role">
					<p className="m-proof-heading">Selected role</p>
					<div className="m-selected-role">
						<strong>{job.role}</strong>
						<span>{job.company}</span>
						<span className="m-record-status">Saved</span>
					</div>
					<p className="m-proof-label">Role details</p>
					<p className="m-proof-detail">
						<MapPin size={15} aria-hidden="true" />
						{job.location}
					</p>
					<p className="m-proof-detail">
						<FileText size={15} aria-hidden="true" />
						Source: saved posting
					</p>
				</div>
				<div className="m-proof-document">
					<p className="m-proof-heading">Source resume / {example.profile.name}</p>
					<ResumePreview compact />
				</div>
				<div className="m-proof-review">
					<p className="m-proof-heading">Review before sharing</p>
					<ClipboardCheck size={24} aria-hidden="true" />
					<ul>
						<li>Check the role and company</li>
						<li>Choose relevant experience</li>
						<li>Read every document</li>
					</ul>
					<p className="m-review-state">Your review is required</p>
				</div>
			</div>
			<figcaption>Fictional example · read-only preview</figcaption>
		</figure>
	);
}

export function LinkedInPreview() {
	return (
		<figure className="m-profile-preview">
			<div className="m-preview-top">
				<span>LinkedIn review</span>
				<span className="m-record-status">Editable text</span>
			</div>
			<div className="m-profile-summary">
				<span className="m-initials" aria-hidden="true">
					AM
				</span>
				<div>
					<strong>{example.profile.name}</strong>
					<p>{example.profile.role}</p>
				</div>
			</div>
			<div className="m-profile-text">
				<p className="m-proof-label">About draft</p>
				<p>{example.profile.summary}</p>
			</div>
			<div className="m-writing-note">
				<strong>Writing check: be specific</strong>
				<p>Name the work you do, the people you work with and the skills you can support with experience.</p>
			</div>
			<figcaption>Fictional profile · illustrative writing check</figcaption>
		</figure>
	);
}

export function JobsPreview() {
	return (
		<figure className="m-tracker-preview">
			<div className="m-preview-top">
				<span>Applications</span>
				<span className="m-proof-label">Saved role → next action</span>
			</div>
			<div className="m-job-records">
				{["Saved", "Draft", "Interview"].map((stage) => {
					const job = example.jobs.find((item) => item.status === stage);
					return job ? (
						<div className="m-job-record" key={stage}>
							<div>
								<strong>{job.role}</strong>
								<p>
									{job.company} · {job.location}
								</p>
							</div>
							<span className="m-record-status">{stage}</span>
							<p className="m-record-next">
								{stage === "Saved"
									? "Review the posting"
									: stage === "Draft"
										? "Review your documents"
										: "Add interview details"}
							</p>
						</div>
					) : null;
				})}
			</div>
			<figcaption>Fictional examples · stages are user records</figcaption>
		</figure>
	);
}

export function BriefPreview() {
	return (
		<figure className="m-brief-preview">
			<div className="m-preview-top">
				<span>Career brief</span>
				<span className="m-record-status">Your preferences</span>
			</div>
			<dl>
				<div>
					<dt>Work to focus on</dt>
					<dd>What problems would you like to solve?</dd>
				</div>
				<div>
					<dt>Team and scope</dt>
					<dd>Who do you want to work with, and how?</dd>
				</div>
				<div>
					<dt>Environment</dt>
					<dd>Where and how do you do your best work?</dd>
				</div>
			</dl>
			<div className="m-brief-next">
				<span>Review a role you saved</span>
				<ArrowRight size={17} aria-hidden="true" />
				<span>Shortlist or pass</span>
			</div>
			<figcaption>Prompts from the career brief · saved roles only</figcaption>
		</figure>
	);
}

export function OutreachPreview() {
	const contact = example.contacts[0];
	return (
		<figure className="m-outreach-preview">
			<div className="m-preview-top">
				<span>Recruiter outreach</span>
				<span className="m-record-status">Draft · not sent</span>
			</div>
			<div className="m-mail-recipient">
				<span>To</span>
				<strong>{contact.name}</strong>
				<span>{contact.email}</span>
			</div>
			<div className="m-mail-body">
				<p>Hi Jamie,</p>
				<p>
					I’m Alex Morgan, a Senior Product Designer. I work across research, interaction design, and design systems.
				</p>
				<p>I’d like to learn about product design opportunities at Forma.</p>
				<p>Alex</p>
			</div>
			<figcaption>Fictional example · you review and send your own message</figcaption>
		</figure>
	);
}

function FramingSample({ round = false }: { round?: boolean }) {
	return (
		<div className={`m-framing-sample${round ? " m-framing-round" : ""}`} aria-hidden="true">
			<span className="m-framing-head" />
			<span className="m-framing-shoulders" />
		</div>
	);
}

export function PhotoPreview() {
	return (
		<figure className="m-photo-preview">
			<div className="m-preview-top">
				<span>Profile photo</span>
				<span className="m-proof-label">Framing guide</span>
			</div>
			<div className="m-photo-comparison">
				<div>
					<FramingSample />
					<strong>Square PNG</strong>
					<p>The file you download</p>
				</div>
				<div>
					<FramingSample round />
					<strong>Circle preview</strong>
					<p>Check the visible crop</p>
				</div>
			</div>
			<figcaption>
				Illustrated framing guide, not a generated headshot.
				<br />
				Choose your own image to crop and adjust locally.
			</figcaption>
		</figure>
	);
}
