import redis from "./redis";

export interface RateLimitResult {
	success: boolean;
	limit: number;
	remaining: number;
	resetTime: number;
}

/**
 * Check rate limit for a given identifier using Redis
 *
 * @param identifier - Unique identifier (e.g., "user:123", "ip:192.168.1.1", "api_key:abc")
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 1 hour)
 * @returns RateLimitResult with success, limit, remaining, and resetTime
 */
export async function checkRateLimit(
	identifier: string,
	limit: number,
	windowMs = 3600000 // 1 hour default
): Promise<RateLimitResult> {
	try {
		const key = `rate_limit:${identifier}`;
		const now = Date.now();
		const window = Math.floor(now / windowMs);
		const windowKey = `${key}:${window}`;

		console.log("[RATE LIMIT] Incrementing counter for:", windowKey);

		// Increment the counter for this window
		const current = await redis.incr(windowKey);

		console.log("[RATE LIMIT] Counter is now:", current, "limit:", limit);

		// Set expiration on first request in window
		if (current === 1) {
			await redis.expire(windowKey, Math.ceil(windowMs / 1000));
		}

		// Calculate reset time (start of next window)
		const resetTime = (window + 1) * windowMs;

		return {
			success: current <= limit,
			limit,
			remaining: Math.max(0, limit - current),
			resetTime,
		};
	} catch (error) {
		console.error("Rate limit check failed:", error);
		// On Redis error, allow the request (fail open)
		return {
			success: true,
			limit,
			remaining: limit,
			resetTime: Date.now() + windowMs,
		};
	}
}

/**
 * Reset rate limit for a given identifier (admin function)
 *
 * @param identifier - Unique identifier to reset
 */
export async function resetRateLimit(identifier: string): Promise<void> {
	try {
		const key = `rate_limit:${identifier}`;
		const keys = await redis.keys(`${key}:*`);

		if (keys.length > 0) {
			await redis.del(...keys);
		}
	} catch (error) {
		console.error("Rate limit reset failed:", error);
	}
}

/**
 * Get current rate limit status without incrementing
 *
 * @param identifier - Unique identifier to check
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 1 hour)
 * @returns RateLimitResult
 */
export async function getRateLimitStatus(
	identifier: string,
	limit: number,
	windowMs = 3600000
): Promise<RateLimitResult> {
	try {
		const key = `rate_limit:${identifier}`;
		const now = Date.now();
		const window = Math.floor(now / windowMs);
		const windowKey = `${key}:${window}`;

		// Get current count without incrementing
		const current = await redis.get(windowKey);
		const count = current ? Number.parseInt(current, 10) : 0;

		const resetTime = (window + 1) * windowMs;

		return {
			success: count < limit,
			limit,
			remaining: Math.max(0, limit - count),
			resetTime,
		};
	} catch (error) {
		console.error("Rate limit status check failed:", error);
		return {
			success: true,
			limit,
			remaining: limit,
			resetTime: Date.now() + windowMs,
		};
	}
}

/**
 * Get rate limit by subscription tier
 *
 * @param tier - Subscription tier ('free', 'pro', 'enterprise')
 * @returns Rate limit per hour
 */
export function getRateLimitByTier(tier: string): number {
	const limits: Record<string, number> = {
		free: 100,
		pro: 1000,
		enterprise: 10000,
	};

	return limits[tier] || limits.free;
}
