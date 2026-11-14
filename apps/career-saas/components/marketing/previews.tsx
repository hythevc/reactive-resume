import { Check, FileText, Mail, MapPin, Compass, Image, CheckCheck } from "lucide-react";
import { createWorkspace } from "@/lib/workspace";

const example = createWorkspace();

export function ResumePreview({ compact = false }: { compact?: boolean }) {
	const { profile } = example;
	return (
		<div className={`m-resume-sheet${compact ? " m-resume-compact" : ""}`}>
			<h3>{profile.name}</h3>
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
			<h4>Skills</h4>
			<div className="m-doc-skills">
				{profile.skills
					.split(", ")
					.slice(0, 4)
					.map((skill) => (
						<span key={skill}>{skill}</span>
					))}
			</div>
			<h4>Experience</h4>
			<p className="m-doc-position">Senior Product Designer</p>
			<p className="m-doc-company">Northstar Studio · 2022 – Present</p>
			<p className="m-doc-description">
				Partner with product and engineering on research, interaction design, and a shared design system.
			</p>
			{!compact && (
				<>
					<h4>Education</h4>
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
	return (
		<figure className="m-workspace-preview" aria-label="Resume and saved roles, fictional example">
			<div className="m-preview-top">
				<span>
					<FileText size={18} aria-hidden="true" />
					Resume / {example.profile.name}
				</span>
				<span className="m-preview-label">Workspace preview</span>
			</div>
			<div className="m-preview-columns">
				<ResumePreview compact />
				<div className="m-preview-jobs">
					<h3>Saved roles</h3>
					{example.jobs.slice(0, 2).map((job) => (
						<div className="m-preview-job" key={job.id}>
							<FileText size={17} aria-hidden="true" />
							<div>
								<strong>{job.company}</strong>
								<p>{job.role}</p>
							</div>
							<span className="m-mini-status">{job.status}</span>
						</div>
					))}
					<div className="m-preview-note">
						<Check size={15} aria-hidden="true" />
						<span>Your documents and next steps, together.</span>
					</div>
				</div>
			</div>
			<figcaption>Fictional example</figcaption>
		</figure>
	);
}

export function LinkedInPreview() {
	return (
		<figure className="m-profile-preview">
			<div className="m-preview-top">
				<span>Profile review</span>
				<span className="m-preview-label">Writing checklist</span>
			</div>
			<div className="m-profile-summary">
				<span className="m-initials" aria-hidden="true">
					AM
				</span>
				<div>
					<h3>{example.profile.name}</h3>
					<p>{example.profile.role}</p>
				</div>
			</div>
			<div className="m-profile-text">
				<h4>About</h4>
				<p>{example.profile.summary}</p>
			</div>
			<div className="m-check-lines">
				<p>
					<Check size={17} aria-hidden="true" />
					Describe the work you do
				</p>
				<p>
					<Check size={17} aria-hidden="true" />
					Keep your experience specific
				</p>
				<p>
					<Check size={17} aria-hidden="true" />
					Use skills you can stand behind
				</p>
			</div>
			<figcaption>Illustrative checklist · fictional profile</figcaption>
		</figure>
	);
}

export function JobsPreview() {
	const stages = ["Saved", "Draft", "Interview"] as const;
	return (
		<figure className="m-tracker-preview">
			<div className="m-preview-top">
				<span>Applications</span>
				<span className="m-preview-label">Your next steps</span>
			</div>
			<div className="m-tracker-columns">
				{stages.map((stage) => {
					const job = example.jobs.find((item) => item.status === stage);
					if (!job) return null;
					return (
						<div className="m-tracker-stage" key={stage}>
							<h3>
								<span className={`m-stage-dot m-stage-${stage.toLowerCase()}`} />
								{stage}
							</h3>
							<div className="m-job-paper">
								<strong>{job.company}</strong>
								<h4>{job.role}</h4>
								<p>
									<MapPin size={13} aria-hidden="true" />
									{job.location}
								</p>
								<span>
									{stage === "Saved"
										? "Review the posting"
										: stage === "Draft"
											? "Review your documents"
											: "Add interview details"}
								</span>
							</div>
						</div>
					);
				})}
			</div>
			<figcaption>Fictional examples · stages are user records</figcaption>
		</figure>
	);
}

export function BriefPreview() {
	return (
		<figure className="m-brief-preview">
			<Compass size={27} aria-hidden="true" />
			<h3>Your next chapter</h3>
			<p>A brief for the work you want next.</p>
			<dl>
				<div>
					<dt>The problem</dt>
					<dd>What would you like to work on?</dd>
				</div>
				<div>
					<dt>The team</dt>
					<dd>Who helps you do your best work?</dd>
				</div>
				<div>
					<dt>The environment</dt>
					<dd>Where and how do you want to work?</dd>
				</div>
			</dl>
			<figcaption>Prompts from the career brief</figcaption>
		</figure>
	);
}

export function OutreachPreview() {
	const contact = example.contacts[0];
	return (
		<figure className="m-outreach-preview">
			<div className="m-preview-top">
				<span>
					<Mail size={17} aria-hidden="true" />
					Outreach draft
				</span>
				<span className="m-preview-label">For your review</span>
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
			<figcaption>Fictional example · no message is sent</figcaption>
		</figure>
	);
}

export function PhotoPreview() {
	return (
		<figure className="m-photo-preview">
			<div className="m-photo-stages">
				<span>
					<Image size={17} aria-hidden="true" />
					Source
				</span>
				<span>Polish</span>
				<span>
					<CheckCheck size={17} aria-hidden="true" />
					Download
				</span>
			</div>
			<div className="m-photo-canvas">
				<div className="m-photo-frame">
					<Image size={46} strokeWidth={1.2} aria-hidden="true" />
					<span>Your photo, thoughtfully framed.</span>
				</div>
				<div className="m-photo-round" aria-hidden="true">
					<Image size={23} strokeWidth={1.2} />
				</div>
			</div>
			<figcaption>Bring your own image · local crop and adjustments</figcaption>
		</figure>
	);
}
