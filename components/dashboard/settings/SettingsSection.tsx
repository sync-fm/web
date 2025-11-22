/**
 * Settings Section Component
 * Reusable section container for settings pages
 */

"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SettingsSectionProps {
	title: string;
	description?: string;
	icon?: LucideIcon;
	children: ReactNode;
	delay?: number;
	variant?: "default" | "danger";
	badge?: string;
}

export function SettingsSection({
	title,
	description,
	icon: Icon,
	children,
	delay = 0,
	variant = "default",
	badge,
}: SettingsSectionProps) {
	const isDanger = variant === "danger";

	return (
		<motion.div
			className={`rounded-2xl p-6 backdrop-blur-xl ${
				isDanger
					? "border border-red-500/30 bg-red-500/5"
					: "border glass-border-light glass-bg-light shadow-glass-md"
			}`}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
		>
			<div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2
						className={`flex items-center gap-2 text-lg font-semibold ${
							isDanger ? "text-red-400" : "text-foreground"
						}`}
					>
						{Icon && <Icon className="h-5 w-5" />}
						{title}
					</h2>
					{description && <p className="mt-2 text-sm text-muted-medium">{description}</p>}
				</div>
				{badge && (
					<span className="glass-border-medium inline-flex shrink-0 items-center justify-center rounded-full glass-bg-light px-3 py-1 text-xs font-medium text-muted-strong">
						{badge}
					</span>
				)}
			</div>
			{children}
		</motion.div>
	);
}
