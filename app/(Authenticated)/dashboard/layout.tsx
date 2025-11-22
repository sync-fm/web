/**
 * Dashboard Layout
 *
 * Main layout for authenticated user dashboard with sidebar navigation
 */

"use client";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NotificationsPopover } from "@/components/dashboard/Notifications";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { SyncFMIcon } from "@/components/SyncFMIcon";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const [user, setUser] = useState<SupabaseUser | null>(null);
	const [profile, setProfile] = useState<{
		username?: string;
		avatar_url?: string;
		subscription_tier?: string;
		is_admin?: boolean;
	} | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const supabase = createClient();

		// Get initial session
		supabase.auth.getUser().then(({ data: { user } }) => {
			if (!user) {
				router.push("/signin?redirect=/dashboard");
				return;
			}

			setUser(user);

			// Fetch profile
			supabase
				.from("profiles")
				.select("username, avatar_url, subscription_tier, is_admin")
				.eq("id", user.id)
				.single()
				.then(({ data }) => {
					setProfile(data);
					setLoading(false);
				});
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (!session?.user) {
				router.push("/signin?redirect=/dashboard");
			} else {
				setUser(session.user);
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [router]);

	const handleSignOut = async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/");
	};

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<SidebarProvider>
			<div className="dark relative min-h-screen w-full overflow-hidden bg-background text-foreground">
				{/* Background gradient */}
				<motion.div
					aria-hidden
					className="pointer-events-none absolute inset-0"
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.5 }}
					transition={{ duration: 1.2 }}
				>
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--primary)_0%,transparent_55%),radial-gradient(circle_at_80%_30%,var(--secondary)_0%,transparent_60%)] opacity-25" />
					<motion.div
						className="absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-primary/20 blur-[120px]"
						animate={{ y: [0, 30, 0], opacity: [0.2, 0.3, 0.2] }}
						transition={{
							duration: 12,
							ease: "easeInOut",
							repeat: Number.POSITIVE_INFINITY,
						}}
					/>
				</motion.div>

				<div className="relative z-10 flex min-h-screen w-full">
					<DashboardSidebar user={user} profile={profile} handleSignOut={handleSignOut} />

					<SidebarInset className="bg-background/90 text-foreground">
						<div
							aria-hidden
							className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,var(--primary)_0%,transparent_55%),radial-gradient(circle_at_70%_0%,var(--secondary)_0%,transparent_60%),radial-gradient(circle_at_50%_120%,var(--primary)_0%,transparent_60%)] opacity-18"
						/>
						<div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
							<div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
								<header className="sticky top-0 z-30 bg-linear-to-b from-background/90 via-background/70 to-transparent px-4 pb-4 pt-6 backdrop-blur-glass lg:hidden">
									<motion.nav
										className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 rounded-[28px] border glass-border-medium glass-bg-light px-3 py-2.5 shadow-glass-sm backdrop-blur-glass"
										initial={{ opacity: 0, y: -12 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.4, ease: "easeOut" }}
									>
										<SidebarTrigger className="size-11 rounded-2xl border glass-border-light glass-bg-medium text-foreground shadow-inner transition hover:glass-border-medium hover:glass-bg-strong" />
										<Link href="/" className="flex flex-1 justify-center">
											<div className="relative flex h-11 min-w-44 items-center justify-center rounded-2xl border glass-border-light glass-bg-medium pl-12 pr-5 text-foreground shadow-inner">
												<SyncFMIcon
													size={11}
													clickable={false}
													className="absolute -left-1 top-1/2 -translate-y-1/2 rounded-2xl"
												/>
												<span className="text-sm font-semibold uppercase tracking-[0.32em] text-muted-foreground">
													SyncFM
												</span>
											</div>
										</Link>
										<NotificationsPopover
											userId={user?.id}
											triggerClassName="size-11 rounded-2xl border glass-border-medium glass-bg-light text-foreground shadow-inner transition hover:glass-border-medium hover:glass-bg-medium"
										/>
									</motion.nav>
								</header>
								<div className="flex min-h-0 flex-1 flex-col gap-6 p-4 pb-10 sm:p-6 lg:p-12">
									{children}
								</div>
							</div>
						</div>
					</SidebarInset>
				</div>
			</div>
		</SidebarProvider>
	);
}
