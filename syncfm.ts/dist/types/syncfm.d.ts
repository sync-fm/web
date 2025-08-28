export interface SyncFMConfig {
    SpotifyClientId?: string;
    SpotifyClientSecret?: string;
    SupabaseUrl?: string;
    SupabaseKey?: string;
}
export declare const enum SyncFMService {
    AppleMusic = "Apple Music",
    Spotify = "Spotify",
    YouTube = "YouTube",
    SoundCloud = "SoundCloud",
    Deezer = "Deezer",
    Tidal = "Tidal",
    LastFM = "LastFM",
    AmazonMusic = "Amazon Music"
}
export declare enum SyncFMExternalIdMapToDesiredService {
    applemusic = "AppleMusic",
    ytmusic = "YouTube",
    spotify = "Spotify"
}
export interface SyncFMExternalIdMap {
    AppleMusic?: string;
    Spotify?: string;
    YouTube?: string;
    SoundCloud?: string;
    Deezer?: string;
    Tidal?: string;
    LastFM?: string;
}
export interface SyncFMArtist {
    syncId: string;
    name: string;
    imageUrl?: string;
    externalIds: SyncFMExternalIdMap;
    genre?: string[];
    albums?: SyncFMAlbum[];
    tracks?: SyncFMArtistTrack[];
}
export interface SyncFMArtistTrack {
    name: string;
    duration?: number;
    externalIds: SyncFMExternalIdMap;
    thumbnailUrl?: string;
    contentUrl?: string;
    uploadDate?: string;
}
export interface SyncFMPlaylist {
    syncId: string;
    title: string;
    description?: string;
    imageUrl?: string;
    originalService: SyncFMService;
    externalIds: SyncFMExternalIdMap;
    songs?: SyncFMSong[];
    totalTracks?: number;
    duration?: number;
    createdBy?: string;
    createdDate?: string;
    modifiedDate?: string;
}
export interface SyncFMSong {
    syncId: string;
    title: string;
    description?: string;
    artists: string[];
    album?: string;
    releaseDate?: Date;
    duration?: number;
    imageUrl?: string;
    animatedImageUrl?: string;
    externalIds: SyncFMExternalIdMap;
    explicit?: boolean;
}
export interface SyncFMAlbum {
    syncId: string;
    title: string;
    description?: string;
    artists: string[];
    releaseDate?: string;
    imageUrl?: string;
    externalIds: SyncFMExternalIdMap;
    songs: SyncFMSong[];
    totalTracks?: number;
    duration?: number;
    label?: string;
    genres?: string[];
    explicit?: boolean;
}
//# sourceMappingURL=syncfm.d.ts.map