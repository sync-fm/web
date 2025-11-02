"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const navLinks = [
	{ href: "#how-it-works", label: "How it works" },
	{ href: "#what-you-get", label: "What you get" },
	{ href: "#why-syncfm", label: "Why SyncFM" },
	{ href: "#roadmap", label: "Roadmap" },
];

type LandingNavProps = {
	onCreateLink: () => void;
};

export const LandingNav = ({ onCreateLink }: LandingNavProps) => {
	return (
		<header className="px-6 py-4 sm:px-10">
			<motion.nav
				className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-full border border-white/12 bg-black/45 px-4 py-3 backdrop-blur-2xl shadow-[0_18px_55px_rgba(8,8,30,0.48)]"
				initial={{ y: -24, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
			>
				<Link href="/landing-v2" className="flex items-center gap-3">
					<motion.img
						src="/og-image.png"
						alt="SyncFM logo"
						className="h-9 w-9 rounded-2xl"
						initial={{ rotate: -6, scale: 0.94 }}
						animate={{ rotate: 0, scale: 1 }}
						transition={{ type: "spring", stiffness: 170, damping: 15 }}
					/>
					<div className="hidden flex-col sm:flex">
						<span className="text-xs font-semibold uppercase tracking-[0.32em] text-white/65">
							SyncFM
						</span>
						<span className="text-xs text-white/50">Universal music links</span>
					</div>
				</Link>
				<div className="hidden items-center gap-2 rounded-full border border-white/5 bg-white/10 px-1 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60 md:flex">
					{navLinks.map((item) => (
						<a
							key={item.label}
							href={item.href}
							className="rounded-full px-3.5 py-1.5 text-white/70 transition hover:bg-white/8 hover:text-white"
						>
							{item.label}
						</a>
					))}
					<Link
						href="/nerds"
						className="rounded-full border border-orange-500/40 bg-orange-500/15 px-3.5 py-1.5 text-orange-100 transition hover:-translate-y-[1px] hover:border-orange-300/60 hover:bg-orange-500/20"
					>
						Nerds
					</Link>
				</div>
				<div className="flex items-center gap-3">
					<Link
						href="/nerds"
						className="rounded-full border border-white/15 bg-white/8 px-3 py-2 text-xs font-medium uppercase tracking-[0.32em] text-white/70 transition hover:border-white/30 hover:text-white md:hidden"
					>
						Nerds
					</Link>
					<button
						type="button"
						onClick={onCreateLink}
						className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-950 shadow-[0_16px_48px_rgba(255,120,0,0.32)] transition hover:-translate-y-[1px] hover:shadow-[0_20px_64px_rgba(255,120,0,0.45)]"
					>
						Create link
					</button>
				</div>
			</motion.nav>
		</header>
	);
};
