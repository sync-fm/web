import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { generateSyncArtistId, generateSyncId } from '../../utils.js';
import { StreamingService } from '../StreamingService.js'; // Adjust path as needed
import { getCanvasFromId } from './GetCanvas.js';
import fs from 'fs';
export class SpotifyService extends StreamingService {
    clientId;
    clientSecret;
    sdk;
    constructor(clientId, clientSecret) {
        super();
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.sdk = this.initializeSpotifyApi(this.clientId, this.clientSecret);
    }
    initializeSpotifyApi(SpotifyClientId, SpotifyClientSecret) {
        if (!this.sdk) {
            const clientId = SpotifyClientId;
            const clientSecret = SpotifyClientSecret;
            if (!clientId || !clientSecret) {
                throw new Error("Spotify client ID or secret not configured in environment variables.");
            }
            this.sdk = SpotifyApi.withClientCredentials(clientId, clientSecret);
        }
        return this.sdk;
    }
    async getSongById(id) {
        const spotifySong = await this.sdk.tracks.get(id);
        const externalIds = { Spotify: spotifySong.id };
        const syncFmSong = {
            syncId: generateSyncId(spotifySong.name, spotifySong.artists.map(a => a.name), spotifySong.duration_ms / 1000),
            title: spotifySong.name,
            description: undefined,
            artists: spotifySong.artists.map(a => a.name),
            album: spotifySong.album.name,
            releaseDate: new Date(spotifySong.album.release_date),
            duration: spotifySong.duration_ms / 1000,
            imageUrl: spotifySong.album.images[0]?.url,
            externalIds: externalIds,
            explicit: spotifySong.explicit,
        };
        return syncFmSong;
    }
    ;
    async getArtistById(id) {
        const spotifyArtist = await this.sdk.artists.get(id);
        const externalIds = { Spotify: spotifyArtist.id };
        const syncFmArtist = {
            syncId: generateSyncArtistId(spotifyArtist.name),
            name: spotifyArtist.name,
            imageUrl: spotifyArtist.images[0]?.url,
            externalIds: externalIds,
            genre: spotifyArtist.genres,
        };
        return syncFmArtist;
    }
    async getAlbumById(id) {
        const spotifyAlbum = await this.sdk.albums.get(id);
        const externalIds = { Spotify: spotifyAlbum.id };
        const albumArtists = spotifyAlbum.artists.map(a => a.name);
        let songs = [];
        if (spotifyAlbum.tracks.items.length > 0) {
            songs = spotifyAlbum.tracks.items.map(track => {
                const trackArtists = track.artists.map(a => a.name);
                const songDuration = track.duration_ms / 1000;
                const externalTrackIds = { Spotify: track.id };
                return {
                    syncId: generateSyncId(track.name, trackArtists, songDuration),
                    title: track.name,
                    artists: trackArtists,
                    album: spotifyAlbum.name,
                    releaseDate: new Date(spotifyAlbum.release_date),
                    duration: songDuration,
                    imageUrl: spotifyAlbum.images[0]?.url,
                    externalIds: externalTrackIds,
                    explicit: track.explicit,
                    description: undefined,
                };
            });
        }
        const albumTotalDuration = songs.reduce((sum, song) => sum + (song.duration || 0), 0);
        const syncFmAlbum = {
            syncId: generateSyncId(spotifyAlbum.name, albumArtists, albumTotalDuration),
            title: spotifyAlbum.name,
            description: undefined,
            artists: albumArtists,
            releaseDate: spotifyAlbum.release_date,
            imageUrl: spotifyAlbum.images[0]?.url,
            externalIds: externalIds,
            songs: songs,
            totalTracks: spotifyAlbum.total_tracks,
            duration: albumTotalDuration > 0 ? albumTotalDuration : undefined,
            label: spotifyAlbum.label,
            genres: spotifyAlbum.genres,
            explicit: songs.some(song => song.explicit),
        };
        return syncFmAlbum;
    }
    async getSongBySearchQuery(query) {
        const searchResult = await this.sdk.search(query, ["track"], undefined, 1);
        if (searchResult.tracks.items.length > 0) {
            const spotifySong = searchResult.tracks.items[0];
            return this.getSongById(spotifySong.id);
        }
        else {
            throw new Error("No song found");
        }
    }
    async getArtistBySearchQuery(query) {
        const searchResult = await this.sdk.search(query, ["artist"], undefined, 1);
        if (searchResult.artists.items.length > 0) {
            const spotifyArtist = searchResult.artists.items[0];
            return this.getArtistById(spotifyArtist.id);
        }
        else {
            throw new Error("No artist found");
        }
    }
    async getAlbumBySearchQuery(query) {
        const searchResult = await this.sdk.search(query, ["album"], undefined, 1);
        if (searchResult.albums.items.length > 0) {
            const spotifyAlbum = searchResult.albums.items[0];
            if (spotifyAlbum && spotifyAlbum.id) {
                return await this.getAlbumById(spotifyAlbum.id);
            }
        }
        throw new Error("No album found for the given query.");
    }
    getIdFromUrl(url) {
        try {
            const path = new URL(url).pathname;
            const parts = path.split('/');
            // The ID is usually the last part of the path
            const id = parts.pop();
            return id || null;
        }
        catch (error) {
            console.error("Invalid URL for Spotify", error);
            return null;
        }
    }
    getTypeFromUrl(url) {
        try {
            const path = new URL(url).pathname;
            const parts = path.split('/');
            if (parts.length > 1) {
                const type = parts[parts.length - 2];
                switch (type) {
                    case 'track':
                        return 'song';
                    case 'artist':
                        return 'artist';
                    case 'album':
                        return 'album';
                    case 'playlist':
                        return 'playlist';
                }
            }
            return null;
        }
        catch (error) {
            console.error("Invalid URL for Spotify", error);
            return null;
        }
    }
    createUrl(id, type) {
        const typePath = type === 'song' ? 'track' : type;
        return `https://open.spotify.com/${typePath}/${id}`;
    }
    async getCanvas(id) {
        const token = await this.sdk.getAccessToken();
        if (!token) {
            console.error("Could not obtain Spotify access token for Canvas request");
            return null;
        }
        const canvasData = await getCanvasFromId(id, token.access_token);
        fs.writeFileSync("canvasdata.json", JSON.stringify(canvasData, null, 2));
        return "uwu";
    }
}
//# sourceMappingURL=index.js.map