export const umbrellaProjects = [
    {
        name: "syncfm web app",
        description:
            "You're looking at it! Next.js powered frontend & REST API that renders our share pages, dynamic links, and more! - Backed by the syncfm.ts service layer.",
    },
    {
        name: "syncfm.ts toolkit",
        description:
            "TypeScript SDK that orchestrates canonical IDs, adapter lifecycles, atomic storage, and background workers for third-party integrations.",
    },
    {
        name: "discord bot",
        description:
            "User-installable Discord app with context menus and slash commands that converts music links to SyncFM embeds with multi-service buttons, now shipping in production.",
    },
    {
        name: "applemusic-api",
        description:
            "Typed client for Apple Music's MusicKit and reverse engineered catalog endpoints with authenticated token refresh, lazy storefront hydration, and catalog caching.",
    },
    {
        name: "ytmusic-api",
        description:
            "Reverse-engineered InnerTube client with tough-cookie session management, transforming YouTube Music responses into typed SyncFM shapes.",
    },
];

export const researchProjects: Array<{
    title: string;
    body: string;
    tags: string[];
}> = [
        {
            title: "Worker mesh",
            body: "Resilient Bun workers orchestrate retries, rate limits, and long-tail catalog lookups so our adapter graph scales without cascading timeouts.",
            tags: ["bun", "queues", "resilience"],
        },
        {
            title: "Open Music RPC",
            body: "Turbolrepo initiative delivering cross-device playback presence, bridging Discord activities, native clients, and web surfaces via typed RPC.",
            tags: ["rpc", "presence", "experiments"],
        },
    ];

export const roadmap: Array<{
    title: string;
    description: string;
}> = [
        {
            title: "Presence bridge",
            description:
                "Real-time playback stream that feeds both the Discord bot and Open Music RPC, exposing unified now-playing data and status webhooks.",
        },
        {
            title: "Public matching API",
            description:
                "REST API surface so nerds can programmatically fetch canonical links on demand.",
        },
        {
            title: "Event & Avaibility feeds",
            description:
                "Push events for match success, adapter degradation, and new catalog availability so downstream systems stay in sync automatically.",
        },
    ];
