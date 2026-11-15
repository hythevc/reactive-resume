"use client";

import type { WorkspaceNavigationOptions } from "@/lib/workspace-navigation";
import type { ChangeEvent, MouseEvent } from "react";
import { ArrowRight, Bookmark, CalendarDays, ChevronRight, Clock3, FileText, MapPin, Upload } from "lucide-react";
import { useRef } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import { matchesApplicationStage, workspaceHash } from "@/lib/workspace-navigation";

type OverviewProps = {
	navigate: (page: string, options?: WorkspaceNavigationOptions) => void;
	importResume: (file: File) => void;
};

export function Overview({ navigate, importResume }: OverviewProps) {
	const { data } = useWorkspace();
	const importRef = useRef<HTMLInputElement>(null);
	const resume = [...data.resumes].sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0))[0];
	const recent = data.jobs.slice(0, 3);
	const sample = data.profile.email.toLowerCase().endsWith("@example.test");
	const summary = [
		{
			label: "Saved",
			stage: "Saved" as const,
			count: data.jobs.filter((job) => job.status === "Saved").length,
			icon: Bookmark,
		},
		{
			label: "In progress",
			stage: "In progress" as const,
			count: data.jobs.filter((job) => matchesApplicationStage(job.status, "In progress")).length,
			icon: Clock3,
		},
		{
			label: "Interview",
			stage: "Interview" as const,
			count: data.jobs.filter((job) => job.status === "Interview").length,
			icon: CalendarDays,
		},
	];
	function follow(event: MouseEvent<HTMLAnchorElement>, view: string, options?: WorkspaceNavigationOptions) {
		if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		navigate(view, options);
	}
	function chooseImport(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (file) importResume(file);
	}
	return (
		<div className="overview-view">
			<input
				ref={importRef}
				type="file"
				accept=".json,application/json"
				hidden
				onChange={chooseImport}
				aria-label="Import resume JSON"
			/>
			<header className="feature-heading overview-heading">
				<div>
					<h1>Your search</h1>
					<p>
						{data.jobs.length} recorded {data.jobs.length === 1 ? "role" : "roles"} · {data.resumes.length} resume{" "}
						{data.resumes.length === 1 ? "version" : "versions"}
					</p>
				</div>
				<a className="button secondary" href="#settings" onClick={(event) => follow(event, "settings")}>
					Edit career profile
				</a>
			</header>
			<nav className="overview-metrics" aria-label="Application stages">
				{summary.map(({ label, stage, count, icon: Icon }) => (
					<a
						className="overview-metric"
						href={workspaceHash("jobs", { stage })}
						onClick={(event) => follow(event, "jobs", { stage })}
						key={stage}
					>
						<Icon size={20} aria-hidden="true" />
						<span>{label}</span>
						<strong>{count}</strong>
						<ChevronRight size={16} aria-hidden="true" />
					</a>
				))}
			</nav>
			{sample ? (
				<p className="overview-sample-note">
					Example workspace. Replace the career profile with your details or import your resume before sharing
					documents.
				</p>
			) : null}
			<section className="panel overview-next" aria-labelledby="next-step-title">
				<div className="overview-next-title">
					<FileText size={24} aria-hidden="true" />
					<div>
						<h2 id="next-step-title">{resume ? "Continue your resume" : "Create your first resume"}</h2>
						<p>{resume?.title || "Start with your own experience and contact details."}</p>
					</div>
				</div>
				<div className="button-row">
					<a
						className="button primary"
						href={workspaceHash("resumes", { resumeId: resume?.id })}
						onClick={(event) => follow(event, "resumes", { resumeId: resume?.id })}
					>
						{resume ? "Open resume" : "Open resume builder"}
						<ArrowRight size={16} aria-hidden="true" />
					</a>
					<button className="button secondary" type="button" onClick={() => importRef.current?.click()}>
						<Upload size={16} aria-hidden="true" />
						Import JSON
					</button>
				</div>
			</section>
			<section className="overview-recent" aria-labelledby="recent-applications-title">
				<div className="panel-heading">
					<h2 id="recent-applications-title">Recent applications</h2>
					<a className="text-button" href="#jobs" onClick={(event) => follow(event, "jobs")}>
						View all applications
						<ArrowRight size={16} aria-hidden="true" />
					</a>
				</div>
				{recent.length ? (
					<table className="data-table overview-records">
						<thead>
							<tr>
								<th>Role</th>
								<th>Company / location</th>
								<th>Stage</th>
								<th>
									<span className="sr-only">Review application</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{recent.map((job) => (
								<tr key={job.id}>
									<td>
										<strong>{job.role || "Untitled role"}</strong>
									</td>
									<td>
										<span className="company-cell">
											<span className="company-logo" aria-hidden="true">
												{job.company[0] || "?"}
											</span>
											<span>
												<strong>{job.company || "Untitled company"}</strong>
												<span className="location-cell">
													<MapPin size={13} aria-hidden="true" />
													{job.location || "Location not set"}
												</span>
											</span>
										</span>
									</td>
									<td>
										<span className={`status ${job.status.toLowerCase()}`}>{job.status}</span>
									</td>
									<td>
										<a
											className="button secondary small"
											aria-label={`Review ${job.role} at ${job.company}`}
											href={workspaceHash("jobs", { jobId: job.id })}
											onClick={(event) => follow(event, "jobs", { jobId: job.id })}
										>
											Review
											<ArrowRight size={14} aria-hidden="true" />
										</a>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<div className="empty-state">
						<Bookmark size={24} aria-hidden="true" />
						<h3>No saved roles</h3>
						<p>Add a job to keep its posting, documents and next step together.</p>
						<a className="button secondary" href="#jobs" onClick={(event) => follow(event, "jobs")}>
							Open applications
						</a>
					</div>
				)}
			</section>
		</div>
	);
}
