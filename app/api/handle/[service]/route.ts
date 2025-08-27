import { NextRequest, NextResponse } from 'next/server';
import { SyncFM } from 'syncfm.ts';
import syncfmconfig from "@/syncfm.confic";

const syncfm = new SyncFM(syncfmconfig);

export async function GET(request: NextRequest, { params }: { params: Promise<{ service: string }> }) {
  try {
    let rawService = (await params).service
    const originalUrl = request.nextUrl.searchParams.get('url')
    // Basic debug: record incoming host and env-lite info (no secrets)
    console.debug('api/handle request', {
      host: request.headers.get('host'),
      method: request.method,
      subdomainParam: rawService,
      originalUrl,
      envNode: process.env.NODE_ENV,
    })

    if (!originalUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 })
    }
    if (!originalUrl.startsWith('http')) {
      return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }

    if (!rawService) {
      return NextResponse.json({ error: "Invalid subdomain." }, { status: 400 });
    }

    const inputType = syncfm.getInputTypeFromUrl(originalUrl);
    let convertedData;
    let convertedUrl;
    const noRedirect = rawService === 'syncfm' ? true : false;
    if (noRedirect) { rawService = 'spotify' }
    const service = rawService as "applemusic" | "spotify" | "ytmusic";
    // Add intermediate logging and per-type try/catch so we can capture
    // library internals (e.g. errors coming from the ytmusic converter)
    switch (inputType) {
      case 'song': {
        const inputSong = await syncfm.getInputSongInfo(originalUrl)
        try {
          convertedData = await syncfm.convertSong(inputSong, service);
          if (!noRedirect) {
            convertedUrl = syncfm.createSongURL(convertedData, service);
          }
        } catch (err) {
          const e = err as unknown as { stack?: string; message?: string }
          console.error('Conversion error (song):', {
            originalUrl,
            service,
            inputSong,
            error: e?.stack || e?.message || String(err),
          })
          throw err
        }
        break;
      }
      case 'album': {
        const inputAlbum = await syncfm.getInputAlbumInfo(originalUrl)
        try {
          convertedData = await syncfm.convertAlbum(inputAlbum, service);
          if (!noRedirect) {
            convertedUrl = syncfm.createAlbumURL(convertedData, service);
          }
        } catch (err) {
          const e = err as unknown as { stack?: string; message?: string }
          console.error('Conversion error (album):', {
            originalUrl,
            service,
            inputAlbum,
            error: e?.stack || e?.message || String(err),
          })
          throw err
        }
        break;
      }
      case 'artist': {
        const inputArtist = await syncfm.getInputArtistInfo(originalUrl)
        try {
          convertedData = await syncfm.convertArtist(inputArtist, service);
          if (!noRedirect) {
            convertedUrl = syncfm.createArtistURL(convertedData, service);
          }
        } catch (err) {
          const e = err as unknown as { stack?: string; message?: string }
          console.error('Conversion error (artist):', {
            originalUrl,
            service,
            inputArtist,
            error: e?.stack || e?.message || String(err),
          })
          throw err
        }
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid input type." }, { status: 400 });
    }

    if (!convertedData) {
      return NextResponse.json({ error: "Conversion failed." }, { status: 404 });
    }

    // If we're allowed to redirect, do so. The previous condition had a
    // redundant check which prevented redirects in some cases.
    if (!noRedirect && convertedUrl) {
      return NextResponse.redirect(convertedUrl);
    }

    return NextResponse.json(convertedData);

  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}