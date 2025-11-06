import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SyncFM } from "syncfm.ts";
import syncfmconfig from "@/syncfm.config";
import type { SyncFMSong, SyncFMAlbum, SyncFMArtist } from "syncfm.ts";
import { captureServerEvent, captureServerException } from "@/lib/analytics/server";
import { durationSince, extractUrlMetadata } from "@/lib/analytics/utils";

const syncfm = new SyncFM(syncfmconfig);

export async function GET(request: NextRequest) {
    const start = Date.now();
    const respond = (status: number, body: unknown, analytics: Record<string, unknown> = {}) => {
        captureServerEvent("api.convertAll.response", {
            route: "api/convertAll",
            method: "GET",
            status,
            success: status < 400,
            duration_ms: durationSince(start),
            ...analytics,
        });
        return NextResponse.json(body, { status });
    };

    try {
        const originalUrl = request.nextUrl.searchParams.get('url')
        const urlMetadata = extractUrlMetadata(originalUrl);
        captureServerEvent("api.convertAll.request", {
            route: "api/convertAll",
            method: "GET",
            ...urlMetadata,
        });
        if (!originalUrl) {
            return respond(400, { error: 'Missing URL parameter' }, {
                reason: 'missing_url',
                ...urlMetadata,
            })
        }
        if (!originalUrl.startsWith('http')) {
            return respond(400, { error: "Invalid URL format." }, {
                reason: 'invalid_url',
                ...urlMetadata,
            });
        }

        let inputType: 'song' | 'album' | 'artist' | 'playlist';
        try {
            inputType = await syncfm.getInputTypeFromUrl(originalUrl);
        } catch (error) {
            console.error("Failed to get input type:", error);
            captureServerException(error, {
                route: "api/convertAll",
                stage: "detect_input_type",
                ...urlMetadata,
            });
            return respond(400, {
                error: "Failed to determine input type",
                message: error instanceof Error ? error.message : "Unknown error"
            }, {
                stage: 'detect_input_type',
                ...urlMetadata,
            });
        }

        let convertedData: SyncFMSong | SyncFMAlbum | SyncFMArtist | null = null;
        try {
            switch (inputType) {
                case 'song':
                    convertedData = await syncfm.convertSong(await syncfm.getInputSongInfo(originalUrl), "spotify");
                    break;
                case 'album':
                    convertedData = await syncfm.convertAlbum(await syncfm.getInputAlbumInfo(originalUrl), "spotify");
                    break;
                case 'artist':
                    convertedData = await syncfm.convertArtist(await syncfm.getInputArtistInfo(originalUrl), "spotify");
                    break;
                default:
                    return respond(400, { error: "Invalid input type." }, {
                        reason: 'unsupported_input_type',
                        input_type: inputType,
                        ...urlMetadata,
                    });
            }
        } catch (error) {
            console.error("Conversion error:", error);
            captureServerException(error, {
                route: "api/convertAll",
                stage: "convert_content",
                input_type: inputType,
                ...urlMetadata,
            });
            return respond(500, {
                error: "Conversion failed",
                message: error instanceof Error ? error.message : "Unknown error",
                inputType
            }, {
                stage: 'convert_content',
                input_type: inputType,
                ...urlMetadata,
            });
        }

        if (!convertedData) {
            return respond(404, {
                error: "Conversion failed - no data returned",
                inputType
            }, {
                stage: 'no_converted_data',
                input_type: inputType,
                ...urlMetadata,
            });
        }

        return respond(200, convertedData, {
            stage: 'success',
            input_type: inputType,
            ...urlMetadata,
        });

    } catch (error) {
        console.error("Error processing request:", error);
        captureServerException(error, {
            route: "api/convertAll",
            stage: "unexpected",
        });
        return respond(500, {
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error"
        }, {
            stage: 'unexpected',
        });
    }
}