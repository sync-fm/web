import { SyncFMConfig } from "syncfm.ts";

const config: SyncFMConfig = {
    SpotifyClientId: process.env.SPOTIFY_CLIENT_ID,
    SpotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    SupabaseUrl: process.env.SUPABASE_URL,
    SupabaseKey: process.env.SUPABASE_KEY,
};

export default config;