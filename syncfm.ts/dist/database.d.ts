import { SyncFMAlbum, SyncFMArtist, SyncFMSong } from './types/syncfm.js';
export declare class Database {
    private supabase;
    constructor(supabaseUrl: string, supabaseKey: string);
    getSongBySyncId(syncId: string): Promise<SyncFMSong | null>;
    getArtistBySyncId(syncId: string): Promise<SyncFMArtist | null>;
    getAlbumBySyncId(syncId: string): Promise<SyncFMAlbum | null>;
    upsertSong(songData: SyncFMSong): Promise<SyncFMSong>;
    upsertArtist(artistData: SyncFMArtist): Promise<SyncFMArtist>;
    upsertAlbum(albumData: SyncFMAlbum): Promise<SyncFMAlbum>;
    uploadSongAnimatedArtwork(imageBuffer: Buffer, syncId: string): Promise<string>;
    getSongAnimatedArtworkUrl(syncId: string): Promise<string | null>;
}
//# sourceMappingURL=database.d.ts.map