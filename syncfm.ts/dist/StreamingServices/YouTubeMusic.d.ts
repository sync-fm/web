import YTMusic from "ytmusic-api";
import { SyncFMSong, SyncFMArtist, SyncFMAlbum } from '../types/syncfm.js';
import { StreamingService, MusicEntityType } from './StreamingService.js';
export declare class YouTubeMusicService extends StreamingService {
    private ytmusic;
    getInstance(): Promise<YTMusic>;
    getSongById(id: string): Promise<SyncFMSong>;
    getArtistById(id: string): Promise<SyncFMArtist>;
    getAlbumById(id: string): Promise<SyncFMAlbum>;
    private internal_YTMSongToSyncFMSong;
    getSongBySearchQuery(query: string): Promise<SyncFMSong>;
    getArtistBySearchQuery(query: string): Promise<SyncFMArtist>;
    getAlbumBySearchQuery(query: string): Promise<SyncFMAlbum>;
    getIdFromUrl(url: string): string | null;
    getTypeFromUrl(url: string): MusicEntityType | null;
    createUrl(id: string, type: MusicEntityType): string;
    private getBrowseIdFromPlaylist;
}
//# sourceMappingURL=YouTubeMusic.d.ts.map