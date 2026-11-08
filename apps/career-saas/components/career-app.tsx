"use client";

import {
	ArrowRight,
	Camera,
	ChevronDown,
	Crown,
	Compass,
	FileText,
	Home,
	Laptop,
	Linkedin,
	Mail,
	Menu,
	Settings,
	X,
	Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { JobsView } from "@/features/jobs";
import { LinkedInView } from "@/features/linkedin";
import { OutreachView } from "@/features/outreach";
import { Overview } from "@/features/overview";
import { PhotoView } from "@/features/photo";
import { ResumesView } from "@/features/resumes";
import { RoleDiscoveryView } from "@/features/role-discovery";
import { SettingsView, PlansView } from "@/features/settings";
import { useWorkspace } from "@/lib/workspace-context";

const navigation = [
	{ id: "overview", name: "Overview", icon: Home },
	{ id: "discovery", name: "Role discovery", icon: Compass },
	{ id: "resumes", name: "Resumes", icon: FileText },
	{ id: "linkedin", name: "LinkedIn studio", icon: Linkedin },
	{ id: "photo", name: "Photo studio", icon: Camera },
	{ id: "jobs", name: "Job autopilot", icon: Zap },
	{ id: "outreach", name: "Recruiter outreach", icon: Mail },
];
const valid = new Set([...navigation.map((n) => n.id), "settings", "plans"]);

export function CareerApp() {
	const [page, setPage] = useState("overview");
	const [mobileOpen, setMobileOpen] = useState(false);
	const sidebarRef = useRef<HTMLElement>(null);
	const { data, ready } = useWorkspace();
	useEffect(() => {
		const sync = () => {
			const id = window.location.hash.slice(1);
			setPage(valid.has(id) ? id : "overview");
		};
		sync();
		window.addEventListener("hashchange", sync);
		return () => window.removeEventListener("hashchange", sync);
	}, []);
	useEffect(() => {
		if (!mobileOpen) return;
		const previous = document.activeElement as HTMLElement | null;
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
			previous?.focus();
		};
	}, [mobileOpen]);
	function go(id: string) {
		window.location.hash = id;
		setPage(id);
		setMobileOpen(false);
		window.scrollTo(0, 0);
	}
	const title = navigation.find((n) => n.id === page)?.name ?? (page === "plans" ? "Plans" : "Settings");
	const initials =
		data.profile.name
			.split(" ")
			.map((n) => n[0])
			.slice(0, 2)
			.join("") || "AM";
	return (
		<div className="app-shell">
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
				<a className="brand" href="#overview" onClick={() => go("overview")}>
					<span className="brand-mark">C</span>CareerOS
				</a>
				<div className="sidebar-label">Workspace</div>
				<nav aria-label="Workspace">
					{navigation.map((n) => (
						<a
							key={n.id}
							href={`#${n.id}`}
							onClick={() => go(n.id)}
							className={`nav-item ${page === n.id ? "active" : ""}`}
							aria-current={page === n.id ? "page" : undefined}
						>
							<n.icon size={19} strokeWidth={1.7} />
							{n.name}
						</a>
					))}
				</nav>
				<div className="sidebar-bottom">
					<div className="upgrade-panel">
						<div>
							<Crown size={20} />
							<strong>Make your next move</strong>
						</div>
						<p>Explore the plans behind your career workspace.</p>
						<button className="button primary" onClick={() => go("plans")}>
							Explore plans <ArrowRight size={15} />
						</button>
					</div>
					<a
						href="#settings"
						className={`nav-item ${page === "settings" ? "active" : ""}`}
						onClick={() => go("settings")}
					>
						<Settings size={19} />
						Settings
					</a>
					<button className="workspace-user" onClick={() => go("settings")}>
						<span className="avatar subtle">{initials}</span>
						<span>Demo workspace</span>
						<ChevronDown size={15} />
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
						<span className="demo-tag">
							<Laptop size={15} />
							Local demo
						</span>
						<button aria-label="Open account settings" className="avatar" onClick={() => go("settings")}>
							{initials}
						</button>
					</div>
				</header>
				<main className="main-content" id="main-content">
					{!ready ? (
						<div className="loading-state">Opening your workspace…</div>
					) : page === "overview" ? (
						<Overview navigate={go} />
					) : page === "resumes" ? (
						<ResumesView />
					) : page === "discovery" ? (
						<RoleDiscoveryView />
					) : page === "linkedin" ? (
						<LinkedInView />
					) : page === "photo" ? (
						<PhotoView />
					) : page === "jobs" ? (
						<JobsView />
					) : page === "outreach" ? (
						<OutreachView />
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
