import { SyncFMSong, SyncFMArtist, SyncFMAlbum, SyncFMPlaylist } from '../types/syncfm.js';
export type MusicEntityType = "song" | "album" | "artist" | "playlist";
export declare abstract class StreamingService {
    abstract getSongById(id: string): Promise<SyncFMSong>;
    abstract getArtistById(id: string): Promise<SyncFMArtist>;
    abstract getAlbumById(id: string): Promise<SyncFMAlbum>;
    abstract getSongBySearchQuery(query: string): Promise<SyncFMSong>;
    abstract getArtistBySearchQuery(query: string): Promise<SyncFMArtist>;
    abstract getAlbumBySearchQuery(query: string): Promise<SyncFMAlbum>;
    getPlaylistById?(id: string): Promise<SyncFMPlaylist>;
    getPlaylistBySearchQuery?(query: string): Promise<SyncFMPlaylist>;
    abstract getIdFromUrl(url: string): string | null;
    abstract getTypeFromUrl(url: string): MusicEntityType | null;
    abstract createUrl(id: string, type: MusicEntityType): string;
}
//# sourceMappingURL=StreamingService.d.ts.map