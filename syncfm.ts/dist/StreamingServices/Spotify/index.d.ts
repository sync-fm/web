import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { SyncFMSong, SyncFMArtist, SyncFMAlbum } from '../../types/syncfm.js';
import { StreamingService, MusicEntityType } from '../StreamingService.js';
export declare class SpotifyService extends StreamingService {
    private readonly clientId;
    private readonly clientSecret;
    sdk: SpotifyApi;
    constructor(clientId: string, clientSecret: string);
    initializeSpotifyApi(SpotifyClientId?: string, SpotifyClientSecret?: string): SpotifyApi;
    getSongById(id: string): Promise<SyncFMSong>;
    getArtistById(id: string): Promise<SyncFMArtist>;
    getAlbumById(id: string): Promise<SyncFMAlbum>;
    getSongBySearchQuery(query: string): Promise<SyncFMSong>;
    getArtistBySearchQuery(query: string): Promise<SyncFMArtist>;
    getAlbumBySearchQuery(query: string): Promise<SyncFMAlbum>;
    getIdFromUrl(url: string): string | null;
    getTypeFromUrl(url: string): MusicEntityType | null;
    createUrl(id: string, type: MusicEntityType): string;
    getCanvas(id: string): Promise<string | null>;
}
//# sourceMappingURL=index.d.ts.map