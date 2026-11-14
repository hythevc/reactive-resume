import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tools } from "@/components/marketing/content";
import {
	BriefPreview,
	JobsPreview,
	LinkedInPreview,
	OutreachPreview,
	PhotoPreview,
	ResumePreview,
} from "@/components/marketing/previews";
import { MarketingLink, MarketingShell } from "@/components/marketing/shell";

type Props = { params: Promise<{ tool: string }> };
export function generateStaticParams() {
	return tools.map((tool) => ({ tool: tool.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { tool: slug } = await params;
	const tool = tools.find((item) => item.slug === slug);
	if (!tool) notFound();
	return { title: tool.name, description: tool.description };
}

export default async function ToolPage({ params }: Props) {
	const { tool: slug } = await params;
	const tool = tools.find((item) => item.slug === slug);
	if (!tool) notFound();
	const previews = {
		resume: (
			<div className="m-tool-resume-preview">
				<ResumePreview />
				<span className="m-example-label">Fictional example</span>
			</div>
		),
		linkedin: <LinkedInPreview />,
		photo: <PhotoPreview />,
		applications: <JobsPreview />,
		outreach: <OutreachPreview />,
		"role-discovery": <BriefPreview />,
	};
	return (
		<MarketingShell>
			<section className={`m-container m-page-hero m-tool-hero m-tool-${tool.slug}`}>
				<div>
					<Link href="/#tools" className="m-breadcrumb">
						The tools / {tool.name}
					</Link>
					<h1>{tool.title}</h1>
					<p className="m-lead">{tool.description}</p>
					<MarketingLink href={`/app#${tool.hash}`}>{tool.action}</MarketingLink>
					<p className="m-hero-note">Free local workspace. No account required.</p>
				</div>
				<div>{previews[tool.slug]}</div>
			</section>
			<section className="m-container m-tool-explanation">
				<div>
					<h2>
						A useful place
						<br />
						to begin.
					</h2>
					<p>{tool.intro}</p>
				</div>
				<ol>
					{tool.steps.map((step, index) => (
						<li key={step}>
							<span>0{index + 1}</span>
							<p>{step}</p>
						</li>
					))}
				</ol>
			</section>
			<section className="m-tool-included-band">
				<div className="m-container m-tool-included">
					<div>
						<span className="m-section-label">In your workspace</span>
						<h2>
							The details that
							<br />
							help you move.
						</h2>
					</div>
					<ul>
						{tool.includes.map((item) => (
							<li key={item}>
								<Check size={20} aria-hidden="true" />
								{item}
							</li>
						))}
					</ul>
				</div>
			</section>
			<section className="m-container m-tool-boundary">
				<h2>
					Know what
					<br />
					you’re working with.
				</h2>
				<div>
					<p>{tool.limit}</p>
					<Link href="/privacy" className="m-text-link">
						How your information is handled
						<ArrowRight size={17} aria-hidden="true" />
					</Link>
				</div>
			</section>
			<section className="m-container m-other-tools">
				<h2>The rest of your workspace</h2>
				<nav aria-label="Other career tools">
					{tools
						.filter((item) => item.slug !== tool.slug)
						.map((item) => (
							<Link key={item.slug} href={`/tools/${item.slug}`}>
								{item.name}
								<ArrowRight size={17} aria-hidden="true" />
							</Link>
						))}
				</nav>
			</section>
			<section className="m-final-band">
				<div className="m-container">
					<h2>
						Your next step,
						<br />
						in your own words.
					</h2>
					<MarketingLink href={`/app#${tool.hash}`}>{tool.action}</MarketingLink>
				</div>
			</section>
		</MarketingShell>
	);
}
