/**
 * Dashboard Header Component
 * Reusable header for dashboard pages with title, subtitle, and optional action button
 *
 * Use DashboardHeaderAction wrapper for action buttons to get automatic responsive behavior
 */

"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface DashboardHeaderProps {
	title: string;
	subtitle?: string;
	action?: ReactNode;
	icon?: LucideIcon;
	delay?: number;
}

export function DashboardHeader({
	title,
	subtitle,
	action,
	icon: Icon,
	delay = 0,
}: DashboardHeaderProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
			className="flex items-start justify-between gap-4"
		>
			<div className="min-w-0 flex-1 space-y-3">
				<div className="flex items-center gap-3">
					{Icon && <Icon className="h-8 w-8 shrink-0 text-primary" />}
					<h1 className="text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
				</div>
				{subtitle && <p className="text-base text-muted-foreground sm:text-lg">{subtitle}</p>}
			</div>

			{action && <div className="flex shrink-0 items-center">{action}</div>}
		</motion.div>
	);
}

interface DashboardHeaderActionProps {
	onClick?: () => void;
	icon: LucideIcon;
	children: string; // Full text for the button
	firstWord?: string; // Optional: specify first word, otherwise will extract it
	className?: string;
}

/**
 * Responsive action button for DashboardHeader
 * Automatically adapts based on available space:
 * - Very tight space: Icon only, round button (48x48)
 * - Medium space: Icon + first word
 * - Plenty of space: Icon + full text
 */
export function DashboardHeaderAction({
	onClick,
	icon: Icon,
	children,
	firstWord,
	className = "",
}: DashboardHeaderActionProps) {
	const words = children.split(" ");
	const extractedFirstWord = firstWord || words[0];

	return (
		<button
			type="button"
			onClick={onClick}
			className={`group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand font-semibold text-primary-foreground shadow-brand-sm transition hover:brightness-105 active:scale-95
				h-12 w-12 p-0
				[@media(min-width:360px)]:h-auto [@media(min-width:360px)]:w-auto [@media(min-width:360px)]:px-4 [@media(min-width:360px)]:py-2.5 [@media(min-width:360px)]:text-sm
				md:px-6 md:py-3
				${className}`}
		>
			<Icon className="h-5 w-5 shrink-0 transition-transform group-hover:rotate-90" />
			<span className="hidden [@media(min-width:360px)]:inline md:hidden">
				{extractedFirstWord}
			</span>
			<span className="hidden md:inline">{children}</span>
		</button>
	);
}
