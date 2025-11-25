/**
 * Endpoint List Component
 * Displays top endpoints with usage metrics
 */

"use client";

import { motion } from "framer-motion";

interface EndpointData {
	endpoint: string;
	count: number;
	avg_response_time?: number;
}

interface EndpointListProps {
	endpoints: EndpointData[];
	title?: string;
	delay?: number;
}

export function EndpointList({
	endpoints,
	title = "Top Endpoints",
	delay = 0.3,
}: EndpointListProps) {
	const maxCount = Math.max(...endpoints.map((e) => e.count), 1);

	return (
		<motion.div
			className="rounded-2xl border glass-border-light glass-bg-light p-6 backdrop-blur-xl shadow-glass-md"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
		>
			<h2 className="mb-6 text-lg font-semibold text-foreground">{title}</h2>
			{endpoints.length === 0 ? (
				<p className="text-center text-muted-faint">No endpoint data available</p>
			) : (
				<div className="space-y-4">
					{endpoints.map((endpoint, index) => (
						<div
							key={endpoint.endpoint}
							className="rounded-lg border glass-border-subtle glass-bg-medium p-4"
						>
							<div className="mb-3 flex items-center justify-between">
								<code className="font-mono text-sm text-foreground">{endpoint.endpoint}</code>
								<div className="flex items-center gap-4 text-sm">
									<span className="text-muted-medium">{endpoint.count} requests</span>
									{endpoint.avg_response_time !== undefined && (
										<span className="text-muted-faint">
											{endpoint.avg_response_time.toFixed(0)}ms avg
										</span>
									)}
								</div>
							</div>
							<div className="h-2 overflow-hidden rounded-full glass-bg-medium">
								<motion.div
									className="h-full bg-gradient-brand"
									initial={{ width: 0 }}
									animate={{
										width: `${(endpoint.count / maxCount) * 100}%`,
									}}
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
