"use client";

import Link from "next/link";

export const LandingFooter = () => {
	return (
		<footer className="border-t border-white/10 bg-black/40 px-6 py-8 backdrop-blur-xl sm:px-10">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/45">
						SyncFM
					</p>
					<p className="text-sm text-white/55">
						Universal music links • Powered by syncfm.ts
					</p>
				</div>
				<div className="flex flex-wrap gap-4 text-xs text-white/55">
					<Link href="/nerds" className="transition hover:text-orange-200">
						nerd log
					</Link>
					<Link
						href="https://github.com/sync-fm"
						target="_blank"
						rel="noreferrer"
						className="transition hover:text-orange-200"
					>
						GitHub
					</Link>
					<Link
						href="https://discord.gg/v6bCFuavU6"
						target="_blank"
						rel="noreferrer"
						className="transition hover:text-orange-200"
					>
						Discord
					</Link>
				</div>
			</div>
		</footer>
	);
};
