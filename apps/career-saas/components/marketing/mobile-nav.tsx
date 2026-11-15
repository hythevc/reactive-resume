"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

export function MobileMarketingNav() {
	const menu = useRef<HTMLDetailsElement>(null);
	function close() {
		if (menu.current) menu.current.open = false;
	}
	return (
		<details
			className="m-mobile-nav"
			ref={menu}
			onKeyDown={(event) => {
				if (event.key === "Escape" && menu.current?.open) {
					close();
					menu.current.querySelector("summary")?.focus();
				}
			}}
		>
			<summary>
				Menu
				<ChevronDown size={17} aria-hidden="true" />
			</summary>
			<nav aria-label="Mobile navigation">
				<Link onClick={close} href="/#tools">
					Tools
				</Link>
				<Link onClick={close} href="/how-it-works">
					How it works
				</Link>
				<Link onClick={close} href="/pricing">
					Pricing
				</Link>
				<Link onClick={close} href="/about">
					About CareerOS
				</Link>
				<Link onClick={close} href="/app">
					Open workspace
					<ArrowRight size={16} aria-hidden="true" />
				</Link>
			</nav>
		</details>
	);
}
