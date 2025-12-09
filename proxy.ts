import { type NextRequest, NextResponse } from "next/server";
import { SyncFM } from "syncfm.ts";
import syncfmconfig from "@/syncfm.config";
import { useMetrics } from "@/lib/analytics/usageMetrics.actions";
import { extractApiKey, isValidApiKeyFormat, verifyApiKey } from "@/lib/api-keys";
import { checkRateLimit, type RateLimitResult } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/middleware";
import { getRateLimitIP } from "@/lib/utils/ip";

// Lazy initialize SyncFM to avoid constructor side-effects at module import time
let _syncfm: SyncFM | null = null;
function getSyncfm(): SyncFM {
	if (!_syncfm) {
		try {
			_syncfm = new SyncFM(syncfmconfig);
		} catch (err) {
			// If construction fails (missing envs in some runtimes), keep null and
			// allow middleware callers to handle absence gracefully.
			console.warn("SyncFM initialization in middleware failed:", err);
			throw err;
		}
	}
	return _syncfm;
}

function decodePathToFullUrl(path: string): string {
	let decoded = decodeURIComponent(path);

	// Fix cases like http:/ or https:/ (missing one slash)
	decoded = decoded.replace(/^https?:\/(?!\/)/, (match) => `${match}/`);

	return decoded;
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// === RATE LIMITING FOR SPECIFIC API ROUTES ===
	// Only rate limit conversion endpoints that make external API calls
	// Note: Route matching is case-sensitive! Use exact casing from route files
	const rateLimitedRoutes = ["/api/convertAll", "/api/handle"];
	const shouldRateLimit = rateLimitedRoutes.some((route) => pathname.includes(route));

	if (shouldRateLimit) {
		// Create Supabase client for authentication
		const { supabase } = createClient(request);

		// Check if request is from Discord bot
		const discordBotSecret = request.headers.get("x-discord-bot-secret");
		const discordUserId = request.headers.get("x-discord-user-id");

		// IMPORTANT: Don't write logic between createClient and getClaims()
		// Get user claims (validates JWT - more reliable than getUser in middleware)
		const { data } = await supabase.auth.getClaims();
		const claims = data?.claims;
		const user = claims ? { id: claims.sub as string } : null;

		// Extract API key from request
		const apiKey = extractApiKey(request.headers, request.nextUrl.searchParams);
		const realIP = getRateLimitIP(request);

		let rateLimitResult: RateLimitResult;
		let identifier: string;
		let userId: string | undefined;
		let apiKeyId: string | undefined;

		// Tier limits configuration
		const tierLimits: Record<string, number> = {
			free: 100,
			pro: 100,
			enterprise: 100,
		};

		// Determine rate limit based on authentication method
		// Priority: Discord Bot > API Key > Authenticated User > Anonymous
		if (discordBotSecret && discordUserId) {
			// === DISCORD BOT REQUEST ===
			const expectedSecret = process.env.DISCORD_BOT_SECRET;

			// Validate the shared secret
			if (!expectedSecret || discordBotSecret !== expectedSecret) {
				return NextResponse.json({ error: "Invalid Discord bot secret" }, { status: 401 });
			}

			// Look up linked SyncFM account by Discord identity
			// Query the auth.identities table to find a user with this Discord provider ID
			const { data: identityData } = await supabase.rpc("get_user_by_discord_id", {
				discord_id: discordUserId,
			});

			if (identityData?.user_id) {
				// Linked user - use their SyncFM rate limits
				const { data: profile } = await supabase
					.from("profiles")
					.select("subscription_tier")
					.eq("id", identityData.user_id)
					.single();

				const tier = profile?.subscription_tier || "free";
				identifier = `user:${identityData.user_id}`;
				userId = identityData.user_id;
				rateLimitResult = await checkRateLimit(identifier, tierLimits[tier] || 100);
			} else {
				// Unlinked Discord user - stricter rate limit (50/hour)
				identifier = `discord:${discordUserId}`;
				rateLimitResult = await checkRateLimit(identifier, 50);
			}
		} else if (apiKey) {
			// Validate API key format
			if (!isValidApiKeyFormat(apiKey)) {
				return NextResponse.json({ error: "Invalid API key format" }, { status: 401 });
			}

			// Fetch API key data from database
			const { data: keyData, error: keyError } = await supabase
				.from("api_keys")
				.select("id, key_hash, rate_limit_per_hour, is_active, user_id")
				.eq("is_active", true)
				.limit(1000);

			if (keyError || !keyData) {
				return NextResponse.json({ error: "Failed to validate API key" }, { status: 500 });
			}

			// Find matching key by verifying hash
			const matchingKey = keyData.find((k: { key_hash: string }) =>
				verifyApiKey(apiKey, k.key_hash)
			);

			if (!matchingKey) {
				return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
			}

			// Use API key for rate limiting
			identifier = `api_key:${matchingKey.id}`;
			userId = matchingKey.user_id;
			apiKeyId = matchingKey.id;
			rateLimitResult = await checkRateLimit(identifier, matchingKey.rate_limit_per_hour);

			// Update last_used_at (fire and forget - don't await)
			void supabase
				.from("api_keys")
				.update({ last_used_at: new Date().toISOString() })
				.eq("id", matchingKey.id);
		} else if (user) {
			// Authenticated user - get rate limit by subscription tier
			const { data: profile } = await supabase
				.from("profiles")
				.select("subscription_tier")
				.eq("id", user.id)
				.single();

			const tier = profile?.subscription_tier || "free";

			identifier = `user:${user.id}`;
			userId = user.id;
			rateLimitResult = await checkRateLimit(identifier, tierLimits[tier] || 100);
		} else {
			// Anonymous user - rate limit by IP
			identifier = `ip:${realIP}`;
			rateLimitResult = await checkRateLimit(identifier, 50);
		}

		// Check if rate limited
		if (!rateLimitResult.success) {
			return NextResponse.json(
				{
					error: "Rate limit exceeded",
					message: `You have exceeded the rate limit of ${rateLimitResult.limit} requests per hour`,
					limit: rateLimitResult.limit,
					remaining: rateLimitResult.remaining,
					resetTime: rateLimitResult.resetTime,
					resetIn: `${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds`,
				},
				{
					status: 429,
					headers: {
						"X-RateLimit-Limit": rateLimitResult.limit.toString(),
						"X-RateLimit-Remaining": "0",
						"X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
						"Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
					},
				}
			);
		}

		// Log usage to database (fire and forget - don't await to avoid slowing down requests)
		// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
		void useMetrics({
			userId: userId || undefined,
			apiKeyId: apiKeyId || undefined,
			endpoint: pathname,
			ipAddress: realIP,
			userAgent: request.headers.get("user-agent"),
		});
	}

	// === EXISTING SYNCFM SUBDOMAIN ROUTING LOGIC ===
	const hostHeader = request.headers.get("host") || "";
	const hostname = hostHeader.split(":")[0];
	const { search } = request.nextUrl;

	// Determine subdomain rules:
	// - For hosts that end with ".localhost" treat two-label hosts like "yt.localhost" as having a subdomain.
	// - For normal domains, require 3+ labels to consider the first label a subdomain (e.g. "yt.syncfm.dev").
	// - For single-label hosts like "localhost" treat as no subdomain.
	let subdomain: string | undefined;
	const labels = hostname.split(".");
	if (hostname === "localhost") {
		subdomain = undefined;
	} else if (hostname.endsWith(".localhost") && labels.length >= 2) {
		subdomain = labels[0];
	} else if (labels.length >= 3) {
		subdomain = labels[0];
	} else {
		subdomain = undefined;
	}

	// If subdomain is detected and not 'www', handle subdomain redirection for all paths
	if (subdomain && subdomain !== "www") {
		// Prevent redirect loops: don't rewrite internal framework or API routes
		// or requests that are already hitting our handler.
		const skipPrefixes = [
			"/api/",
			"/_next/",
			"/_static/",
			"/favicon.ico",
			"/robots.txt",
			"/sitemap.xml",
			"/song",
			"/album",
			"/artist",
			"/playlist",
		];
		for (const prefix of skipPrefixes) {
			if (pathname.startsWith(prefix)) return NextResponse.next();
		}

		return handleSubdomainRedirection(request, subdomain) || NextResponse.next();
	}

	// For root hosts, only handle if path starts with /http or /https
	if (pathname.startsWith("/http") || pathname.startsWith("/https")) {
		const path = pathname.slice(1);
		const fullExternalUrl = decodePathToFullUrl(`${path}${search}`);

		let detectedInputType: string | null | undefined;
		try {
			detectedInputType = await getSyncfm().getInputTypeFromUrl(fullExternalUrl); // handled above
		} catch (err) {
			// If SyncFM isn't available (e.g. missing env vars), skip redirection.
			console.warn("middleware: could not detect input type due to SyncFM init failure", err);
			detectedInputType = null;
		}

		if (detectedInputType) {
			const redirectTarget = `${request.nextUrl.protocol}//${request.nextUrl.host}/${detectedInputType}?url=${encodeURIComponent(fullExternalUrl)}`;
			return NextResponse.redirect(new URL(redirectTarget, request.url));
		}
	}
	return NextResponse.next();
}

