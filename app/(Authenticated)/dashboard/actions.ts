/**
 * Server Actions for Dashboard
 *
 * These actions run on the server and can access Redis, database, etc.
 */

"use server";

import { getRateLimitStatus } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export interface RecentActivityItem {
	created_at: Date;
	type: "convert" | "createUrl" | "other";
	status_code: number;
}

export async function getDashboardStats() {
	const supabase = await createClient();

	// Get user
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("Not authenticated");
	}

	// Get profile
	const { data: profileData } = await supabase
		.from("profiles")
		.select("subscription_tier, created_at, id, username, is_admin, full_name, avatar_url")
		.eq("id", user.id)
		.single();

	// Get API keys count
	const { count: apiKeysCount } = await supabase
		.from("api_keys")
		.select("*", { count: "exact", head: true })
		.eq("user_id", user.id)
		.eq("is_active", true);

	// Get total requests
	const { count: totalRequests } = await supabase
		.from("usage_metrics")
		.select("*", { count: "exact", head: true })
		.eq("user_id", user.id);

	// Get requests today
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const { count: requestsToday } = await supabase
		.from("usage_metrics")
		.select("*", { count: "exact", head: true })
		.eq("user_id", user.id)
		.gte("created_at", today.toISOString());

	// Get rate limit info
	const tier = profileData?.subscription_tier || "free";
	const tierLimits: Record<string, number> = {
		free: 100,
		pro: 1000,
		enterprise: 10000,
	};
	const rateLimitTotal = tierLimits[tier] || 100;

	// Check current rate limit status WITHOUT incrementing (server-side only)
	const rateLimitResult = await getRateLimitStatus(`user:${user.id}`, rateLimitTotal);

	// Get recent activity
	const { data: activityData } = await supabase
		.from("usage_metrics")
		.select("endpoint, created_at, status_code")
		.eq("user_id", user.id)
		.order("created_at", { ascending: false })
		.limit(20)
		.likeAnyOf("endpoint", ["%/handle/%", "%/convertAll", "%/createUrl"]);

	const RecentActivityItems: RecentActivityItem[] = [];

	for (const i of activityData || []) {
		const item: RecentActivityItem = {
			created_at: i.created_at,
			type: "other",
			status_code: i.status_code,
		};
		if (i.endpoint.includes("/convertAll")) {
			(item as RecentActivityItem).type = "convert";
		} else if (i.endpoint.includes("/createUrl")) {
			(item as RecentActivityItem).type = "createUrl";
		} else {
			(item as RecentActivityItem).type = "other";
		}
		RecentActivityItems.push(item);
	}

	// Get daily stats for the last 7 days
	const dailyStats = await Promise.all(
		Array.from({ length: 7 }).map(async (_, i) => {
			const date = new Date();
			date.setDate(date.getDate() - i);
			date.setHours(0, 0, 0, 0);

			const nextDate = new Date(date);
			nextDate.setDate(date.getDate() + 1);

			const { count } = await supabase
				.from("usage_metrics")
				.select("*", { count: "exact", head: true })
				.eq("user_id", user.id)
				.gte("created_at", date.toISOString())
				.lt("created_at", nextDate.toISOString());

			return {
				date: date.toISOString(),
				count: count || 0,
			};
		})
	);

	return {
		user: {
			email: user.email,
		},
		profile: profileData,
		stats: {
			totalRequests: totalRequests || 0,
			requestsToday: requestsToday || 0,
			apiKeysCount: apiKeysCount || 0,
			rateLimitRemaining: rateLimitResult.remaining,
			rateLimitTotal,
		},
		recentActivity: RecentActivityItems || [],
		dailyStats: dailyStats.reverse(),
	};
}
