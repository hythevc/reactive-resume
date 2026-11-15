import type { Metadata } from "next";
import Link from "next/link";
import { tools } from "@/components/marketing/content";
import { MarketingLink, MarketingShell } from "@/components/marketing/shell";

export const metadata: Metadata = {
	title: "Pricing — Free local workspace",
	description:
		"The current CareerOS local workspace is free, without a card or account. See the included tools and service availability.",
};

export default function PricingPage() {
	return (
		<MarketingShell>
			<section className="m-container m-page-intro">
				<h1>A free local workspace.</h1>
				<p className="m-lead">All six preparation tools. No account, card or trial countdown.</p>
			</section>
			<section className="m-container m-price-layout">
				<div className="m-price-panel">
					<h2>Local workspace</h2>
					<p className="m-price">Free</p>
					<p>Available today in your browser.</p>
					<MarketingLink href="/app">Open workspace</MarketingLink>
					<ul className="m-included-list">
						<li>All six career preparation tools</li>
						<li>Independent resume versions and live previews</li>
						<li>Saved roles, editable drafts and contact notes</li>
						<li>Private backup export and restore</li>
					</ul>
					<p className="m-small-note">Saved in this browser profile. Export a separate backup to keep your own copy.</p>
				</div>
				<div className="m-pricing-tools">
					<h2>Included tools</h2>
					<nav aria-label="Included career tools">
						{tools.map((tool) => (
							<Link href={`/tools/${tool.slug}`} key={tool.slug}>
								<strong>{tool.name}</strong>
								<span>{tool.output}</span>
							</Link>
						))}
					</nav>
				</div>
			</section>
			<section className="m-container m-route-layout">
				<div>
					<h2>Service availability</h2>
					<p>
						No paid checkout is active. Plan choices inside the demo are demonstration state, not a purchase or server
						entitlement.
					</p>
				</div>
				<dl className="m-fact-list">
					<div>
						<dt>Local preparation — available</dt>
						<dd>
							Resume editing, writing checks, photo adjustments, saved roles, draft preparation and manual outreach
							tools.
						</dd>
					</div>
					<div>
						<dt>Agent review — optional</dt>
						<dd>
							Export a private packet to your own configured agent session. Its access and any provider costs are
							separate from this browser app.
						</dd>
					</div>
					<div>
						<dt>Account bridge — configuration required</dt>
						<dd>
							Account access and explicit resume copies depend on an operator-configured Reactive Resume backend.
							Availability is shown in the workspace.
						</dd>
					</div>
					<div>
						<dt>Services not active</dt>
						<dd>
							AI text or headshot generation, live job feeds, automatic applications, contact verification, email
							delivery and payments.
						</dd>
					</div>
				</dl>
			</section>
			<section className="m-container m-page-action">
				<div>
					<h2>Build your first resume.</h2>
					<p>Start with the facts you want an employer to see.</p>
				</div>
				<MarketingLink href="/app#resumes">Start a resume</MarketingLink>
			</section>
		</MarketingShell>
	);
}
