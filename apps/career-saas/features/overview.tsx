"use client";

import { ArrowRight, Compass, FileText, Mail } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";

type OverviewProps = { navigate: (page: string, jobId?: string) => void };

export function Overview({ navigate }: OverviewProps) {
	const { data } = useWorkspace();
	const recent = [...data.jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
	const active = data.jobs.filter(({ status }) => status === "Applied" || status === "Interview").length;
	const tasks = [
		{ name: "Edit a resume", description: "Review your versions and tailor a copy.", page: "resumes", icon: FileText },
		{ name: "Review saved roles", description: "Shortlist roles that fit your career brief.", page: "discovery", icon: Compass },
		{ name: "Draft recruiter outreach", description: "Review a message before copying it.", page: "outreach", icon: Mail },
	];
	return (
		<div className="workspace-overview">
			<header className="overview-intro">
				<div>
					<h1>Your job search</h1>
					<p>{data.jobs.length} tracked {data.jobs.length === 1 ? "role" : "roles"} · {active} in progress</p>
				</div>
				<a className="button primary" href="#jobs" onClick={() => navigate("jobs")}>
					Open applications <ArrowRight size={17} aria-hidden />
				</a>
			</header>
			<div className="overview-columns">
				<section className="overview-section" aria-labelledby="recent-jobs">
					<h2 id="recent-jobs">Recent applications</h2>
					{recent.length ? (
						<ul className="workspace-list">
							{recent.map((job) => (
								<li key={job.id}>
									<a href={`#jobs?job=${encodeURIComponent(job.id)}`} onClick={() => navigate("jobs", job.id)}>
										<span><strong>{job.role}</strong><small>{job.company}</small></span>
										<span className={`status ${job.status.toLowerCase()}`}>{job.status === "Draft" ? "Prepare" : job.status}</span>
										<ArrowRight size={16} aria-hidden />
									</a>
								</li>
							))}
						</ul>
					) : <p className="muted">Save a role in Applications to start tracking it here.</p>}
				</section>
				<section className="overview-section" aria-labelledby="preparation-tools">
					<h2 id="preparation-tools">Preparation tools</h2>
					<ul className="workspace-list">
						{tasks.map(({ name, description, page, icon: Icon }) => (
							<li key={page}>
								<a href={`#${page}`} onClick={() => navigate(page)}>
									<Icon size={18} aria-hidden />
									<span><strong>{name}</strong><small>{description}</small></span>
									<ArrowRight size={16} aria-hidden />
								</a>
							</li>
						))}
					</ul>
				</section>
			</div>
		</div>
	);
}
