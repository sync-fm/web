"use client";

import Link from "next/link";

export const LandingFooter = () => {
	return (
		<footer className="border-t glass-border-light glass-bg-medium px-6 py-8 backdrop-blur-glass">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground">
						SyncFM
					</p>
					<p className="text-sm text-muted-foreground">
						Universal music links • Powered by syncfm.ts
					</p>
				</div>
				<div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
					<Link
						href="https://github.com/sync-fm"
						target="_blank"
						rel="noreferrer"
						className="transition hover:text-primary"
					>
						GitHub
					</Link>
					<Link
						href="https://discord.gg/v6bCFuavU6"
						target="_blank"
						rel="noreferrer"
						className="transition hover:text-primary"
					>
						Discord
					</Link>
				</div>
			</div>
		</footer>
	);
};
