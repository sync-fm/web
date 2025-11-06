import type { ServiceName, SyncFMExternalIdMap } from "syncfm.ts";

type ConversionErrorEntry = {
    lastAttempt: Date | string;
    attempts: number;
    lastError?: string;
    retryable: boolean;
    errorType?: string;
};

type ConversionWarningEntry = {
    message: string;
    timestamp: Date | string;
};

type ConversionData = {
    externalIds?: SyncFMExternalIdMap;
    conversionErrors?: Record<string, ConversionErrorEntry | undefined> | null;
    conversionWarnings?: Record<string, ConversionWarningEntry | undefined> | null;
};

export type ProviderStatus = {
    service: ServiceName;
    available: boolean;
    reason?: string;
    retryable?: boolean;
    warning?: string;
};

const SERVICE_KEY_MAP: Record<ServiceName, keyof SyncFMExternalIdMap> = {
    applemusic: "AppleMusic",
    spotify: "Spotify",
    ytmusic: "YouTube",
};

function coerceDate(value: Date | string | undefined): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export type NormalizedConversionOutcome = {
    statuses: ProviderStatus[];
    availableServices: ServiceName[];
    missingServices: ServiceName[];
    hasPartialSuccess: boolean;
    lastErrorAt?: Date;
};

export function normalizeConversionOutcome(
    data: ConversionData,
    services: ServiceName[] = ["spotify", "ytmusic", "applemusic"],
): NormalizedConversionOutcome {
    const statuses: ProviderStatus[] = [];
    const availableServices: ServiceName[] = [];
    const missingServices: ServiceName[] = [];

    let lastErrorAt: Date | undefined;

    for (const service of services) {
        const externalKey = SERVICE_KEY_MAP[service];
        const hasExternalId = Boolean(data.externalIds?.[externalKey]);
        const errorEntry = data.conversionErrors?.[service];
        const warningEntry = data.conversionWarnings?.[service];

        if (hasExternalId) {
            availableServices.push(service);
        } else {
            missingServices.push(service);
        }

        if (errorEntry) {
            const parsed = coerceDate(errorEntry.lastAttempt);
            if (parsed && (!lastErrorAt || parsed > lastErrorAt)) {
                lastErrorAt = parsed;
            }
        }

        statuses.push({
            service,
            available: hasExternalId,
            reason: errorEntry?.lastError,
            retryable: errorEntry?.retryable,
            warning: warningEntry?.message,
        });
    }

    return {
        statuses,
        availableServices,
        missingServices,
        hasPartialSuccess: availableServices.length > 0 && missingServices.length > 0,
        lastErrorAt,
    };
}
