import { Suspense } from "react";
import { getServerUser } from "@/lib/supabase/server";
import NotificationsPageClient from "./NotificationsPageClient";

export default async function NotificationsDashboardPage() {
	const user = await getServerUser();

	return (
		<Suspense fallback={<div className="p-6 text-muted-foreground">Loading notifications…</div>}>
			<NotificationsPageClient initialUserId={user?.id ?? null} />
		</Suspense>
	);
}
