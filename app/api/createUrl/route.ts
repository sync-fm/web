import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSyncfm } from "@/lib/syncfm";
import type { SyncFMSong, ServiceName, SyncFMAlbum, SyncFMArtist, SyncFMPlaylist } from "syncfm.ts";
import { captureServerEvent, captureServerException } from "@/lib/analytics/server";
import { durationSince } from "@/lib/analytics/utils";

export type MusicEntityType = "song" | "album" | "artist" | "playlist";

interface CreateUrlRequest {
    service: ServiceName;
    input: SyncFMSong | SyncFMAlbum | SyncFMArtist | SyncFMPlaylist;
    type: MusicEntityType;
}

export async function POST(req: NextRequest) {
    const start = Date.now();
    const respond = (status: number, body: unknown, analytics: Record<string, unknown> = {}) => {
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
            return respond(400, { error: "Missing service, input or type" }, {
                reason: "missing_fields",
                service,
                type,
            });
        }

        // Extract syncId if available
        const syncId = 'syncId' in input ? input.syncId : undefined;

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
            return respond(404, {
                error: "Failed to create URL",
                service,
                type
            }, {
                stage: "create_url",
                service,
                type,
                has_syncId: Boolean(syncId),
            });
        }

        return respond(200, { url }, {
            stage: "success",
            service,
            type,
            has_syncId: Boolean(syncId),
        });
    } catch (error) {
        console.error("Error in createUrl:", error);
        captureServerException(error, {
            route: "api/createUrl",
        });
        return respond(500, {
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error"
        }, {
            stage: "unexpected",
        });
    }
}
