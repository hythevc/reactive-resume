"use client";

import type { WorkspaceLocation, WorkspaceNavigationOptions } from "@/lib/workspace-navigation";
import type { MouseEvent } from "react";
import {
	BriefcaseBusiness,
	Camera,
	Cloud,
	Compass,
	FileText,
	Home,
	Info,
	Laptop,
	Linkedin,
	Mail,
	Menu,
	Settings,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CloudView } from "@/features/cloud";
import { JobsView } from "@/features/jobs";
import { LinkedInView } from "@/features/linkedin";
import { OutreachView } from "@/features/outreach";
import { Overview } from "@/features/overview";
import { PhotoView } from "@/features/photo";
import { ResumesView } from "@/features/resumes";
import { RoleDiscoveryView } from "@/features/role-discovery";
import { SettingsView, PlansView } from "@/features/settings";
import { useWorkspace } from "@/lib/workspace-context";
import { readWorkspaceLocation, workspaceHash } from "@/lib/workspace-navigation";

const navigation = [
	{ id: "overview", name: "Overview", icon: Home },
	{ id: "discovery", name: "Role discovery", icon: Compass },
	{ id: "resumes", name: "Resumes", icon: FileText },
	{ id: "linkedin", name: "LinkedIn review", icon: Linkedin },
	{ id: "photo", name: "Profile photo", icon: Camera },
	{ id: "jobs", name: "Applications", icon: BriefcaseBusiness },
	{ id: "outreach", name: "Recruiter outreach", icon: Mail },
];
const utilities = [
	{ id: "settings", name: "Settings", icon: Settings },
	{ id: "cloud", name: "Cloud account", icon: Cloud },
	{ id: "plans", name: "Plan preview", icon: FileText },
];

