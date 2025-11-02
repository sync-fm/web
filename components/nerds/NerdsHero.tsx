"use client";

import Link from "next/link";
import { Braces } from "lucide-react";
import {
	SiApplemusic,
	SiGithub,
	SiTypescript,
	SiYoutubemusic,
} from "react-icons/si";

export const NerdsHero = () => {
	return (
		<div className="rounded-[32px] border border-white/10 bg-black/40 px-8 py-10 shadow-[0_20px_60px_rgba(12,12,40,0.55)] backdrop-blur-2xl">
			<span className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/15 px-4 py-1 text-xs uppercase tracking-[0.35em] text-orange-200/80">
				<Braces className="h-4 w-4" />
				nerd log
			</span>
			<h1 className="mt-6 max-w-2xl text-4xl font-black leading-tight text-white md:text-5xl">
				The SyncFM nerd log
			</h1>
			<p className="mt-4 max-w-3xl text-base text-white/70 md:text-lg">
				A lil place for the nerds who care about the * in &quot;it just
				works*&quot; - Explore the infrastructure, adapters, and experiments
				that make universal music links work & help us press play on the future
				of music sharing.
			</p>
			<div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/75">
				<Link
					href="https://github.com/sync-fm"
					target="_blank"
					rel="noreferrer noopener"
					className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 transition hover:border-white/35 hover:text-white"
				>
					<SiGithub className="h-4 w-4" />
					GitHub
				</Link>
				<Link
					href="https://github.com/sync-fm/syncfm.ts"
					target="_blank"
					rel="noreferrer noopener"
					className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 transition hover:border-white/35 hover:text-white"
				>
					<SiTypescript className="h-4 w-4" />
					SyncFM SDK
				</Link>
				<Link
					href="https://github.com/sync-fm/applemusic-api"
					target="_blank"
					rel="noreferrer noopener"
					className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 transition hover:border-white/35 hover:text-white"
				>
					<SiApplemusic className="h-4 w-4" />
					Apple Music API
				</Link>
				<Link
					href="https://github.com/sync-fm/ytmusic-api"
					target="_blank"
					rel="noreferrer noopener"
					className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 transition hover:border-white/35 hover:text-white"
				>
					<SiYoutubemusic className="h-4 w-4" />
					YouTube Music API
				</Link>
			</div>
		</div>
	);
};
