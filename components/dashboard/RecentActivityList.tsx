/**
 * Recent Activity List Component
 * Reusable list for displaying recent activity items
 */

"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Activity, Music, Share2 } from "lucide-react";
import type { RecentActivityItem } from "@/app/(Authenticated)/dashboard/actions";

interface RecentActivityListProps {
	activities: RecentActivityItem[];
	title?: string;
	emptyMessage?: string;
	emptyDescription?: string;
	delay?: number;
}

export function RecentActivityList({
	activities,
	title = "Recent Activity",
	emptyMessage = "No activity yet",
	emptyDescription = "Start sharing music to see your history!",
	delay = 0.3,
}: RecentActivityListProps) {
	const getActivityInfo = (type: string): { label: string; icon: LucideIcon } => {
		switch (type) {
			case "createUrl":
				return { label: "Link Created", icon: Share2 };
			case "convert":
				return { label: "Conversion", icon: Music };
			default:
				return { label: "API Request", icon: Activity };
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
			className="rounded-2xl border glass-border-light glass-bg-light p-6 backdrop-blur-xl"
		>
			<h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>
			{activities.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-8 text-center">
					<div className="mb-3 rounded-full glass-bg-light p-3">
						<Activity className="h-6 w-6 text-muted-faint" />
					</div>
					<p className="text-muted-medium">{emptyMessage}</p>
					<p className="text-sm text-muted-faint">{emptyDescription}</p>
				</div>
			) : (
				<div className="space-y-2">
					{activities.map((activity, i) => {
						const { label, icon: Icon } = getActivityInfo(activity.type);
						const isSuccess = activity.status_code >= 200 && activity.status_code < 300;

						return (
							<div
								key={`${activity.type}-${activity.created_at}-${i}`}
								className="group flex items-center justify-between rounded-lg border glass-border-subtle glass-bg-light p-4 transition hover:glass-bg-medium"
							>
								<div className="flex items-center gap-4">
									<div
										className={`flex h-10 w-10 items-center justify-center rounded-full transition group-hover:scale-110 ${
											isSuccess ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
										}`}
									>
										<Icon className="h-5 w-5" />
									</div>
									<div>
										<p className="font-medium text-foreground">{label}</p>
										<p className="text-xs font-mono text-muted-faint">{activity.type}</p>
									</div>
								</div>
								<div className="text-right">
									<p className="text-sm text-muted-medium">
										{new Date(activity.created_at).toLocaleTimeString()}
									</p>
									<p className="text-xs text-muted-faint">
										{new Date(activity.created_at).toLocaleDateString()}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</motion.div>
	);
}