export function CareerApp() {
	const [location, setLocation] = useState<WorkspaceLocation>({ view: "overview", stage: "All" });
	const page = location.view;
	const [mobileOpen, setMobileOpen] = useState(false);
	const [pendingResumeImport, setPendingResumeImport] = useState<File | null>(null);
	const sidebarRef = useRef<HTMLElement>(null);
	const mainRef = useRef<HTMLElement>(null);
	const { data, ready, persistenceStatus } = useWorkspace();
	useEffect(() => {
		const sync = () => {
			setLocation(readWorkspaceLocation(window.location.hash));
		};
		sync();
		window.addEventListener("hashchange", sync);
		return () => window.removeEventListener("hashchange", sync);
	}, []);
	useEffect(() => {
		const phoneViewport = window.matchMedia("(max-width: 760px)");
		const closeOnDesktop = (event: MediaQueryListEvent) => {
			if (!event.matches) setMobileOpen(false);
		};
		phoneViewport.addEventListener("change", closeOnDesktop);
		return () => phoneViewport.removeEventListener("change", closeOnDesktop);
	}, []);
	useEffect(() => {
		if (!mobileOpen) return;
		const previous = document.activeElement as HTMLElement | null;
		const main = mainRef.current;
		const overflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const elements = () =>
			Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
		elements()[0]?.focus();
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setMobileOpen(false);
			if (event.key !== "Tab") return;
			const items = elements();
			const first = items[0];
			const last = items[items.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last?.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first?.focus();
			}
		};
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = overflow;
			if (previous?.getClientRects().length) previous.focus({ preventScroll: true });
			else main?.focus({ preventScroll: true });
		};
	}, [mobileOpen]);
	function updateLocation(id: string, options: WorkspaceNavigationOptions = {}) {
		const hash = workspaceHash(id, options);
		window.location.hash = hash;
		setLocation(readWorkspaceLocation(hash));
	}
	function go(id: string, options?: WorkspaceNavigationOptions) {
		updateLocation(id, options);
		setMobileOpen(false);
		window.scrollTo(0, 0);
		requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }));
	}
	function follow(event: MouseEvent<HTMLAnchorElement>, id: string) {
		if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		go(id);
	}
	function importResume(file: File) {
		setPendingResumeImport(file);
		go("resumes");
	}
	const title = [...navigation, ...utilities].find((item) => item.id === page)?.name ?? "Overview";
	const initials =
		data.profile.name
			.split(" ")
			.map((n) => n[0])
			.slice(0, 2)
			.join("") || "AM";
	return (
		<div className="app-shell">
			<a
				className="skip-link"
				href="#main-content"
				onClick={(event) => {
					event.preventDefault();
					mainRef.current?.focus();
				}}
			>
				Skip to content
			</a>
			{mobileOpen ? (
				<button aria-label="Close navigation" className="nav-backdrop" onClick={() => setMobileOpen(false)} />
			) : null}
			<aside
				ref={sidebarRef}
				id="career-navigation"
				className={`sidebar ${mobileOpen ? "is-open" : ""}`}
				role={mobileOpen ? "dialog" : undefined}
				aria-modal={mobileOpen || undefined}
				aria-label="Career workspace navigation"
			>
				<div className="sidebar-brand-row">
					<a className="brand" href="#overview" onClick={(event) => follow(event, "overview")}>
						<span className="brand-mark">C</span>CareerOS
					</a>
					<button
						className="icon-button mobile-nav-close"
						aria-label="Close navigation"
						onClick={() => setMobileOpen(false)}
					>
						<X size={20} aria-hidden="true" />
					</button>
				</div>
				<div className="sidebar-label">Workspace</div>
				<nav aria-label="Workspace">
					{navigation.map((n) => (
						<a
							key={n.id}
							href={`#${n.id}`}
							onClick={(event) => follow(event, n.id)}
							className={`nav-item ${page === n.id ? "active" : ""}`}
							aria-current={page === n.id ? "page" : undefined}
						>
							<n.icon size={19} strokeWidth={1.7} />
							{n.name}
						</a>
					))}
				</nav>
				<div className="sidebar-bottom">
					<nav className="sidebar-secondary" aria-label="Settings and account">
						{utilities.map((item) => (
							<a
								key={item.id}
								href={`#${item.id}`}
								className={`nav-item ${page === item.id ? "active" : ""}`}
								aria-current={page === item.id ? "page" : undefined}
								onClick={(event) => follow(event, item.id)}
							>
								<item.icon size={18} aria-hidden="true" />
								{item.name}
							</a>
						))}
					</nav>
					<button className="workspace-user" onClick={() => go("settings")}>
						<span className="avatar subtle">{initials}</span>
						<span>{data.profile.name || "Your workspace"}</span>
					</button>
					<div className="device-note">
						<Laptop size={15} />
						Stored on this device
					</div>
				</div>
			</aside>
			<div className="app-main" inert={mobileOpen}>
				<header className="topbar">
					<div className="breadcrumb">
						<button
							className="icon-button mobile-menu"
							aria-label="Open navigation"
							aria-expanded={mobileOpen}
							aria-controls="career-navigation"
							onClick={() => setMobileOpen(true)}
						>
							{mobileOpen ? <X size={20} /> : <Menu size={20} />}
						</button>
						<strong>Workspace</strong>
						<span>/</span>
						<span>{title}</span>
					</div>
					<div className="topbar-right">
						<details className="workspace-info">
							<summary
								className="demo-tag"
								aria-label={`Local workspace information: ${persistenceStatus === "saved" ? "saved on this device" : persistenceStatus === "saving" ? "saving" : "storage needs attention"}`}
							>
								<Info size={16} aria-hidden="true" />
								<span>
									{persistenceStatus === "saved"
										? "Saved on this device"
										: persistenceStatus === "saving"
											? "Saving…"
											: "Storage needs attention"}
								</span>
							</summary>
							<div className="workspace-info-panel">
								<strong>Your local workspace</strong>
								<p>
									People using this browser profile can access its data. Keep a private backup in Settings. Cloud saving
									is a separate action.
								</p>
								<a className="text-button" href="/privacy">
									Your information
								</a>
							</div>
						</details>
						<button aria-label="Open account settings" className="avatar" onClick={() => go("settings")}>
							{initials}
						</button>
					</div>
				</header>
				<main ref={mainRef} tabIndex={-1} className="main-content" id="main-content">
					{!ready ? (
						<div className="loading-state">Opening your workspace…</div>
					) : page === "overview" ? (
						<Overview navigate={go} importResume={importResume} />
					) : page === "resumes" ? (
						<ResumesView
							pendingImport={pendingResumeImport}
							onImportConsumed={() => setPendingResumeImport(null)}
							initialResumeId={location.resumeId}
						/>
					) : page === "discovery" ? (
						<RoleDiscoveryView />
					) : page === "linkedin" ? (
						<LinkedInView />
					) : page === "photo" ? (
						<PhotoView />
					) : page === "jobs" ? (
						<JobsView
							initialJobId={location.jobId}
							initialStage={location.stage}
							onLocationChange={(options) => updateLocation("jobs", options)}
						/>
					) : page === "outreach" ? (
						<OutreachView />
					) : page === "cloud" ? (
						<CloudView />
					) : page === "plans" ? (
						<PlansView />
					) : (
						<SettingsView />
					)}
				</main>
			</div>
		</div>
	);
}
