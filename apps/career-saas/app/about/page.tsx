import { ArrowRight, FileText, Linkedin, Camera, Compass, Zap, Mail } from "lucide-react";
import Link from "next/link";
export default function AboutPage() {
	return (
		<div className="marketing-page">
			<header className="marketing-nav">
				<Link href="/" className="brand">
					<span className="brand-mark">C</span>CareerOS
				</Link>
				<nav>
					<a href="#workspace">The workspace</a>
					<a href="/#plans">Plans</a>
					<Link href="/" className="button primary">
						Open demo <ArrowRight size={16} />
					</Link>
				</nav>
			</header>
			<main>
				<section className="marketing-hero">
					<h1>
						One career profile.
						<br />
						<em>Every next step.</em>
					</h1>
					<p>
						Make your experience count. Build your resume, sharpen your profile, and bring your job search together in
						one thoughtful workspace.
					</p>
					<Link href="/" className="button primary">
						Find your next chapter <ArrowRight size={18} />
					</Link>
					<small>Explore the local demo. No account or payment required.</small>
					<div className="marketing-paper">
						<img src="/resume-sheets.png" alt="CareerOS resume templates" />
					</div>
				</section>
				<section className="marketing-workflows" id="workspace">
					<h2>
						A little less scattered.
						<br />A lot more you.
					</h2>
					<div>
						{[
							{
								icon: Compass,
								title: "Find work that feels like you.",
								text: "Capture what matters next, review one saved role at a time, and choose what goes into your introduction.",
							},
							{
								icon: FileText,
								title: "Tell your story.",
								text: "Create and tailor resumes with a live preview. Print a PDF or bring your Reactive Resume JSON.",
							},
							{
								icon: Linkedin,
								title: "Make a stronger introduction.",
								text: "Review your LinkedIn text with an explained writing checklist and edit your next draft.",
							},
							{
								icon: Camera,
								title: "Look like your next chapter.",
								text: "Crop and polish your own profile photo. Connected AI headshots are planned.",
							},
							{
								icon: Zap,
								title: "Give your search direction.",
								text: "Track roles, see skill matches, and prepare an application review queue.",
							},
							{
								icon: Mail,
								title: "Start the right conversation.",
								text: "Keep recruiter contacts, write personal outreach, and compose messages in your email app.",
							},
						].map((f) => (
							<article key={f.title}>
								<f.icon size={24} />
								<h3>{f.title}</h3>
								<p>{f.text}</p>
							</article>
						))}
					</div>
				</section>
				<section className="marketing-end">
					<h2>Your next move deserves a clear starting point.</h2>
					<p>Start with the tools that work locally today.</p>
					<Link href="/" className="button lime">
						Open your workspace <ArrowRight size={18} />
					</Link>
					<p className="small-print">
						Demo data stays in your browser. AI generation, cloud accounts, payments, email delivery, and automatic job
						submission require future service connections.
					</p>
				</section>
			</main>
			<footer>
				<Link href="/" className="brand">
					CareerOS
				</Link>
				<span>Built on Reactive Resume and the Next.js SaaS Starter.</span>
				<Link href="/">
					Open workspace <ArrowRight size={15} />
				</Link>
			</footer>
		</div>
	);
}
