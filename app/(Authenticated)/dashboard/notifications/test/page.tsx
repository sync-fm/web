import { Suspense } from "react";
import { getServerUser } from "@/lib/supabase/server";
import NotificationsTestClient from "./TestClient";

export default async function NotificationsTestPage() {
	const user = await getServerUser();

	return (
		<Suspense fallback={<div className="p-6 text-white/60">Loading tester…</div>}>
			<NotificationsTestClient initialUserId={user?.id ?? null} />
		</Suspense>
	);
}
