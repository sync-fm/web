import type { SyncFMConfig } from "syncfm.ts";
import { meowenv } from "@/lib/meow-env";
const env = new meowenv();
const config: SyncFMConfig = {
    SpotifyClientId: env.get("SPOTIFY_CLIENT_ID"),
    SpotifyClientSecret: env.get("SPOTIFY_CLIENT_SECRET"),
    SupabaseUrl: env.get("SUPABASE_URL"),
    SupabaseKey: env.get("SUPABASE_KEY"),
    YouTubeApiKey: env.get("YOUTUBE_API_KEY"),
};

export default config;