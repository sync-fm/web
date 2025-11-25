import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	serverExternalPackages: ["syncfm.ts"],
	experimental: {
		browserDebugInfoInTerminal: true,
		authInterrupts: true,
		typedEnv: true,
	},
	webpack: (config) => {
		config.experiments = {
			...config.experiments,
			asyncWebAssembly: true,
			layers: true,
		};
		return config;
	},
	typedRoutes: true,
	turbopack: {
		root: __dirname,
	},
	reactCompiler: true,
	cacheComponents: true,
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
