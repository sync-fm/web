import { SyncFMSong, SyncFMArtist, SyncFMAlbum } from '../types/syncfm.js';
import { StreamingService, MusicEntityType } from './StreamingService.js';
export declare class AppleMusicService extends StreamingService {
    getSongById(id: string): Promise<SyncFMSong>;
    getArtistById(id: string): Promise<SyncFMArtist>;
    getAlbumById(id: string): Promise<SyncFMAlbum>;
    getSongBySearchQuery(query: string): Promise<SyncFMSong>;
    getArtistBySearchQuery(query: string): Promise<SyncFMArtist>;
    getAlbumBySearchQuery(query: string): Promise<SyncFMAlbum>;
    private searchForId;
    getIdFromUrl(url: string): string | null;
    getTypeFromUrl(url: string): MusicEntityType | null;
    createUrl(id: string, type: MusicEntityType, country?: string): string;
    private getSongDataFromUrl;
    private parseISO8601Duration;
}
//# sourceMappingURL=AppleMusic.d.ts.map