import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SyncFM } from "syncfm.ts";
import type { SyncFMSong, SyncFMAlbum, SyncFMArtist } from "syncfm.ts";
import syncfmconfig from "@/syncfm.config";

const syncfm = new SyncFM(syncfmconfig);

export async function GET(request: NextRequest, { params }: { params: Promise<{ service: string }> }) {
  try {
    let rawService = (await params).service
    const originalUrl = request.nextUrl.searchParams.get('url')
    const syncId = request.nextUrl.searchParams.get('syncId')
    const noRedirect = rawService === 'syncfm';

    if (!originalUrl && !syncId) {
      if (!noRedirect) {
        const errorUrl = new URL('/error', request.url);
        errorUrl.searchParams.set('errorType', 'fetch');
        errorUrl.searchParams.set('entityType', 'song');
        errorUrl.searchParams.set('message', 'Missing URL or syncId parameter');
        return NextResponse.redirect(errorUrl);
      }
      return NextResponse.json({ error: 'Missing URL or syncId parameter' }, { status: 400 })
    }

    // Handle syncId-based lookup
    if (syncId) {
      if (!rawService) {
        if (!noRedirect) {
          const errorUrl = new URL('/error', request.url);
          errorUrl.searchParams.set('errorType', 'fetch');
          errorUrl.searchParams.set('entityType', 'song');
          errorUrl.searchParams.set('message', 'Invalid service');
          return NextResponse.redirect(errorUrl);
        }
        return NextResponse.json({ error: "Invalid service." }, { status: 400 });
      }

      if (noRedirect) { rawService = 'spotify' }
      const service = rawService as "applemusic" | "spotify" | "ytmusic";

      // We need to determine the type from the database
      // Try each type until we find it
      let convertedData: SyncFMSong | SyncFMAlbum | SyncFMArtist | null = null;
      let inputType: 'song' | 'album' | 'artist' | 'playlist' = 'song';

      try {
        // Try song first
        convertedData = await syncfm.getSongBySyncId(syncId);
        if (convertedData) {
          inputType = 'song';
        } else {
          // Try album
          convertedData = await syncfm.getAlbumBySyncId(syncId);
          if (convertedData) {
            inputType = 'album';
          } else {
            // Try artist
            convertedData = await syncfm.getArtistBySyncId(syncId);
            if (convertedData) {
              inputType = 'artist';
            }
          }
        }

        if (!convertedData) {
          if (!noRedirect) {
            const errorUrl = new URL('/error', request.url);
            errorUrl.searchParams.set('errorType', 'fetch');
            errorUrl.searchParams.set('entityType', 'song');
            errorUrl.searchParams.set('syncId', syncId);
            errorUrl.searchParams.set('message', `No content found with syncId: ${syncId}`);
            return NextResponse.redirect(errorUrl);
          }
          return NextResponse.json({ error: `No content found with syncId: ${syncId}` }, { status: 404 });
        }

        // Now create the URL for the target service
        let convertedUrl: string | null = null;
        if (!noRedirect) {
          switch (inputType) {
            case 'song':
              convertedUrl = await syncfm.createSongURL(convertedData as SyncFMSong, service, syncId);
              break;
            case 'album':
              convertedUrl = await syncfm.createAlbumURL(convertedData as SyncFMAlbum, service, syncId);
              break;
            case 'artist':
              convertedUrl = await syncfm.createArtistURL(convertedData as SyncFMArtist, service, syncId);
              break;
          }

          if (!convertedUrl) {
            const errorUrl = new URL('/error', request.url);
            errorUrl.searchParams.set('errorType', 'redirect');
            errorUrl.searchParams.set('entityType', inputType);
            errorUrl.searchParams.set('syncId', syncId);
            errorUrl.searchParams.set('service', service);
            errorUrl.searchParams.set('message', `Failed to create ${service} URL`);
            return NextResponse.redirect(errorUrl);
          }

          return NextResponse.redirect(convertedUrl);
        }

        return NextResponse.json(convertedData);

      } catch (error) {
        console.error("Error fetching by syncId:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        if (!noRedirect) {
          const errorUrl = new URL('/error', request.url);
          errorUrl.searchParams.set('errorType', 'fetch');
          errorUrl.searchParams.set('entityType', 'song');
          errorUrl.searchParams.set('syncId', syncId);
          errorUrl.searchParams.set('message', `Failed to fetch content: ${errorMessage}`);
          return NextResponse.redirect(errorUrl);
        }

        return NextResponse.json({
          error: "Failed to fetch content",
          message: errorMessage
        }, { status: 500 });
      }
    }

    // Handle URL-based conversion (original logic)
    if (!originalUrl || !originalUrl.startsWith('http')) {
      if (!noRedirect) {
        const errorUrl = new URL('/error', request.url);
        errorUrl.searchParams.set('errorType', 'fetch');
        errorUrl.searchParams.set('entityType', 'song');
        if (originalUrl) errorUrl.searchParams.set('url', originalUrl);
        errorUrl.searchParams.set('message', 'Invalid URL format');
        return NextResponse.redirect(errorUrl);
      }
      return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }

    if (!rawService) {
      if (!noRedirect) {
        const errorUrl = new URL('/error', request.url);
        errorUrl.searchParams.set('errorType', 'fetch');
        errorUrl.searchParams.set('entityType', 'song');
        errorUrl.searchParams.set('message', 'Invalid service');
        return NextResponse.redirect(errorUrl);
      }
      return NextResponse.json({ error: "Invalid subdomain." }, { status: 400 });
    }

    let inputType: 'song' | 'album' | 'artist' | 'playlist';
    try {
      inputType = await syncfm.getInputTypeFromUrl(originalUrl);
    } catch (error) {
      console.error("Failed to get input type:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Redirect to error page for user-facing services
      if (!noRedirect) {
        const errorUrl = new URL('/error', request.url);
        errorUrl.searchParams.set('errorType', 'fetch');
        errorUrl.searchParams.set('entityType', 'song');
        errorUrl.searchParams.set('url', originalUrl);
        errorUrl.searchParams.set('message', `Failed to determine content type: ${errorMessage}`);
        return NextResponse.redirect(errorUrl);
      }

      return NextResponse.json({
        error: "Failed to determine input type",
        message: errorMessage
      }, { status: 400 });
    }

    let convertedData: SyncFMSong | SyncFMAlbum | SyncFMArtist | null = null;
    let convertedUrl: string | null = null;
    if (noRedirect) { rawService = 'spotify' }
    const service = rawService as "applemusic" | "spotify" | "ytmusic";

    try {
      switch (inputType) {
        case 'song':
          convertedData = await syncfm.convertSong(await syncfm.getInputSongInfo(originalUrl), service);
          if (!noRedirect && convertedData) {
            convertedUrl = await syncfm.createSongURL(convertedData, service, convertedData.syncId);
          }
          break;
        case 'album':
          convertedData = await syncfm.convertAlbum(await syncfm.getInputAlbumInfo(originalUrl), service);
          if (!noRedirect && convertedData) {
            convertedUrl = await syncfm.createAlbumURL(convertedData, service, convertedData.syncId);
          }
          break;
        case 'artist':
          convertedData = await syncfm.convertArtist(await syncfm.getInputArtistInfo(originalUrl), service);
          if (!noRedirect && convertedData) {
            convertedUrl = await syncfm.createArtistURL(convertedData, service, convertedData.syncId);
          }
          break;
        default:
          if (!noRedirect) {
            const errorUrl = new URL('/error', request.url);
            errorUrl.searchParams.set('errorType', 'conversion');
            errorUrl.searchParams.set('entityType', 'song');
            errorUrl.searchParams.set('url', originalUrl);
            errorUrl.searchParams.set('service', service);
            errorUrl.searchParams.set('message', 'Unsupported content type');
            return NextResponse.redirect(errorUrl);
          }
          return NextResponse.json({ error: "Invalid input type." }, { status: 400 });
      }
    } catch (error) {
      console.error("Conversion error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Redirect to error page for user-facing services
      if (!noRedirect) {
        const errorUrl = new URL('/error', request.url);
        errorUrl.searchParams.set('errorType', 'conversion');
        errorUrl.searchParams.set('entityType', inputType);
        errorUrl.searchParams.set('url', originalUrl);
        errorUrl.searchParams.set('service', service);
        errorUrl.searchParams.set('message', `Conversion failed: ${errorMessage}`);
        return NextResponse.redirect(errorUrl);
      }

      return NextResponse.json({
        error: "Conversion failed",
        message: errorMessage,
        inputType
      }, { status: 500 });
    }

    if (!convertedData) {
      // Redirect to error page for user-facing services
      if (!noRedirect) {
        const errorUrl = new URL('/error', request.url);
        errorUrl.searchParams.set('errorType', 'conversion');
        errorUrl.searchParams.set('entityType', inputType);
        errorUrl.searchParams.set('url', originalUrl);
        errorUrl.searchParams.set('service', service);
        errorUrl.searchParams.set('message', `${inputType.charAt(0).toUpperCase() + inputType.slice(1)} not found or unavailable on ${service}`);
        return NextResponse.redirect(errorUrl);
      }

      return NextResponse.json({
        error: "Conversion failed - no data returned",
        inputType
      }, { status: 404 });
    }

    if (!noRedirect) {
      if (!convertedUrl) {
        // Failed to create URL - redirect to error page
        const errorUrl = new URL('/error', request.url);
        errorUrl.searchParams.set('errorType', 'redirect');
        errorUrl.searchParams.set('entityType', inputType);
        errorUrl.searchParams.set('url', originalUrl);
        errorUrl.searchParams.set('service', service);
        errorUrl.searchParams.set('message', `Failed to create ${service} URL`);
        return NextResponse.redirect(errorUrl);
      }
      return NextResponse.redirect(convertedUrl);
    }

    return NextResponse.json(convertedData);

  } catch (error) {
    console.error("Error processing request:", error);
    const originalUrl = request.nextUrl.searchParams.get('url') || '';
    const rawService = (await (await params)).service;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Redirect to error page for user-facing services (not syncfm)
    if (rawService !== 'syncfm') {
      const errorUrl = new URL('/error', request.url);
      errorUrl.searchParams.set('errorType', 'unknown');
      errorUrl.searchParams.set('entityType', 'song');
      errorUrl.searchParams.set('url', originalUrl);
      errorUrl.searchParams.set('service', rawService);
      errorUrl.searchParams.set('message', `Internal server error: ${errorMessage}`);
      return NextResponse.redirect(errorUrl);
    }

    return NextResponse.json({
      error: "Internal server error",
      message: errorMessage
    }, { status: 500 });
  }
}
