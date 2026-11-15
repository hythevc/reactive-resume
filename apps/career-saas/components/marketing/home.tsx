import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { WorkspacePreview } from "./previews";
import { MarketingLink, MarketingShell } from "./shell";
import { ToolShowcase } from "./tool-showcase";

export function WorkflowSteps() {
	return (
		<ol className="m-workflow-steps">
			{[
				{ title: "Add your experience", text: "Build a shared record of your work, skills and education." },
				{ title: "Choose a role", text: "Save a posting and prepare documents from your own facts." },
				{ title: "Review and export", text: "Check every draft, export it and record your next step." },
			].map((step, index) => (
				<li key={step.title}>
					<span className="m-step-number" aria-hidden="true">
						{index + 1}
					</span>
					<div>
						<h3>{step.title}</h3>
						<p>{step.text}</p>
					</div>
				</li>
			))}
		</ol>
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
			"No. It prepares editable drafts and tracks the stages you report. You review your documents and apply through the employer’s process. CareerOS does not submit applications or send recruiter emails.",
	},
	{
		question: "Do I need an AI API key?",
		answer:
			"No. The local tools work without a model API key. An optional review-packet handoff lets you use your own configured agent session. The browser makes no model call; your agent access and any provider costs are separate.",
	},
	{
		question: "Where is my data stored?",
		answer:
			"Career data is saved in this browser profile, without a local account lock or CareerOS encryption. Other people using that profile may access it. Export a private backup from Settings. Photos are temporary and are not included in backups. Optional cloud resume copies require a separate action.",
	},
] as const;

export function FAQ() {
	return (
		<section className="m-container m-faq" aria-labelledby="faq-title">
			<div>
				<h2 id="faq-title">Questions before you start</h2>
				<p>How the current workspace works.</p>
			</div>
			<div className="m-faq-list">
				{questions.map((item) => (
					<details key={item.question}>
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
		<section className="m-container m-local-facts">
			<div>
				<h2>Local preparation. Your final review.</h2>
				<p>Work without an account. Keep a separate backup, check the drafts and choose what you share.</p>
				<Link href="/privacy" className="m-text-link">
					Read how your information is handled
				</Link>
			</div>
			<dl>
				<div>
					<dt>Saved in this browser</dt>
					<dd>
						People using the same browser profile may access your workspace. Backups contain readable career
						information.
					</dd>
				</div>
				<div>
					<dt>Review it yourself</dt>
					<dd>
						Edit and acknowledge your documents before export. An optional agent handoff is available when you want a
						separate review.
					</dd>
				</div>
			</dl>
		</section>
	);
}

export function HomePage() {
	return (
		<MarketingShell>
			<section className="m-container m-hero">
				<div className="m-hero-copy">
					<h1>
						Build a resume.
						<br />
						Keep the search moving.
					</h1>
					<p>
						Write a clear resume for each role. Keep your saved jobs, document drafts and next steps in one workspace.
					</p>
					<div className="m-hero-actions">
						<MarketingLink href="/app#resumes">Start a resume</MarketingLink>
						<MarketingLink href="/app" secondary>
							View workspace
						</MarketingLink>
					</div>
					<p className="m-small-note">Free local workspace. No account or payment required.</p>
				</div>
				<WorkspacePreview />
			</section>
			<section className="m-container m-workflow" aria-labelledby="workflow-title">
				<h2 id="workflow-title">One workflow for each application.</h2>
				<WorkflowSteps />
			</section>
			<section id="tools" className="m-container m-tool-overview">
				<div>
					<h2>Choose a task.</h2>
					<p>Each tool uses the career facts, roles or contacts you provide.</p>
				</div>
				<ToolShowcase />
			</section>
			<PrivacyStory />
			<FAQ />
			<section className="m-container m-page-action">
				<div>
					<h2>Start with your experience.</h2>
					<p>Replace the fictional examples with your own facts.</p>
				</div>
				<MarketingLink href="/app#resumes">Build your resume</MarketingLink>
			</section>
		</MarketingShell>
	);
}
