import { CalendarDays, FileText, ListChecks, ChevronDown, Pencil, Laptop, Layers } from "lucide-react";
import Link from "next/link";
import {
	BriefPreview,
	JobsPreview,
	LinkedInPreview,
	OutreachPreview,
	PhotoPreview,
	WorkspacePreview,
} from "./previews";
import { MarketingLink, MarketingShell } from "./shell";
import { ToolShowcase } from "./tool-showcase";

export function WorkflowSteps() {
	return (
		<div className="m-workflow-steps">
			{[
				{
					icon: FileText,
					title: "Shape your story",
					text: "Build a clear, well-structured resume that reflects your experience and goals.",
				},
				{
					icon: ListChecks,
					title: "Prepare for the role",
					text: "Tailor your materials for each opportunity with focus and intention.",
				},
				{
					icon: CalendarDays,
					title: "Keep track of what comes next",
					text: "Stay organized as you move from saved roles to submitted applications.",
				},
			].map((step, index) => (
				<article key={step.title}>
					<step.icon size={29} strokeWidth={1.5} aria-hidden="true" />
					<div>
						<h3>
							<span>0{index + 1}</span>
							{step.title}
						</h3>
						<p>{step.text}</p>
					</div>
				</article>
			))}
		</div>
	);
}

const questions = [
	{
		question: "What can I use today?",
		answer:
			"The free local workspace includes resume editing, LinkedIn writing checks, photo adjustments, role discovery, application preparation and outreach drafts. It starts with fictional examples that you can replace with your own information.",
	},
	{
		question: "Does CareerOS apply to jobs for me?",
		answer:
			"No. The current app prepares drafts and tracks the stages you report for each role. It does not submit applications for you or send recruiter emails.",
	},
	{
		question: "Can I use it without an AI API key?",
		answer:
			"Yes. The browser’s local tools require no model API key. If you choose the manual AI handoff, export a private job review packet and provide it to your own configured agent session. The browser makes no model call.",
	},
	{
		question: "Where is my data stored?",
		answer:
			"The local workspace saves career data in this browser profile, without a local account lock or CareerOS encryption. Other people using that profile may access it. Export a private backup from Settings. Photos are temporary and are not included in backups. Optional cloud resume copies require a separate action.",
	},
] as const;

export function FAQ() {
	return (
		<section className="m-container m-faq" aria-labelledby="faq-title">
			<div>
				<h2 id="faq-title">FAQ</h2>
				<p>Quick answers about how CareerOS works today.</p>
			</div>
			<div className="m-faq-list">
				{questions.map((item, index) => (
					<details key={item.question} open={index === 1}>
						<summary>
							{item.question}
							<ChevronDown size={18} aria-hidden="true" />
						</summary>
						<p>{item.answer}</p>
					</details>
				))}
			</div>
		</section>
	);
}

export function PrivacyStory() {
	return (
		<section className="m-container m-trust-story">
			<h2>
				Your career
				<br />
				facts stay yours.
			</h2>
			<div className="m-trust-rows">
				<article>
					<Pencil size={27} strokeWidth={1.5} aria-hidden="true" />
					<div>
						<h3>Edit before you share</h3>
						<p>Review and refine every draft. You choose what you copy, download or share.</p>
					</div>
				</article>
				<article>
					<Laptop size={29} strokeWidth={1.5} aria-hidden="true" />
					<div>
						<h3>Local by default</h3>
						<p>
							Career data stays in this browser profile until you choose to export it or make an explicit cloud resume
							copy. Keep backups private.
						</p>
					</div>
				</article>
				<article>
					<Layers size={28} strokeWidth={1.5} aria-hidden="true" />
					<div>
						<h3>A manual path that works</h3>
						<p>
							Export a job review packet for your own agent session. Import its resume and cover-letter drafts, read the
							report and make the final call.
						</p>
					</div>
				</article>
			</div>
			<p className="m-trust-note">
				There is no local account lock. People using the same browser profile may access the workspace.{" "}
				<Link href="/privacy">How your information is handled</Link>
			</p>
		</section>
	);
}

export function HomePage() {
	return (
		<MarketingShell>
			<section className="m-container m-hero">
				<div className="m-hero-copy">
					<h1>
						<span>Your next move,</span>
						<span>in one place.</span>
					</h1>
					<p>Build a resume you can stand behind. Prepare thoughtful applications. Keep your search moving.</p>
					<div className="m-hero-actions">
						<MarketingLink href="/app#resumes">Start with your resume</MarketingLink>
						<MarketingLink href="/app" secondary>
							Explore the workspace
						</MarketingLink>
					</div>
					<p className="m-hero-note">Free local workspace. No account or payment required.</p>
				</div>
				<WorkspacePreview />
			</section>
			<section className="m-container m-workflow" aria-labelledby="workflow-title">
				<h2 id="workflow-title">From first draft to next conversation</h2>
				<WorkflowSteps />
			</section>
			<section id="tools" className="m-tool-overview">
				<div className="m-container">
					<h2>A focused workspace for your job search.</h2>
					<ToolShowcase
						items={[
							{
								slug: "resume",
								name: "Resumes",
								description: "Create and refine tailored resumes for each opportunity.",
								preview: <WorkspacePreview />,
							},
							{
								slug: "linkedin",
								name: "LinkedIn studio",
								description: "Draft and refine your LinkedIn writing with the same clarity as your resume.",
								preview: <LinkedInPreview />,
							},
							{
								slug: "photo",
								name: "Photo studio",
								description: "Crop and adjust your own photo for your job search.",
								preview: <PhotoPreview />,
							},
							{
								slug: "role-discovery",
								name: "Role discovery",
								description: "Find your direction and review the roles you save.",
								preview: <BriefPreview />,
							},
							{
								slug: "applications",
								name: "Applications",
								description: "Keep a clear record of your roles, documents and next steps.",
								preview: <JobsPreview />,
							},
							{
								slug: "outreach",
								name: "Recruiter outreach",
								description: "Draft thoughtful, personalized messages for your own review.",
								preview: <OutreachPreview />,
							},
						]}
					/>
				</div>
			</section>
			<PrivacyStory />
			<FAQ />
			<section className="m-final-band m-home-final">
				<div className="m-container">
					<h2>Make your next move a considered one.</h2>
					<div>
						<MarketingLink href="/app">Open workspace</MarketingLink>
						<p>Free local demo. No account or payment required.</p>
					</div>
				</div>
			</section>
		</MarketingShell>
	);
}
