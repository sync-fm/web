import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SyncFM } from "syncfm.ts";
import syncfmconfig from "@/syncfm.config";
import type { SyncFMSong, SyncFMAlbum, SyncFMArtist } from "syncfm.ts";
import { captureServerEvent, captureServerException } from "@/lib/analytics/server";
import { durationSince } from "@/lib/analytics/utils";

const syncfm = new SyncFM(syncfmconfig);

export async function GET(request: NextRequest) {
    const start = Date.now();
    const respond = (status: number, body: unknown, analytics: Record<string, unknown> = {}) => {
        captureServerEvent("api.getBySyncId.response", {
            route: "api/getBySyncId",
            method: "GET",
            status,
            success: status < 400,
            duration_ms: durationSince(start),
            ...analytics,
        });
        return NextResponse.json(body, { status });
    };

    try {
        const syncId = request.nextUrl.searchParams.get('syncId');
        const type = request.nextUrl.searchParams.get('type') as 'song' | 'album' | 'artist' | null;

        captureServerEvent("api.getBySyncId.request", {
            route: "api/getBySyncId",
            method: "GET",
            syncId: syncId ?? undefined,
            type,
        });

        if (!syncId) {
            return respond(400, { error: 'Missing syncId parameter' }, {
                reason: 'missing_syncId',
                type,
            });
        }

        if (!type || !['song', 'album', 'artist'].includes(type)) {
            return respond(400, { error: 'Missing or invalid type parameter. Must be: song, album, or artist' }, {
                reason: 'invalid_type',
                syncId,
            });
        }

        let data: SyncFMSong | SyncFMAlbum | SyncFMArtist | null = null;

        try {
            switch (type) {
                case 'song':
                    data = await syncfm.getSongBySyncId(syncId);
                    break;
                case 'album':
                    data = await syncfm.getAlbumBySyncId(syncId);
                    break;
                case 'artist':
                    data = await syncfm.getArtistBySyncId(syncId);
                    break;
            }
        } catch (error) {
            console.error("Database fetch error:", error);
            captureServerException(error, {
                route: "api/getBySyncId",
                stage: "fetch",
                type,
                syncId,
            });
            return respond(500, {
                error: "Failed to fetch data from database",
                message: error instanceof Error ? error.message : "Unknown error",
                type
            }, {
                stage: 'fetch',
                type,
                syncId,
            });
        }

        if (!data) {
            return respond(404, {
                error: `No ${type} found with syncId: ${syncId}`,
                type,
                syncId
            }, {
                stage: 'not_found',
                type,
                syncId,
            });
        }

        return respond(200, data, {
            stage: 'success',
            type,
            syncId,
        });

    } catch (error) {
        console.error("Error processing request:", error);
        captureServerException(error, {
            route: "api/getBySyncId",
            stage: 'unexpected',
        });
        return respond(500, {
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error"
        }, {
            stage: 'unexpected',
        });
    }
}
