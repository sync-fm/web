import { StreamingService, MusicEntityType } from './StreamingServices/StreamingService.js';
import { SyncFMArtist, SyncFMSong, SyncFMConfig, SyncFMAlbum } from './types/syncfm.js';
export * from './types/syncfm.js';
export * from './types/StreamingService.js';
type ServiceName = "applemusic" | "spotify" | "ytmusic";
export declare class SyncFM {
    private readonly config;
    private services;
    private Database;
    constructor(config: SyncFMConfig);
    private getService;
    __INTERNAL_getService(name: ServiceName): StreamingService;
    getStreamingServiceFromUrl: (url: string) => ServiceName | null;
    getInputTypeFromUrl: (url: string) => MusicEntityType | null;
    private getInputInfo;
    getInputSongInfo: (input: string) => Promise<SyncFMSong>;
    getInputArtistInfo: (input: string) => Promise<SyncFMArtist>;
    getInputAlbumInfo: (input: string) => Promise<SyncFMAlbum>;
    convertSong: (songInfo: SyncFMSong, desiredService: ServiceName) => Promise<SyncFMSong>;
    convertArtist: (artistInfo: SyncFMArtist, desiredService: ServiceName) => Promise<SyncFMArtist>;
    convertAlbum: (albumInfo: SyncFMAlbum, desiredService: ServiceName) => Promise<SyncFMAlbum>;
    private createURL;
    createSongURL: (song: SyncFMSong, service: ServiceName) => string;
    createArtistURL: (artist: SyncFMArtist, service: ServiceName) => string;
    createAlbumURL: (album: SyncFMAlbum, service: ServiceName) => string;
}
//# sourceMappingURL=index.d.ts.map