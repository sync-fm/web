import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveCanonicalUrl } from "@/lib/canonical-url";
import { SyncFM } from "syncfm.ts";
import type { SyncFMSong, SyncFMAlbum, SyncFMArtist } from "syncfm.ts";
import syncfmconfig from "@/syncfm.config";

const syncfm = new SyncFM(syncfmconfig);

type EntityType = "song" | "artist" | "album";

const prefixMapReverse: Record<string, EntityType> = {
    so: "song",
    ar: "artist",
    al: "album",
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ shortcode: string }> }) {
    let shortcode: string | undefined;
    try {
        const resolvedParams = await params;
        shortcode = resolvedParams.shortcode;

        const buildErrorUrl = (options: {
            errorType: string;
            entityType: string;
            message: string;
            code?: string;
        }): URL => {
            const errorUrl = resolveCanonicalUrl(request, "/error");
            errorUrl.searchParams.set("errorType", options.errorType);
            errorUrl.searchParams.set("entityType", options.entityType);
            errorUrl.searchParams.set("message", options.message);
            if (options.code) {
                errorUrl.searchParams.set("code", options.code);
            }
            return errorUrl;
        };

        if (!shortcode) {
            const errorUrl = buildErrorUrl({
                errorType: "resolve",
                entityType: "shortcode",
                message: "No shortcode provided.",
            });
            return NextResponse.redirect(errorUrl);
        }

        let inputType: EntityType;
        try {
            const prefix = shortcode.slice(0, 2);
            const resolvedType = prefixMapReverse[prefix];
            if (!resolvedType) {
                throw new Error(`Unsupported shortcode prefix: ${prefix || "unknown"}`);
            }
            inputType = resolvedType;
        } catch (error) {
            console.error("Failed to get input type:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            const errorUrl = buildErrorUrl({
                errorType: "resolve",
                entityType: "shortcode",
                message: `Failed to resolve shortcode type: ${errorMessage}`,
                code: shortcode,
            });
            return NextResponse.redirect(errorUrl);
        }

        let dataFromShortcode: SyncFMSong | SyncFMAlbum | SyncFMArtist;
        try {
            dataFromShortcode = await syncfm.getInputInfoFromShortcode<
                SyncFMSong | SyncFMAlbum | SyncFMArtist
            >(shortcode);
        } catch (error) {
            console.error("Error fetching data from shortcode:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            const errorUrl = buildErrorUrl({
                errorType: "resolve",
                entityType: inputType,
                message: `Failed to fetch data from shortcode: ${errorMessage}`,
                code: shortcode,
            });
            return NextResponse.redirect(errorUrl);
        }

        let convertedData: SyncFMSong | SyncFMAlbum | SyncFMArtist;
        try {
            convertedData = await syncfm.unifiedConvert(dataFromShortcode, "spotify", inputType);
        } catch (error) {
            console.error("Conversion error:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            const errorUrl = buildErrorUrl({
                errorType: "conversion",
                entityType: inputType,
                message: `Conversion failed: ${errorMessage}`,
                code: shortcode,
            });
            return NextResponse.redirect(errorUrl);
        }

        if (!convertedData) {
            const errorUrl = buildErrorUrl({
                errorType: "conversion",
                entityType: inputType,
                message: "No converted data returned",
                code: shortcode,
            });
            return NextResponse.redirect(errorUrl);
        }

        const redirectUrl = resolveCanonicalUrl(request, `/${inputType}`);
        redirectUrl.searchParams.set("syncId", convertedData.syncId);
        return NextResponse.redirect(redirectUrl);
    } catch (error) {
        console.error("Error processing request:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorUrl = resolveCanonicalUrl(request, "/error");
        errorUrl.searchParams.set("errorType", "unknown");
        errorUrl.searchParams.set("entityType", "song");
        errorUrl.searchParams.set("url", request.nextUrl.searchParams.get("url") || "");
        if (shortcode) {
            errorUrl.searchParams.set("code", shortcode);
        }
        errorUrl.searchParams.set("message", `Internal server error: ${errorMessage}`);
        return NextResponse.redirect(errorUrl);
    }
}
