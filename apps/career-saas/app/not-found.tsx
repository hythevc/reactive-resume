import { Compass } from "lucide-react";
import { MarketingLink, MarketingShell } from "@/components/marketing/shell";

export default function NotFound() {
	return (
		<MarketingShell>
			<section className="m-container m-not-found">
				<Compass size={40} strokeWidth={1.3} aria-hidden="true" />
				<p className="m-section-label">404 / Page not found</p>
				<h1>
					Let’s find your
					<br />
					next starting point.
				</h1>
				<p>This page isn’t here. Your workspace is a good place to pick up where you left off.</p>
				<div>
					<MarketingLink href="/app">Open your workspace</MarketingLink>
					<MarketingLink href="/" secondary>
						Back to CareerOS
					</MarketingLink>
				</div>
			</section>
		</MarketingShell>
	);
}
