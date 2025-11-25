/**
 * Empty State Component
 * Reusable empty state for dashboard pages
 */

"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description: string;
	action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
	return (
		<div className="rounded-2xl border glass-border-light glass-bg-light p-12 text-center backdrop-blur-xl shadow-glass-sm">
			<Icon className="mx-auto h-12 w-12 text-muted-faint" />
			<h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
			<p className="mt-2 text-muted-medium">{description}</p>
			{action && <div className="mt-6">{action}</div>}
		</div>
	);
}
