import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

/**
 * Generate a new API key with secure hash
 * Format: sk_<32-character-nanoid>
 *
 * @returns Object containing the plaintext key (show once), hash (store in DB), and prefix (for display)
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
	// Generate secure random API key
	const key = `sk_${nanoid(32)}`;

	// Hash for storage (using bcrypt with salt rounds = 10)
	const hash = bcrypt.hashSync(key, 10);

	// Prefix for display (first 12 characters + ellipsis)
	const prefix = `${key.substring(0, 12)}...`;

	return { key, hash, prefix };
}

/**
 * Hash an API key for storage
 *
 * @param key - Plaintext API key
 * @returns Bcrypt hash
 */
export function hashApiKey(key: string): string {
	return bcrypt.hashSync(key, 10);
}

/**
 * Verify an API key against its hash
 *
 * @param key - Plaintext API key to verify
 * @param hash - Stored bcrypt hash
 * @returns True if key matches hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
	try {
		return bcrypt.compareSync(key, hash);
	} catch (error) {
		console.error("API key verification failed:", error);
		return false;
	}
}

/**
 * Validate API key format
 * Must start with 'sk_' and be followed by 32 characters
 *
 * @param key - API key to validate
 * @returns True if format is valid
 */
export function isValidApiKeyFormat(key: string): boolean {
	return /^sk_[A-Za-z0-9_-]{32}$/.test(key);
}

/**
 * Extract API key from request (header or query param)
 * Priority: x-api-key header > api_key query param
 *
 * @param headers - Request headers
 * @param searchParams - URL search params
 * @returns API key if found, null otherwise
 */
export function extractApiKey(headers: Headers, searchParams: URLSearchParams): string | null {
	// Check header first (preferred method)
	const headerKey = headers.get("x-api-key");
	if (headerKey) {
		return headerKey;
	}

	// Check query param (fallback for simple integrations)
	const queryKey = searchParams.get("api_key");
	if (queryKey) {
		return queryKey;
	}

	return null;
}

/**
 * Mask an API key for display
 * Shows first 12 characters + ellipsis
 *
 * @param key - API key to mask
 * @returns Masked key
 */
export function maskApiKey(key: string): string {
	if (key.length <= 15) {
		return key;
	}
	return `${key.substring(0, 12)}...`;
}
