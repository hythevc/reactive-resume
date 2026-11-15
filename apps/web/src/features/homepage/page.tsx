import { t } from "@lingui/core/macro";
import { ProductFeatures, TemplateProof, CompactCommunity, CompactClosing } from "./compact";
import { CompactFaq } from "./faq";
import { CompactLandingFooter } from "./footer";
import { CompactLandingHeader } from "./header";
import { Hero } from "./hero";

/**
 * The same compact, static product page is rendered live and in every localized build-time prerender.
 * Product evidence and working entry points remain readable without scroll choreography or JavaScript.
 */
export function Homepage() {
	return (
		<div className="landing compact-home relative isolate bg-bg font-ui text-ink">
			<a
				href="#main"
				className="fixed start-4 top-2.5 z-100 -translate-y-[160%] rounded-md bg-ink px-3.5 py-2.5 font-ui text-sm font-semibold text-bg transition-transform focus:translate-y-0"
			>
				{t`Skip to content`}
			</a>
			<CompactLandingHeader />
			<main id="main">
				<Hero />
				<ProductFeatures />
				<TemplateProof />
				<CompactFaq />
				<CompactCommunity />
				<CompactClosing />
			</main>
			<CompactLandingFooter />
		</div>
	);
}
