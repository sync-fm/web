"use client";

import posthog from "posthog-js";
import type { CaptureOptions, Properties } from "posthog-js";
import { meowenv } from "@/lib/meow-env";
const env = new meowenv(true);
const API_KEY = env.get("NEXT_PUBLIC_POSTHOG_KEY");
const ENABLE_IN_DEV = env.get("NEXT_PUBLIC_POSTHOG_ENABLE_IN_DEV") === "true";

let initialized = false;

function shouldInit() {
    if (!API_KEY) return false;
    if (typeof window === "undefined") return false;
    if (env.get("NODE_ENV") === "development" && !ENABLE_IN_DEV) return false;
    return true;
}

export function initPosthogClient() {
    if (initialized) return posthog;
    if (!shouldInit()) return undefined;

    const key = API_KEY;
    if (!key) return undefined;

    posthog.init(key, {
        api_host: "/relay-8aSv",
        ui_host: 'https://eu.posthog.com',
        person_profiles: "identified_only",
        autocapture: true,
        capture_pageview: false,
        capture_pageleave: true,
        capture_performance: true,
        debug: env.get("NODE_ENV") === "development",
    });

    initialized = true;
    return posthog;
}

export function getPosthogClient() {
    if (!initialized) {
        return initPosthogClient();
    }
    return posthog;
}

export function captureClientEvent(
    event: string,
    properties?: Properties,
    options?: CaptureOptions,
) {
    const client = getPosthogClient();
    if (!client) return;
    client.capture(event, properties, options);
}

export function captureClientException(
    error: unknown,
    properties?: Properties,
) {
    const client = getPosthogClient();
    if (!client) return;
    if (error instanceof Error) {
        client.capture("client_exception", {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...properties,
        });
        return;
    }

    client.capture("client_exception", {
        typeof_error: typeof error,
        stringified: JSON.stringify(error),
        ...properties,
    });
}

export function setPosthogUser(userId: string | undefined, properties?: Properties) {
    const client = getPosthogClient();
    if (!client) return;
    if (!userId) {
        client.reset();
        return;
    }
    client.identify(userId, properties);
}

export function setPosthogPersonProperties(properties: Properties) {
    const client = getPosthogClient();
    if (!client) return;
    client.people.set(properties);
}

export function registerPosthogGlobals(properties: Properties) {
    const client = getPosthogClient();
    if (!client) return;
    client.register(properties);
}

export function unregisterPosthogGlobals(keys: string[]) {
    const client = getPosthogClient();
    if (!client) return;
    for (const key of keys) {
        client.unregister(key);
    }
}
