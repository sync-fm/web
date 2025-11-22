/**
 * OAuth Callback Handler
 *
 * This route handles the OAuth callback from Supabase Auth.
 * After successful authentication with a provider (Discord, GitHub, Google),
 * Supabase redirects here with a code that we exchange for a session.
 *
 * Based on official Supabase example:
 * https://github.com/supabase/supabase/tree/main/apps/ui-library/registry/default/blocks/social-auth-nextjs
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	const error = searchParams.get("error");
	const errorDescription = searchParams.get("error_description");

	// if "next" is in param, use it as the redirect URL
	let next = searchParams.get("next") ?? "/";
	if (!next.startsWith("/")) {
		// if "next" is not a relative URL, use the default
		next = "/";
	}

	// Handle OAuth errors (user cancelled, provider error, etc.)
	if (error) {
		console.error("OAuth callback error:", error, errorDescription);
		return NextResponse.redirect(
			`${origin}/error?message=${encodeURIComponent(errorDescription || error)}`
		);
	}

	if (code) {
		const supabase = await createClient();

		console.log("Attempting to exchange code for session");
		console.log("Code:", code);
		console.log("Request URL:", request.url);

		const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

		console.log("Exchange result:", { data, error: exchangeError });

		if (!exchangeError) {
			// Success! Redirect to the requested page
			const forwardedHost = request.headers.get("x-forwarded-host");
			const isLocalEnv = process.env.NODE_ENV === "development";

			if (isLocalEnv) {
				// Development: no load balancer
				return NextResponse.redirect(`${origin}${next}`);
			}
			if (forwardedHost) {
				// Production: behind load balancer
				return NextResponse.redirect(`https://${forwardedHost}${next}`);
			}
			return NextResponse.redirect(`${origin}${next}`);
		}

		// Error exchanging code for session
		console.error("Error exchanging code for session:", exchangeError);
		return NextResponse.redirect(
			`${origin}/error?message=${encodeURIComponent(exchangeError.message)}`
		);
	}

	// No code provided - return to error page
	return NextResponse.redirect(`${origin}/error?message=No%20authentication%20code%20provided`);
}
