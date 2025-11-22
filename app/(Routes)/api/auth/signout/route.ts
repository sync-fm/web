/**
 * Sign Out API Route
 *
 * Handles user sign out by clearing the Supabase session
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
	const supabase = await createClient();

	try {
		const { error } = await supabase.auth.signOut();

		if (error) {
			console.error("Error signing out:", error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Successful sign out
		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("Unexpected error during sign out:", err);
		return NextResponse.json({ error: "Sign out failed" }, { status: 500 });
	}
}

// Also support GET for simple redirect-based sign out
export async function GET(request: NextRequest) {
	const supabase = await createClient();

	try {
		await supabase.auth.signOut();
	} catch (err) {
		console.error("Error signing out:", err);
	}

	// Always redirect to home after sign out
	const requestUrl = new URL(request.url);
	return NextResponse.redirect(new URL("/", requestUrl.origin));
}
