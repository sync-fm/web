import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["syncfm.ts"],
    reactCompiler: true,
    poweredByHeader: false,
    async rewrites() {
        return [
            {
                source: "/relay-8aSv/static/:path*",
                destination: "https://us-assets.i.posthog.com/static/:path*",
            },
            {
                source: "/relay-8aSv/:path*",
                destination: "https://us.i.posthog.com/:path*",
            },
        ];
    },
    // This is required to support PostHog trailing slash API requests
    skipTrailingSlashRedirect: true,
};

export default nextConfig;