function handleSubdomainRedirection(request: NextRequest, subdomain: string) {
	let desiredService: "applemusic" | "spotify" | "ytmusic" | "syncfm" | undefined;
	try {
		desiredService = getDesiredServiceFromSubdomain(subdomain);
	} catch {
		desiredService = undefined;
	}
	if (!desiredService) return NextResponse.next();

	const path = request.nextUrl.pathname.slice(1);
	// If the path already targets our internal handler, don't redirect again
	if (path.startsWith("api/handle") || path.startsWith("api/")) return NextResponse.next();
	const fullExternalUrl = decodePathToFullUrl(`${path}${request.nextUrl.search}`);

	const redirectTarget = `${request.nextUrl.protocol}//${request.nextUrl.host}/api/handle/${desiredService}?url=${encodeURIComponent(fullExternalUrl)}`;
	return NextResponse.redirect(new URL(redirectTarget, request.url));
}

function getDesiredServiceFromSubdomain(
	subdomain: string
): "applemusic" | "spotify" | "ytmusic" | "syncfm" | undefined {
	switch (subdomain) {
		case "am":
		case "a":
		case "applemusic":
			return "applemusic";
		case "s":
		case "spotify":
			return "spotify";
		case "y":
		case "yt":
		case "ytm":
		case "youtube":
			return "ytmusic";
		case "syncfm":
			return "syncfm";
		default:
			return undefined;
	}
}

// Configure which routes to run proxy on (Next.js 16 requirement)
export const config = {
	matcher: [
		// Run on all routes to handle both API rate limiting and subdomain routing
		"/(.*)",
	],
};
