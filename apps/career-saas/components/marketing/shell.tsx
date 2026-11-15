import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MobileMarketingNav } from "./mobile-nav";

export function MarketingLink({
	href,
	children,
	secondary = false,
}: {
	href: string;
	children: ReactNode;
	secondary?: boolean;
}) {
	return (
		<Link href={href} className={secondary ? "m-text-link" : "m-button"}>
			{children}
			<ArrowRight size={18} aria-hidden="true" />
		</Link>
	);
}

export function MarketingShell({ children }: { children: ReactNode }) {
	return (
		<div className="marketing-site">
			<a className="m-skip" href="#marketing-main">
				Skip to content
			</a>
			<header className="m-header m-container">
				<Link href="/" className="m-brand" aria-label="CareerOS home">
					<span className="m-brand-mark" aria-hidden="true">
						C
					</span>
					<span translate="no">CareerOS</span>
				</Link>
				<nav className="m-desktop-nav" aria-label="Main navigation">
					<Link href="/#tools">Tools</Link>
					<Link href="/how-it-works">How it works</Link>
					<Link href="/pricing">Pricing</Link>
					<MarketingLink href="/app">Open workspace</MarketingLink>
				</nav>
				<MobileMarketingNav />
			</header>
			<main id="marketing-main" tabIndex={-1}>
				{children}
			</main>
			<footer className="m-footer">
				<div className="m-container m-footer-compact">
					<Link href="/" className="m-brand">
						<span className="m-brand-mark" aria-hidden="true">
							C
						</span>
						<span translate="no">CareerOS</span>
					</Link>
					<nav aria-label="Footer navigation">
						<Link href="/#tools">Tools</Link>
						<Link href="/how-it-works">How it works</Link>
						<Link href="/pricing">Pricing</Link>
						<Link href="/privacy">Privacy</Link>
						<Link href="/about">About</Link>
					</nav>
				</div>
				<div className="m-container m-footer-bottom">
					<span>Built on Reactive Resume and the Next.js SaaS Starter.</span>
					<span>Free local workspace. Review before sharing.</span>
				</div>
			</footer>
		</div>
	);
}
