import "@fontsource-variable/figtree";
import "@fontsource/instrument-serif/400.css";
import "./globals.css";
import "./workspace.css";
import "./marketing.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WorkspaceProvider } from "@/lib/workspace-context";

export const metadata: Metadata = {
	title: { default: "CareerOS | Resume and job-search workspace", template: "%s · CareerOS" },
	description:
		"Build resumes, review supplied LinkedIn writing, adjust a profile photo, and prepare applications and outreach from your own career facts.",
};

type RootLayoutProps = { children: ReactNode };

export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html lang="en">
			<body>
				<WorkspaceProvider>{children}</WorkspaceProvider>
			</body>
		</html>
	);
}
