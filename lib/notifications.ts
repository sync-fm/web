import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Route } from "next";
import { z } from "zod";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

export const NOTIFICATIONS_TABLE_NAME = "notifications";

export const NOTIFICATION_VARIANTS = ["info", "success", "warning", "danger", "system"] as const;

export type NotificationVariant = (typeof NOTIFICATION_VARIANTS)[number];

export interface NotificationContext {
	accentColor?: string | null;
	badgeText?: string | null;
	thumbnailUrl?: string | null;
}

export interface Notification {
	id: string;
	userId: string;
	title: string;
	body?: string;
	actionUrl?: Route;
	variant: NotificationVariant;
	createdAt: string;
	expiresAt?: string | null;
	avatarUrl?: string | null;
	icon?: string | null;
	context?: NotificationContext;
	metadata?: Record<string, unknown> | null;
	isPinned: boolean;
}

export interface CreateNotificationInput {
	userId: string;
	title: string;
	body?: string;
	actionUrl?: string;
	variant?: NotificationVariant;
	avatarUrl?: string | null;
	icon?: string | null;
	context?: NotificationContext;
	metadata?: Record<string, unknown> | null;
	expiresAt?: Date | string | null;
	isPinned?: boolean;
}

export interface NotificationQueryOptions {
	limit?: number;
	includeExpired?: boolean;
	onOrAfter?: Date;
}

export class NotificationsError extends Error {
	readonly details?: unknown;

	constructor(message: string, details?: unknown) {
		super(message);
		this.name = "NotificationsError";
		this.details = details;
	}
}

export const notificationRowSchema = z
	.object({
		id: z.string().uuid(),
		user_id: z.string().uuid(),
		title: z.string().min(1),
		body: z.string().nullable(),
		variant: z.enum(NOTIFICATION_VARIANTS),
		action_url: z.string().nullable(),
		avatar_url: z.string().nullable(),
		icon: z.string().nullable(),
		metadata: z.record(z.string(), z.any()).nullable(),
		is_pinned: z.boolean(),
		expires_at: z.string().nullable(),
		created_at: z.string(),
	})
	.transform((row) => ({
		...row,
		metadata: row.metadata ?? null,
		body: row.body ?? undefined,
		action_url: row.action_url ?? undefined,
		avatar_url: row.avatar_url ?? null,
		icon: row.icon ?? null,
		expires_at: row.expires_at ?? null,
	}));

export const createNotificationSchema = z.object({
	userId: z.string().uuid(),
	title: z.string().min(1),
	body: z.string().optional(),
	actionUrl: z.string().optional(),
	variant: z.enum(NOTIFICATION_VARIANTS).default("info"),
	avatarUrl: z.string().nullable().optional(),
	icon: z.string().nullable().optional(),
	context: z
		.object({
			accentColor: z.string().nullable().optional(),
			badgeText: z.string().nullable().optional(),
			thumbnailUrl: z.string().nullable().optional(),
		})
		.optional(),
	metadata: z.record(z.string(), z.any()).optional(),
	expiresAt: z.union([z.date(), z.string()]).nullable().optional(),
	isPinned: z.boolean().optional(),
});

interface NotificationRow extends z.infer<typeof notificationRowSchema> {
	action_url: Route;
}
type NormalizedCreateNotification = z.infer<typeof createNotificationSchema>;

export function mapRowToNotification(row: NotificationRow): Notification {
	const rawMetadata = (row.metadata ?? {}) as Record<string, unknown> & {
		context?: NotificationContext;
	};
	const { context, ...restMetadata } = rawMetadata;
	const normalizedMetadata = Object.keys(restMetadata).length > 0 ? restMetadata : null;

	return {
		id: row.id,
		userId: row.user_id,
		title: row.title,
		body: row.body,
		actionUrl: row.action_url,
		variant: row.variant,
		createdAt: row.created_at,
		expiresAt: row.expires_at,
		avatarUrl: row.avatar_url,
		icon: row.icon,
		context: context ?? undefined,
		metadata: normalizedMetadata,
		isPinned: row.is_pinned,
	};
}

export function normalizeCreateInput(input: CreateNotificationInput): NormalizedCreateNotification {
	const parsed = createNotificationSchema.parse(input);
	return {
		...parsed,
		expiresAt: parsed.expiresAt
			? typeof parsed.expiresAt === "string"
				? parsed.expiresAt
				: parsed.expiresAt.toISOString()
			: null,
	};
}

export function sanitizeMetadata(
	metadata: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
	if (!metadata || typeof metadata !== "object") {
		return null;
	}
	try {
		return JSON.parse(JSON.stringify(metadata));
	} catch (error) {
		console.warn("[notifications] Failed to sanitize metadata", error);
		return null;
	}
}

export type NotificationInsertHandler = (notification: Notification) => void;

export function subscribeToNotificationInserts(
	userId: string,
	handler: NotificationInsertHandler
): RealtimeChannel {
	try {
		const supabase = createBrowserSupabaseClient();
		const channel = supabase
			.channel(`notifications:user:${userId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "notifications",
					filter: `user_id=eq.${userId}`,
				},
				(payload) => {
					try {
						const parsedRow = notificationRowSchema.parse(payload.new) as NotificationRow;
						handler(mapRowToNotification(parsedRow));
					} catch (error) {
						console.error("[notifications] Failed to parse realtime payload", error);
					}
				}
			)
			.subscribe();

		return channel;
	} catch (error) {
		console.error("[notifications] Unable to create browser Supabase client", error);
		throw error;
	}
}
