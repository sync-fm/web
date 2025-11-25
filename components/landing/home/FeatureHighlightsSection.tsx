"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { featureHighlights, shareBenefits } from "./constants";

export function FeatureHighlightsSection() {
	return (
		<section
			id="what-you-get"
			className="rounded-4xl border glass-border-light glass-bg-light p-8 shadow-glass-md backdrop-blur-glass"
		>
			<div className="mb-10 space-y-3">
				<p className="inline-flex items-center gap-2 rounded-full border glass-border-medium glass-bg-medium px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-muted-light">
					<Activity className="h-3.5 w-3.5" />
					What you get
				</p>
				<h3 className="text-2xl font-semibold text-foreground">
					A share page that does the heavy lifting for you.
				</h3>
				<p className="text-sm text-muted-medium">
					Whether you&apos;re texting a friend or posting to a community, SyncFM keeps the
					experience consistent and ready for the next wave of services.
				</p>
			</div>
			<div className="grid gap-8 lg:grid-cols-3">
				{featureHighlights.map((feature) => (
					<motion.div
						key={feature.title}
						className="flex flex-col gap-4 rounded-3xl border glass-border-medium bg-linear-to-br glass-bg-medium via-glass-bg-light to-glass-border-medium p-6 backdrop-blur-xl"
						initial={{ opacity: 0, y: 18 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
					>
						<div>
							<p className="text-xs uppercase tracking-[0.3em] text-brand">{feature.title}</p>
							<p className="mt-3 text-sm text-muted-strong">{feature.description}</p>
						</div>
						<ul className="space-y-3 text-sm text-muted-strong">
							{feature.points.map((point) => (
								<li key={point} className="flex gap-3">
									<span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
									<span>{point}</span>
								</li>
							))}
						</ul>
					</motion.div>
				))}
			</div>
			<div className="mt-10 grid gap-6 md:grid-cols-3">
				{shareBenefits.map((item) => (
					<motion.div
						key={item.title}
						className="rounded-3xl border glass-border-medium glass-bg-light p-5 shadow-glass-lg backdrop-blur-glass"
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.45 }}
					>
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
							{item.title}
						</p>
						<p className="mt-3 text-sm text-muted-strong">{item.description}</p>
					</motion.div>
				))}
			</div>
		</section>
	);
}
