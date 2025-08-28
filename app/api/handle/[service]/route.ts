import { NextRequest, NextResponse } from 'next/server';
import { SyncFM } from '@/syncfm.ts';
import syncfmconfig from "@/syncfm.config";

const syncfm = new SyncFM(syncfmconfig);

export async function GET(request: NextRequest, { params }: { params: Promise<{ service: string }> }) {
  try {
    let rawService = (await params).service
    // Prefer `url` query param, but fall back to reconstructing from the pathname when
    // reverse proxies (traefik/coolify) mangle the path containing the external URL.
    let originalUrl = request.nextUrl.searchParams.get('url')

    function normalizeExternalUrl(input: string | null | undefined): string | null {
      if (!input) return null
      // Try decode once safely (catch malformed sequences)
      let candidate = input
      try {
        candidate = decodeURIComponent(candidate)
  } catch {
        // fall back to raw input
      }

      // Strip leading slash if present (we sometimes receive "/https://...")
      if (candidate.startsWith('/')) candidate = candidate.slice(1)

      // Fix common single-slash protocol mangles: "https:/example" -> "https://example"
      candidate = candidate.replace(/^(https?:)\/(?!\/)/, '$1//')

      // If it still doesn't look like a proper http(s) URL, give up
      if (!candidate.match(/^https?:\/\//i)) return null
      return candidate
    }

    if (!originalUrl) {
      // Reconstruct from the pathname when upstream removed/encoded characters.
      // Example mangled path: "/https:/music.youtube.com/watch%3Fv%3Dabc"
      const pathPart = request.nextUrl.pathname
      const searchPart = request.nextUrl.search || ''
      const combined = `${pathPart}${searchPart}`
      originalUrl = normalizeExternalUrl(combined)
    } else {
      originalUrl = normalizeExternalUrl(originalUrl)
    }

    if (!originalUrl) {
      console.error('Missing or invalid URL parameter', {
        host: request.headers.get('host'),
        pathname: request.nextUrl.pathname,
        rawQuery: request.nextUrl.search,
      })
      return NextResponse.json({ error: 'Missing or invalid URL parameter' }, { status: 400 })
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

    if (!noRedirect && convertedUrl) {
      // Redirect the client to the converted service URL in normal (non-syncfm) subdomain flows
      return NextResponse.redirect(new URL(convertedUrl, request.url))
    }

    // For `syncfm` (no-redirect) or if we couldn't build a redirect URL, return JSON
    return NextResponse.json(convertedData);

  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}