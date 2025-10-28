import { NextRequest, NextResponse } from 'next/server'
import { SyncFM } from "syncfm.ts";
import syncfmconfig from "@/syncfm.config";

// Lazy initialize SyncFM to avoid constructor side-effects at module import time
let _syncfm: SyncFM | null = null;
function getSyncfm(): SyncFM {
  if (!_syncfm) {
    try {
      _syncfm = new SyncFM(syncfmconfig);
    } catch (err) {
      // If construction fails (missing envs in some runtimes), keep null and
      // allow middleware callers to handle absence gracefully.
      console.warn('SyncFM initialization in middleware failed:', err);
      throw err;
    }
  }
  return _syncfm;
}

function decodePathToFullUrl(path: string): string {
  let decoded = decodeURIComponent(path)

  // Fix cases like http:/ or https:/ (missing one slash)
  decoded = decoded.replace(/^https?:\/(?!\/)/, (match) => match + '/')

  return decoded
}

export async function middleware(request: NextRequest) {
  const hostHeader = request.headers.get('host') || ''
  // remove port if present: e.g. "yt.localhost:3000" -> "yt.localhost"
  const hostname = hostHeader.split(':')[0]
  const { pathname, search } = request.nextUrl

  // Determine subdomain rules:
  // - For hosts that end with ".localhost" treat two-label hosts like "yt.localhost" as having a subdomain.
  // - For normal domains, require 3+ labels to consider the first label a subdomain (e.g. "yt.syncfm.dev").
  // - For single-label hosts like "localhost" treat as no subdomain.
  let subdomain: string | undefined
  const labels = hostname.split('.')
  if (hostname === 'localhost') {
    subdomain = undefined
  } else if (hostname.endsWith('.localhost') && labels.length >= 2) {
    subdomain = labels[0]
  } else if (labels.length >= 3) {
    subdomain = labels[0]
  } else {
    subdomain = undefined
  }

  // If subdomain is detected and not 'www', handle subdomain redirection for all paths
  if (subdomain && subdomain !== 'www') {
    // Prevent redirect loops: don't rewrite internal framework or API routes
    // or requests that are already hitting our handler.
    const skipPrefixes = ['/api/', '/_next/', '/_static/', '/favicon.ico', '/robots.txt']
    for (const prefix of skipPrefixes) {
      if (pathname.startsWith(prefix)) return NextResponse.next()
    }

    return handleSubdomainRedirection(request, subdomain) || NextResponse.next()
  }

  // For root hosts, only handle if path starts with /http or /https
  if (pathname.startsWith('/http') || pathname.startsWith('/https')) {
    const path = pathname.slice(1)
    const fullExternalUrl = decodePathToFullUrl(`${path}${search}`)

    let detectedInputType: string | null | undefined;
    try {
      detectedInputType = await getSyncfm().getInputTypeFromUrl(fullExternalUrl) // handled above
    } catch (err) {
      // If SyncFM isn't available (e.g. missing env vars), skip redirection.
      console.warn('middleware: could not detect input type due to SyncFM init failure', err)
      detectedInputType = null
    }

    if (detectedInputType) {
      const redirectTarget = `${request.nextUrl.protocol}//${request.nextUrl.host}/${detectedInputType}?url=${encodeURIComponent(fullExternalUrl)}`
      return NextResponse.redirect(new URL(redirectTarget, request.url))
    }
  }
  return NextResponse.next()
}

function handleSubdomainRedirection(request: NextRequest, subdomain: string) {
  let desiredService: "applemusic" | "spotify" | "ytmusic" | "syncfm" | undefined;
  try {
    desiredService = getDesiredServiceFromSubdomain(subdomain)
  } catch {
    desiredService = undefined
  }
  if (!desiredService) return NextResponse.next()

  const path = request.nextUrl.pathname.slice(1)
  // If the path already targets our internal handler, don't redirect again
  if (path.startsWith('api/handle') || path.startsWith('api/')) return NextResponse.next()
  const fullExternalUrl = decodePathToFullUrl(`${path}${request.nextUrl.search}`)

  const redirectTarget = `${request.nextUrl.protocol}//${request.nextUrl.host}/api/handle/${desiredService}?url=${encodeURIComponent(fullExternalUrl)}`
  return NextResponse.redirect(new URL(redirectTarget, request.url))
}

function getDesiredServiceFromSubdomain(subdomain: string): "applemusic" | "spotify" | "ytmusic" | "syncfm" | undefined {
  switch (subdomain) {
    case 'am':
    case 'a':
    case 'applemusic':
      return 'applemusic'
    case 's':
    case 'spotify':
      return 'spotify'
    case 'y':
    case 'yt':
    case 'ytm':
    case 'youtube':
      return 'ytmusic'
    case 'syncfm':
      return 'syncfm'
    default:
      return undefined
  }
}