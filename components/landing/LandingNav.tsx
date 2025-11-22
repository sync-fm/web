"use client";

import { motion } from "framer-motion";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SyncFMIcon } from "@/components/SyncFMIcon";

export function LandingNav() {
	const router = useRouter();

	const navLinks = [
		{ href: "/#how-it-works", label: "How it works" },
		{ href: "/#what-you-get", label: "What you get" },
		{ href: "/#why-syncfm", label: "Why SyncFM" },
		{ href: "/#roadmap", label: "Roadmap" },
		{ href: "/privacy", label: "Privacy" },
		{ href: "/terms", label: "Terms" },
	] as {
		href: Route;
		label: string;
	}[];

	return (
		<header className="px-6 py-4 sm:px-10">
			<motion.nav
				className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-full border glass-border-medium glass-bg-light px-4 py-3 backdrop-blur-glass shadow-glass-sm"
				initial={{ y: -24, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
			>
				{/* Left: Logo and Text */}
				<Link href="/" className="flex items-center">
					<div className="relative flex h-11 items-center rounded-2xl pl-12 pr-5 text-foreground">
						<SyncFMIcon
							size={11}
							clickable={false}
							className="absolute -left-1 top-1/2 -translate-y-1/2 rounded-2xl"
						/>
						<div className="flex flex-col">
							<span className="text-sm font-semibold uppercase tracking-[0.32em] text-muted-foreground">
								SyncFM
							</span>
							<span className="text-[9px] font-medium text-muted-medium">
								Universal Music Links
							</span>
						</div>
					</div>
				</Link>

				{/* Center: Navigation Links */}
				<div className="hidden h-11 items-center gap-2 rounded-full border glass-border-subtle glass-bg-medium px-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-medium md:flex">
					{navLinks.map((item) => (
						<Link
							key={item.label}
							href={item.href}
							className="flex h-full items-center rounded-full px-3.5 text-muted-strong transition hover:glass-bg-medium hover:text-foreground"
						>
							{item.label}
						</Link>
					))}
				</div>

				{/* Right: Get Started Button */}
				<button
					type="button"
					onClick={() => router.push("/signin")}
					className="flex h-11 items-center gap-2 rounded-full bg-gradient-brand px-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-primary-foreground shadow-brand-md transition hover:-translate-y-px hover:shadow-brand-lg"
				>
					Get Started
				</button>
			</motion.nav>
		</header>
	);
}
