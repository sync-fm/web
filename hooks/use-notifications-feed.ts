"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Notification, subscribeToNotificationInserts } from "@/lib/notifications";

type PendingMap = Record<string, boolean>;

type FetchKind = "initial" | "refresh";

interface UseNotificationsFeedOptions {
	userId?: string | null;
	limit?: number;
	pollIntervalMs?: number;
}

interface UseNotificationsFeedResult {
	notifications: Notification[];
	loading: boolean;
	error: string | null;
	isRefreshing: boolean;
	pendingIds: PendingMap;
	markingAll: boolean;
	lastUpdatedAt: Date | null;
	refresh: () => Promise<void>;
	markNotification: (notificationId: string) => Promise<boolean>;
	markAll: () => Promise<boolean>;
	clearError: () => void;
}

const DEFAULT_POLL_INTERVAL = 45_000;

export function useNotificationsFeed({
	userId,
	limit = 50,
	pollIntervalMs = DEFAULT_POLL_INTERVAL,
}: UseNotificationsFeedOptions): UseNotificationsFeedResult {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [pendingIds, setPendingIds] = useState<PendingMap>({});
	const [markingAll, setMarkingAll] = useState(false);
	const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

	const mountedRef = useRef(true);
	const limitRef = useRef(limit);

	useEffect(() => {
		limitRef.current = limit;
	}, [limit]);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const log = useCallback((...args: unknown[]) => {
		if (
			process.env.NODE_ENV === "development" &&
			process.env.NEXT_PUBLIC_DEBUG_NOTIFICATIONS === "true"
		) {
			console.info("[useNotificationsFeed]", ...args);
		}
	}, []);

	const runFetch = useCallback(
		async (kind: FetchKind): Promise<void> => {
			if (!userId) {
				if (mountedRef.current) {
					setNotifications([]);
					setLoading(false);
					setIsRefreshing(false);
				}
				return;
			}

			log(`runFetch(${kind})`, { userId, limit });

			if (kind === "initial") {
				setLoading(true);
			} else {
				setIsRefreshing(true);
			}

			const startTime = Date.now();
			const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
			let stallTimer: ReturnType<typeof setTimeout> | undefined;
			let timeoutTimer: ReturnType<typeof setTimeout> | undefined;

			try {
				stallTimer = setTimeout(() => {
					log("runFetch:stall", {
						kind,
						elapsedMs: Date.now() - startTime,
					});
				}, 5_000);
				timeoutTimer = setTimeout(() => {
					log("runFetch:timeout", {
						kind,
						elapsedMs: Date.now() - startTime,
					});
					controller?.abort();
				}, 15_000);

				const response = await fetch(
					`/api/notifications/feed?limit=${encodeURIComponent(limit.toString())}`,
					{
						method: "GET",
						credentials: "include",
						cache: "no-store",
						signal: controller?.signal,
					}
				);

				log("runFetch:response", {
					kind,
					status: response.status,
					redirected: response.redirected,
					url: response.url,
				});

				if (!response.ok) {
					log("runFetch:http-error", {
						status: response.status,
						statusText: response.statusText,
					});
					throw new Error(await response.text());
				}

				const payload = (await response.json()) as {
					notifications?: Notification[];
					lastUpdatedAt?: string;
				};

				if (mountedRef.current) {
					log("runFetch:success", {
						count: payload.notifications?.length ?? 0,
						lastUpdatedAt: payload.lastUpdatedAt,
						firstId: payload.notifications?.[0]?.id,
					});
					setNotifications(payload.notifications ?? []);
					setError(null);
					setLastUpdatedAt(payload.lastUpdatedAt ? new Date(payload.lastUpdatedAt) : new Date());
				}
			} catch (err) {
				console.error("[notifications] Failed to fetch notifications", err);
				log("runFetch:error", { message: (err as Error).message });
				if (mountedRef.current) {
					setError("Unable to load notifications right now.");
				}
			} finally {
				if (stallTimer) {
					clearTimeout(stallTimer);
				}
				if (timeoutTimer) {
					clearTimeout(timeoutTimer);
				}
				if (mountedRef.current) {
					if (kind === "initial") {
						setLoading(false);
					} else {
						setIsRefreshing(false);
					}
				}
				log("runFetch:complete", {
					kind,
					durationMs: Date.now() - startTime,
				});
			}
		},
		[userId, limit, log]
	);

	useEffect(() => {
		if (!userId) {
			setNotifications([]);
			setLoading(false);
			return;
		}

		runFetch("initial");
	}, [userId, runFetch]);

	useEffect(() => {
		log("notifications:state", {
			count: notifications.length,
			ids: notifications.map((notification) => notification.id).slice(0, 5),
		});
	}, [notifications, log]);

	useEffect(() => {
		if (!userId) {
			return;
		}

		log("subscribeToNotificationInserts:init", { userId });
		const channel = subscribeToNotificationInserts(userId, (notification) => {
			log("subscribeToNotificationInserts:event", { id: notification.id });
			setNotifications((current) => {
				if (current.some((item) => item.id === notification.id)) {
					return current;
				}
				const next = [notification, ...current];
				return next.slice(0, limitRef.current);
			});
			setLastUpdatedAt(new Date());
		});

		return () => {
			log("subscribeToNotificationInserts:cleanup", { userId });
			channel.unsubscribe();
		};
	}, [userId, log]);

	useEffect(() => {
		if (!userId) return;
		if (!pollIntervalMs || pollIntervalMs <= 0) return;

		const intervalId = setInterval(() => {
			runFetch("refresh").catch((error) => {
				console.error("[notifications] Polling refresh failed", error);
			});
		}, pollIntervalMs);

		return () => {
			clearInterval(intervalId);
		};
	}, [userId, pollIntervalMs, runFetch]);

	const markNotification = useCallback(
		async (notificationId: string) => {
			if (!notificationId) return false;

			log("markNotification:start", { notificationId });
			setPendingIds((prev) => ({ ...prev, [notificationId]: true }));

			try {
				const response = await fetch("/api/notifications/consume", {
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ notificationId }),
				});

				if (!response.ok) {
					throw new Error(await response.text());
				}

				const payload = (await response.json()) as { success?: boolean };

				if (!mountedRef.current) {
					return Boolean(payload.success);
				}

				if (payload.success) {
					log("markNotification:success", { notificationId });
					setNotifications((current) =>
						current.filter((notification) => notification.id !== notificationId)
					);
					setLastUpdatedAt(new Date());
					return true;
				}
				log("markNotification:noop", { notificationId });
				return false;
			} catch (err) {
				console.error("[notifications] Failed to consume notification", err);
				if (mountedRef.current) {
					setError("Couldn't update that notification. Please try again.");
				}
				return false;
			} finally {
				if (mountedRef.current) {
					setPendingIds((prev) => {
						const next = { ...prev };
						delete next[notificationId];
						return next;
					});
					log("markNotification:finished", { notificationId });
				}
			}
		},
		[log]
	);

	const markAll = useCallback(async () => {
		if (!userId) return false;
		if (notifications.length === 0) return true;

		setMarkingAll(true);
		log("markAll:start", { userId, count: notifications.length });

		try {
			const response = await fetch("/api/notifications/consume-all", {
				method: "POST",
				credentials: "include",
				cache: "no-store",
			});

			if (!response.ok) {
				throw new Error(await response.text());
			}

			if (!mountedRef.current) return true;

			setNotifications([]);
			setLastUpdatedAt(new Date());
			log("markAll:success");
			return true;
		} catch (err) {
			console.error("[notifications] Failed to consume all notifications", err);
			if (mountedRef.current) {
				setError("Couldn't clear notifications. Try again in a moment.");
			}
			log("markAll:error", err);
			return false;
		} finally {
			if (mountedRef.current) {
				setMarkingAll(false);
				log("markAll:finished");
			}
		}
	}, [userId, notifications.length, log]);

	const refresh = useCallback(async () => {
		await runFetch("refresh");
	}, [runFetch]);

	const clearError = useCallback(() => setError(null), []);

	return useMemo(
		() => ({
			notifications,
			loading,
			error,
			isRefreshing,
			pendingIds,
			markingAll,
			lastUpdatedAt,
			refresh,
			markNotification,
			markAll,
			clearError,
		}),
		[
			notifications,
			loading,
			error,
			isRefreshing,
			pendingIds,
			markingAll,
			lastUpdatedAt,
			refresh,
			markNotification,
			markAll,
			clearError,
		]
	);
}
