/**
 * Notification Card Component
 * Displays individual notification with actions
 */

"use client";

import { CheckCheck, ExternalLink, Loader2, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Notification } from "@/lib/notifications";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
	notification: Notification;
	expanded: boolean;
	onToggle: (open: boolean) => void;
	onOpen: () => void;
	onDismiss: () => void;
	pending: boolean;
}

function formatRelativeTime(iso: string) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "Unknown";

	const diff = Date.now() - date.getTime();
	const minute = 60_000;
	const hour = 60 * minute;
	const day = 24 * hour;

	if (diff < minute) return "Just now";
	if (diff < hour) {
		const mins = Math.floor(diff / minute);
		return `${mins} min${mins === 1 ? "" : "s"} ago`;
	}
	if (diff < day) {
		const hrs = Math.floor(diff / hour);
		return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
	}
	const days = Math.floor(diff / day);
	return `${days} day${days === 1 ? "" : "s"} ago`;
}

function getInitials(text?: string | null) {
	if (!text) return "";
	const parts = text
		.split(" ")
		.filter(Boolean)
		.map((part) => part[0]?.toUpperCase())
		.join("");
	return parts.slice(0, 2) || "";
}

export function NotificationCard({
	notification,
	expanded,
	onToggle,
	onOpen,
	onDismiss,
	pending,
}: NotificationCardProps) {
	return (
		<div
			className={cn(
				"group relative overflow-hidden rounded-2xl border glass-border-light glass-bg-light backdrop-blur-xl shadow-glass-sm transition-all hover:glass-bg-medium",
				pending && "opacity-50 pointer-events-none"
			)}
		>
			<div className="flex items-start gap-4 p-6">
				<div className="relative shrink-0">
					<Avatar className="size-12 border glass-border-light">
						<AvatarImage
							src={notification.context?.thumbnailUrl ?? notification.avatarUrl ?? undefined}
							alt="Notification thumbnail"
						/>
						<AvatarFallback className="glass-bg-medium text-foreground/70">
							{getInitials(notification.title)}
						</AvatarFallback>
					</Avatar>
					{notification.context?.accentColor && (
						<span
							className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 glass-border-light"
							style={{ backgroundColor: notification.context.accentColor ?? undefined }}
						/>
					)}
				</div>
				<div className="min-w-0 flex-1 space-y-2">
					<div className="flex items-start justify-between gap-2">
						<div>
							<h3 className="font-semibold text-foreground">{notification.title}</h3>
							<p className="text-xs text-muted-faint">
								{formatRelativeTime(notification.createdAt)}
							</p>
						</div>
						<div className="flex items-center gap-1">
							{notification.isPinned && <Star className="size-4 fill-orange-400 text-orange-400" />}
							<Button
								variant="ghost"
								size="icon"
								className="size-8 text-muted-faint hover:glass-bg-medium hover:text-foreground"
								onClick={onDismiss}
								disabled={pending}
							>
								<CheckCheck className="size-4" />
								<span className="sr-only">Mark read</span>
							</Button>
						</div>
					</div>

					{notification.body && (
						<div className="text-sm text-muted-medium">{notification.body}</div>
					)}

					{notification.actionUrl && (
						<div className="pt-2">
							<Button
								size="sm"
								onClick={onOpen}
								disabled={pending}
								className="glass-bg-medium glass-border-medium text-foreground hover:glass-bg-strong"
							>
								{pending ? (
									<Loader2 className="mr-2 size-3 animate-spin" />
								) : (
									<ExternalLink className="mr-2 size-3" />
								)}
								Open
							</Button>
						</div>
					)}

					{notification.metadata && Object.keys(notification.metadata).length > 0 && (
						<Collapsible open={expanded} onOpenChange={onToggle} className="mt-2">
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-auto p-0 text-xs text-muted-faint hover:text-foreground"
								>
									{expanded ? "Hide details" : "Show details"}
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent className="mt-2 rounded-md glass-bg-medium p-3 text-xs text-muted-medium">
								<pre className="whitespace-pre-wrap font-mono text-xs">
									{JSON.stringify(notification.metadata, null, 2)}
								</pre>
							</CollapsibleContent>
						</Collapsible>
					)}
				</div>
			</div>
		</div>
	);
}
