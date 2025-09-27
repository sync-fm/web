import { NextRequest, NextResponse } from 'next/server';
import { SyncFM } from "syncfm.ts";
import syncfmconfig from "@/syncfm.config";

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

        const inputType = syncfm.getInputTypeFromUrl(originalUrl);
        let convertedData;
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

        if (!convertedData) {
            return NextResponse.json({ error: "Conversion failed." }, { status: 404 });
        }

        return NextResponse.json(convertedData);

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}