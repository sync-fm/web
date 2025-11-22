import Redis from "ioredis";
import { authConfig } from "@/syncfm.config";

// Create Redis client with retry logic
// Note: This file does NOT have 'use server' - it's a utility that can be imported by server-side code
const redis = new Redis(authConfig.redis.url, {
	maxRetriesPerRequest: 3,
	lazyConnect: true,
	retryStrategy: (times: number) => {
		if (times > 3) {
			console.error("Redis connection failed after 3 retries");
			return null; // Stop retrying
		}
		const delay = Math.min(times * 50, 2000);
		return delay;
	},
	reconnectOnError: (err: Error) => {
		const targetError = "READONLY";
		if (err.message.includes(targetError)) {
			// Only reconnect when the error contains "READONLY"
			return true;
		}
		return false;
	},
});

// Connection event handlers
redis.on("connect", () => {
	console.log("✅ Redis connected");
});

redis.on("error", (err: Error) => {
	console.error("❌ Redis connection error:", err.message);
});

redis.on("ready", () => {
	console.log("✅ Redis ready to accept commands");
});

redis.on("close", () => {
	console.log("⚠️ Redis connection closed");
});

// Graceful shutdown
process.on("SIGTERM", async () => {
	await redis.quit();
	process.exit(0);
});

export default redis;

// Helper function to test connection
export async function testRedisConnection(): Promise<boolean> {
	try {
		await redis.ping();
		console.log("✅ Redis PING successful");
		return true;
	} catch (error) {
		console.error("❌ Redis PING failed:", error);
		return false;
	}
}
