import { NextRequest, NextResponse } from "next/server";
import { getSyncfm } from "@/lib/syncfm";
import type { SyncFMSong, ServiceName, SyncFMAlbum, SyncFMArtist, SyncFMPlaylist } from "syncfm.ts";

export type MusicEntityType = "song" | "album" | "artist" | "playlist";

interface CreateUrlRequest {
    service: ServiceName;
    input: SyncFMSong | SyncFMAlbum | SyncFMArtist | SyncFMPlaylist;
    type: MusicEntityType;
}

export async function POST(req: NextRequest) {
    const syncfm = getSyncfm();
    const { service, input, type }: CreateUrlRequest = await req.json();

    let url: string | null = null;

    if (!service || !input || !type) {
        return NextResponse.json({ error: "Missing service, input or type" }, { status: 400 });
    }

    switch (type) {
        case "song":
            url = syncfm.createSongURL(input as SyncFMSong, service);
            break;
        case "album":
            url = syncfm.createAlbumURL(input as SyncFMAlbum, service);
            break;
        case "artist":
            url = syncfm.createArtistURL(input as SyncFMArtist, service);
            break;
        case "playlist":
            url = null;
            break;
        // url = syncfm.createPlaylistURL(input as SyncFMPlaylist, service);
        default:
            url = null;
            break;
    }

    return NextResponse.json({ url: url });
}
