import "@fontsource-variable/manrope";
import "@fontsource/instrument-serif/400.css";
import "./globals.css";
import type { Metadata } from "next";
import { WorkspaceProvider } from "@/lib/workspace-context";

export const metadata: Metadata = {
	title: "CareerOS — Your next chapter",
	description:
		"One career profile. Resumes, LinkedIn reviews, professional photos, application preparation, and recruiter outreach.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<WorkspaceProvider>{children}</WorkspaceProvider>
			</body>
		</html>
	);
}
