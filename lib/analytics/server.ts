import { PostHog } from "posthog-node";
import { meowenv } from "@/lib/meow-env";
const env = new meowenv(false);
const API_KEY = env.get("NEXT_PUBLIC_POSTHOG_KEY");
const DISABLED = env.get("POSTHOG_DISABLED") === "true";

let client: PostHog | null = null;

function isEdgeRuntime() {
    return typeof process !== "undefined" && env.get("NEXT_RUNTIME") === "edge";
}

function createClient(): PostHog | undefined {
    if (client || DISABLED || !API_KEY || isEdgeRuntime()) {
        return client ?? undefined;
    }

    client = new PostHog(API_KEY, {
        host: `${env.get("NEXT_PUBLIC_APP_URL")}/relay-8aSv`
    });
    return client;
}

export function getPosthogServer() {
    return createClient();
}

type EventProperties = Record<string, unknown> | undefined;

function buildProperties(additional?: EventProperties) {
    return {
        environment:
            env.get("NEXT_PUBLIC_RUNTIME_ENV") ?? env.get("NODE_ENV") ?? "unknown",
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
