import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fetchNotifications } from "@/lib/notifications.server";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
	const user = await getServerUser();

	if (!user) {
		console.warn("[api/notifications/feed] unauthorized request");
		return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
	}

	const params = request.nextUrl.searchParams;
	const limitParam = params.get("limit");
	const includeExpiredParam = params.get("includeExpired");
	const onOrAfterParam = params.get("onOrAfter");

	const limit = Math.min(100, Math.max(1, Number.parseInt(limitParam ?? "50", 10) || 50));
	const includeExpired = includeExpiredParam === "true";
	const onOrAfter = onOrAfterParam ? new Date(onOrAfterParam) : undefined;

	try {
		console.info("[api/notifications/feed] fetching", {
			userId: user.id,
			limit,
			includeExpired,
			onOrAfter: onOrAfter?.toISOString() ?? null,
		});
		const notifications = await fetchNotifications(user.id, {
			limit,
			includeExpired,
			onOrAfter: onOrAfter && Number.isNaN(onOrAfter.getTime()) ? undefined : onOrAfter,
		});

		console.info("[api/notifications/feed] success", {
			userId: user.id,
			count: notifications.length,
		});

		return NextResponse.json({
			notifications,
			lastUpdatedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error("[api/notifications/feed] failed", {
			userId: user.id,
			error,
		});
		return NextResponse.json({ error: "Unable to load notifications" }, { status: 500 });
	}
}
