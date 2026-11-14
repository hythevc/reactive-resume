import "@fontsource-variable/figtree";
import "@fontsource/instrument-serif/400.css";
import "./globals.css";
import "./marketing.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WorkspaceProvider } from "@/lib/workspace-context";

export const metadata: Metadata = {
	title: { default: "CareerOS — Your next move, in one place.", template: "%s · CareerOS" },
	description:
		"One career profile. Resumes, LinkedIn reviews, professional photos, application preparation, and recruiter outreach.",
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
