/**
 * Supabase Client-Side Utilities
 *
 * Use these utilities in client components for browser-side operations
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
	// In client components, we must use process.env directly for NEXT_PUBLIC_ variables
	// The meowenv class doesn't work in browser context
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error(
			"Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
		);
	}

	return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export async function getUserProfile() {
	const supabase = createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("Not authenticated");
	}

	const { data: profileData, error } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", user.id)
		.single();

	if (error) {
		console.error("Error fetching user profile:", error);
		throw new Error("Failed to fetch user profile");
	}

	return profileData;
}
