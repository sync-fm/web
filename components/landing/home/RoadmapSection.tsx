"use client";

import { motion } from "framer-motion";
import { Rocket } from "lucide-react";
import { roadmapItems } from "./constants";

export function RoadmapSection() {
	return (
		<section
			id="roadmap"
			className="rounded-4xl border glass-border-light glass-bg-light p-8 backdrop-blur-glass"
		>
			<div className="flex flex-col gap-10 lg:flex-row lg:items-center">
				<div className="flex-1 space-y-6">
					<p className="inline-flex items-center gap-2 rounded-full border glass-border-strong glass-bg-light px-4 py-1 text-xs uppercase tracking-[0.35em] text-muted-subtle">
						<Rocket className="h-4 w-4" />
						forward roadmap
					</p>
					<h2 className="text-3xl font-bold text-foreground md:text-4xl">
						Built for listeners. Built by nerds
					</h2>
					<p className="max-w-2xl text-sm text-muted-strong md:text-base">
						SyncFM is just getting started. Here&apos;s a peek at what&apos;s next on our roadmap.
						But that&apos;s not all. We are constantly iterating and (hopefully) improving!
					</p>
				</div>
				<div className="flex-1 space-y-4">
					{roadmapItems.map((item) => (
						<motion.div
							key={item.title}
							className="rounded-3xl border glass-border-light glass-bg-medium p-6 backdrop-blur-xl"
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6 }}
						>
							<p className="text-xs uppercase tracking_[0.35em] text-muted-faint">{item.era}</p>
							<p
								className={`mt-2 inline-flex items-center rounded-full bg-linear-to-r ${item.accent} px-3 py-1 text-xs font-medium text-primary-foreground`}
							>
								{item.title}
							</p>
							<p className="mt-3 text-sm text-muted-strong">{item.description}</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
