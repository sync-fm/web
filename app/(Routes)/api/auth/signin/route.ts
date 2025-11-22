/**
 * Sign In API Route
 *
 * Initiates OAuth sign in flow with the specified provider
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
	const supabase = await createClient();
	const { provider, redirectTo } = await request.json();

	if (!provider || !["discord", "github", "google"].includes(provider)) {
		return NextResponse.json(
			{ error: "Invalid provider. Must be discord, github, or google." },
			{ status: 400 }
		);
	}

	try {
		// Get the actual host from headers (handles proxy/forwarding scenarios)
		const host = request.headers.get("host") || "localhost:3000";
		const protocol =
			request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
		const origin = `${protocol}://${host}`;

		// Use the origin of the current request for OAuth callback
		// This ensures localhost:3000 stays on localhost, and production stays on production
		const callbackUrl = new URL("/api/auth/callback", origin);

		// Add the redirect destination to the callback URL
		if (redirectTo) {
			callbackUrl.searchParams.set("next", redirectTo);
		}

		console.log("OAuth redirectTo URL:", callbackUrl.toString());

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: provider as "discord" | "github" | "google",
			options: {
				redirectTo: callbackUrl.toString(),
				scopes: getProviderScopes(provider),
			},
		});

		if (error) {
			console.error(`Error signing in with ${provider}:`, error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Return the OAuth URL for client to redirect to
		return NextResponse.json({ url: data.url });
	} catch (err) {
		console.error("Unexpected error during sign in:", err);
		return NextResponse.json({ error: "Sign in failed" }, { status: 500 });
	}
}

function getProviderScopes(provider: string): string {
	switch (provider) {
		case "discord":
			return "identify email";
		case "github":
			return "read:user user:email";
		case "google":
			return "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";
		default:
			return "";
	}
}
