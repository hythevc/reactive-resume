import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLink, MarketingShell } from "@/components/marketing/shell";

export const metadata: Metadata = {
	title: "About CareerOS",
	description: "A local workspace connecting your career facts, resume versions, saved roles and application records.",
};

export default function AboutPage() {
	return (
		<MarketingShell>
			<section className="m-container m-page-intro">
				<h1>Your facts. Your documents. Your next step.</h1>
				<p className="m-lead">
					CareerOS connects the preparation behind a job search: a shared career profile, role-specific documents and a
					record of what happens next.
				</p>
				<div className="m-hero-actions">
					<MarketingLink href="/app">Open workspace</MarketingLink>
					<MarketingLink href="/how-it-works" secondary>
						See the workflow
					</MarketingLink>
				</div>
			</section>
			<section className="m-container m-route-layout">
				<div>
					<h2>How the workspace is built</h2>
					<p>Start with experience you can support. Choose how to present it for each opportunity.</p>
				</div>
				<dl className="m-fact-list">
					<div>
						<dt>One factual source</dt>
						<dd>
							Keep a shared career profile and separate resume versions. Change the emphasis for a role while preserving
							the original facts.
						</dd>
					</div>
					<div>
						<dt>Preparation you can inspect</dt>
						<dd>
							See the text behind a writing check, the source behind a saved role and the exact documents behind an
							imported review.
						</dd>
					</div>
					<div>
						<dt>Your final decision</dt>
						<dd>
							Edit and review before sharing. Apply through the employer’s process and record the stages yourself.
							CareerOS does not automatically submit applications or send recruiter messages.
						</dd>
					</div>
				</dl>
			</section>
			<section className="m-container m-route-layout">
				<div>
					<h2>Open foundation, local tools</h2>
				</div>
				<div className="m-route-copy">
					<p>
						CareerOS is a standalone career workspace within Reactive Resume, built from the Next.js SaaS Starter. The
						local tools work without an account. An optional account connection is separate and depends on a configured
						Reactive Resume service.
					</p>
					<p>
						The current product focuses on local preparation. Live job feeds, connected AI generation, payment and
						message delivery are not active.
					</p>
					<Link className="m-text-link" href="https://github.com/hythevc/reactive-resume">
						Explore the repository
					</Link>
					<Link className="m-text-link" href="/privacy">
						How your information is handled
					</Link>
				</div>
			</section>
		</MarketingShell>
	);
}
