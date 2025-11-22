import type { SyncFMConfig } from "syncfm.ts";
import { meowenv, usedEnvs } from "@/lib/meow-env";

const env = new meowenv();

const config: SyncFMConfig = {
	SpotifyClientId: env.get(usedEnvs.SPOTIFY_CLIENT_ID),
	SpotifyClientSecret: env.get(usedEnvs.SPOTIFY_CLIENT_SECRET),
	SupabaseUrl: env.get(usedEnvs.NEXT_PUBLIC_SUPABASE_URL),
	SupabaseKey: env.get(usedEnvs.NEXT_PUBLIC_SUPABASE_ANON_KEY),
	YouTubeApiKey: env.get(usedEnvs.YOUTUBE_API_KEY),
	enableStreamingDebug: false,
};

export const authConfig = {
	redis: {
		url: env.get(usedEnvs.REDIS_URL),
	},
	supabase: {
		url: env.get(usedEnvs.NEXT_PUBLIC_SUPABASE_URL),
		anonKey: env.get(usedEnvs.NEXT_PUBLIC_SUPABASE_ANON_KEY),
		serviceKey: env.get(usedEnvs.SUPABASE_SERVICE_KEY),
	},
	admin: {
		email: env.get(usedEnvs.ADMIN_EMAIL),
		discordId: env.get(usedEnvs.ADMIN_DISCORD_ID),
	},
	rateLimits: {
		anonymous: 50, // requests per hour
		authenticated: 100, // requests per hour
		apiKeyDefault: 1000, // requests per hour
	},
};

export default config;
