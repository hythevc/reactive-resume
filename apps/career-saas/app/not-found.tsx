import { MarketingLink, MarketingShell } from "@/components/marketing/shell";

export default function NotFound() {
	return (
		<MarketingShell>
			<section className="m-container m-not-found">
				<p className="m-error-code">404</p>
				<h1>Page not found.</h1>
				<p>Check the address or return to your workspace.</p>
				<div className="m-hero-actions">
					<MarketingLink href="/app">Open workspace</MarketingLink>
					<MarketingLink href="/" secondary>
						Back to CareerOS
					</MarketingLink>
				</div>
			</section>
		</MarketingShell>
	);
}
