import axios from 'axios';
import { generateSyncId, generateSyncArtistId } from '../utils.js';
import { StreamingService } from './StreamingService.js';
export class AppleMusicService extends StreamingService {
    async getSongById(id) {
        const url = this.createUrl(id, "song");
        const rawSongData = await this.getSongDataFromUrl(url);
        const externalIds = { AppleMusic: id };
        const syncFmSong = {
            syncId: generateSyncId(rawSongData.audio?.name || rawSongData.name, rawSongData.audio?.byArtist?.map(a => a.name) || [], this.parseISO8601Duration(rawSongData.audio?.duration || rawSongData.timeRequired)),
            title: rawSongData.audio?.name || rawSongData.name,
            description: rawSongData.audio?.description || rawSongData.description,
            artists: rawSongData.audio?.byArtist?.map(a => a.name) || [],
            album: rawSongData.audio?.album?.name,
            releaseDate: new Date(rawSongData.audio?.datePublished),
            duration: this.parseISO8601Duration(rawSongData.audio?.duration || rawSongData.timeRequired),
            imageUrl: rawSongData.audio?.album?.image || rawSongData.audio?.image || rawSongData.image,
            externalIds: externalIds,
            explicit: undefined,
        };
        return syncFmSong;
    }
    async getArtistById(id) {
        try {
            const response = await axios.get(this.createUrl(id, "artist"));
            if (!response.status || response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = response.data;
            const embeddedArtistInfo = html.split(`<script id=schema:music-group type="application/ld+json">`)[1]?.split(`</script>`)[0];
            const trimmedArtistInfo = embeddedArtistInfo?.trim();
            if (trimmedArtistInfo) {
                const jsonData = JSON.parse(trimmedArtistInfo);
                const tracks = jsonData.tracks?.map((track) => ({
                    title: track.name,
                    duration: this.parseISO8601Duration(track.duration),
                    thumbnailUrl: track.audio.thumbnailUrl,
                    uploadDate: track.audio.uploadDate,
                    contentUrl: track.audio.contentUrl,
                })) || [];
                const artist = {
                    syncId: generateSyncArtistId(jsonData.name),
                    name: jsonData.name,
                    imageUrl: jsonData.image,
                    externalIds: {
                        AppleMusic: id,
                    },
                    genre: jsonData.genre || [],
                    tracks: tracks.slice(0, 5),
                };
                return artist;
            }
            else {
                throw new Error('Could not find artist data in HTML');
            }
        }
        catch (error) {
            console.error('Error fetching or parsing artist data:', error);
            throw error;
        }
    }
    async getAlbumById(id) {
        try {
            const response = await axios.get(this.createUrl(id, "album"));
            if (!response.status || response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = response.data;
            const embeddedAlbumInfo = html.split(`<script id=schema:music-album type="application/ld+json">`)[1]?.split(`</script>`)[0];
            const trimmedAlbumInfo = embeddedAlbumInfo?.trim();
            if (trimmedAlbumInfo) {
                const jsonData = JSON.parse(trimmedAlbumInfo);
                const albumArtists = jsonData.byArtist?.map((artist) => artist.name) || [];
                const songs = (jsonData.tracks || []).map((track) => {
                    const songDuration = this.parseISO8601Duration(track.duration);
                    const appleMusicSongId = track.url?.split('/').pop();
                    const externalSongIds = {};
                    if (appleMusicSongId) {
                        externalSongIds.AppleMusic = appleMusicSongId;
                    }
                    return {
                        syncId: generateSyncId(track.name, albumArtists, songDuration),
                        title: track.name,
                        artists: albumArtists,
                        album: jsonData.name,
                        releaseDate: track.audio?.uploadDate || jsonData.datePublished,
                        duration: songDuration,
                        imageUrl: track.audio?.thumbnailUrl || jsonData.image,
                        externalIds: externalSongIds,
                        explicit: undefined,
                        description: undefined,
                    };
                });
                const albumTotalDuration = songs.reduce((sum, song) => sum + (song.duration || 0), 0);
                const syncFmAlbum = {
                    syncId: generateSyncId(jsonData.name, albumArtists, albumTotalDuration),
                    title: jsonData.name,
                    description: jsonData.description,
                    artists: albumArtists,
                    releaseDate: jsonData.datePublished,
                    imageUrl: jsonData.image,
                    externalIds: { AppleMusic: id },
                    songs: songs,
                    totalTracks: jsonData.tracks?.length || 0,
                    duration: albumTotalDuration > 0 ? albumTotalDuration : undefined,
                    label: undefined,
                    genres: jsonData.genre || [],
                    explicit: undefined,
                };
                return syncFmAlbum;
            }
            else {
                throw new Error('Could not find album data in HTML');
            }
        }
        catch (error) {
            console.error('Error fetching or parsing album data:', error);
            throw error;
        }
    }
    async getSongBySearchQuery(query) {
        const id = await this.searchForId(query, "songs");
        return this.getSongById(id);
    }
    async getArtistBySearchQuery(query) {
        const id = await this.searchForId(query, "artists");
        return this.getArtistById(id);
    }
    async getAlbumBySearchQuery(query) {
        const id = await this.searchForId(query, "albums");
        return this.getAlbumById(id);
    }
    async searchForId(query, type) {
        try {
            const url = "https://music.apple.com/us/search?term=" + encodeURIComponent(query);
            const response = await axios.get(url);
            if (!response.status || response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = response.data;
            const embeddedSongInfo = html.split(`<script type="application/json" id="serialized-server-data">`)[1]?.split(`</script>`)[0];
            const trimmedSongInfo = embeddedSongInfo?.trim();
            if (trimmedSongInfo) {
                const jsonData = JSON.parse(trimmedSongInfo);
                const firstResult = jsonData[0]?.data?.sections[0].items?.find((item) => item.itemKind === type);
                if (!firstResult) {
                    throw new Error(`Could not find ${type} in search result`);
                }
                const id = firstResult?.contentDescriptor?.identifiers?.storeAdamId || firstResult?.contentDescriptor?.identifiers?.storeAdamID;
                if (!id) {
                    throw new Error(`Could not find id in search result for ${type}`);
                }
                return id.toString();
            }
            else {
                throw new Error('Could not find song data in HTML');
            }
        }
        catch (error) {
            console.error('Error fetching or parsing song data:', error);
            throw error;
        }
    }
    getIdFromUrl(url) {
        try {
            const parsedUrl = new URL(url);
            const pathParts = parsedUrl.pathname.split('/');
            for (let i = pathParts.length - 1; i >= 0; i--) {
                const part = pathParts[i];
                if (part && /^\d+$/.test(part)) {
                    return part;
                }
            }
            return null;
        }
        catch (error) {
            console.error("Invalid URL for Apple Music", error);
            return null;
        }
    }
    getTypeFromUrl(url) {
        try {
            const pathParts = new URL(url).pathname.split('/');
            const potentialTypes = ['song', 'album', 'artist', 'playlist'];
            // Find the first path segment that is a valid music entity type
            for (const part of pathParts) {
                if (potentialTypes.includes(part)) {
                    return part;
                }
            }
            return null;
        }
        catch (error) {
            console.error("Invalid URL for Apple Music", error);
            return null;
        }
    }
    createUrl(id, type, country = "us") {
        // Note: Creating a song URL from just the song ID is tricky as it requires the album ID and name in the path.
        // This implementation will require a more advanced lookup if we need to create song URLs from scratch.
        // For now, we assume this is primarily for album/artist/playlist.
        return `https://music.apple.com/${country}/${type}/${id}`;
    }
    async getSongDataFromUrl(url) {
        try {
            const response = await axios.get(url);
            if (!response.status || response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = response.data;
            const embeddedSongInfo = html.split(`<script id=schema:song type="application/ld+json">`)[1]?.split(`</script>`)[0];
            const trimmedSongInfo = embeddedSongInfo?.trim();
            if (trimmedSongInfo) {
                const jsonData = JSON.parse(trimmedSongInfo);
                return jsonData;
            }
            else {
                throw new Error('Could not find song data in HTML');
            }
        }
        catch (error) {
            console.error('Error fetching or parsing song data:', error);
            throw error;
        }
    }
    parseISO8601Duration(durationString) {
        if (!durationString)
            return undefined;
        const match = durationString.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
        if (!match) {
            console.warn(`Could not parse ISO 8601 duration: ${durationString}`);
            return undefined;
        }
        const hours = parseInt(match[1] || '0', 10);
        const minutes = parseInt(match[2] || '0', 10);
        const seconds = parseFloat(match[3] || '0');
        return hours * 3600 + minutes * 60 + seconds;
    }
}
//# sourceMappingURL=AppleMusic.js.map