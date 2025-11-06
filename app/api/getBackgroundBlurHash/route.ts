import { NextResponse } from "next/server";
import * as blurhash from 'blurhash'
import sharp from 'sharp';
import { captureServerEvent, captureServerException } from "@/lib/analytics/server";
import { durationSince, extractUrlMetadata } from "@/lib/analytics/utils";

export async function GET(req: Request) {
    const start = Date.now();
    const respond = (status: number, body: unknown, analytics: Record<string, unknown> = {}) => {
        captureServerEvent("api.getBackgroundBlurHash.response", {
            route: "api/getBackgroundBlurHash",
            method: "GET",
            status,
            success: status < 400,
            duration_ms: durationSince(start),
            ...analytics,
        });
        return NextResponse.json(body, { status });
    };
    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')
    const urlMetadata = extractUrlMetadata(url);
    captureServerEvent("api.getBackgroundBlurHash.request", {
        route: "api/getBackgroundBlurHash",
        method: "GET",
        ...urlMetadata,
    });

    if (!url) return respond(400, {
        message: 'Required fields is empty'
    }, {
        reason: 'missing_url'
    })

    try {
        const image = await fetch(url);
        const buffer = Buffer.from(await image.arrayBuffer())

        const { data, info } = await sharp(buffer)
            .raw()
            .ensureAlpha()
            .resize(256, 256)
            .toBuffer({
                resolveWithObject: true
            });

        const hash = blurhash.encode(
            new Uint8ClampedArray(data),
            info.width,
            info.height,
            4,
            4
        )

        return respond(200, {
            hash
        }, {
            stage: 'success',
            hash_length: hash.length,
            ...urlMetadata,
        })
    } catch (err) {
        captureServerException(err, {
            route: "api/getBackgroundBlurHash",
            ...urlMetadata,
        });
        return respond(404, {
            error: err
        }, {
            stage: 'processing_error',
            ...urlMetadata,
        })
    }
}