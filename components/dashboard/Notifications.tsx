"use client";

import { BellIcon, CheckCheck, ExternalLink, Inbox, Loader2, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_NOTIFICATION_THEME, NOTIFICATION_THEME } from "@/components/notifications/theme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotificationsFeed } from "@/hooks/use-notifications-feed";
import type { Notification } from "@/lib/notifications";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";

interface NotificationsPopoverProps {
	userId?: string | null;
	triggerClassName?: string;
}

interface NotificationItemProps {
	notification: Notification;
	pending: boolean;
	onOpen: () => void;
	onMark: () => void;
}

const SKELETON_KEYS = ["notif-skeleton-a", "notif-skeleton-b", "notif-skeleton-c"] as const;

function NotificationItem({ notification, pending, onOpen, onMark }: NotificationItemProps) {
	const theme = NOTIFICATION_THEME[notification.variant] ?? DEFAULT_NOTIFICATION_THEME;
	const accentColor = notification.context?.accentColor ?? theme.spotlight;

	return (
		<div
			className={cn(
				"group relative flex flex-col gap-3 rounded-xl border border-white/10 bg-white/10 p-4 text-white/80 shadow-sm transition-all hover:border-white/30 hover:bg-white/20 hover:text-white",
				pending && "opacity-50 pointer-events-none"
			)}
		>
			<div className="flex items-start gap-3">
				<div className="relative shrink-0">
					<Avatar className="size-8 glass-border-light shadow-inner">
						<AvatarImage
							src={notification.context?.thumbnailUrl ?? notification.avatarUrl ?? undefined}
							alt="Notification"
						/>
						<AvatarFallback className="glass-bg-medium text-xs text-muted-medium">
							{getInitials(notification.title)}
						</AvatarFallback>
					</Avatar>
					{accentColor && (
						<span
							className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 glass-border-light shadow-sm"
							style={{ backgroundColor: accentColor }}
						/>
					)}
				</div>
				<div className="min-w-0 flex-1 space-y-1">
					<div className="flex items-start justify-between gap-2">
						<p className="text-sm font-medium leading-none text-foreground">{notification.title}</p>
						<span className="shrink-0 text-[10px] font-medium text-muted-faint">
							{formatRelativeTime(notification.createdAt)}
						</span>
					</div>
					{notification.body && (
						<p className="line-clamp-2 text-xs leading-relaxed text-muted-light group-hover:text-muted-medium">
							{notification.body}
						</p>
					)}
				</div>
			</div>

			<div className="flex items-center justify-end gap-2 pt-1 opacity-0 transition-opacity group-hover:opacity-100">
				{notification.actionUrl && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						disabled={pending}
						onClick={(e) => {
							e.stopPropagation();
							onOpen();
						}}
						className="h-6 gap-1.5 rounded-lg px-2 text-[10px] font-medium text-muted-light hover:glass-bg-medium hover:text-foreground"
					>
						{pending ? (
							<Loader2 className="size-3 animate-spin" />
						) : (
							<ExternalLink className="size-3" />
						)}
						Open
					</Button>
				)}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={pending}
					onClick={(e) => {
						e.stopPropagation();
						onMark();
					}}
					className="h-6 gap-1.5 rounded-lg px-2 text-[10px] font-medium text-white/60 hover:bg-white/10 hover:text-white"
				>
					{pending ? (
						<Loader2 className="size-3 animate-spin" />
					) : (
						<CheckCheck className="size-3" />
					)}
					Mark read
				</Button>
			</div>
		</div>
	);
}

function NotificationSkeleton() {
	return (
		<div className="flex flex-col gap-3 rounded-xl glass-border-light glass-bg-light p-4">
			<div className="flex items-start gap-3">
				<div className="size-8 shrink-0 rounded-full glass-bg-medium animate-pulse" />
				<div className="flex-1 space-y-2">
					<div className="h-4 w-2/3 rounded glass-bg-medium animate-pulse" />
					<div className="h-3 w-full rounded glass-bg-light animate-pulse" />
				</div>
			</div>
		</div>
	);
}

