import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { useIsClient } from "usehooks-ts";
import { Icon } from "@reactive-resume/ui/components/icon";
import { toast } from "@reactive-resume/ui/components/toast";
import { goToScene, SCENE } from "./scroll";
import { Sheet } from "./sheet";
import { CtaLink } from "./ui";
import { authClient } from "@/libs/auth/client";
import { sessionQueryKey } from "@/libs/root-context";

/** The four lines of the headline; the footer repeats them. Lines 2 and 4 are highlighted. */
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
	return (
		<section id="top" data-scene={SCENE.hero} aria-labelledby="hero-title" className="relative border-b border-line">
			<div className="mx-auto grid min-h-[min(900px,100svh)] max-w-[1440px] items-center gap-12 px-(--gutter) pt-28 pb-16 min-[900px]:grid-cols-[1.1fr_1fr] min-[900px]:gap-16 min-[900px]:pt-36 min-[900px]:pb-20">
				<div className="grid justify-items-start gap-7">
					<h1
						id="hero-title"
						className="max-w-[14ch] font-display text-[clamp(44px,5.2vw,76px)] leading-[1.03] font-normal tracking-[-0.025em] text-balance"
					>
						{headline[0]} <em className="text-accent-text">{headline[1]}</em> {headline[2]}{" "}
						<em className="text-accent-text">{headline[3]}</em>
					</h1>
					<p className="max-w-[42ch] text-base leading-7 text-pretty text-ink-2 sm:text-[18px]">
						{t`Build a professional resume, download it as PDF or Word, and manage your job search in one place. Free templates, no ads, no paywall.`}
					</p>
					<div className="grid justify-items-start gap-4">
						<CtaLink size="hero" />
						<GuestLink />
					</div>
					<nav aria-label={t`Story`} className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6">
						{[
							{ scene: SCENE.write, label: t`Write`, icon: "pencil-simple" },
							{ scene: SCENE.design, label: t`Design`, icon: "palette" },
							{ scene: SCENE.tailor, label: t`Tailor`, icon: "briefcase" },
						].map(({ scene, label, icon }) => (
							<button
								key={scene}
								type="button"
								onClick={() => goToScene(scene, 0.04)}
								className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-ink-2 transition-colors hover:text-accent-text"
							>
								<Icon name={icon as "pencil-simple" | "palette" | "briefcase"} size={18} />
								{label}
								<Icon name="arrow-up-right" size={14} />
							</button>
						))}
					</nav>
				</div>
				<div className="mx-auto w-full max-w-[510px] rounded-xl border border-line bg-surface p-4 shadow-e1 sm:p-6">
					<div className="mb-5 flex items-center justify-between gap-4 text-sm text-ink-2">
						<span className="flex items-center gap-2">
							<Icon name="file-text" size={18} />
							<Trans>Sample resume</Trans>
						</span>
						<span className="font-mono text-xs">PDF · DOCX</span>
					</div>
					<div className="relative mx-auto aspect-[612/792] w-full max-w-[380px] overflow-hidden rounded-sm bg-paper shadow-e2">
						<Sheet />
					</div>
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
			className="font-ui text-sm text-ink-2 underline underline-offset-3 transition-colors hover:text-ink disabled:opacity-60"
		>
			<Trans>Try it without an account</Trans>
		</button>
	);
}
