"use client";

import Link from "next/link";
import { SiGithub } from "react-icons/si";

export const OpenSourceCTA = () => {
	return (
		<section className="rounded-[32px] border border-white/10 bg-black/45 p-8 backdrop-blur-2xl">
			<div className="flex flex-col gap-6 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
				<div className="max-w-xl space-y-3">
					<p className="text-xs uppercase tracking-[0.35em] text-white/45">
						Take a peek
					</p>
					<p className="text-2xl font-semibold text-white">
						We believe in open source software and building in public. We invite
						all nerds to drop by with ideas & contributions.
					</p>
					<p>
						Drop a message to{" "}
						<Link
							href="mailto:hey@syncfm.dev"
							className="text-orange-200 transition hover:text-orange-100"
						>
							hey@syncfm.dev
						</Link>{" "}
						to say hi or get involved.
					</p>
				</div>
				<div className="flex flex-col gap-4 text-sm text-white/60">
					<Link
						href="https://github.com/sync-fm"
						target="_blank"
						rel="noreferrer noopener"
						className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 transition hover:border-white/35 hover:text-white"
					>
						<SiGithub className="h-4 w-4" />
						GitHub
					</Link>
				</div>
			</div>
		</section>
	);
};
