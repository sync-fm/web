/**
 * Daily Usage Chart Component
 * Displays daily usage over time with progress bars
 */

"use client";

import { motion } from "framer-motion";

interface DailyUsage {
	date: string;
	count: number;
}

interface DailyUsageChartProps {
	data: DailyUsage[];
	title?: string;
	delay?: number;
}

export function DailyUsageChart({
	data,
	title = "Last 7 Days Activity",
	delay = 0.2,
}: DailyUsageChartProps) {
	const maxCount = Math.max(...data.map((d) => d.count), 1);

	return (
		<motion.div
			className="rounded-2xl border glass-border-light glass-bg-light p-6 backdrop-blur-xl shadow-glass-md"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
		>
			<h2 className="mb-6 text-lg font-semibold text-foreground">{title}</h2>
			{data.length === 0 ? (
				<p className="text-center text-muted-faint">No data available</p>
			) : (
				<div className="space-y-3">
					{data.map((day, index) => (
						<div key={day.date} className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-medium">{day.date}</span>
								<span className="font-medium text-foreground">{day.count} requests</span>
							</div>
							<div className="h-2 overflow-hidden rounded-full glass-bg-medium">
								<motion.div
									className="h-full bg-gradient-brand"
									initial={{ width: 0 }}
									animate={{ width: `${(day.count / maxCount) * 100}%` }}
									transition={{ duration: 0.8, delay: delay + index * 0.05 }}
								/>
							</div>
						</div>
					))}
				</div>
			)}
		</motion.div>
	);
}
