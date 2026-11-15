import { t } from "@lingui/core/macro";
import { Link } from "@tanstack/react-router";
import { AtsChecker } from "./checker";

type AtsCheckerPageProps = { signedIn: boolean; importPending: boolean };

/**
 * The /ats-checker page, which the build also prerenders (features/homepage/prerender.tsx). The checker's first screen
 * is light, and PDF.js and the analysis engine load only once a file is chosen, so it renders without a loading state.
 */
export function AtsCheckerPage({ signedIn, importPending }: AtsCheckerPageProps) {
	return (
		<div className="relative bg-bg font-ui text-ink">
			<main id="main-content" className="relative">
				<AtsChecker signedIn={signedIn} importPending={importPending} />
				<p className="mx-auto max-w-3xl px-6 pb-12 text-center text-ink-2">
					<Link
						to="/resume-templates"
						className="inline-flex min-h-11 items-center rounded-sm text-accent-text underline underline-offset-4"
					>
						{t`Browse free resume templates and sample PDFs`}
					</Link>
				</p>
			</main>
		</div>
	);
}
