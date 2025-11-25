/**
 * Usage Analytics Page
 *
 * Detailed analytics and usage metrics for API requests
 */

"use client";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Activity, BarChart3, Clock, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardHeader, DashboardHeaderAction } from "@/components/dashboard/DashboardHeader";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { DailyUsageChart } from "@/components/dashboard/usage/DailyUsageChart";
import { EndpointList } from "@/components/dashboard/usage/EndpointList";
import { UsageStatsGrid } from "@/components/dashboard/usage/UsageStatsGrid";
import { createClient } from "@/lib/supabase/client";

interface UsageData {
	endpoint: string;
	count: number;
	avg_response_time?: number;
}

interface DailyUsage {
	date: string;
	count: number;
}

export default function UsagePage() {
	const [_user, setUser] = useState<SupabaseUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [topEndpoints, setTopEndpoints] = useState<UsageData[]>([]);
	const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
	const [totalRequests, setTotalRequests] = useState(0);
	const [avgResponseTime, setAvgResponseTime] = useState(0);

	// biome-ignore lint/correctness/useExhaustiveDependencies: a
	useEffect(() => {
		loadUsageData();
	}, []);

	const loadUsageData = async () => {
		const supabase = createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return;
		setUser(user);

		// Get total requests
		const { count } = await supabase
			.from("usage_metrics")
			.select("*", { count: "exact", head: true })
			.eq("user_id", user.id);
		setTotalRequests(count || 0);

		// Get top endpoints
		const { data: metrics } = await supabase
			.from("usage_metrics")
			.select("endpoint, response_time_ms")
			.eq("user_id", user.id)
			.order("created_at", { ascending: false })
			.limit(1000);

		if (metrics) {
			// Group by endpoint
			const endpointMap = new Map<string, { count: number; totalTime: number }>();
			for (const m of metrics) {
				const existing = endpointMap.get(m.endpoint) || {
					count: 0,
					totalTime: 0,
				};
				endpointMap.set(m.endpoint, {
					count: existing.count + 1,
					totalTime: existing.totalTime + (m.response_time_ms || 0),
				});
			}

			const endpointData: UsageData[] = Array.from(endpointMap.entries())
				.map(([endpoint, data]) => ({
					endpoint,
					count: data.count,
					avg_response_time: data.count > 0 ? data.totalTime / data.count : 0,
				}))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10);

			setTopEndpoints(endpointData);

			// Calculate average response time
			const totalTime = metrics.reduce((sum, m) => sum + (m.response_time_ms || 0), 0);
			setAvgResponseTime(metrics.length > 0 ? totalTime / metrics.length : 0);
		}

		// Get daily usage (last 7 days)
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const { data: recentMetrics } = await supabase
			.from("usage_metrics")
			.select("created_at")
			.eq("user_id", user.id)
			.gte("created_at", sevenDaysAgo.toISOString());

		if (recentMetrics) {
			const dailyMap = new Map<string, number>();
			for (const m of recentMetrics) {
				const date = new Date(m.created_at).toLocaleDateString();
				dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
			}

			const daily: DailyUsage[] = Array.from(dailyMap.entries())
				.map(([date, count]) => ({ date, count }))
				.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

			setDailyUsage(daily);
		}

		setLoading(false);
	};

	const handleExport = () => {
		// Create CSV data
		const csv = [
			["Endpoint", "Requests", "Avg Response Time (ms)"],
			...topEndpoints.map((e) => [
				e.endpoint,
				e.count.toString(),
				e.avg_response_time?.toFixed(2) || "0",
			]),
		]
			.map((row) => row.join(","))
			.join("\n");

		// Download CSV
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `syncfm-usage-${new Date().toISOString().split("T")[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	const stats = [
		{
			label: "Total Requests",
			value: totalRequests.toLocaleString(),
			icon: Activity,
		},
		{
			label: "Avg Response Time",
			value: `${avgResponseTime.toFixed(0)}ms`,
			icon: Clock,
		},
	];

	return (
		<div className="space-y-8">
			<DashboardHeader
				title="Usage Analytics"
				subtitle="Detailed insights into your API usage"
				icon={BarChart3}
				action={
					<DashboardHeaderAction
						onClick={handleExport}
						icon={Download}
						className="bg-transparent! shadow-none! glass-bg-light glass-border-medium hover:brightness-100! hover:glass-bg-medium"
					>
						Export Data
					</DashboardHeaderAction>
				}
			/>

			<UsageStatsGrid stats={stats} />

			<DailyUsageChart data={dailyUsage} />

			<EndpointList endpoints={topEndpoints} />
		</div>
	);
}
