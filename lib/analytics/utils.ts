import crypto from "node:crypto";

interface UrlMetadata {
	hasUrl: boolean;
	isValid?: boolean;
	hostname?: string;
	protocol?: string;
	pathHash?: string;
}

export function extractUrlMetadata(rawUrl: string | null | undefined): UrlMetadata {
	if (!rawUrl) {
		return { hasUrl: false };
	}

	try {
		const parsed = new URL(rawUrl);
		const hash = crypto
			.createHash("sha256")
			.update(parsed.origin + parsed.pathname)
			.digest("hex")
			.slice(0, 16);

		return {
			hasUrl: true,
			isValid: true,
			hostname: parsed.hostname,
			protocol: parsed.protocol.replace(":", ""),
			pathHash: hash,
		};
	} catch {
		return {
			hasUrl: true,
			isValid: false,
		};
	}
}

export function durationSince(start: number) {
	return Date.now() - start;
}
