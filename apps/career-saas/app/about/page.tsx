import type { Metadata } from "next";
import { ArrowRight, FileText, Hand, NotebookPen } from "lucide-react";
import Link from "next/link";
import { MarketingLink, MarketingShell } from "@/components/marketing/shell";

export const metadata: Metadata = {
	title: "About — A more thoughtful job search",
	description:
		"Why CareerOS brings your career facts, documents and next steps together, with clear control over what you share.",
};

export default function AboutPage() {
	return (
		<MarketingShell>
			<section className="m-container m-page-hero m-about-hero">
				<div>
					<p className="m-section-label">About CareerOS</p>
					<h1>
						A clearer desk for
						<br />
						your next chapter.
					</h1>
					<p className="m-lead">
						A job search asks you to tell your story in a dozen different places. CareerOS brings the preparation back
						to one thoughtful workspace.
					</p>
					<MarketingLink href="/app">Explore the workspace</MarketingLink>
				</div>
				<div className="m-about-note">
					<NotebookPen size={36} strokeWidth={1.3} aria-hidden="true" />
					<h2>
						Good preparation starts
						<br />
						with your own story.
					</h2>
					<p>Your experience is the source. Your documents are editable. Your next step stays in your hands.</p>
				</div>
			</section>
			<section className="m-container m-about-principles">
				<div>
					<span className="m-section-label">What guides the workspace</span>
					<h2>
						Clarity before
						<br />
						more activity.
					</h2>
				</div>
				<div>
					<article>
						<FileText size={23} aria-hidden="true" />
						<div>
							<h3>One set of facts, room for different stories.</h3>
							<p>
								Keep a shared career profile and separate resume versions. Tailor the emphasis for a role without
								inventing experience.
							</p>
						</div>
					</article>
					<article>
						<NotebookPen size={23} aria-hidden="true" />
						<div>
							<h3>Preparation you can inspect.</h3>
							<p>
								See the text behind a check, the reason behind a saved role and the exact documents behind an imported
								review.
							</p>
						</div>
					</article>
					<article>
						<Hand size={23} aria-hidden="true" />
						<div>
							<h3>Your judgment has the final word.</h3>
							<p>
								Choose your edits, review what you share and record your own application stages. No automatic
								applications or recruiter messages.
							</p>
						</div>
					</article>
				</div>
			</section>
			<section className="m-about-foundation">
				<div className="m-container">
					<h2>
						An open foundation.
						<br />A practical starting point.
					</h2>
					<div>
						<p>
							CareerOS is a standalone career workspace within Reactive Resume, built from the Next.js SaaS Starter. The
							local tools work without an account. An optional account connection is separate and depends on a
							configured Reactive Resume service.
						</p>
						<p>
							The current product focuses on local preparation. Live job feeds, connected AI generation, payment and
							message delivery are not active.
						</p>
						<div className="m-inline-links">
							<Link href="https://github.com/hythevc/reactive-resume">
								Explore the repository
								<ArrowRight size={16} aria-hidden="true" />
							</Link>
							<Link href="/how-it-works">
								How it works
								<ArrowRight size={16} aria-hidden="true" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</MarketingShell>
	);
}
