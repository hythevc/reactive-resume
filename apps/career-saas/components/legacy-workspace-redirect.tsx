"use client";

import { useEffect } from "react";
import { legacyWorkspacePath } from "@/lib/workspace-navigation";

export function LegacyWorkspaceRedirect() {
	useEffect(() => {
		const redirect = () => {
			const target = legacyWorkspacePath(window.location.hash, window.location.search);
			if (target) window.location.replace(target);
		};
		redirect();
		window.addEventListener("hashchange", redirect);
		return () => window.removeEventListener("hashchange", redirect);
	}, []);
	return null;
}
