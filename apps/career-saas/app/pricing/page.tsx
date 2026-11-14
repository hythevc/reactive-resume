import type { Metadata } from "next";
import { ArrowRight, Check, Minus } from "lucide-react";
import Link from "next/link";
import { tools } from "@/components/marketing/content";
import { MarketingLink, MarketingShell } from "@/components/marketing/shell";

export const metadata: Metadata = {
	title: "Pricing — Free local workspace",
	description:
		"Use the current CareerOS local workspace for free, without a card or account. See the included tools and the services that are not connected.",
};

export default function PricingPage() {
	return (
		<MarketingShell>
			<section className="m-container m-page-hero m-centered-hero">
				<h1>
					A clear starting point.
					<br />
					No card required.
				</h1>
				<p className="m-lead">
					The local workspace is free to use. Bring your experience, make your edits and keep your own next steps
					organized.
				</p>
			</section>
			<section className="m-container m-pricing-layout">
				<div className="m-price-panel">
					<span className="m-section-label">Available today</span>
					<h2>Local workspace</h2>
					<p className="m-price-value">Free</p>
					<p>No trial countdown. No checkout.</p>
					<MarketingLink href="/app">Open your workspace</MarketingLink>
					<ul>
						<li>
							<Check size={18} aria-hidden="true" />
							All six preparation tools
						</li>
						<li>
							<Check size={18} aria-hidden="true" />
							Resume versions and live previews
						</li>
						<li>
							<Check size={18} aria-hidden="true" />
							Local drafts, saved roles and contact notes
						</li>
						<li>
							<Check size={18} aria-hidden="true" />
							Private backup export and restore
						</li>
						<li>
							<Check size={18} aria-hidden="true" />
							No account required for local use
						</li>
					</ul>
					<p className="m-price-note">Saved in this browser profile. Export a backup to keep a separate copy.</p>
				</div>
				<div className="m-pricing-tools">
					<h2>What you can work on</h2>
					{tools.map((tool) => (
						<Link href={`/tools/${tool.slug}`} key={tool.slug}>
							<div>
								<h3>{tool.name}</h3>
								<p>{tool.description}</p>
							</div>
							<ArrowRight size={19} aria-hidden="true" />
						</Link>
					))}
				</div>
			</section>
			<section className="m-container m-availability">
				<div>
					<h2>
						Clear about
						<br />
						what’s connected.
					</h2>
					<p>
						No paid checkout is active. Any plan choices inside the demo are demonstration state, not a purchase or
						server entitlement.
					</p>
				</div>
				<dl>
					<div>
						<dt>
							<Check size={19} aria-hidden="true" />
							Local preparation
						</dt>
						<dd>
							Resume editing, writing checks, photo adjustments, saved roles, draft preparation and manual outreach
							tools.
						</dd>
					</div>
					<div>
						<dt>
							<Check size={19} aria-hidden="true" />
							Manual agent handoff
						</dt>
						<dd>
							Export a private packet and use your own configured agent session. Its access and any provider costs are
							separate from this browser app.
						</dd>
					</div>
					<div>
						<dt>
							<Minus size={19} aria-hidden="true" />
							Optional account bridge
						</dt>
						<dd>
							Account access and explicit resume copies depend on an operator-configured Reactive Resume backend.
							Availability is shown in the workspace.
						</dd>
					</div>
					<div>
						<dt>
							<Minus size={19} aria-hidden="true" />
							Services not active
						</dt>
						<dd>
							AI text or headshot generation, live job feeds, automatic applications, contact verification, email
							delivery and payments.
						</dd>
					</div>
				</dl>
			</section>
			<section className="m-final-band">
				<div className="m-container">
					<h2>Start with your story.</h2>
					<MarketingLink href="/app#resumes">Build your resume</MarketingLink>
					<Link className="m-text-link" href="/how-it-works">
						See how it works
						<ArrowRight size={17} aria-hidden="true" />
					</Link>
				</div>
			</section>
		</MarketingShell>
	);
}
