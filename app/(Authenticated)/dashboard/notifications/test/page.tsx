import { unauthorized } from "next/navigation";
import { Suspense } from "react";
import { getServerUser, isServerAdmin } from "@/lib/supabase/server";
import NotificationsTestClient from "./TestClient";
export default async function NotificationsTestPage() {
	const user = await getServerUser();
	const admin = await isServerAdmin();
	if (!user || !admin) {
		return unauthorized();
	}
	return (
		<Suspense fallback={<div className="p-6 text-white/60">Loading tester…</div>}>
			<NotificationsTestClient initialUserId={user?.id ?? null} />
		</Suspense>
	);
}
