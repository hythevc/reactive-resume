import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Link } from "@tanstack/react-router";
import { templateSchema } from "@reactive-resume/schema/templates";
import { Icon } from "@reactive-resume/ui/components/icon";
import { supportedLocales } from "@reactive-resume/utils/locale";
import { LanguageIndex } from "./sections";
import { CtaLink } from "./ui";
import { templates } from "@/dialogs/resume/template/data";

/** An ordinary product directory: complete capabilities, no simulated interactive workspace. */
export function ProductFeatures() {
	const { i18n } = useLingui();
	const templateCount = i18n.number(templateSchema.options.length);
	const features = [
		{
			id: "write",
			title: t`Write`,
			description: t`Write beside a live page. It saves as you type and keeps every version. Ask the assistant for a sharper line: it suggests, you decide.`,
		},
		{
			id: "design",
			title: t`Design`,
			description: t`Pick from ${templateCount} templates, then set the type, color and spacing. The words stay put, so try as many looks as you like.`,
		},
		{
			id: "check",
			title: t`Check`,
			description: t`Check reads your resume the way hiring software does and explains what to fix in plain words. It runs in your browser, so the file stays with you: 0 uploads.`,
		},
		{
			id: "tailor",
			title: t`Tailor`,
			description: t`Paste a job posting once. It feeds a tailored copy of your resume, a fit check against each requirement, a cover letter draft and a place to track the role.`,
		},
		{
			id: "share",
			title: t`Share`,
			description: t`Share a public link, add a password or keep it private. Choose from 3 visibility options. Export to PDF or Word, or take all your data with you as JSON.`,
		},
		{
			id: "prepare",
			title: t`Prepare`,
			description: t`Get a plan for the interview, built from the posting and your own stories. Practice out loud, then write down how it went.`,
		},
		{
			id: "remember",
			title: t`Remember`,
			description: t`Write a story once, with the facts behind it, and the coach uses it in 3 places. Switch a fact off and nothing leans on it.`,
		},
	];
	return (
		<section aria-labelledby="features-title" className="home-section">
			<div className="home-container grid gap-7 min-[900px]:grid-cols-[1fr_2fr] min-[900px]:gap-16">
				<div>
					<h2 id="features-title" className="home-title">{t`Features`}</h2>
					<Link to="/ats-checker" className="home-text-link mt-4">
						{t`Check any PDF, no account needed`}
						<Icon name="arrow-right" size={18} />
					</Link>
				</div>
				<div className="border-t border-line">
					{features.map((feature) => (
						<article
							key={feature.id}
							id={feature.id}
							className="grid scroll-mt-24 gap-2 border-b border-line py-5 sm:grid-cols-[100px_1fr] sm:gap-7"
						>
							<h3 className="text-lg leading-7 font-semibold">{feature.title}</h3>
							<p className="max-w-[58ch] text-[15px] leading-7 text-ink-2">{feature.description}</p>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}

/** The actual repository's template thumbnails and sample PDFs, rather than decorative document cards. */
export function TemplateProof() {
	return (
		<section id="templates" aria-labelledby="templates-title" className="home-section border-t border-line bg-surface">
			<div className="home-container">
				<div className="flex flex-wrap items-end justify-between gap-5">
					<div className="max-w-[66ch]">
						<h2 id="templates-title" className="home-title">{t`Templates`}</h2>
						<p className="mt-4 text-base leading-7 text-ink-2">{t`Compare real resume layouts before you sign up. Every template is free to customize, with PDF and Word downloads and no watermark.`}</p>
					</div>
					<Link to="/resume-templates" className="home-text-link">
						{t`Templates`}
						<Icon name="arrow-right" size={18} />
					</Link>
				</div>
				<div className="mt-8 grid grid-cols-3 gap-3 sm:gap-8">
					{templateSchema.options.slice(0, 3).map((id) => {
						const name = templates[id].name;
						return (
							<figure key={id} className="min-w-0">
								<a
									href={`/templates/pdf/${id}.pdf`}
									aria-label={t`Preview ${name} sample PDF`}
									className="block rounded-sm focus-visible:outline-offset-4"
								>
									<img
										src={`/templates/thumb/${id}.webp`}
										srcSet={`/templates/thumb/${id}-small.webp 300w, /templates/thumb/${id}.webp 596w`}
										sizes="(min-width: 1200px) 360px, 30vw"
										alt={t`${name} resume template preview`}
										width={298}
										height={421}
										loading="lazy"
										className="aspect-[298/421] w-full rounded-sm border border-line bg-paper object-cover"
									/>
								</a>
								<figcaption className="mt-3 flex min-h-11 flex-wrap items-center justify-between gap-2 text-sm font-semibold">
									{name}
									<span className="font-mono text-xs font-normal text-ink-2">PDF</span>
								</figcaption>
							</figure>
						);
					})}
				</div>
			</div>
		</section>
	);
}

export function CompactCommunity() {
	const { i18n } = useLingui();
	const languageCount = i18n.number(supportedLocales.length);
	return (
		<section id="support" aria-labelledby="support-title" className="home-section border-t border-line">
			<div className="home-container grid gap-10 min-[900px]:grid-cols-2 min-[900px]:gap-20">
				<div>
					<h2 id="support-title" className="home-title">{t`Support`}</h2>
					<p className="mt-4 max-w-[55ch] text-[15px] leading-7 text-ink-2">{t`Reactive Resume is open source under the MIT License. Amruth Pillai and a community of contributors keep it running, and donations pay for hosting and development. There’s no paid tier.`}</p>
					<div className="mt-4 flex flex-wrap gap-x-6">
						<a href="https://github.com/sponsors/AmruthPillai" className="home-text-link">
							GitHub Sponsors
							<Icon name="arrow-up-right" size={16} />
						</a>
						<a href="https://opencollective.com/reactive-resume/donate" className="home-text-link">
							Open Collective
							<Icon name="arrow-up-right" size={16} />
						</a>
					</div>
					<a href="https://discord.gg/jSVSJyWd2k" className="home-text-link mt-2">
						{t`Join the Discord community`}
						<Icon name="arrow-up-right" size={16} />
					</a>
				</div>
				<div id="languages" className="scroll-mt-24">
					<h2 id="languages-title" className="home-title">{t`Speaks your language`}</h2>
					<p className="mt-4 text-[15px] leading-7 text-ink-2">{t`Translated into ${languageCount} languages.`}</p>
					<details className="home-language-index mt-3 border-y border-line">
						<summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-sm text-sm font-semibold">
							{t`Change language`}
							<Icon name="caret-down" size={16} />
						</summary>
						<div className="pb-5">
							<LanguageIndex />
						</div>
					</details>
					<a href="https://crowdin.com/project/reactive-resume" className="home-text-link mt-3">
						{t`Help translate it into yours.`}
						<Icon name="arrow-up-right" size={16} />
					</a>
				</div>
			</div>
		</section>
	);
}

export function CompactClosing() {
	return (
		<section aria-labelledby="closing-title" className="border-t border-line bg-accent-soft">
			<div className="home-container grid gap-7 py-10 min-[900px]:grid-cols-[1fr_auto] min-[900px]:items-center">
				<div>
					<h2 id="closing-title" className="home-title">{t`Get started`}</h2>
					<p className="mt-3 max-w-[58ch] text-base leading-7 text-ink-2">{t`Start from scratch or import what you have. It takes a few minutes, and you can come back to it anytime.`}</p>
				</div>
				<CtaLink size="closing" className="justify-self-start" />
				<div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line pt-5 min-[900px]:col-span-2">
					<p className="me-auto text-sm text-ink-2">{t`Also on mobile`}</p>
					<a href="https://go.rx.cv/ios" className="home-text-link">
						{t`Download on the`} App Store
						<Icon name="arrow-up-right" size={16} />
					</a>
					<a href="https://go.rx.cv/android" className="home-text-link">
						{t`Get it on`} Google Play
						<Icon name="arrow-up-right" size={16} />
					</a>
				</div>
			</div>
		</section>
	);
}
