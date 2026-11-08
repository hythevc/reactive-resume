"use client";
import { ArrowRight, Camera, FileText, Linkedin, Mail, Plus } from "lucide-react";
import { useState } from "react";
import { useWorkspace } from "@/lib/workspace-context";

export function Overview({ navigate }: { navigate: (page: string) => void }) {
	const { data } = useWorkspace();
	const [filter, setFilter] = useState("All applications");
	const [displayDate] = useState(() =>
		new Intl.DateTimeFormat("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric",
		}).format(new Date()),
	);
	const inProgress = data.jobs.filter((j) => ["Applied", "Interview"].includes(j.status));
	const shown = (
		filter === "In progress"
			? inProgress
			: filter === "Saved"
				? data.jobs.filter((j) => j.status === "Saved")
				: data.jobs
	).slice(0, 3);
	return (
		<>
			<div className="overview-date">{displayDate}</div>
			<div className="overview-heading">
				<div>
					<h1>Your next chapter starts here.</h1>
					<p>One workspace. A more confident next move.</p>
				</div>
				<button className="button secondary goals-button" onClick={() => navigate("discovery")}>
					Set career goals <ArrowRight size={20} />
				</button>
			</div>
			<section className="story-banner">
				<div>
					<h2>Great opportunities start with a great story.</h2>
					<p>Build a resume that opens the right doors.</p>
					<button className="button lime" onClick={() => navigate("resumes")}>
						<Plus size={19} />
						Create a resume
					</button>
				</div>
				<img src="/resume-sheets.png" alt="Two clean resume templates" />
			</section>
			<section className="metrics" aria-label="Workspace summary">
				{[
					{ name: "Resumes", value: data.resumes.length },
					{ name: "Applications", value: data.jobs.length },
					{ name: "In progress", value: inProgress.length },
					{
						name: "Outreach drafts",
						value: data.contacts.filter((c) => c.status === "Draft").length,
					},
				].map((m) => (
					<div key={m.name}>
						<span>{m.name}</span>
						<strong>{m.value}</strong>
					</div>
				))}
			</section>
			<div className="overview-grid">
				<section className="panel pipeline">
					<div className="panel-header">
						<h2>Your job search, at a glance</h2>
						<button className="text-button" onClick={() => navigate("jobs")}>
							View all <ArrowRight size={17} />
						</button>
					</div>
					<div className="tabs">
						{["All applications", "In progress", "Saved"].map((t) => (
							<button key={t} onClick={() => setFilter(t)} className={`tab ${filter === t ? "active" : ""}`}>
								{t}
							</button>
						))}
					</div>
					<div className="table-wrap">
						<table className="data-table overview-table">
							<thead>
								<tr>
									<th>Company & role</th>
									<th>Status</th>
									<th>Added</th>
								</tr>
							</thead>
							<tbody>
								{shown.map((job) => (
									<tr key={job.id} onClick={() => navigate("jobs")}>
										<td>
											<button className="company-link" onClick={() => navigate("jobs")}>
												<span className="company-logo">{job.company[0]}</span>
												<span>
													<strong>{job.company}</strong>
													<small>{job.role}</small>
												</span>
											</button>
										</td>
										<td>
											<span className={`status ${job.status.toLowerCase()}`}>{job.status}</span>
										</td>
										<td className="muted">
											{new Intl.DateTimeFormat("en-US", {
												month: "short",
												day: "numeric",
											}).format(new Date(job.createdAt))}
										</td>
									</tr>
								))}
							</tbody>
						</table>
						{shown.length === 0 ? <div className="empty">No applications in this view yet.</div> : null}
					</div>
				</section>
				<section className="panel next-moves">
					<h2>Your next best move</h2>
					{[
						{
							icon: FileText,
							title: "Refine your resume",
							text: "Polish your experience, skills, and impact.",
							to: "resumes",
						},
						{
							icon: Linkedin,
							title: "Strengthen your LinkedIn",
							text: "Get an explained profile review and useful edits.",
							to: "linkedin",
						},
						{
							icon: Camera,
							title: "Refresh your profile photo",
							text: "Frame and polish your own professional photo.",
							to: "photo",
						},
					].map((item, i) => (
						<button className="next-move" key={item.to} onClick={() => navigate(item.to)}>
							<span className="step-number">{i + 1}</span>
							<span>
								<strong>{item.title}</strong>
								<small>{item.text}</small>
							</span>
							<ArrowRight size={18} />
						</button>
					))}
				</section>
			</div>
			<section className="quick-links">
				<h3>Made for your next move</h3>
				<div>
					{[
						{ icon: FileText, text: "Resume builder", page: "resumes" },
						{ icon: Linkedin, text: "Profile review", page: "linkedin" },
						{ icon: Mail, text: "Recruiter outreach", page: "outreach" },
					].map((l) => (
						<button key={l.page} onClick={() => navigate(l.page)}>
							<l.icon size={20} />
							<span>{l.text}</span>
							<ArrowRight size={17} />
						</button>
					))}
				</div>
			</section>
		</>
	);
}
