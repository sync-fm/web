"use server";

import { errAsync, okAsync, type Result } from "neverthrow";
import type { NextRequest } from "next/server";
import { extractApiKey, isValidApiKeyFormat, verifyApiKey } from "@/lib/api-keys";
import { createClient } from "@/lib/supabase/server";
import { getRateLimitIP } from "@/lib/utils/ip";

export interface UsageLogRequest {
	userId?: string;
	apiKeyId?: string;
	endpoint: string;
	ipAddress: string;
	userAgent: string | null;
	statusCode?: number;
	responseTimeMs?: number;
}

type SupabaseClientInstance = Awaited<ReturnType<typeof createClient>>;

async function insertUsageMetric(payload: UsageLogRequest, client?: SupabaseClientInstance) {
	const supabase = client ?? (await createClient());
	const { error } = await supabase.from("usage_metrics").insert({
		user_id: payload.userId || null,
		api_key_id: payload.apiKeyId || null,
		endpoint: payload.endpoint,
		ip_address: payload.ipAddress,
		user_agent: payload.userAgent || null,
		status_code: payload.statusCode || null,
		response_time_ms: payload.responseTimeMs ?? null,
		created_at: new Date().toISOString(),
	});

	if (error) {
		throw error;
	}
}

export async function useMetrics(ul: UsageLogRequest): Promise<Result<boolean, { error: string }>> {
	try {
		const supabase = await createClient();
		await insertUsageMetric(ul, supabase);
	} catch (err) {
		return errAsync({ error: `Failed to log usage: ${err}` });
	}
	return okAsync(true);
}

interface UsageLogMeta {
	endpoint: string;
	statusCode: number;
	durationMs: number;
}

export async function logUsageMetricFromRequest(request: NextRequest, meta: UsageLogMeta) {
	try {
		const supabase = await createClient();
		const ipAddress = getRateLimitIP(request);
		const userAgent = request.headers.get("user-agent");

		let userId: string | undefined;
		let apiKeyId: string | undefined;

		try {
			const { data, error } = await supabase.auth.getUser();
			if (!error && data.user) {
				userId = data.user.id;
			}
		} catch (userErr) {
			console.error("logUsageMetricFromRequest: failed to resolve user", userErr);
		}

		const apiKey = extractApiKey(request.headers, request.nextUrl.searchParams);
		if (apiKey && isValidApiKeyFormat(apiKey)) {
			try {
				const { data: keyData, error: keyError } = await supabase
					.from("api_keys")
					.select("id, key_hash, user_id")
					.eq("is_active", true)
					.limit(1000);

				if (!keyError && keyData) {
					const matchingKey = keyData.find((k: { key_hash: string }) =>
						verifyApiKey(apiKey, k.key_hash)
					);
					if (matchingKey) {
						apiKeyId = matchingKey.id;
						if (!userId && matchingKey.user_id) {
							userId = matchingKey.user_id;
						}
					}
				} else if (keyError) {
					console.error("logUsageMetricFromRequest: failed to load api_keys", keyError);
				}
			} catch (keyErr) {
				console.error("logUsageMetricFromRequest: error resolving api key", keyErr);
			}
		}

		const durationMs = Number.isFinite(meta.durationMs)
			? Math.max(0, Math.round(meta.durationMs))
			: 0;

		await insertUsageMetric(
			{
				endpoint: meta.endpoint,
				statusCode: meta.statusCode,
				responseTimeMs: durationMs,
				userId,
				apiKeyId,
				ipAddress,
				userAgent,
			},
			supabase
		);
	} catch (err) {
		console.error("logUsageMetricFromRequest: failed to log usage metric", err);
	}
}

export async function createUsageLogger(request: NextRequest, endpoint: string, startedAt: number) {
	let logged = false;
	return (statusCode: number) => {
		if (logged) return;
		logged = true;
		void logUsageMetricFromRequest(request, {
			endpoint,
			statusCode,
			durationMs: Date.now() - startedAt,
		});
	};
}
