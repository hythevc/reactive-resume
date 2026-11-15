import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { useIsClient } from "usehooks-ts";
import { Icon } from "@reactive-resume/ui/components/icon";
import { toast } from "@reactive-resume/ui/components/toast";
import { CtaLink } from "./ui";
import { templates } from "@/dialogs/resume/template/data";
import { authClient } from "@/libs/auth/client";
import { sessionQueryKey } from "@/libs/root-context";

/** The localized promise keeps its four catalog phrases; each layout chooses their wrapping. */
export const getHeadline = () =>
	[
		t({
			message: "A free, open-source",
			comment: "Hero headline, line 1 of 4: A free, open-source / resume builder / and / career manager.",
		}),
		t({
			message: "resume builder",
			comment:
				"Hero headline, line 2 of 4: A free, open-source / resume builder / and / career manager. Lines 2 and 4 are highlighted: keep each a complete phrase.",
		}),
		t({
			message: "and",
			context: "hero headline",
			comment: "Hero headline, line 3 of 4: A free, open-source / resume builder / and / career manager.",
		}),
		t({
			message: "career manager.",
			comment:
				"Hero headline, line 4 of 4: A free, open-source / resume builder / and / career manager. Lines 2 and 4 are highlighted: keep each a complete phrase.",
		}),
	] as const;

/** The public promise and a rendered sample resume are visible before JavaScript or scroll motion. */
export function Hero() {
	const headline = getHeadline();
	const name = templates.onyx.name;
	return (
		<section id="top" aria-labelledby="hero-title" className="relative border-b border-line">
			<div className="home-container grid items-center gap-10 pt-12 pb-14 min-[900px]:grid-cols-[1.15fr_1fr] min-[900px]:gap-16 min-[900px]:py-16">
				<div className="grid justify-items-start gap-7">
					<h1
						id="hero-title"
						className="max-w-[18ch] font-ui text-[40px] leading-[1.04] font-semibold tracking-[-0.035em] text-balance min-[640px]:text-[clamp(48px,4.5vw,64px)]"
					>
						{headline[0]} {headline[1]} {headline[2]} {headline[3]}
					</h1>
					<p className="max-w-[42ch] text-base leading-7 text-pretty text-ink-2 sm:text-[18px]">
						{t`Build a professional resume, download it as PDF or Word, and manage your job search in one place. Free templates, no ads, no paywall.`}
					</p>
					<div className="grid justify-items-start gap-2">
						<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
							<CtaLink size="hero" />
							<Link to="/resume-templates" className="home-text-link">
								{t`Templates`} <Icon name="arrow-right" size={18} />
							</Link>
						</div>
						<GuestLink />
					</div>
					<nav aria-label={t`Features`} className="flex w-full flex-wrap gap-x-6 border-t border-line pt-3">
						{[
							{ id: "write", label: t`Write` },
							{ id: "design", label: t`Design` },
							{ id: "tailor", label: t`Tailor` },
						].map(({ id, label }) => (
							<a
								key={id}
								href={`#${id}`}
								className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-ink-2 transition-colors hover:text-accent-text"
							>
								{label}
								<Icon name="arrow-down" size={14} />
							</a>
						))}
					</nav>
				</div>
				<div className="mx-auto w-full max-w-[480px] rounded-lg border border-line bg-surface p-4 sm:p-5">
					<div className="mb-5 flex items-center justify-between gap-4 text-sm text-ink-2">
						<span className="flex items-center gap-2">
							<Icon name="file-text" size={18} />
							<Trans>Sample resume</Trans>
						</span>
						<span className="font-mono text-xs">PDF · DOCX</span>
					</div>
					<a
						href="/templates/pdf/onyx.pdf"
						aria-label={t`Preview ${name} sample PDF`}
						className="relative mx-auto block w-full max-w-[360px] rounded-sm bg-paper shadow-e1"
					>
						<img
							src="/templates/thumb/onyx.webp"
							srcSet="/templates/thumb/onyx-small.webp 300w, /templates/thumb/onyx.webp 596w"
							sizes="(min-width: 900px) 360px, calc(100vw - 72px)"
							alt={t`${name} resume template preview`}
							width={298}
							height={421}
							fetchPriority="high"
							decoding="async"
							className="aspect-[298/421] w-full rounded-sm object-contain"
						/>
					</a>
				</div>
			</div>
		</section>
	);
}

/**
 * "Try it without an account", under the hero's call to action, where the server allows guests: a guest session opens
 * Documents, and signing up later keeps the work. The build's prerendered page has no route to read flags from, so
 * the link appears once the live page has loaded.
 */
function GuestLink() {
	return useIsClient() ? <GuestLinkButton /> : null;
}

function GuestLinkButton() {
	const { flags, session } = useRouteContext({ strict: false });
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [pending, setPending] = useState(false);
	if (!flags?.allowGuestLogin || session) return null;

	const failed = (message?: string) => {
		setPending(false);
		toast.add({ type: "error", description: message || t`Couldn't continue as a guest. Try again.` });
	};
	const start = async () => {
		setPending(true);
		try {
			const { error } = await authClient.signIn.anonymous();
			if (error) return failed(error.message);
			await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
			void navigate({ to: "/dashboard" });
		} catch {
			failed();
		}
	};

	return (
		<button
			type="button"
			disabled={pending}
			onClick={() => void start()}
			className="inline-flex min-h-11 items-center rounded-sm font-ui text-sm text-ink-2 underline underline-offset-3 transition-colors hover:text-ink disabled:opacity-60"
		>
			<Trans>Try it without an account</Trans>
		</button>
	);
}
