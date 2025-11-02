import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SyncFM } from "syncfm.ts";
import type { SyncFMSong, SyncFMAlbum, SyncFMArtist } from "syncfm.ts";
import syncfmconfig from "@/syncfm.config";

const syncfm = new SyncFM(syncfmconfig);

const prefixMapReverse: Record<string, "song" | "artist" | "album"> = {
    so: "song",
    ar: "artist",
    al: "album",
};
export async function GET(request: NextRequest, { params }: { params: Promise<{ shortcode: string }> }) {
    try {
        const shortcode = (await params).shortcode
        const prefixMap: Record<"song" | "artist" | "album", string> = {
            song: "so",
            artist: "ar",
            album: "al",
        } as const;
        let inputType: keyof typeof prefixMap

        try {
            if (!shortcode) {
                throw new Error('No shortcode!');
            }
            inputType = prefixMapReverse[shortcode.slice(0, 2) as keyof typeof prefixMap];
        } catch (error) {
            console.error("Failed to get input type:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";

            const errorUrl = new URL('/error', request.url);
            errorUrl.searchParams.set('errorType', 'resolve');
            errorUrl.searchParams.set('entityType', 'shortcode');
            errorUrl.searchParams.set('message', `Failed to resolve shortcode type: ${errorMessage}`);
            return NextResponse.redirect(errorUrl);


        }
        let dataFromShortcode: SyncFMSong | SyncFMAlbum | SyncFMArtist | null = null;
        try {
            dataFromShortcode = await syncfm.getInputInfoFromShortcode<SyncFMSong | SyncFMAlbum | SyncFMArtist>(shortcode);

        } catch (error) {
            console.error("Error fetching data from shortcode:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";

            const errorUrl = new URL('/error', request.url);
            errorUrl.searchParams.set('errorType', 'resolve');
            errorUrl.searchParams.set('entityType', inputType);
            errorUrl.searchParams.set('code', shortcode);
            errorUrl.searchParams.set('message', `Failed to fetch data from shortcode: ${errorMessage}`);
            return NextResponse.redirect(errorUrl);
        }

        let convertedData: SyncFMSong | SyncFMAlbum | SyncFMArtist | null = null;
        let redirectUrl: URL;
        const host = request.headers.get("host") || "localhost:3000";
        const protocol =
            request.headers.get("x-forwarded-proto") ||
            (process.env.NODE_ENV === "production" ? "https" : "http");
        const baseUrl = `${protocol}://${host}`;
        try {
            convertedData = await syncfm.unifiedConvert(dataFromShortcode, 'spotify', inputType);
            redirectUrl = new URL(`${baseUrl}/${inputType}`)
            redirectUrl.searchParams.set("syncId", convertedData.syncId);
        } catch (error) {
            console.error("Conversion error:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";

            const errorUrl = new URL('/error', request.url);
            errorUrl.searchParams.set('errorType', 'conversion');
            errorUrl.searchParams.set('entityType', inputType);
            errorUrl.searchParams.set('message', `Conversion failed: ${errorMessage}`);
            return NextResponse.redirect(errorUrl);
        }

        if (!convertedData) {

            const errorUrl = new URL('/error', request.url);
            errorUrl.searchParams.set('errorType', 'conversion');
            errorUrl.searchParams.set('entityType', inputType);
            errorUrl.searchParams.set('code', shortcode);
            errorUrl.searchParams.set('message', "No converted data returned");
            return NextResponse.redirect(errorUrl);
        }


        // successful 
        return NextResponse.redirect(redirectUrl);

    } catch (error) {
        console.error("Error processing request:", error);
        const originalUrl = request.nextUrl.searchParams.get('url') || '';
        const shortcode = (await (await params)).shortcode;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        // Redirect to error page for user-facing services (not syncfm)
        const errorUrl = new URL('/error', request.url);
        errorUrl.searchParams.set('errorType', 'unknown');
        errorUrl.searchParams.set('entityType', 'song');
        errorUrl.searchParams.set('url', originalUrl);
        errorUrl.searchParams.set('code', shortcode);
        errorUrl.searchParams.set('message', `Internal server error: ${errorMessage}`);
        return NextResponse.redirect(errorUrl);
    }
}
