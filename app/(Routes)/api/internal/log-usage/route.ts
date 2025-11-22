/**
 * Internal Usage Logging API
 *
 * This endpoint is used internally by the middleware to log API usage metrics
 * It's async and non-blocking to avoid slowing down API responses
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface UsageLogRequest {
	userId?: string;
	apiKeyId?: string;
	endpoint: string;
	ipAddress: string;
	userAgent: string | null;
	statusCode?: number;
	responseTimeMs?: number;
}

export async function POST(request: NextRequest) {
	try {
		const body: UsageLogRequest = await request.json();

		// Validate required fields
		if (!body.endpoint || !body.ipAddress) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		const supabase = await createClient();

		// Insert usage metric
		const { error } = await supabase.from("usage_metrics").insert({
			user_id: body.userId || null,
			api_key_id: body.apiKeyId || null,
			endpoint: body.endpoint,
			ip_address: body.ipAddress,
			user_agent: body.userAgent || null,
			status_code: body.statusCode || null,
			response_time_ms: body.responseTimeMs || null,
			created_at: new Date().toISOString(),
		});

		if (error) {
			console.error("Failed to log usage metric:", error);
			return NextResponse.json({ error: "Failed to log usage" }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("Unexpected error in usage logging:", err);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
