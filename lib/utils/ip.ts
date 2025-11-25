import type { NextRequest } from "next/server";

/**
 * Extract the real client IP address from a Next.js request
 *
 * This function handles the proxy chain: Cloudflare → Coolify → Docker → Next.js
 * It prioritizes headers in order of reliability:
 * 1. cf-connecting-ip (Cloudflare's real client IP - most reliable)
 * 2. x-forwarded-for (standard proxy header)
 * 3. x-real-ip (alternative proxy header)
 * 4. request.ip (direct connection - fallback)
 *
 * @param request - Next.js request object
 * @returns The real client IP address
 */
export function getRealIP(request: NextRequest): string {
	// Cloudflare specific header (most reliable when behind Cloudflare)
	const cfConnectingIP = request.headers.get("cf-connecting-ip");
	if (cfConnectingIP) {
		return cfConnectingIP.trim();
	}

	// Standard forwarded header (may contain multiple IPs: client, proxy1, proxy2)
	// Format: "client, proxy1, proxy2"
	const xForwardedFor = request.headers.get("x-forwarded-for");
	if (xForwardedFor) {
		// Get the first IP (original client)
		const firstIP = xForwardedFor.split(",")[0].trim();
		if (firstIP) {
			return firstIP;
		}
	}

	// Alternative proxy header
	const xRealIP = request.headers.get("x-real-ip");
	if (xRealIP) {
		return xRealIP.trim();
	}

	// Fallback to localhost (NextRequest doesn't have ip property in Edge runtime)
	return "127.0.0.1";
}

/**
 * Validate if a string is a valid IP address (IPv4 or IPv6)
 *
 * @param ip - String to validate
 * @returns True if valid IP address
 */
export function isValidIP(ip: string): boolean {
	// IPv4 regex
	const ipv4Regex =
		/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

	// IPv6 regex (simplified - matches most common formats)
	const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

	return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Check if an IP address is a private/local IP
 *
 * @param ip - IP address to check
 * @returns True if private IP
 */
export function isPrivateIP(ip: string): boolean {
	// Localhost
	if (ip === "127.0.0.1" || ip === "::1") {
		return true;
	}

	// Private IPv4 ranges
	const privateRanges = [
		/^10\./, // 10.0.0.0/8
		/^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
		/^192\.168\./, // 192.168.0.0/16
	];

	return privateRanges.some((range) => range.test(ip));
}

/**
 * Get IP address for rate limiting purposes
 * Handles special cases like private IPs in development
 *
 * @param request - Next.js request object
 * @returns IP address suitable for rate limiting
 */
export function getRateLimitIP(request: NextRequest): string {
	const ip = getRealIP(request);

	// In development, use a stable identifier for localhost
	// Note: This returns '127.0.0.1' instead of 'localhost' to be compatible with inet type
	if (isPrivateIP(ip)) {
		return "127.0.0.1";
	}

	return ip;
}
