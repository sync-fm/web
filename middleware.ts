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
  const host = request.headers.get('host') || ''
  const subdomain = host.split('.')[0]
  const { pathname, search } = request.nextUrl

  if (!pathname.startsWith('/http') && !pathname.startsWith('/https')) {
    return NextResponse.next()
  }

  if (!subdomain || subdomain === 'www' || subdomain === host) {
    const path = pathname.slice(1)
    const fullExternalUrl = decodePathToFullUrl(`${path}${search}`)

    const detectedService = syncfm.getStreamingServiceFromUrl(fullExternalUrl)
    const detectedInputType = syncfm.getInputTypeFromUrl(fullExternalUrl, detectedService)

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