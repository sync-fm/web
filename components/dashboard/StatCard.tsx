/**
 * Stat Card Component
 * Reusable card for displaying statistics with icon
 */

"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
	icon: LucideIcon;
	label: string;
	value: string | number;
	iconColor?: string;
	delay?: number;
}

export function StatCard({
	icon: Icon,
	label,
	value,
	iconColor = "text-primary",
	delay = 0,
}: StatCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
			className="rounded-xl glass-bg-light p-4 transition hover:glass-bg-medium"
		>
			<div className="flex items-center gap-2">
				<Icon className={`h-4 w-4 ${iconColor}`} />
				<p className="text-sm font-medium">{label}</p>
			</div>
			<p className="mt-2 text-2xl font-bold text-foreground">
				{typeof value === "number" ? value.toLocaleString() : value}
			</p>
		</motion.div>
	);
}
