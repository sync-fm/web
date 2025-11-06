import type { NextRequest } from "next/server";
import env from "@/lib/meow-env";

const HTTPS = "https";

const getEnvOrigin = (): string | null => {
    const candidate = env.get("NEXT_PUBLIC_APP_URL") ?? null;
    if (!candidate) return null;
    try {
        return new URL(candidate).origin;
    } catch {
        return null;
    }
};

const pickForwardedHost = (headerValue: string | null): string | null => {
    if (!headerValue) return null;
    const [first] = headerValue.split(",");
    return first?.trim() ?? null;
};

const normalizeProtocol = (proto: string | null, fallback: string): string => {
    if (!proto) return fallback;
    const [first] = proto.split(",");
    return first?.trim() || fallback;
};

export const getCanonicalOrigin = (request: NextRequest): string => {
    const envOrigin = getEnvOrigin();
    if (envOrigin) {
        return envOrigin;
    }

    const forwardedHost = pickForwardedHost(request.headers.get("x-forwarded-host"));
    const forwardedProto = normalizeProtocol(
        request.headers.get("x-forwarded-proto"),
        env.get("NODE_ENV") === "production" ? HTTPS : request.nextUrl.protocol.replace(":", ""),
    );

    if (forwardedHost) {
        return `${forwardedProto}://${forwardedHost}`;
    }

    const host = request.headers.get("host");
    if (host) {
        const protocol = env.get("NODE_ENV") === "production" ? HTTPS : forwardedProto;
        return `${protocol}://${host}`;
    }

    return request.nextUrl.origin;
};

export const resolveCanonicalUrl = (request: NextRequest, target: string | URL): URL => {
    if (target instanceof URL) {
        return target;
    }

    try {
        const direct = new URL(target);
        return direct;
    } catch {
        const origin = getCanonicalOrigin(request);
        return new URL(target, origin);
    }
};
