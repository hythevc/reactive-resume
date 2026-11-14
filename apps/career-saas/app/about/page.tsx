import Link from "next/link";
import { ArrowRight } from "lucide-react";

const workflows = [
	{ title: "Keep a resume for each opportunity", body: "Edit your career facts, compare them with a saved posting and keep a separate resume version for each application.", href: "/#resumes", action: "Open resumes" },
	{ title: "Track applications and interviews", body: "Save roles, record interviews and review the documents you plan to send. Pick up from your most recent application.", href: "/#jobs", action: "Open applications" },
	{ title: "Prepare for the conversation", body: "Review your LinkedIn text, crop a profile photo and prepare recruiter messages you can check before sharing.", href: "/#outreach", action: "Open recruiter outreach" },
];

export default function AboutPage() {
	return (
		<div className="career-marketing">
			<header className="career-marketing-nav">
				<Link className="brand" href="/about"><span className="brand-mark" aria-hidden>C</span>CareerOS</Link>
				<nav aria-label="Website"><a href="#workflows">Workflows</a><Link href="/privacy">Your data</Link></nav>
				<Link className="button primary" href="/#overview">Open workspace <ArrowRight size={17} aria-hidden /></Link>
			</header>
			<main>
				<section className="career-marketing-hero">
					<div>
						<h1>Give every application a place.</h1>
						<p>Keep your resumes, saved roles and interview notes together from the first posting to the final decision.</p>
						<Link className="button primary" href="/#overview">Open workspace <ArrowRight size={17} aria-hidden /></Link>
						<small>The workspace saves in this browser. <Link href="/privacy">Read about your data</Link></small>
					</div>
					<figure>
						<img src="/resume-sheets.png" alt="Two sample CareerOS resume layouts" width={720} height={480} />
						<figcaption>Sample resume layouts</figcaption>
					</figure>
				</section>
				<section className="career-marketing-workflows" id="workflows">
					<h2>Work through your job search</h2>
					<ul>{workflows.map(({ title, body, href, action }) => (
						<li key={href}><h3>{title}</h3><p>{body}</p><Link href={href}>{action} <ArrowRight size={16} aria-hidden /></Link></li>
					))}</ul>
				</section>
			</main>
			<footer className="career-marketing-footer"><strong>CareerOS</strong><Link href="/privacy">Your career information</Link><Link href="/#plans">Plans</Link></footer>
		</div>
	);
}
