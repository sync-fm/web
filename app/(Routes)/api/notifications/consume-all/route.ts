import { NextResponse } from "next/server";
import { consumeAllNotifications } from "@/lib/notifications.server";
import { getServerUser } from "@/lib/supabase/server";

export async function POST() {
	const user = await getServerUser();

	if (!user) {
		console.warn("[api/notifications/consume-all] unauthorized request");
		return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
	}

	try {
		const deleted = await consumeAllNotifications(user.id);
		return NextResponse.json({ deleted });
	} catch (error) {
		console.error("[api/notifications/consume-all] failed", {
			userId: user.id,
			error,
		});
		return NextResponse.json({ error: "Unable to clear notifications" }, { status: 500 });
	}
}
