import { NextRequest, NextResponse } from 'next/server'
import { SyncFM } from "syncfm.ts";
import syncfmconfig from "@/syncfm.confic";

export const syncfm = new SyncFM(syncfmconfig)

function decodePathToFullUrl(path: string): string {
  let decoded = decodeURIComponent(path)

  // Fix cases like http:/ or https:/ (missing one slash)
  decoded = decoded.replace(/^https?:\/(?!\/)/, (match) => match + '/')

  return decoded
}

export function middleware(request: NextRequest) {
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

  if (!pathname.startsWith('/http') && !pathname.startsWith('/https')) {
    return NextResponse.next()
  }

  // If there's no detected subdomain (or it's a common www host), treat as normal root-host behavior.
  if (!subdomain || subdomain === 'www') {
    const path = pathname.slice(1)
    const fullExternalUrl = decodePathToFullUrl(`${path}${search}`)

    const detectedInputType = syncfm.getInputTypeFromUrl(fullExternalUrl)

    if (detectedInputType) {
      const redirectTarget = `${request.nextUrl.protocol}//${request.nextUrl.host}/${detectedInputType}?url=${encodeURIComponent(fullExternalUrl)}`
      return NextResponse.redirect(new URL(redirectTarget, request.url))
    }
  } else {
    return handleSubdomainRedirection(request, subdomain) || NextResponse.next()
  }
}

function handleSubdomainRedirection(request: NextRequest, subdomain: string) {
  const desiredService = getDesiredServiceFromSubdomain(subdomain)
  if (!desiredService) return NextResponse.next()

  const path = request.nextUrl.pathname.slice(1)
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