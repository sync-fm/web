"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { whySyncfmPoints } from "./constants";

export function WhySyncFMSection() {
	return (
		<section
			id="why-syncfm"
			className="rounded-4xl border glass-border-light bg-linear-to-br from-primary/12 via-primary/6 to-glass-bg-strong p-8 backdrop-blur-glass"
		>
			<div className="mb-8 space-y-3">
				<p className="inline-flex items-center gap-2 rounded-full border glass-border-medium glass-bg-medium px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-muted-light">
					<Activity className="h-3.5 w-3.5" />
					Why we built it
				</p>
				<h3 className="text-2xl font-semibold text-foreground">
					The whole point is to keep sharing simple.
				</h3>
				<p className="text-sm text-muted-strong">
					SyncFM started as a way to stop digging for alternate links. It&apos;s grown into a tool
					that lets every listener stay in the moment together.
				</p>
			</div>
			<div className="grid gap-6 md:grid-cols-3">
				{whySyncfmPoints.map((point) => (
					<motion.div
						key={point.title}
						className="rounded-3xl border glass-border-medium glass-bg-medium p-6"
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.45 }}
					>
						<p className="text-xs uppercase tracking-[0.3em] text-muted-light">{point.title}</p>
						<p className="mt-3 text-sm text-muted-strong">{point.description}</p>
					</motion.div>
				))}
			</div>
		</section>
	);
}
