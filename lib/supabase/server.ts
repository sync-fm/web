/**
 * Supabase Server-Side Utilities
 *
 * Use these utilities in server components, API routes, and server actions
 * for server-side authentication operations.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { meowenv } from "../meow-env";

const env = new meowenv();
/**
 * Create a Supabase client for server components
 * This uses the cookies from the request to maintain session
 */
export async function createClient() {
	const cookieStore = await cookies();
	return createServerClient(
		env.get("NEXT_PUBLIC_SUPABASE_URL"),
		env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						// biome-ignore lint/suspicious/useIterableCallbackReturn: pawsex
						cookiesToSet.forEach(({ name, value }) => cookieStore.set(name, value));
					} catch {
						// The `setAll` method was called from a Server Component.
						// This can be ignored if you have middleware refreshing
						// user sessions.
					}
				},
			},
		}
	);
}

/**
 * Get the current session on the server side
 * Returns null if not authenticated
 */
export async function getServerSession() {
	const supabase = await createClient();

	try {
		const {
			data: { session },
			error,
		} = await supabase.auth.getSession();

		if (error) {
			console.error("getServerSession error:", error);
			return null;
		}

		return session;
	} catch (err) {
		console.error("Unexpected error in getServerSession:", err);
		return null;
	}
}

/**
 * Get the current user on the server side
 * Returns null if not authenticated
 */
export async function getServerUser() {
	const supabase = await createClient();

	try {
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();

		if (error) {
			console.error("getServerUser error:", error);
			return null;
		}

		return user;
	} catch (err) {
		console.error("Unexpected error in getServerUser:", err);
		return null;
	}
}

/**
 * Get the user's profile from the server side
 * Returns null if profile doesn't exist or user not authenticated
 */
export async function getServerUserProfile() {
	const supabase = await createClient();
	const user = await getServerUser();

	if (!user) return null;

	try {
		const { data: profile, error } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", user.id)
			.single();

		if (error) {
			console.error("Error getting profile:", error);
			return null;
		}

		return profile;
	} catch (err) {
		console.error("Unexpected error in getServerUserProfile:", err);
		return null;
	}
}

/**
 * Check if the current user is an admin (server-side)
 */
export async function isServerAdmin(): Promise<boolean> {
	const profile = await getServerUserProfile();
	return profile?.is_admin ?? false;
}
