import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SyncFM } from "syncfm.ts";
import syncfmconfig from "@/syncfm.config";
import type { SyncFMSong, SyncFMAlbum, SyncFMArtist } from "syncfm.ts";

const syncfm = new SyncFM(syncfmconfig);

export async function GET(request: NextRequest) {
    try {
        const originalUrl = request.nextUrl.searchParams.get('url')
        if (!originalUrl) {
            return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 })
        }
        if (!originalUrl.startsWith('http')) {
            return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
        }

        let inputType: 'song' | 'album' | 'artist' | 'playlist';
        try {
            inputType = await syncfm.getInputTypeFromUrl(originalUrl);
        } catch (error) {
            console.error("Failed to get input type:", error);
            return NextResponse.json({
                error: "Failed to determine input type",
                message: error instanceof Error ? error.message : "Unknown error"
            }, { status: 400 });
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
                    return NextResponse.json({ error: "Invalid input type." }, { status: 400 });
            }
        } catch (error) {
            console.error("Conversion error:", error);
            return NextResponse.json({
                error: "Conversion failed",
                message: error instanceof Error ? error.message : "Unknown error",
                inputType
            }, { status: 500 });
        }

        if (!convertedData) {
            return NextResponse.json({
                error: "Conversion failed - no data returned",
                inputType
            }, { status: 404 });
        }

        return NextResponse.json(convertedData);

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}