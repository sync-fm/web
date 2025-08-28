import { SyncFMAlbum, SyncFMSong } from "./types/syncfm.js";
export declare const normalizeSongData: (songInfo: SyncFMSong) => {
    cleanTitle: string;
    allArtists: string[];
};
export declare const normalizeAlbumData: (albumInfo: SyncFMAlbum) => {
    cleanTitle: string;
    allArtists: string[];
};
export declare const generateSyncId: (title: string, artists: string[], duration: number) => string;
export declare const generateSyncArtistId: (name: string) => string;
//# sourceMappingURL=utils.d.ts.map