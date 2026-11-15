import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/shell";

export const metadata: Metadata = {
	title: "Your career information",
	description:
		"How the CareerOS local workspace handles browser storage, photos, backups, deletion and its optional cloud connection.",
};

export default function PrivacyPage() {
	return (
		<MarketingShell>
			<article className="m-container m-legal">
				<h1>Your career information</h1>
				<p>Updated November 9, 2026. This page describes the local workspace and its optional cloud connection.</p>
				<h2>Local workspace</h2>
				<p>
					Your profile, resume versions, LinkedIn drafts, saved jobs, contact notes, introductions and preferences are
					saved in this browser profile. There is no local account lock. Other people using this browser profile may
					access them. Local data is not encrypted by CareerOS.
				</p>
				<p>
					Photos are processed in your browser and are not included in workspace backups. Leaving the photo editor
					discards its image and adjustments.
				</p>
				<h2>Backups and deletion</h2>
				<p>
					Backups contain readable career information. Keep them in a private location. Settings lets you export,
					replace or reset the workspace and clear retained recovery data. Reset cannot remove previously downloaded
					files, clipboard contents or drafts opened in your email application.
				</p>
				<h2>Optional cloud account</h2>
				<p>
					The Cloud account screen shows whether an account service is available. Signing in does not automatically
					upload this local workspace. Saving a selected resume to the cloud requires a separate action. Account access
					and private documents are handled by the connected Reactive Resume service.
				</p>
				<p>
					Keep your original CV and confirm every field before sharing. Copying text places it on your clipboard;
					opening an email composer passes the selected recipient and message to your email application. The local
					workspace does not send recruiter emails or submit job applications.
				</p>
				<h2>Service availability</h2>
				<p>
					AI generation, automatic application submission, employer messaging, and payments are not active in this demo.
					A local score is a writing or keyword check, not a hiring prediction. Hosting receives normal web-request
					metadata. This page does not claim a commercial cloud launch or a retention policy for an unconfigured
					service.
				</p>
				<Link href="/app#settings" className="m-text-link">
					Open data settings
				</Link>
			</article>
		</MarketingShell>
	);
}
