import { NextRequest, NextResponse } from 'next/server';
import { SyncFM } from 'syncfm.ts';
import syncfmconfig from "@/syncfm.confic";

const syncfm = new SyncFM(syncfmconfig);

export async function GET(request: NextRequest, { params }: { params: Promise<{ service: string }> }) {
  try {
    let rawService = (await params).service
    const originalUrl = request.nextUrl.searchParams.get('url')

    if (!originalUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 })
    }
    if (!originalUrl.startsWith('http')) {
      return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }

    if (!rawService) {
      return NextResponse.json({ error: "Invalid subdomain." }, { status: 400 });
    }

    const inputType = syncfm.getInputTypeFromUrl(originalUrl, syncfm.getStreamingServiceFromUrl(originalUrl));
    let convertedData;
    let convertedUrl;
    const noRedirect = rawService === 'syncfm' ? true : false;
    if (noRedirect) { rawService = 'spotify' }
    const service = rawService as "applemusic" | "spotify" | "ytmusic";
    switch (inputType) {
      case 'song':
        convertedData = await syncfm.convertSong(await syncfm.getInputSongInfo(originalUrl), service);
        if (!noRedirect) {
          convertedUrl = syncfm.createSongURL(convertedData, service);
        }
        break;
      case 'album':
        convertedData = await syncfm.convertAlbum(await syncfm.getInputAlbumInfo(originalUrl), service);
        if (!noRedirect) {
          convertedUrl = syncfm.createAlbumURL(convertedData, service);
        }
        break;
      case 'artist':
        convertedData = await syncfm.convertArtist(await syncfm.getInputArtistInfo(originalUrl), service);
        if (!noRedirect) {
          convertedUrl = syncfm.createArtistURL(convertedData, service);
        }
        break;
      default:
        return NextResponse.json({ error: "Invalid input type." }, { status: 400 });
    }

    if (!convertedData) {
      return NextResponse.json({ error: "Conversion failed." }, { status: 404 });
    }

    if (!noRedirect && !noRedirect) {
      return NextResponse.redirect(convertedUrl || '/');
    }

    return NextResponse.json(convertedData);

  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}