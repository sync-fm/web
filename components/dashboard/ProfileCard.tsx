/**
 * Profile Card Component
 * Reusable profile display card with stats
 */

"use client";

import { motion } from "framer-motion";
import { Activity, Clock, TrendingUp, Zap } from "lucide-react";
import type { ReactNode } from "react";

interface Profile {
	username?: string;
	full_name?: string;
	avatar_url?: string;
	subscription_tier?: string;
	created_at?: string;
}

interface RateLimitInfo {
	remaining: number;
	total: number;
}

interface ProfileCardProps {
	profile: Profile | null;
	stats?: {
		todayCount: number;
		totalCount: number;
	};
	rateLimit?: RateLimitInfo;
	customStats?: ReactNode;
	delay?: number;
}

export function ProfileCard({
	profile,
	stats,
	rateLimit,
	customStats,
	delay = 0.2,
}: ProfileCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
			className="h-full space-y-6"
		>
			<div className="flex h-full flex-col justify-between rounded-2xl border glass-border-light glass-bg-light p-6 backdrop-blur-xl">
				<div className="mb-6 flex items-center gap-4">
					{profile?.avatar_url ? (
						<img
							src={profile.avatar_url}
							alt={profile.username || "User"}
							width={64}
							height={64}
							className="h-16 w-16 rounded-full border-2 glass-border-light"
						/>
					) : (
						<div className="flex h-16 w-16 items-center justify-center rounded-full border-2 glass-border-light glass-bg-light">
							<span className="text-2xl font-bold text-muted-faint">
								{profile?.username?.[0]?.toUpperCase() || "U"}
							</span>
						</div>
					)}
					<div>
						<p className="text-xl font-bold text-foreground">
							{profile?.full_name || "Music Lover"}
						</p>
						<p className="text-muted-medium">@{profile?.username}</p>
						<div className="mt-1 flex items-center gap-2">
							<span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium capitalize text-brand">
								{profile?.subscription_tier || "free"}
							</span>
							<span className="text-xs text-muted-faint">
								Member since{" "}
								{profile?.created_at
									? new Date(profile.created_at).toLocaleDateString("en-US", {
											month: "short",
											year: "numeric",
										})
									: "Unknown"}
							</span>
						</div>
					</div>
				</div>

				{customStats ||
					(stats && (
						<div className="grid grid-cols-2 gap-4">
							<div className="rounded-xl glass-bg-light p-4 transition hover:glass-bg-medium">
								<div className="flex items-center gap-2 text-primary">
									<Activity className="h-4 w-4" />
									<p className="text-sm font-medium">Links Today</p>
								</div>
								<p className="mt-2 text-2xl font-bold text-foreground">
									{stats.todayCount.toLocaleString()}
								</p>
							</div>
							<div className="rounded-xl glass-bg-light p-4 transition hover:glass-bg-medium">
								<div className="flex items-center gap-2 text-secondary">
									<TrendingUp className="h-4 w-4" />
									<p className="text-sm font-medium">Total Links</p>
								</div>
								<p className="mt-2 text-2xl font-bold text-foreground">
									{stats.totalCount.toLocaleString()}
								</p>
							</div>
						</div>
					))}

				{rateLimit && (
					<div className="mt-6 border-t glass-border-light pt-6">
						<div className="mb-2 flex items-center justify-between">
							<div className="flex items-center gap-2 text-muted-medium">
								<Zap className="h-4 w-4 text-primary" />
								<span className="text-sm">Requests Remaining</span>
							</div>
							<span className="text-sm font-medium text-foreground">
								{rateLimit.remaining} / {rateLimit.total}
							</span>
						</div>
						<div className="h-2 overflow-hidden rounded-full glass-bg-medium">
							<div
								className="h-full rounded-full bg-primary transition-all duration-500"
								style={{
									width: `${(rateLimit.remaining / rateLimit.total) * 100}%`,
								}}
							/>
						</div>
						<div className="mt-2 flex items-center gap-1.5 text-xs text-muted-faint">
							<Clock className="h-3 w-3" />
							<span>Resets every hour</span>
						</div>
					</div>
				)}
			</div>
		</motion.div>
	);
}
