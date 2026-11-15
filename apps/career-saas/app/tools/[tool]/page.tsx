import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
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
			<figure className="m-tool-resume-preview">
				<ResumePreview />
				<figcaption>Fictional example · read-only document preview</figcaption>
			</figure>
		),
		linkedin: <LinkedInPreview />,
		photo: <PhotoPreview />,
		applications: <JobsPreview />,
		outreach: <OutreachPreview />,
		"role-discovery": <BriefPreview />,
	};
	return (
		<MarketingShell>
			<section className={`m-container m-tool-hero m-tool-${tool.slug}`}>
				<div>
					<nav className="m-breadcrumb" aria-label="Breadcrumb">
						<Link href="/#tools">Tools</Link>
						<span aria-hidden="true">/</span>
						<span>{tool.name}</span>
					</nav>
					<h1>{tool.title}</h1>
					<p className="m-lead">{tool.description}</p>
					<MarketingLink href={`/app#${tool.hash}`}>{tool.action}</MarketingLink>
					<p className="m-small-note">Free local workspace. No account required.</p>
				</div>
				{previews[tool.slug]}
			</section>
			<section className="m-container m-tool-details">
				<div>
					<h2>How it works</h2>
					<p>{tool.intro}</p>
					<ol className="m-step-list">
						{tool.steps.map((step) => (
							<li key={step}>{step}</li>
						))}
					</ol>
				</div>
				<div>
					<h2>What you can do</h2>
					<ul className="m-included-list">
						{tool.includes.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</div>
			</section>
			<section className="m-container m-tool-boundary">
				<h2>Before you start</h2>
				<div>
					<p>{tool.limit}</p>
					<Link href="/privacy" className="m-text-link">
						How your information is handled
						<ArrowRight size={17} aria-hidden="true" />
					</Link>
				</div>
			</section>
			<section className="m-container m-page-action">
				<div>
					<h2>{tool.closing}</h2>
					<p>{tool.output}</p>
				</div>
				<MarketingLink href={`/app#${tool.hash}`}>{tool.action}</MarketingLink>
			</section>
			<section className="m-container m-other-tools">
				<h2>Other tools</h2>
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
		</MarketingShell>
	);
}
