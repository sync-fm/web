import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SyncFM } from "syncfm.ts";
import type { SyncFMSong, SyncFMAlbum, SyncFMArtist } from "syncfm.ts";
import syncfmconfig from "@/syncfm.config";
import { captureServerEvent, captureServerException } from "@/lib/analytics/server";
import { durationSince, extractUrlMetadata } from "@/lib/analytics/utils";
import { normalizeConversionOutcome } from "@/lib/normalizeConversionOutcome";
import { getErrorURL } from '@/lib/url-factory';

const syncfm = new SyncFM(syncfmconfig);

export async function GET(request: NextRequest, { params }: { params: Promise<{ service: string }> }) {
  const resolvedParams = await params;
  let rawService = resolvedParams.service;
  const requestedService = rawService;
  const originalUrl = request.nextUrl.searchParams.get('url');
  const syncId = request.nextUrl.searchParams.get('syncId');
  const noRedirect = rawService === 'syncfm';
  const start = Date.now();
  const urlMetadata = extractUrlMetadata(originalUrl);

  // Debug logging for URL processing
  console.log("DEBUG: Received originalUrl:", originalUrl);
  console.log("DEBUG: originalUrl type:", typeof originalUrl);
  console.log("DEBUG: originalUrl length:", originalUrl?.length);
  if (originalUrl) {
    console.log("DEBUG: originalUrl chars:", originalUrl.split('').slice(0, 50).map(c => `${c}(${c.charCodeAt(0)})`).join(' '));
  }

  captureServerEvent("api.handle.request", {
    route: "api/handle/[service]",
    method: "GET",
    requested_service: requestedService,
    no_redirect: noRedirect,
    has_syncId: Boolean(syncId),
    ...urlMetadata,
  });

  const recordResponse = (status: number, analytics: Record<string, unknown> = {}) => {
    captureServerEvent("api.handle.response", {
      route: "api/handle/[service]",
      method: "GET",
      requested_service: requestedService,
      resolved_service: rawService,
      no_redirect: noRedirect,
      has_syncId: Boolean(syncId),
      status,
      success: status >= 200 && status < 400,
      duration_ms: durationSince(start),
      ...urlMetadata,
      ...analytics,
    });
  };

  const respondJson = (status: number, body: unknown, analytics: Record<string, unknown> = {}) => {
    recordResponse(status, { response_type: "json", ...analytics });
    return NextResponse.json(body, { status });
  };

  const respondRedirect = (target: string | URL, analytics: Record<string, unknown> = {}) => {
    const resolvedUrl = target instanceof URL ? target : new URL(target);
    recordResponse(302, {
      response_type: "redirect",
      redirect_host: resolvedUrl.hostname,
      ...analytics,
    });

    return NextResponse.redirect(resolvedUrl);
  };

  const buildShareRedirectPath = (
    entity: SyncFMSong | SyncFMAlbum | SyncFMArtist,
    entityType: 'song' | 'album' | 'artist' | 'playlist',
    fallbackService: string,
  ): string => {
    const params = new URLSearchParams();
    params.set('syncId', entity.syncId);
    params.set('partial', 'true');
    params.set('service', fallbackService);

    switch (entityType) {
      case 'album':
        return `/album?${params.toString()}`;
      case 'artist':
        return `/artist?${params.toString()}`;
      case 'playlist':
        return `/playlist?${params.toString()}`;
      default:
        return `/song?${params.toString()}`;
    }
  };

  try {
    if (!originalUrl && !syncId) {
      const analytics = { reason: "missing_parameters" };
      if (!noRedirect) {
        const errorUrl = getErrorURL();
        errorUrl.searchParams.set('errorType', 'fetch');
        errorUrl.searchParams.set('entityType', 'song');
        errorUrl.searchParams.set('message', 'Missing URL or syncId parameter');
        return respondRedirect(errorUrl, analytics);
      }
      return respondJson(400, { error: 'Missing URL or syncId parameter' }, analytics);
    }

    // Handle syncId-based lookup
    if (syncId) {
      if (!rawService) {
        const analytics = { reason: "invalid_service", stage: "syncId" };
        if (!noRedirect) {
          const errorUrl = getErrorURL();
          errorUrl.searchParams.set('errorType', 'fetch');
          errorUrl.searchParams.set('entityType', 'song');
          errorUrl.searchParams.set('message', 'Invalid service');
          return respondRedirect(errorUrl, analytics);
        }
        return respondJson(400, { error: "Invalid service." }, analytics);
      }

      if (noRedirect) { rawService = 'spotify'; }
      const service = rawService as "applemusic" | "spotify" | "ytmusic";

      let convertedData: SyncFMSong | SyncFMAlbum | SyncFMArtist | null = null;
      let inputType: 'song' | 'album' | 'artist' | 'playlist' = 'song';

      try {
        convertedData = await syncfm.getSongBySyncId(syncId);
        if (convertedData) {
          inputType = 'song';
        } else {
          convertedData = await syncfm.getAlbumBySyncId(syncId);
          if (convertedData) {
            inputType = 'album';
          } else {
            convertedData = await syncfm.getArtistBySyncId(syncId);
            if (convertedData) {
              inputType = 'artist';
            }
          }
        }

        if (!convertedData) {
          const analytics = {
            reason: "not_found",
            stage: "syncId",
            syncId,
            service,
          };
          if (!noRedirect) {
            const errorUrl = getErrorURL();
            errorUrl.searchParams.set('errorType', 'fetch');
            errorUrl.searchParams.set('entityType', 'song');
            errorUrl.searchParams.set('syncId', syncId);
            errorUrl.searchParams.set('message', `No content found with syncId: ${syncId}`);
            return respondRedirect(errorUrl, analytics);
          }
          return respondJson(404, { error: `No content found with syncId: ${syncId}` }, analytics);
        }

        const normalized = normalizeConversionOutcome(convertedData);

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

          const analyticsBase = {
            stage: "syncId",
            syncId,
            service,
            inputType,
            available_services: normalized.availableServices,
            missing_services: normalized.missingServices,
            has_partial_success: normalized.hasPartialSuccess,
          };

          if (convertedUrl) {
            return respondRedirect(convertedUrl, {
              ...analyticsBase,
              outcome: "redirect",
            });
          }

          const shareTarget = buildShareRedirectPath(convertedData, inputType, service);
          return respondRedirect(shareTarget, {
            ...analyticsBase,
            outcome: "redirect_share",
            reason: "missing_converted_url",
          });
        }

        return respondJson(200, convertedData, {
          stage: "syncId",
          syncId,
          service,
          inputType,
          outcome: "data",
          available_services: normalized.availableServices,
          missing_services: normalized.missingServices,
          has_partial_success: normalized.hasPartialSuccess,
        });

      } catch (error) {
        console.error("Error fetching by syncId:", error);
        captureServerException(error, {
          route: "api/handle/[service]",
          stage: "syncId",
          syncId,
          service,
        });
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        const analytics = {
          stage: "syncId",
          syncId,
          service,
          reason: "exception",
        };

        if (!noRedirect) {
          const errorUrl = getErrorURL();
          errorUrl.searchParams.set('errorType', 'fetch');
          errorUrl.searchParams.set('entityType', 'song');
          errorUrl.searchParams.set('syncId', syncId);
          errorUrl.searchParams.set('message', `Failed to fetch content: ${errorMessage}`);
          return respondRedirect(errorUrl, analytics);
        }

        return respondJson(500, {
          error: "Failed to fetch content",
          message: errorMessage
        }, analytics);
      }
    }

    // Handle URL-based conversion (original logic)
    if (!originalUrl || !originalUrl.startsWith('http')) {
      const analytics = {
        reason: "invalid_url",
        stage: "url",
        originalUrl,
      };
      if (!noRedirect) {
        const errorUrl = getErrorURL();
        errorUrl.searchParams.set('errorType', 'fetch');
        errorUrl.searchParams.set('entityType', 'song');
        if (originalUrl) errorUrl.searchParams.set('url', originalUrl);
        errorUrl.searchParams.set('message', 'Invalid URL format');
        return respondRedirect(errorUrl, analytics);
      }
      return respondJson(400, { error: "Invalid URL format." }, analytics);
    }

    if (!rawService) {
      const analytics = { reason: "invalid_service", stage: "url" };
      if (!noRedirect) {
        const errorUrl = getErrorURL();
        errorUrl.searchParams.set('errorType', 'fetch');
        errorUrl.searchParams.set('entityType', 'song');
        errorUrl.searchParams.set('message', 'Invalid service');
        return respondRedirect(errorUrl, analytics);
      }
      return respondJson(400, { error: "Invalid subdomain." }, analytics);
    }

    let inputType: 'song' | 'album' | 'artist' | 'playlist';
    try {
      inputType = await syncfm.getInputTypeFromUrl(originalUrl);
    } catch (error) {
      console.error("Failed to get input type:", error);
      captureServerException(error, {
        route: "api/handle/[service]",
        stage: "detect_input_type",
        requested_service: requestedService,
      });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      const analytics = {
        reason: "detect_input_type_failed",
        stage: "detect_input_type",
        originalUrl,
      };

      if (!noRedirect) {
        const errorUrl = getErrorURL();
        errorUrl.searchParams.set('errorType', 'fetch');
        errorUrl.searchParams.set('entityType', 'song');
        errorUrl.searchParams.set('url', originalUrl);
        errorUrl.searchParams.set('message', `Failed to determine content type: ${errorMessage}`);
        return respondRedirect(errorUrl, analytics);
      }

      return respondJson(400, {
        error: "Failed to determine input type",
        message: errorMessage
      }, analytics);
    }

    let convertedData: SyncFMSong | SyncFMAlbum | SyncFMArtist | null = null;
    let convertedUrl: string | null = null;
    if (noRedirect) { rawService = 'spotify'; }
    const service = rawService as "applemusic" | "spotify" | "ytmusic";

    try {
      switch (inputType) {
        case 'song': {
          console.log("DEBUG: Processing song URL:", originalUrl);
          console.log("DEBUG: Service:", service);

          // Get the syncfm service to check URL parsing
          const ytmusicService = syncfm.__INTERNAL_getService('ytmusic');
          const extractedId = ytmusicService.getIdFromUrl(originalUrl);
          console.log("DEBUG: Extracted video ID:", extractedId, "Length:", extractedId?.length, "Type:", typeof extractedId);

          if (extractedId) {
            console.log("DEBUG: Video ID chars:", extractedId.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' '));
            console.log("DEBUG: Regex test:", /^[a-zA-Z0-9-_]{11}$/.test(extractedId));
          }

          convertedData = await syncfm.convertSong(await syncfm.getInputSongInfo(originalUrl), service);
          if (!noRedirect && convertedData) {
            convertedUrl = await syncfm.createSongURL(convertedData, service, convertedData.syncId);
          }
          break;
        }
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
        default: {
          const analytics = {
            reason: "unsupported_input_type",
            stage: "conversion",
            inputType,
            service,
          };
          if (!noRedirect) {
            const errorUrl = getErrorURL();
            errorUrl.searchParams.set('errorType', 'conversion');
            errorUrl.searchParams.set('entityType', 'song');
            errorUrl.searchParams.set('url', originalUrl);
            errorUrl.searchParams.set('service', service);
            errorUrl.searchParams.set('message', 'Unsupported content type');
            return respondRedirect(errorUrl, analytics);
          }
          return respondJson(400, { error: "Invalid input type." }, analytics);
        }
      }
    } catch (error) {
      console.error("Conversion error:", error);
      captureServerException(error, {
        route: "api/handle/[service]",
        stage: "conversion",
        inputType,
        service,
      });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      const analytics = {
        reason: "conversion_failed",
        stage: "conversion",
        inputType,
        service,
      };

      if (!noRedirect) {
        const errorUrl = getErrorURL();
        errorUrl.searchParams.set('errorType', 'conversion');
        errorUrl.searchParams.set('entityType', inputType);
        errorUrl.searchParams.set('url', originalUrl);
        errorUrl.searchParams.set('service', service);
        errorUrl.searchParams.set('message', `Conversion failed: ${errorMessage}`);
        return respondRedirect(errorUrl, analytics);
      }

      return respondJson(500, {
        error: "Conversion failed",
        message: errorMessage,
        inputType
      }, analytics);
    }

    if (!convertedData) {
      const analytics = {
        reason: "conversion_returned_null",
        stage: "conversion",
        inputType,
        service,
      };
      if (!noRedirect) {
        const errorUrl = getErrorURL();
        errorUrl.searchParams.set('errorType', 'conversion');
        errorUrl.searchParams.set('entityType', inputType);
        errorUrl.searchParams.set('url', originalUrl);
        errorUrl.searchParams.set('service', service);
        errorUrl.searchParams.set('message', `${inputType.charAt(0).toUpperCase() + inputType.slice(1)} not found or unavailable on ${service}`);
        return respondRedirect(errorUrl, analytics);
      }

      return respondJson(404, {
        error: "Conversion failed - no data returned",
        inputType
      }, analytics);
    }

    const normalized = normalizeConversionOutcome(convertedData);

    if (!noRedirect) {
      const analyticsBase = {
        stage: "conversion",
        inputType,
        service,
        available_services: normalized.availableServices,
        missing_services: normalized.missingServices,
        has_partial_success: normalized.hasPartialSuccess,
      };

      if (convertedUrl) {
        return respondRedirect(convertedUrl, {
          ...analyticsBase,
          outcome: "redirect",
        });
      }

      const shareTarget = buildShareRedirectPath(convertedData, inputType, service);
      return respondRedirect(shareTarget, {
        ...analyticsBase,
        outcome: "redirect_share",
        reason: "missing_converted_url",
      });
    }

    return respondJson(200, convertedData, {
      stage: "conversion",
      inputType,
      service,
      outcome: "data",
      available_services: normalized.availableServices,
      missing_services: normalized.missingServices,
      has_partial_success: normalized.hasPartialSuccess,
    });

  } catch (error) {
    console.error("Error processing request:", error);
    captureServerException(error, {
      route: "api/handle/[service]",
      stage: "unexpected",
      requested_service: requestedService,
    });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (!noRedirect) {
      const errorUrl = getErrorURL();
      errorUrl.searchParams.set('errorType', 'unknown');
      errorUrl.searchParams.set('entityType', 'song');
      if (originalUrl) errorUrl.searchParams.set('url', originalUrl);
      errorUrl.searchParams.set('service', requestedService);
      errorUrl.searchParams.set('message', `Internal server error: ${errorMessage}`);
      return respondRedirect(errorUrl, { stage: "unexpected", reason: "exception" });
    }

    return respondJson(500, {
      error: "Internal server error",
      message: errorMessage
    }, { stage: "unexpected", reason: "exception" });
  }
}