export function NotificationsPopover({ userId, triggerClassName }: NotificationsPopoverProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);

	const log = useCallback((event: string, payload?: Record<string, unknown>) => {
		console.info("[NotificationsPopover]", event, payload);
	}, []);

	const {
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
	} = useNotificationsFeed({ userId, limit: 30, pollIntervalMs: 60_000 });

	const unreadCount = notifications.length;

	const triggerLabel = useMemo(() => {
		if (!userId) return "Notifications unavailable";
		if (unreadCount === 0) return "No unread notifications";
		if (unreadCount === 1) return "1 unread notification";
		return `${unreadCount} unread notifications`;
	}, [userId, unreadCount]);

	useEffect(() => {
		log("state:update", {
			userId,
			open,
			unreadCount,
			loading,
			error,
			lastUpdatedAt: lastUpdatedAt?.toISOString() ?? null,
			preview: notifications.map((notification) => notification.id).slice(0, 5),
		});
	}, [log, userId, open, unreadCount, loading, error, lastUpdatedAt, notifications]);

	useEffect(() => {
		if (!open || !userId) return;
		log("popover:open", { userId });
		refresh().catch((err) => {
			console.error("[notifications] refresh on open failed", err);
		});
	}, [open, refresh, userId, log]);

	const handleMarkOne = useCallback(
		async (notificationId: string) => {
			await markNotification(notificationId);
		},
		[markNotification]
	);

	const handleOpenNotification = useCallback(
		async (notification: Notification) => {
			if (!notification.actionUrl) return;
			const success = await markNotification(notification.id);
			if (!success) return;

			if (notification.actionUrl.startsWith("http")) {
				window.open(notification.actionUrl, "_blank", "noopener,noreferrer");
			} else {
				router.push(notification.actionUrl);
			}
		},
		[markNotification, router]
	);

	const handleMarkAll = useCallback(async () => {
		await markAll();
	}, [markAll]);

	const handleViewHistory = useCallback(() => {
		setOpen(false);
		router.push("/dashboard/notifications");
	}, [router]);

	return (
		<Popover
			open={open}
			onOpenChange={(nextOpen) => {
				log("popover:onOpenChange", { nextOpen });
				setOpen(nextOpen);
			}}
		>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={cn(
						"relative text-muted-medium hover:glass-bg-medium hover:text-foreground",
						triggerClassName
					)}
					disabled={!userId}
					aria-label={triggerLabel}
				>
					<BellIcon className="size-5" />
					{unreadCount > 0 && (
						<span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background" />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="w-[380px] rounded-2xl glass-border-light bg-background bg-linear-to-br from-glass-bg-medium/80 via-glass-bg-light/60 to-transparent p-0 text-foreground shadow-glass-xl backdrop-blur-2xl"
			>
				<div className="flex items-center justify-between px-4 py-3 border-b glass-border-subtle">
					<h4 className="text-sm font-medium text-muted-strong">Notifications</h4>
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="size-7 rounded-lg text-muted-subtle hover:glass-bg-medium hover:text-foreground"
							onClick={() => refresh()}
							disabled={loading || isRefreshing}
							title="Refresh"
						>
							<RefreshCcw className={cn("size-3.5", isRefreshing && "animate-spin")} />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="size-7 rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
							onClick={handleMarkAll}
							disabled={markingAll || unreadCount === 0}
							title="Mark all as read"
						>
							<CheckCheck className="size-3.5" />
						</Button>
					</div>
				</div>

				{error && (
					<div className="mx-4 mb-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive-foreground">
						<p>{error}</p>
						<Button
							variant="link"
							size="sm"
							onClick={clearError}
							className="mt-1 h-auto p-0 text-destructive-foreground/80 underline hover:text-destructive-foreground"
						>
							Dismiss
						</Button>
					</div>
				)}

				<div className="max-h-[400px] overflow-y-auto px-3 pb-3">
					{loading ? (
						<div className="space-y-2">
							{SKELETON_KEYS.map((key) => (
								<NotificationSkeleton key={key} />
							))}
						</div>
					) : notifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-3 rounded-xl glass-border-subtle glass-bg-light py-12 text-center">
							<div className="rounded-full glass-bg-light p-3">
								<Inbox className="size-6 text-muted-subtle" />
							</div>
							<div className="space-y-1">
								<p className="text-sm font-medium text-muted-medium">All caught up</p>
								<p className="text-xs text-muted-faint">No new notifications to show</p>
							</div>
						</div>
					) : (
						<div className="space-y-2">
							{notifications.map((notification) => (
								<NotificationItem
									key={notification.id}
									notification={notification}
									pending={Boolean(pendingIds[notification.id])}
									onOpen={() => handleOpenNotification(notification)}
									onMark={() => handleMarkOne(notification.id)}
								/>
							))}
						</div>
					)}
				</div>

				<div className="border-t glass-border-subtle p-2">
					<Button
						variant="ghost"
						className="w-full justify-center rounded-xl text-xs text-muted-subtle hover:glass-bg-medium hover:text-foreground"
						onClick={handleViewHistory}
					>
						View all notifications
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
