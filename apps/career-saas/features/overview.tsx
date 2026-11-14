"use client";

import { ArrowRight, Bookmark, CalendarDays, ChevronRight, Clock3, FileText, MapPin, Pencil } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";

export function Overview({ navigate }: { navigate: (page: string, jobId?: string) => void }) {
	const { data } = useWorkspace();
	const resume = data.resumes[0];
	const recent = data.jobs.slice(0, 3);
	const sample = data.profile.email.toLowerCase().endsWith("@example.test");
	const summary = [
		{ label: "Saved", count: data.jobs.filter((job) => job.status === "Saved").length, icon: Bookmark },
		{
			label: "In progress",
			count: data.jobs.filter((job) => ["Draft", "Applied"].includes(job.status)).length,
			icon: Clock3,
		},
		{ label: "Interview", count: data.jobs.filter((job) => job.status === "Interview").length, icon: CalendarDays },
	];
	return (
		<div className="overview-view">
			<header className="overview-heading">
				<div>
					<h1>
						A little progress,
						<br />a clearer next move.
					</h1>
					<p>Pick up where you left off, or start with your career facts.</p>
				</div>
				<a className="text-button" href="#settings" onClick={() => navigate("settings")}>
					Edit career profile <Pencil size={17} aria-hidden="true" />
				</a>
			</header>
			<div className="overview-start-grid">
				<section className="panel next-step-panel" aria-labelledby="next-step-title">
					<h2 id="next-step-title" className="editorial-title">
						Your next step
					</h2>
					<div className="next-step-content">
						<div className="resume-miniature" aria-hidden="true">
							<strong>{resume?.profile.name || "Your name"}</strong>
							<span>{resume?.profile.role || "Your professional title"}</span>
							<i />
							<small>Profile</small>
							<p>{resume?.profile.summary || "Your story starts with your experience."}</p>
							<small>Experience</small>
							<p className="miniature-experience">
								{resume?.profile.experience || "Add your roles, responsibilities and accomplishments."}
							</p>
						</div>
						<div className="next-step-copy">
							<h3>{resume ? "Make this resume yours" : "Start with your story"}</h3>
							<p>Review your experience and contact details before sharing.</p>
							<a className="button primary" href="#resumes" onClick={() => navigate("resumes")}>
								<FileText size={18} aria-hidden="true" />
								{resume ? "Open resume" : "Create a resume"}
							</a>
							<a className="text-button" href="#resumes" onClick={() => navigate("resumes")}>
								Import a resume instead
							</a>
						</div>
					</div>
				</section>
				<section className="panel search-summary" aria-labelledby="search-summary-title">
					<h2 id="search-summary-title" className="editorial-title">
						Your search
					</h2>
					{summary.map(({ label, count, icon: Icon }) => (
						<a href="#jobs" onClick={() => navigate("jobs")} className="search-summary-row" key={label}>
							<span className="summary-icon">
								<Icon size={23} strokeWidth={1.6} aria-hidden="true" />
							</span>
							<span>{label}</span>
							<strong>{count}</strong>
							<ChevronRight size={17} aria-hidden="true" />
						</a>
					))}
					<p className="summary-footnote">
						{sample
							? "Example workspace · replace the sample facts with yours."
							: `${data.resumes.length} resume${data.resumes.length === 1 ? "" : "s"} · ${data.contacts.length} contact${data.contacts.length === 1 ? "" : "s"} in this workspace.`}
					</p>
				</section>
			</div>
			<section className="panel recent-applications" aria-labelledby="recent-applications-title">
				<div className="panel-heading">
					<h2 id="recent-applications-title" className="editorial-title">
						Recent applications
					</h2>
					<a className="text-button" href="#jobs" onClick={() => navigate("jobs")}>
						View all applications <ArrowRight size={18} aria-hidden="true" />
					</a>
				</div>
				{recent.length ? (
					<table className="data-table recent-table">
						<thead>
							<tr>
								<th>Company</th>
								<th>Role</th>
								<th>Location</th>
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
										<span className="company-cell">
											<span className="company-logo" aria-hidden="true">
												{job.company[0] || "?"}
											</span>
											<strong>{job.company || "Untitled company"}</strong>
										</span>
									</td>
									<td>{job.role || "Untitled role"}</td>
									<td>
										<span className="location-cell">
											<MapPin size={15} aria-hidden="true" />
											{job.location || "Location not set"}
										</span>
									</td>
									<td>
										<span className={`status ${job.status.toLowerCase()}`}>{job.status}</span>
									</td>
									<td>
										<button
											className="button secondary small"
											aria-label={`Review ${job.role} at ${job.company}`}
											onClick={() => navigate("jobs", job.id)}
										>
											Review
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<div className="empty">
						<Bookmark size={28} aria-hidden="true" />
						<h3>Make room for your next opportunity.</h3>
						<p className="muted">Save a job to keep its details and your next steps together.</p>
						<a className="button primary" href="#jobs" onClick={() => navigate("jobs")}>
							Save your first job <ArrowRight size={16} aria-hidden="true" />
						</a>
					</div>
				)}
			</section>
		</div>
	);
}
