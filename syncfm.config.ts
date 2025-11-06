import type { SyncFMConfig } from "syncfm.ts";
import { env } from "@/lib/meow-env";

const config: SyncFMConfig = {
    SpotifyClientId: env.get("SPOTIFY_CLIENT_ID"),
    SpotifyClientSecret: env.get("SPOTIFY_CLIENT_SECRET"),
    SupabaseUrl: env.get("SUPABASE_URL"),
    SupabaseKey: env.get("SUPABASE_KEY"),
};

export default config;