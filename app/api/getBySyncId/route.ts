import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SyncFM } from "syncfm.ts";
import syncfmconfig from "@/syncfm.config";
import type { SyncFMSong, SyncFMAlbum, SyncFMArtist } from "syncfm.ts";

const syncfm = new SyncFM(syncfmconfig);

export async function GET(request: NextRequest) {
    try {
        const syncId = request.nextUrl.searchParams.get('syncId');
        const type = request.nextUrl.searchParams.get('type') as 'song' | 'album' | 'artist' | null;

        if (!syncId) {
            return NextResponse.json({ error: 'Missing syncId parameter' }, { status: 400 });
        }

        if (!type || !['song', 'album', 'artist'].includes(type)) {
            return NextResponse.json({ error: 'Missing or invalid type parameter. Must be: song, album, or artist' }, { status: 400 });
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
            return NextResponse.json({
                error: "Failed to fetch data from database",
                message: error instanceof Error ? error.message : "Unknown error",
                type
            }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({
                error: `No ${type} found with syncId: ${syncId}`,
                type,
                syncId
            }, { status: 404 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
