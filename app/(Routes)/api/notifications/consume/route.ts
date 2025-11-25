import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { consumeNotification } from "@/lib/notifications.server";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
	const user = await getServerUser();

	if (!user) {
		console.warn("[api/notifications/consume] unauthorized request");
		return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
	}

	const body = (await request.json().catch(() => null)) as { notificationId?: string } | null;
	const notificationId = body?.notificationId?.trim();

	if (!notificationId) {
		console.warn("[api/notifications/consume] missing notificationId", {
			userId: user.id,
		});
		return NextResponse.json({ error: "notificationId_required" }, { status: 400 });
	}

	try {
		const notification = await consumeNotification(user.id, notificationId);
		const success = Boolean(notification);
		return NextResponse.json({ success });
	} catch (error) {
		console.error("[api/notifications/consume] failed", {
			userId: user.id,
			notificationId,
			error,
		});
		return NextResponse.json({ error: "Unable to update notification" }, { status: 500 });
	}
}
