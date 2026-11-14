import type { Metadata } from "next";
import { LegacyWorkspaceRedirect } from "@/components/legacy-workspace-redirect";
import { HomePage } from "@/components/marketing/home";

export const metadata: Metadata = {
	title: { absolute: "CareerOS — Your next move, in one place" },
	description:
		"Build your resume, review your LinkedIn writing, prepare applications and organize your job search in a free local workspace.",
};

export default function Page() {
	return (
		<>
			<LegacyWorkspaceRedirect />
			<HomePage />
		</>
	);
}
