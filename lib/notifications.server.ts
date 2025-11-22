"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import type { Route } from "next";
import type { z } from "zod";
import { createClient as createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import {
	type CreateNotificationInput,
	mapRowToNotification,
	NOTIFICATIONS_TABLE_NAME,
	type Notification,
	type NotificationQueryOptions,
	NotificationsError,
	normalizeCreateInput,
	notificationRowSchema,
	sanitizeMetadata,
} from "./notifications";

interface NotificationRow extends z.infer<typeof notificationRowSchema> {
	action_url: Route;
}

function handlePostgrestError(error: PostgrestError, context: string): never {
	console.error(`[notifications] ${context}`, error);
	throw new NotificationsError(context, error);
}

async function requireAuthenticatedUser() {
	const user = await getServerUser();

	if (!user) {
		throw new NotificationsError("User must be authenticated to manage notifications");
	}

	return user;
}

export async function fetchNotifications(
	userId: string,
	options: NotificationQueryOptions = {}
): Promise<Notification[]> {
	const { limit = 20, includeExpired = false, onOrAfter } = options;
	const supabase = await createServerSupabaseClient();

	let query = supabase
		.from(NOTIFICATIONS_TABLE_NAME)
		.select("*")
		.eq("user_id", userId)
		.order("is_pinned", { ascending: false })
		.order("created_at", { ascending: false })
		.limit(limit);

	if (!includeExpired) {
		const nowIso = new Date().toISOString();
		query = query.or(`expires_at.is.null,expires_at.gt.${nowIso}`);
	}

	if (onOrAfter) {
		query = query.gte("created_at", onOrAfter.toISOString());
	}

	const { data, error } = await query;

	if (error) {
		handlePostgrestError(error, "Failed to fetch notifications");
	}

	const parsedRows = notificationRowSchema.array().parse(data ?? []) as NotificationRow[];
	return parsedRows.map(mapRowToNotification);
}

export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
	const normalized = normalizeCreateInput(input);
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from(NOTIFICATIONS_TABLE_NAME)
		.insert({
			user_id: normalized.userId,
			title: normalized.title,
			body: normalized.body ?? null,
			variant: normalized.variant,
			action_url: normalized.actionUrl ?? null,
			avatar_url: normalized.avatarUrl ?? null,
			icon: normalized.icon ?? null,
			metadata: sanitizeMetadata({
				...normalized.metadata,
				context: normalized.context ?? undefined,
			}),
			is_pinned: normalized.isPinned ?? false,
			expires_at: normalized.expiresAt,
		})
		.select("*")
		.single();

	if (error) {
		handlePostgrestError(error, "Failed to create notification");
	}

	return mapRowToNotification(notificationRowSchema.parse(data) as NotificationRow);
}

export async function consumeNotification(
	userId: string,
	notificationId: string
): Promise<Notification | null> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("notifications")
		.delete()
		.eq("user_id", userId)
		.eq("id", notificationId)
		.select("*")
		.single();

	if (error) {
		if ((error as PostgrestError).code === "PGRST116") {
			return null;
		}
		handlePostgrestError(error, "Failed to consume notification");
	}

	if (!data) {
		return null;
	}

	return mapRowToNotification(notificationRowSchema.parse(data) as NotificationRow);
}

export async function consumeAllNotifications(userId: string): Promise<number> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from(NOTIFICATIONS_TABLE_NAME)
		.delete()
		.eq("user_id", userId)
		.select("id");

	if (error) {
		handlePostgrestError(error, "Failed to consume all notifications");
	}

	return data?.length ?? 0;
}

export async function hasUnreadNotifications(userId: string): Promise<boolean> {
	const supabase = await createServerSupabaseClient();

	const { count, error } = await supabase
		.from(NOTIFICATIONS_TABLE_NAME)
		.select("id", { count: "exact", head: true })
		.eq("user_id", userId);

	if (error) {
		handlePostgrestError(error, "Failed to check unread notifications");
	}

	return (count ?? 0) > 0;
}

export async function listNotificationsAction(
	options: NotificationQueryOptions = {}
): Promise<Notification[]> {
	const user = await requireAuthenticatedUser();
	return fetchNotifications(user.id, options);
}

export async function consumeNotificationAction(
	notificationId: string
): Promise<Notification | null> {
	const user = await requireAuthenticatedUser();
	return consumeNotification(user.id, notificationId);
}

export async function consumeAllNotificationsAction(): Promise<number> {
	const user = await requireAuthenticatedUser();
	return consumeAllNotifications(user.id);
}
