import { Link, Outlet } from "@tanstack/react-router";
import { BrandIcon } from "@reactive-resume/ui/components/brand-icon";
import { LandingBackground } from "@/features/homepage/background";

/** The homepage's desk (grain and window light, without its scroll scenes) with the logomark leading back home. */
export function AuthLayout() {
	return (
		<div className="relative isolate min-h-svh">
			<LandingBackground />

			<div className="relative mx-auto flex min-h-svh w-full max-w-[460px] flex-col justify-center gap-y-7 px-4 py-10">
				<Link to="/" className="self-center rounded-md p-1 transition-opacity hover:opacity-80">
					{/* The visible image's alt text, "Reactive Resume", names the link. */}
					<BrandIcon variant="icon" className="size-10 [view-transition-name:auth-brand]" />
				</Link>

				<div className="grid gap-6 rounded-2xl border border-line bg-surface p-6 shadow-e1 sm:p-8">
					<Outlet />
				</div>
			</div>
		</div>
	);
}
