/**
 * Activity Chart Component
 * Reusable bar chart for displaying daily activity
 */

"use client";

import { motion } from "framer-motion";

interface DailyStat {
	date: string;
	count: number;
}

interface ActivityChartProps {
	data: DailyStat[];
	title?: string;
	label?: string;
	delay?: number;
}

export function ActivityChart({
	data,
	title = "Activity",
	label = "Links Created",
	delay = 0.1,
}: ActivityChartProps) {
	const maxCount = Math.max(...data.map((d) => d.count), 5);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
			className="h-full"
		>
			<div className="flex h-full min-h-[260px] flex-col rounded-2xl border glass-border-light glass-bg-light p-6 backdrop-blur-xl sm:min-h-0">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="text-lg font-semibold text-foreground">{title}</h2>
					<div className="flex items-center gap-2 text-xs text-muted-faint">
						<div className="h-2 w-2 rounded-full bg-primary" />
						<span>{label}</span>
					</div>
				</div>

				<div className="flex flex-1 items-end justify-between gap-3">
					{data.map((stat, i) => {
						const height = (stat.count / maxCount) * 100;
						const date = new Date(stat.date);
						const isToday = new Date().toDateString() === date.toDateString();

						return (
							<div
								key={stat.date}
								className="group relative flex h-full w-full flex-col justify-end gap-2"
							>
								<div className="relative flex h-full w-full items-end overflow-hidden rounded-t-lg glass-bg-light">
									<motion.div
										initial={{ height: 0 }}
										animate={{ height: `${height}%` }}
										transition={{ duration: 0.5, delay: i * 0.1 }}
										className={`w-full rounded-t-lg transition-colors ${isToday ? "bg-primary" : "bg-primary/40 group-hover:bg-primary/60"}`}
									/>

									{/* Tooltip */}
									<div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
										<div className="whitespace-nowrap rounded-lg glass-bg-strong px-2 py-1 text-xs font-medium text-foreground">
											{stat.count} links
										</div>
									</div>
								</div>
								<span
									className={`text-center text-xs ${isToday ? "font-medium text-foreground" : "text-muted-faint"}`}
								>
									{date.toLocaleDateString("en-US", { weekday: "short" })}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		</motion.div>
	);
}
