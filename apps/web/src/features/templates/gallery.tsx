import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Link } from "@tanstack/react-router";
import { templateLayouts, templateSchema } from "@reactive-resume/schema/templates";
import { cn } from "@reactive-resume/utils/style";
import { templates } from "@/dialogs/resume/template/data";
import { CtaLink, labelClass } from "@/features/homepage/ui";

const linkClass =
	"inline-flex min-h-11 items-center rounded-sm text-accent-text underline underline-offset-4 transition-colors hover:text-accent-hover";

/** A public comparison of actual document layouts, with account-aware template selection. */
export function TemplateGallery() {
	const { i18n } = useLingui();
	const count = i18n.number(templateSchema.options.length);

	return (
		<div className="relative bg-bg font-ui text-ink">
			<main id="main-content" className="home-container py-12 sm:py-14">
				<div>
					<div className="relative max-w-3xl">
						<h1 className="font-ui text-[40px] leading-[1.04] font-semibold tracking-[-.035em] text-balance sm:text-[clamp(48px,4.5vw,64px)]">
							{t`${count} free resume templates. Find your fit.`}
						</h1>
						<p className="mt-5 max-w-2xl text-base leading-7 text-pretty text-ink-2">
							{t`Compare real resume layouts before you sign up. Every template is free to customize, with PDF and Word downloads and no watermark.`}
						</p>

						<div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
							<CtaLink size="hero" />
							<a
								href="https://docs.rxresu.me/guides/choosing-a-template"
								className={cn(linkClass, "inline-flex min-h-11 items-center")}
							>
								{t`How to choose a template`}
							</a>
						</div>
						<p className="mt-3 text-sm text-ink-3">
							{t`Pick a template below to start with it, or choose later in Design. Switch layouts anytime without rewriting your content.`}
						</p>
					</div>

					{/* Two side by side even on phones, so the page compares layouts; the description and the sample PDF link
					    join from sm up. */}
					<div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-3">
						{templateSchema.options.map((id, index) => {
							const template = templates[id];
							const name = template.name;
							const layout = templateLayouts[id];
							return (
								<article key={id} id={id} className="scroll-mt-24">
									<a
										href={`/templates/pdf/${id}.pdf`}
										aria-label={t`Preview ${name} sample PDF`}
										className="mx-auto block w-full max-w-74.5 rounded-sm focus-visible:outline-offset-4"
									>
										<img
											src={`/templates/thumb/${id}.webp`}
											srcSet={`/templates/thumb/${id}-small.webp 300w, /templates/thumb/${id}.webp 596w`}
											sizes="(min-width: 640px) 298px, 45vw"
											alt={t`${name} resume template preview`}
											width={298}
											height={420}
											// The first row is on the first screen, and the first preview is its largest paint.
											loading={index < 3 ? "eager" : "lazy"}
											fetchPriority={index === 0 ? "high" : "auto"}
											decoding="async"
											className="aspect-[298/420] w-full rounded-sm border border-line bg-paper object-contain shadow-e1"
										/>
									</a>
									<h2 className="mt-4 font-ui text-lg leading-tight font-semibold sm:text-[22px]">{name}</h2>
									<p className={cn(labelClass, "mt-1 text-ink-3")}>
										{layout.columns === 1 ? t`One column` : t`Two columns`}
									</p>
									<p className="mt-3 hidden text-[15px] leading-6 text-pretty text-ink-2 sm:block">
										{i18n._(template.description)}
									</p>
									<div className="mt-2 flex flex-wrap items-center gap-x-5">
										{/* Signed out, through sign-up; signed in, straight to a blank resume in this template. */}
										<Link
											to="/auth/register"
											search={{ callbackURL: `/dashboard?new=resume&template=${id}` }}
											className={cn(linkClass, "inline-flex min-h-11 items-center text-sm font-semibold")}
											aria-label={t`Use the ${name} template`}
										>
											{t`Use this template`}
										</Link>
										<a
											href={`/templates/pdf/${id}.pdf`}
											download={`${name}-resume-example.pdf`}
											className={cn(linkClass, "hidden min-h-11 items-center text-sm font-semibold sm:inline-flex")}
											aria-label={t`Download ${name} sample PDF`}
										>
											{t`Download sample PDF`}
										</a>
									</div>
								</article>
							);
						})}
					</div>

					<section aria-labelledby="layout-advice" className="mt-12 max-w-3xl border-t border-line pt-7">
						<h2 id="layout-advice" className="text-lg font-semibold">
							{t`One column or two?`}
						</h2>
						<p className="mt-3 text-[15px] leading-7 text-pretty text-ink-2">
							{t`One-column templates give hiring software a simple top-to-bottom reading order. Two-column templates put supporting details in a sidebar and leave more room for visual hierarchy. Choose for your content, then check the exported PDF.`}
						</p>
						<p className="mt-2 text-sm text-ink-3">
							<Link to="/ats-checker" className={linkClass}>
								{t`Check your resume’s ATS readability`}
							</Link>{" "}
							{t`Readability does not guarantee an interview or a particular ATS result.`}
						</p>
					</section>
					<section
						className="mt-10 flex flex-col items-start gap-5 border-t border-line pt-8"
						aria-labelledby="make-it-yours"
					>
						<h2 id="make-it-yours" className="home-title">
							{t`Make it yours, then take it with you.`}
						</h2>
						<p className="max-w-[58ch] text-base leading-7 text-pretty text-ink-2">
							{t`Adjust fonts, colors, spacing and sections in the resume builder. Export your finished resume to PDF or Word, or share a link. The PDFs above are examples to help you compare designs.`}
						</p>
						<CtaLink size="closing" />
					</section>
				</div>
			</main>
		</div>
	);
}
