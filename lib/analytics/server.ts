import { PostHog } from "posthog-node";

const API_KEY = process.env.POSTHOG_API_KEY;
const HOST = process.env.POSTHOG_HOST ?? "https://eu.i.posthog.com";
const DISABLED = process.env.POSTHOG_DISABLED === "true";
const FLUSH_AT = process.env.POSTHOG_FLUSH_AT ? Number(process.env.POSTHOG_FLUSH_AT) : undefined;
const FLUSH_INTERVAL = process.env.POSTHOG_FLUSH_INTERVAL_MS
    ? Number(process.env.POSTHOG_FLUSH_INTERVAL_MS)
    : undefined;

let client: PostHog | null = null;

function isEdgeRuntime() {
    return typeof process !== "undefined" && process.env.NEXT_RUNTIME === "edge";
}

function createClient(): PostHog | undefined {
    if (client || DISABLED || !API_KEY || isEdgeRuntime()) {
        return client ?? undefined;
    }

    const options: Record<string, unknown> = {
        host: HOST,
    };
    if (typeof FLUSH_AT === "number" && !Number.isNaN(FLUSH_AT)) {
        options.flushAt = FLUSH_AT;
    }
    if (typeof FLUSH_INTERVAL === "number" && !Number.isNaN(FLUSH_INTERVAL)) {
        options.flushInterval = FLUSH_INTERVAL;
    }

    client = new PostHog(API_KEY, options);
    return client;
}

export function getPosthogServer() {
    return createClient();
}

type EventProperties = Record<string, unknown> | undefined;

function buildProperties(additional?: EventProperties) {
    return {
        environment:
            process.env.NEXT_PUBLIC_RUNTIME_ENV ?? process.env.NODE_ENV ?? "unknown",
        ...additional,
    };
}

export function captureServerEvent(event: string, properties?: EventProperties) {
    const instance = getPosthogServer();
    if (!instance) return;

    instance.capture({
        distinctId: "server",
        event,
        properties: buildProperties(properties),
    });
}

export function captureServerException(error: unknown, properties?: EventProperties) {
    const instance = getPosthogServer();
    if (!instance) return;

    const base = buildProperties(properties);

    if (error instanceof Error) {
        instance.capture({
            distinctId: "server",
            event: "server_exception",
            properties: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                ...base,
            },
        });
        return;
    }

    instance.capture({
        distinctId: "server",
        event: "server_exception",
        properties: {
            value: error,
            serialized: safeStringify(error),
            ...base,
        },
    });
}

function safeStringify(value: unknown) {
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

export function shutdownPosthog() {
    if (!client) return;
    client.shutdown();
    client = null;
}

export function withServerTiming<T>(
    event: string,
    properties: EventProperties,
    exec: () => Promise<T>,
) {
    const start = Date.now();
    return exec()
        .then((result) => {
            captureServerEvent(`${event}.success`, {
                ...properties,
                duration_ms: Date.now() - start,
                success: true,
            });
            return result;
        })
        .catch((error) => {
            captureServerException(error, {
                ...properties,
                duration_ms: Date.now() - start,
                success: false,
            });
            throw error;
        });
}
