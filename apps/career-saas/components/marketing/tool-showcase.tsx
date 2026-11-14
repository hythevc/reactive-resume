"use client";

import { ArrowUpRight, ClipboardList, Compass, FileText, Linkedin, Send, UserRound } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type ReactNode, type KeyboardEvent } from "react";

const icons = [FileText, Linkedin, UserRound, Compass, ClipboardList, Send];
export type ShowcaseItem = { slug: string; name: string; description: string; preview: ReactNode };

export function ToolShowcase({ items }: { items: ShowcaseItem[] }) {
	const [selected, setSelected] = useState(0);
	const tabs = useRef<(HTMLButtonElement | null)[]>([]);
	function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
		let next: number;
		if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % items.length;
		else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index + items.length - 1) % items.length;
		else if (event.key === "Home") next = 0;
		else if (event.key === "End") next = items.length - 1;
		else return;
		event.preventDefault();
		setSelected(next);
		tabs.current[next]?.focus();
	}
	return (
		<div className="m-showcase">
			<div className="m-tool-tabs" role="tablist" aria-label="CareerOS tools" aria-orientation="vertical">
				{items.map((item, index) => {
					const Icon = icons[index];
					return (
						<button
							key={item.slug}
							ref={(node) => {
								tabs.current[index] = node;
							}}
							type="button"
							role="tab"
							id={`tool-tab-${item.slug}`}
							aria-controls={`tool-panel-${item.slug}`}
							aria-selected={selected === index}
							tabIndex={selected === index ? 0 : -1}
							onClick={() => setSelected(index)}
							onKeyDown={(event) => onKeyDown(event, index)}
						>
							<Icon size={25} strokeWidth={1.6} aria-hidden="true" />
							<span>
								<strong>{item.name}</strong>
								<span>{item.description}</span>
							</span>
						</button>
					);
				})}
			</div>
			<div className="m-tool-panels">
				{items.map((item, index) => (
					<div
						key={item.slug}
						role="tabpanel"
						id={`tool-panel-${item.slug}`}
						aria-labelledby={`tool-tab-${item.slug}`}
						tabIndex={0}
						hidden={selected !== index}
					>
						<div className="m-showcase-artifact">{item.preview}</div>
						<Link href={`/tools/${item.slug}`} className="m-showcase-detail">
							Explore {item.name.toLowerCase()}
							<ArrowUpRight size={17} aria-hidden="true" />
						</Link>
					</div>
				))}
			</div>
		</div>
	);
}
