"use client";

import { Bell, CheckCheck, Loader2, RefreshCcw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { NotificationCard } from "@/components/dashboard/notifications/NotificationCard";
import { NotificationFilters } from "@/components/dashboard/notifications/NotificationFilters";
import {
	type Notification,
	type NotificationVariant,
	subscribeToNotificationInserts,
} from "@/lib/notifications";
import {
	consumeAllNotificationsAction,
	consumeNotificationAction,
	listNotificationsAction,
} from "@/lib/notifications.server";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type VariantFilter = "all" | NotificationVariant;
type PendingMap = Record<string, boolean>;

interface NotificationsPageClientProps {
	initialUserId: string | null;
}

export default function NotificationsPageClient({ initialUserId }: NotificationsPageClientProps) {
	const router = useRouter();
	const [userId, setUserId] = useState<string | null>(initialUserId);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [pendingIds, setPendingIds] = useState<PendingMap>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [variantFilter, setVariantFilter] = useState<VariantFilter>("all");
	const [showPinnedOnly, setShowPinnedOnly] = useState(false);
	const [markingAll, setMarkingAll] = useState(false);
	const [isRefreshing, startRefresh] = useTransition();

	useEffect(() => {
		if (initialUserId) return;

		let cancelled = false;
		const supabase = createClient();

		supabase.auth.getUser().then(({ data }) => {
			if (!cancelled) {
				setUserId(data.user?.id ?? null);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [initialUserId]);

	useEffect(() => {
		if (!userId) {
			setLoading(false);
			return;
		}

		let active = true;
		setLoading(true);
		setError(null);

		listNotificationsAction({ limit: 100 })
			.then((items) => {
				if (active) {
					setNotifications(items);
				}
			})
			.catch((err) => {
				console.error("Failed to fetch notifications", err);
				if (active) {
					setError("Unable to load notifications right now.");
				}
			})
			.finally(() => {
				if (active) {
					setLoading(false);
				}
			});

		const channel = subscribeToNotificationInserts(userId, (notification) => {
			setNotifications((current) => {
				if (current.some((item) => item.id === notification.id)) {
					return current;
				}
				return [notification, ...current];
			});
		});

		return () => {
			active = false;
			channel.unsubscribe();
		};
	}, [userId]);

	const filteredNotifications = useMemo(() => {
		let items = [...notifications];

		if (variantFilter !== "all") {
			items = items.filter((notification) => notification.variant === variantFilter);
		}

		if (showPinnedOnly) {
			items = items.filter((notification) => notification.isPinned);
		}

		if (search.trim()) {
			const needle = search.toLowerCase();
			items = items.filter((notification) => {
				return (
					notification.title.toLowerCase().includes(needle) ||
					(notification.body ?? "").toLowerCase().includes(needle) ||
					(notification.metadata &&
						JSON.stringify(notification.metadata).toLowerCase().includes(needle))
				);
			});
		}

		return items;
	}, [notifications, variantFilter, showPinnedOnly, search]);

	const pinnedNotifications = filteredNotifications.filter((notification) => notification.isPinned);
	const otherNotifications = filteredNotifications.filter((notification) => !notification.isPinned);

	const handleDismiss = (notificationId: string) => {
		setPendingIds((prev) => ({ ...prev, [notificationId]: true }));
		consumeNotificationAction(notificationId)
			.then((result) => {
				if (!result) return;
				setNotifications((current) =>
					current.filter((notification) => notification.id !== notificationId)
				);
				setExpandedId((current) => (current === notificationId ? null : current));
			})
			.catch((err) => {
				console.error("Failed to dismiss notification", err);
			})
			.finally(() => {
				setPendingIds((prev) => {
					const next = { ...prev };
					delete next[notificationId];
					return next;
				});
			});
	};

	const handleOpen = (notification: Notification) => {
		const actionUrl = notification.actionUrl;
		if (!actionUrl) return;

		setPendingIds((prev) => ({ ...prev, [notification.id]: true }));
		consumeNotificationAction(notification.id)
			.then(() => {
				setNotifications((current) => current.filter((item) => item.id !== notification.id));
				setExpandedId((current) => (current === notification.id ? null : current));

				if (actionUrl.startsWith("http")) {
					window.open(actionUrl, "_blank", "noopener,noreferrer");
				} else {
					router.push(actionUrl);
				}
			})
			.catch((err) => {
				console.error("Failed to open notification", err);
			})
			.finally(() => {
				setPendingIds((prev) => {
					const next = { ...prev };
					delete next[notification.id];
					return next;
				});
			});
	};

	const handleMarkAll = () => {
		if (notifications.length === 0) return;

		setMarkingAll(true);
		consumeAllNotificationsAction()
			.then(() => {
				setNotifications([]);
				setExpandedId(null);
			})
			.catch((err) => {
				console.error("Failed to clear notifications", err);
			})
			.finally(() => setMarkingAll(false));
	};

	const handleRefresh = () => {
		if (!userId) return;

		startRefresh(() => {
			listNotificationsAction({ limit: 100 })
				.then((items) => setNotifications(items))
				.catch((err) => console.error("Failed to refresh notifications", err));
		});
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	return (
		<div className="space-y-8">
			<DashboardHeader
				title="Notifications"
				subtitle="Manage your notifications and stay updated"
				icon={Bell}
				action={
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleRefresh}
							disabled={isRefreshing || loading}
							className="glass-bg-light glass-border-medium flex items-center gap-2 rounded-lg px-4 py-2 text-foreground transition hover:glass-bg-medium disabled:opacity-50"
						>
							<RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
							Refresh
						</button>
						<button
							type="button"
							disabled={markingAll || notifications.length === 0}
							onClick={handleMarkAll}
							className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-brand-sm transition hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{markingAll ? (
								<Loader2 className="h-5 w-5 animate-spin" />
							) : (
								<CheckCheck className="h-5 w-5" />
							)}
							<span>Mark all read</span>
						</button>
					</div>
				}
			/>

			<NotificationFilters
				search={search}
				onSearchChange={setSearch}
				variantFilter={variantFilter}
				onVariantFilterChange={setVariantFilter}
				showPinnedOnly={showPinnedOnly}
				onShowPinnedOnlyChange={setShowPinnedOnly}
			/>

			<div className="space-y-4">
				{error ? (
					<div className="rounded-2xl border border-red-500/30 glass-bg-light p-6 text-red-400 backdrop-blur-xl">
						<h3 className="font-semibold">Error loading notifications</h3>
						<p className="text-sm">{error}</p>
					</div>
				) : filteredNotifications.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-2 rounded-2xl border glass-border-light glass-bg-light p-10 text-center backdrop-blur-xl">
						<Sparkles className="size-8 text-muted-faint" />
						<h3 className="font-semibold text-foreground">All caught up</h3>
						<p className="text-sm text-muted-medium">No notifications to display.</p>
					</div>
				) : (
					<div className="space-y-6">
						{pinnedNotifications.length > 0 && (
							<div className="space-y-4">
								<h4 className="text-sm font-medium text-muted-medium">Pinned</h4>
								<div className="space-y-4">
									{pinnedNotifications.map((notification) => (
										<NotificationCard
											key={notification.id}
											notification={notification}
											expanded={expandedId === notification.id}
											onToggle={(open) => setExpandedId(open ? notification.id : null)}
											onOpen={() => handleOpen(notification)}
											onDismiss={() => handleDismiss(notification.id)}
											pending={Boolean(pendingIds[notification.id])}
										/>
									))}
								</div>
							</div>
						)}

						{otherNotifications.length > 0 && (
							<div className="space-y-4">
								{pinnedNotifications.length > 0 && (
									<h4 className="text-sm font-medium text-muted-medium">Recent</h4>
								)}
								<div className="space-y-4">
									{otherNotifications.map((notification) => (
										<NotificationCard
											key={notification.id}
											notification={notification}
											expanded={expandedId === notification.id}
											onToggle={(open) => setExpandedId(open ? notification.id : null)}
											onOpen={() => handleOpen(notification)}
											onDismiss={() => handleDismiss(notification.id)}
											pending={Boolean(pendingIds[notification.id])}
										/>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
