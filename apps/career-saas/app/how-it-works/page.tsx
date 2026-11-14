import type { Metadata } from "next";
import { ArrowRight, Download, FileCheck2, FolderOpen, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { WorkflowSteps, FAQ } from "@/components/marketing/home";
import { JobsPreview } from "@/components/marketing/previews";
import { MarketingLink, MarketingShell } from "@/components/marketing/shell";

export const metadata: Metadata = {
	title: "How it works — From career facts to thoughtful applications",
	description:
		"Start with your career facts, prepare documents for a saved role, and review your next step. Learn how local storage and the manual agent review handoff work.",
};

export default function HowItWorksPage() {
	return (
		<MarketingShell>
			<section className="m-container m-page-hero m-centered-hero">
				<h1>
					From your story
					<br />
					to your next step.
				</h1>
				<p className="m-lead">Start with what you know. Prepare for the work you want. Keep each next step in view.</p>
				<MarketingLink href="/app#resumes">Start with your resume</MarketingLink>
				<p className="m-hero-note">No account or payment required for the local workspace.</p>
			</section>
			<section className="m-container m-how-workflow">
				<WorkflowSteps />
				<JobsPreview />
			</section>
			<section className="m-container m-how-detail">
				<div>
					<span className="m-section-label">A first session, at your pace</span>
					<h2>
						Make one useful thing.
						<br />
						Then build from there.
					</h2>
				</div>
				<ol>
					<li>
						<span>01</span>
						<div>
							<h3>Replace the fictional examples with your facts.</h3>
							<p>
								Add your experience, skills and education, or import supported Reactive Resume JSON. Keep the original
								file and review every imported field.
							</p>
							<Link href="/app#resumes">
								Open the resume builder
								<ArrowRight size={15} aria-hidden="true" />
							</Link>
						</div>
					</li>
					<li>
						<span>02</span>
						<div>
							<h3>Save a role you want to consider.</h3>
							<p>
								Paste a posting and its source link. Compare explicit terms, add your notes and choose what belongs in a
								role-specific draft.
							</p>
							<Link href="/app#jobs">
								Open your applications
								<ArrowRight size={15} aria-hidden="true" />
							</Link>
						</div>
					</li>
					<li>
						<span>03</span>
						<div>
							<h3>Review, share and record your next step.</h3>
							<p>
								Read the documents, export what you need and apply through the employer’s process. Update the tracker
								yourself so your records reflect what happened.
							</p>
						</div>
					</li>
				</ol>
			</section>
			<section id="agent-review" className="m-review-band">
				<div className="m-container">
					<div className="m-review-intro">
						<span className="m-section-label">Optional / Your own agent session</span>
						<h2>
							AI help, with a<br />
							deliberate handoff.
						</h2>
						<p>
							The browser does not call a model. You choose whether to share a private review packet with your own agent
							session.
						</p>
					</div>
					<div className="m-review-steps">
						{[
							{
								icon: Download,
								title: "Export the packet",
								text: "Select a saved job and draft source in Application workspace. Export a review packet to a private location outside the repository.",
							},
							{
								icon: FolderOpen,
								title: "Use your own agent",
								text: "Give the packet and a private result path to the included ai-job-search skill. It drafts from supplied facts and requests a separate read-only review.",
							},
							{
								icon: FileCheck2,
								title: "Import and read",
								text: "Import the returned JSON. The app binds the report to the exact documents and inputs; it cannot verify the reviewer’s identity.",
							},
							{
								icon: ShieldCheck,
								title: "Make the final call",
								text: "Resolve actionable issues and acknowledge the current documents before saving a resume version or exporting the cover letter.",
							},
						].map((item) => (
							<article key={item.title}>
								<item.icon size={24} strokeWidth={1.5} aria-hidden="true" />
								<h3>{item.title}</h3>
								<p>{item.text}</p>
							</article>
						))}
					</div>
					<p className="m-section-footnote">
						Changing a source or draft invalidates its previous review. This handoff does not submit an application or
						contact an employer.
					</p>
				</div>
			</section>
			<section className="m-container m-storage-story">
				<div>
					<h2>
						A local place to work.
						<br />A private copy to keep.
					</h2>
					<p>
						Your browser profile holds the local workspace. Export backups in Settings and keep them somewhere private.
						Photos are temporary and are not part of a backup.
					</p>
				</div>
				<div>
					<p>
						There is no local account lock or CareerOS encryption. People using the same browser profile may access your
						information. Optional cloud resume copies require a separate, explicit action.
					</p>
					<MarketingLink href="/privacy" secondary>
						Understand your information
					</MarketingLink>
					<MarketingLink href="/app#settings" secondary>
						Open data settings
					</MarketingLink>
				</div>
			</section>
			<FAQ />
		</MarketingShell>
	);
}
