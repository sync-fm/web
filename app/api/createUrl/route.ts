import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSyncfm } from "@/lib/syncfm";
import type { SyncFMSong, ServiceName, SyncFMAlbum, SyncFMArtist, SyncFMPlaylist } from "syncfm.ts";

export type MusicEntityType = "song" | "album" | "artist" | "playlist";

interface CreateUrlRequest {
    service: ServiceName;
    input: SyncFMSong | SyncFMAlbum | SyncFMArtist | SyncFMPlaylist;
    type: MusicEntityType;
}

export async function POST(req: NextRequest) {
    try {
        const syncfm = getSyncfm();
        const { service, input, type }: CreateUrlRequest = await req.json();

        if (!service || !input || !type) {
            return NextResponse.json({ error: "Missing service, input or type" }, { status: 400 });
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
            return NextResponse.json({
                error: "Failed to create URL",
                service,
                type
            }, { status: 404 });
        }

        return NextResponse.json({ url: url });
    } catch (error) {
        console.error("Error in createUrl:", error);
        return NextResponse.json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
