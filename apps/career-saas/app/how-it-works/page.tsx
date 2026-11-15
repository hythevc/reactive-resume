import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/components/marketing/home";
import { MarketingLink, MarketingShell } from "@/components/marketing/shell";

export const metadata: Metadata = {
	title: "How it works — From facts to reviewed documents",
	description:
		"Add your experience, save a role, review your documents and export. Learn about the optional agent handoff and local backups.",
};

export default function HowItWorksPage() {
	return (
		<MarketingShell>
			<section className="m-container m-page-intro">
				<h1>From career facts to reviewed documents.</h1>
				<p className="m-lead">
					Start with one resume and one saved role. The local tools work without an account or AI API key.
				</p>
				<MarketingLink href="/app#resumes">Start a resume</MarketingLink>
			</section>
			<section className="m-container m-route-layout">
				<div>
					<h2>Your first application</h2>
					<p>The workspace opens with fictional examples. Replace them with your own information.</p>
				</div>
				<ol className="m-step-list m-detailed-steps">
					<li>
						<h3>Add your career facts</h3>
						<p>
							Enter your experience, skills and education, or import supported Reactive Resume JSON. Keep the original
							file and review every imported field.
						</p>
						<Link href="/app#resumes" className="m-text-link">
							Open resume builder
						</Link>
					</li>
					<li>
						<h3>Save a real role</h3>
						<p>
							Paste a posting and its source link. Compare explicit terms, add notes and prepare editable resume and
							cover-letter drafts from your facts.
						</p>
						<Link href="/app#jobs" className="m-text-link">
							Open applications
						</Link>
					</li>
					<li>
						<h3>Review the documents yourself</h3>
						<p>
							Read and edit each draft. Check the company, role and experience, then acknowledge the current documents
							before saving a resume version or exporting a cover letter. A separate agent report is optional.
						</p>
					</li>
					<li>
						<h3>Export and record your next step</h3>
						<p>
							Use the resume’s print layout to save a PDF, or export supported JSON. Apply through the employer’s
							process and update the application stage yourself.
						</p>
					</li>
				</ol>
			</section>
			<section id="agent-review" className="m-container m-route-layout">
				<div>
					<h2>Optional agent review</h2>
					<p>Use your own agent session when you want a separate draft and review. The browser makes no model call.</p>
				</div>
				<details className="m-inline-disclosure">
					<summary>How the private review-packet handoff works</summary>
					<ol className="m-step-list">
						<li>
							<strong>Export a private packet.</strong> Select a saved role and draft source in Applications. Save the
							review packet to a private location outside the repository.
						</li>
						<li>
							<strong>Use your own configured agent.</strong> Give the packet and a private result path to the included
							ai-job-search skill. It drafts from supplied facts and requests a separate read-only review. Provider
							access and costs are separate.
						</li>
						<li>
							<strong>Import the returned JSON.</strong> The app binds the report to the exact documents and inputs. It
							cannot verify the reviewer’s identity.
						</li>
						<li>
							<strong>Read and acknowledge the documents.</strong> Resolve actionable issues before saving a resume
							version or exporting the cover letter. Changing a source or draft invalidates its previous review.
						</li>
					</ol>
					<p className="m-small-note">This handoff does not submit an application or contact an employer.</p>
				</details>
			</section>
			<section className="m-container m-route-layout">
				<div>
					<h2>Keep a private backup</h2>
				</div>
				<div className="m-route-copy">
					<p>
						Your browser profile holds the local workspace. Export a backup in Settings and keep it somewhere private.
						Photos are temporary and are not part of a backup.
					</p>
					<p>
						There is no local account lock or CareerOS encryption. People using the same browser profile may access your
						information. Optional cloud resume copies require a separate, explicit action.
					</p>
					<div className="m-inline-links">
						<MarketingLink href="/app#settings" secondary>
							Open data settings
						</MarketingLink>
						<MarketingLink href="/privacy" secondary>
							Read privacy details
						</MarketingLink>
					</div>
				</div>
			</section>
			<FAQ />
		</MarketingShell>
	);
}
