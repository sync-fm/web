"use client";

import { motion } from "framer-motion";
import { Shuffle } from "lucide-react";
import {
	HOW_IT_WORKS_CARD_VARIANTS,
	HOW_IT_WORKS_WRAPPER_VARIANTS,
	howItWorksSteps,
} from "./constants";

interface HowItWorksSectionProps {
	visible: boolean;
}

export function HowItWorksSection({ visible }: HowItWorksSectionProps) {
	return (
		<motion.section
			id="how-it-works"
			className="rounded-4xl border glass-border-light glass-bg-light p-8 shadow-glass-md backdrop-blur-glass"
			initial={{ opacity: 0, y: 32 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, ease: "easeOut" }}
		>
			<div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="max-w-xl space-y-2">
					<p className="inline-flex items-center gap-2 rounded-full border glass-border-medium glass-bg-medium px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-muted-light">
						<Shuffle className="h-3.5 w-3.5" />
						How it works
					</p>
					<h3 className="text-2xl font-semibold text-foreground">
						Share once. Let SyncFM handle the rest.
					</h3>
					<p className="text-sm text-muted-medium">
						Drop the link you already have - SyncFM fetches everything needed, gives you a nice
						little page, and lets your friends pick their preferred service.
					</p>
				</div>
			</div>
			<motion.div
				className="grid gap-6 md:grid-cols-3"
				initial="hidden"
				animate={visible ? "visible" : "hidden"}
				variants={HOW_IT_WORKS_WRAPPER_VARIANTS}
			>
				{howItWorksSteps.map((step, index) => (
					<motion.div
						key={step.title}
						className="rounded-3xl border glass-border-medium bg-linear-to-br glass-bg-medium via-glass-bg-light to-glass-border-medium p-6 backdrop-blur-xl"
						variants={HOW_IT_WORKS_CARD_VARIANTS}
					>
						<span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-primary-foreground shadow-brand-md">
							{index + 1}
						</span>
						<p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-brand">
							{step.title}
						</p>
						<p className="mt-3 text-sm text-muted-strong">{step.description}</p>
					</motion.div>
				))}
			</motion.div>
		</motion.section>
	);
}
