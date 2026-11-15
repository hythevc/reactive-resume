import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { tools } from "./content";

export function ToolShowcase() {
	return (
		<nav className="m-tool-directory" aria-label="CareerOS tools">
			{tools.map((tool) => (
				<Link href={`/tools/${tool.slug}`} key={tool.slug}>
					<span>
						<strong>{tool.name}</strong>
						<span>{tool.output}</span>
					</span>
					<ArrowRight size={19} aria-hidden="true" />
				</Link>
			))}
		</nav>
	);
}
