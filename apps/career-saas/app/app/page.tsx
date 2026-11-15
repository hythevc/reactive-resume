import type { Metadata } from "next";
import { CareerApp } from "@/components/career-app";

export const metadata: Metadata = {
	title: "Workspace",
	robots: { index: false, follow: false },
};

export default function WorkspacePage() {
	return <CareerApp />;
}
