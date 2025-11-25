/**
 * Supabase Middleware Utilities
 *
 * Use these utilities in Next.js middleware to protect routes
 * and handle authentication at the edge.
 */

import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { meowenv } from "../meow-env";

const env = new meowenv(false);

/**
 * Create a Supabase client for middleware (edge runtime)
 */
export function createClient(request: NextRequest) {
	let response = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		env.get("NEXT_PUBLIC_SUPABASE_URL"),
		env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) => {
						request.cookies.set(name, value);
					});
					response = NextResponse.next({
						request,
					});
					cookiesToSet.forEach(({ name, value }) => {
						response.cookies.set(name, value);
					});
				},
			},
		}
	);

	return { supabase, response };
}

/**
 * Require authentication middleware
 * Redirects to sign-in page if user is not authenticated
 *
 * @example
 * ```ts
 * // In middleware.ts
 * export async function middleware(req: NextRequest) {
 *   if (req.nextUrl.pathname.startsWith('/dashboard')) {
 *     return requireAuth(req)
 *   }
 * }
 * ```
 */
export async function requireAuth(req: NextRequest) {
	const { supabase, response } = createClient(req);

	try {
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();

		if (error) {
			console.error("requireAuth supabase.getUser error:", error);
		}

		if (!user) {
			// Store the original URL to redirect back after sign-in
			const signInUrl = new URL("/auth/signin", req.url);
			signInUrl.searchParams.set("redirect", req.nextUrl.pathname);
			return NextResponse.redirect(signInUrl);
		}

		return response;
	} catch (err) {
		console.error("Unexpected error in requireAuth:", err);
		const signInUrl = new URL("/auth/signin", req.url);
		return NextResponse.redirect(signInUrl);
	}
}

/**
 * Require admin middleware
 * Redirects to home page if user is not an admin
 */
export async function requireAdmin(req: NextRequest) {
	const { supabase, response } = createClient(req);

	try {
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();

		if (error || !user) {
			const signInUrl = new URL("/auth/signin", req.url);
			return NextResponse.redirect(signInUrl);
		}

		// Check if user is admin
		const { data: profile } = await supabase
			.from("profiles")
			.select("is_admin")
			.eq("id", user.id)
			.single();

		if (!profile?.is_admin) {
			// Not an admin, redirect to home
			const homeUrl = new URL("/", req.url);
			return NextResponse.redirect(homeUrl);
		}

		return response;
	} catch (err) {
		console.error("Unexpected error in requireAdmin:", err);
		const homeUrl = new URL("/", req.url);
		return NextResponse.redirect(homeUrl);
	}
}

/**
 * Refresh session middleware
 * Ensures the session is fresh on every request
 * Use this as a base middleware for all routes
 */
export async function refreshSession(req: NextRequest) {
	const { supabase, response } = createClient(req);

	// This will refresh the session if needed
	await supabase.auth.getSession();

	return response;
}
