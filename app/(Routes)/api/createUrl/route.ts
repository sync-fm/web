import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { ServiceName, SyncFMAlbum, SyncFMArtist, SyncFMPlaylist, SyncFMSong } from "syncfm.ts";
import { captureServerEvent, captureServerException } from "@/lib/analytics/server";
import { createUsageLogger } from "@/lib/analytics/usageMetrics.actions";
import { durationSince } from "@/lib/analytics/utils";
import { normalizeConversionOutcome } from "@/lib/normalizeConversionOutcome";
import { getSyncfm } from "@/lib/syncfm";

export type MusicEntityType = "song" | "album" | "artist" | "playlist";

interface CreateUrlRequest {
	service: ServiceName;
	input: SyncFMSong | SyncFMAlbum | SyncFMArtist | SyncFMPlaylist;
	type: MusicEntityType;
}

export async function POST(req: NextRequest) {
	const start = Date.now();
	const logUsage = await createUsageLogger(req, req.nextUrl.pathname, start);
	const respond = (status: number, body: unknown, analytics: Record<string, unknown> = {}) => {
		logUsage(status);
		captureServerEvent("api.createUrl.response", {
			route: "api/createUrl",
			method: "POST",
			status,
			success: status < 400,
			duration_ms: durationSince(start),
			...analytics,
		});
		return NextResponse.json(body, { status });
	};

	try {
		const syncfm = getSyncfm();
		const { service, input, type }: CreateUrlRequest = await req.json();

		captureServerEvent("api.createUrl.request", {
			route: "api/createUrl",
			method: "POST",
			service,
			type,
			has_syncId: Boolean(input && "syncId" in input && input.syncId),
		});

		if (!service || !input || !type) {
			return respond(
				400,
				{ error: "Missing service, input or type" },
				{
					reason: "missing_fields",
					service,
					type,
				}
			);
		}

		// Extract syncId if available
		const syncId = "syncId" in input ? input.syncId : undefined;

		const normalized = normalizeConversionOutcome(input, [service]);
		const providerStatus = normalized.statuses[0];

		let url: string | null = null;

		switch (type) {
			case "song":
				url = await syncfm.createSongURL(input as SyncFMSong, service, syncId);
				break;
			case "album":
				url = await syncfm.createAlbumURL(input as SyncFMAlbum, service, syncId);
				break;
			case "artist":
				url = await syncfm.createArtistURL(input as SyncFMArtist, service, syncId);
				break;
			case "playlist":
				url = null;
				break;
			// url = syncfm.createPlaylistURL(input as SyncFMPlaylist, service);
			default:
				url = null;
				break;
		}

		if (!url) {
			return respond(
				200,
				{
					url: null,
					warning:
						providerStatus && !providerStatus.available
							? {
									service: providerStatus.service,
									reason: providerStatus.reason,
									retryable: providerStatus.retryable,
								}
							: undefined,
				},
				{
					stage: "partial",
					service,
					type,
					has_syncId: Boolean(syncId),
					available_services: normalized.availableServices,
					missing_services: normalized.missingServices,
					has_partial_success: normalized.hasPartialSuccess,
				}
			);
		}

		return respond(
			200,
			{ url },
			{
				stage: "success",
				service,
				type,
				has_syncId: Boolean(syncId),
				available_services: normalized.availableServices,
				missing_services: normalized.missingServices,
				has_partial_success: normalized.hasPartialSuccess,
			}
		);
	} catch (error) {
		console.error("Error in createUrl:", error);
		captureServerException(error, {
			route: "api/createUrl",
		});
		return respond(
			500,
			{
				error: "Internal server error",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{
				stage: "unexpected",
			}
		);
	}
}
