/**
 * Dashboard Overview Page
 *
 * Main dashboard page showing user stats, rate limits, and recent activity
 */

"use client";

import { LucideMusic4 } from "lucide-react";
import { useEffect, useState } from "react";
import type { RecentActivityItem } from "@/app/(Authenticated)/dashboard/actions";
import { getDashboardStats } from "@/app/(Authenticated)/dashboard/actions";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { DashboardHeader, DashboardHeaderAction } from "@/components/dashboard/DashboardHeader";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { RecentActivityList } from "@/components/dashboard/RecentActivityList";
import LinkComposer from "@/components/LinkComposer/LinkComposer";

interface DashboardStats {
	totalRequests: number;
	requestsToday: number;
	apiKeysCount: number;
	rateLimitRemaining: number;
	rateLimitTotal: number;
}

interface DailyStat {
	date: string;
	count: number;
}

export default function DashboardPage() {
	const [profile, setProfile] = useState<{
		username?: string;
		full_name?: string;
		id?: string;
		is_admin?: boolean;
		avatar_url?: string;
		subscription_tier?: string;
		created_at?: string;
	} | null>(null);
	const [stats, setStats] = useState<DashboardStats>({
		totalRequests: 0,
		requestsToday: 0,
		apiKeysCount: 0,
		rateLimitRemaining: 0,
		rateLimitTotal: 100,
	});
	const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
	const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [isComposerOpen, setIsComposerOpen] = useState(false);

	const greetingName = profile?.full_name?.split(" ")[0] || profile?.username || "twink";
	const heroTitle = `Haiii ${greetingName}!!`;
	const heroSubtitle = "Ready to share some muuuuusic?~";

	useEffect(() => {
		const loadDashboard = async () => {
			try {
				const data = await getDashboardStats();

				setProfile(data.profile);
				setStats(data.stats);
				setDailyStats(data.dailyStats);
				setRecentActivity(data.recentActivity);
				setLoading(false);
			} catch (error) {
				console.error("Failed to load dashboard:", error);
				setLoading(false);
			}
		};

		loadDashboard();
	}, []);

	if (loading) {
		return <LoadingSpinner />;
	}

	// Adjust stats by dividing by 3 and rounding up
	const adjustedRequestsToday = Math.ceil(stats.requestsToday / 3);
	const adjustedTotalRequests = Math.ceil(stats.totalRequests / 3);

	// Filter recent activity to group createUrl calls
	const processedActivity = recentActivity
		.reduce((acc, curr) => {
			if (acc.length === 0) return [curr];
			const prev = acc[acc.length - 1];
			const isCreateUrl = curr.type === "createUrl";
			const prevIsCreateUrl = prev.type === "createUrl";
			const timeDiff = new Date(prev.created_at).getTime() - new Date(curr.created_at).getTime();

			if (isCreateUrl && prevIsCreateUrl && Math.abs(timeDiff) < 5000) {
				return acc;
			}
			acc.push(curr);
			return acc;
		}, [] as RecentActivityItem[])
		.slice(0, 5);

	// Transform daily stats for the chart
	const chartData = dailyStats.map((stat) => ({
		date: stat.date,
		count: Math.ceil(stat.count / 3),
	}));

	return (
		<div className="space-y-8">
			{/* Header */}
			<DashboardHeader
				title={heroTitle}
				subtitle={heroSubtitle}
				action={
					<DashboardHeaderAction onClick={() => setIsComposerOpen(true)} icon={LucideMusic4}>
						Share some music!
					</DashboardHeaderAction>
				}
			/>

			<div className="grid gap-8 lg:grid-cols-2">
				{/* Left Column: Usage Chart */}
				<ActivityChart data={chartData} />

				{/* Right Column: Profile & Stats */}
				<ProfileCard
					profile={profile}
					stats={{
						todayCount: adjustedRequestsToday,
						totalCount: adjustedTotalRequests,
					}}
					rateLimit={{
						remaining: stats.rateLimitRemaining,
						total: stats.rateLimitTotal,
					}}
				/>
			</div>

			{/* Recent Activity - Full Width */}
			<RecentActivityList activities={processedActivity} />

			<LinkComposer
				expanded={isComposerOpen}
				onExpandedChange={setIsComposerOpen}
				hideInline={true}
			/>
		</div>
	);
}
