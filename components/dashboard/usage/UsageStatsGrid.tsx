/**
 * Usage Stats Grid Component
 * Displays key metrics in a grid layout
 */

"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatItem {
	label: string;
	value: string;
	icon: LucideIcon;
}

interface UsageStatsGridProps {
	stats: StatItem[];
	delay?: number;
}

export function UsageStatsGrid({ stats, delay = 0.1 }: UsageStatsGridProps) {
	return (
		<motion.div
			className="grid gap-6 sm:grid-cols-2"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
		>
			{stats.map((stat) => {
				const Icon = stat.icon;
				return (
					<div
						key={stat.label}
						className="rounded-2xl border glass-border-light glass-bg-light p-6 backdrop-blur-xl shadow-glass-sm"
					>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-medium">{stat.label}</p>
								<p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
							</div>
							<div className="rounded-full bg-gradient-brand p-3">
								<Icon className="h-6 w-6 text-foreground" />
							</div>
						</div>
					</div>
				);
			})}
		</motion.div>
	);
}
