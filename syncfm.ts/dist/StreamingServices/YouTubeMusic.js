import YTMusic from "ytmusic-api";
import { generateSyncArtistId, generateSyncId } from '../utils.js';
import axios from "axios";
import { StreamingService } from './StreamingService.js'; // Adjust path as needed
export class YouTubeMusicService extends StreamingService {
    ytmusic;
    async getInstance() {
        if (!this.ytmusic) {
            this.ytmusic = new YTMusic();
            await this.ytmusic.initialize();
        }
        return this.ytmusic;
    }
    async getSongById(id) {
        console.log("Getting YouTube Music song by ID:", id);
        const ytmusic = await this.getInstance();
        const ytMusicSong = await ytmusic.getSong(id);
        const externalIds = { YouTube: id };
        const syncFmSong = {
            syncId: generateSyncId(ytMusicSong.name, ytMusicSong.artist ? [ytMusicSong.artist.name] : [], ytMusicSong.duration),
            title: ytMusicSong.name,
            description: undefined,
            artists: ytMusicSong.artist ? [ytMusicSong.artist.name] : [],
            album: undefined,
            releaseDate: undefined,
            duration: ytMusicSong.duration,
            imageUrl: ytMusicSong.thumbnails[0]?.url,
            externalIds: externalIds,
            explicit: undefined,
        };
        return syncFmSong;
    }
    async getArtistById(id) {
        const ytmusic = await this.getInstance();
        const ytMusicArtist = await ytmusic.getArtist(id);
        const externalIds = { YouTube: id };
        const syncFmArtist = {
            syncId: generateSyncArtistId(ytMusicArtist.name),
            name: ytMusicArtist.name,
            imageUrl: ytMusicArtist.thumbnails[0]?.url,
            externalIds: externalIds,
            genre: undefined,
        };
        return syncFmArtist;
    }
    async getAlbumById(id) {
        const ytmusic = await this.getInstance();
        let ytMusicAlbum;
        if (!id.startsWith("MPREb_")) {
            console.warn("Invalid YouTube Music album ID, attempting to get browseId");
            const browseId = await this.getBrowseIdFromPlaylist(id);
            ytMusicAlbum = await ytmusic.getAlbum(browseId);
        }
        else {
            ytMusicAlbum = await ytmusic.getAlbum(id);
        }
        let normalizedArtists = [];
        if (ytMusicAlbum.artist) {
            const splitArtists = ytMusicAlbum.artist.name.split(/[,&]\s*|\s* and \s*/i).map(a => a.trim()).filter(a => a.length > 0);
            normalizedArtists.push(...splitArtists);
        }
        let totalDuration = 0;
        let totalTracks = 0;
        let parsedTracks = [];
        ytMusicAlbum.songs.forEach(song => {
            totalTracks += 1;
            if (song.duration) {
                totalDuration += song.duration;
            }
            const externalIds = { YouTube: song.videoId };
            const syncFmSong = {
                syncId: generateSyncId(song.name, song.artist ? [song.artist.name] : [], song.duration),
                title: song.name,
                description: undefined,
                artists: song.artist ? [song.artist.name] : [],
                album: song.album?.name,
                releaseDate: undefined,
                duration: song.duration,
                imageUrl: song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : undefined,
                externalIds: externalIds,
                explicit: undefined,
            };
            parsedTracks.push(syncFmSong);
        });
        const externalIds = { YouTube: ytMusicAlbum.albumId };
        const syncFMAlbum = {
            syncId: generateSyncId(ytMusicAlbum.name, normalizedArtists, totalDuration),
            title: ytMusicAlbum.name,
            artists: normalizedArtists,
            releaseDate: undefined,
            imageUrl: ytMusicAlbum.thumbnails && ytMusicAlbum.thumbnails.length > 0 ? ytMusicAlbum.thumbnails[0].url : undefined,
            externalIds: externalIds,
            duration: totalDuration,
            songs: parsedTracks,
            totalTracks: totalTracks,
        };
        return syncFMAlbum;
    }
    internal_YTMSongToSyncFMSong(ytMusicSong) {
        const externalIds = { YouTube: ytMusicSong.videoId };
        const syncFmSong = {
            syncId: generateSyncId(ytMusicSong.name, ytMusicSong.artist ? [ytMusicSong.artist.name] : [], ytMusicSong.duration),
            title: ytMusicSong.name,
            description: undefined,
            artists: ytMusicSong.artist ? [ytMusicSong.artist.name] : [],
            album: undefined,
            releaseDate: undefined,
            duration: ytMusicSong.duration,
            imageUrl: ytMusicSong.thumbnails[0]?.url,
            externalIds: externalIds,
            explicit: undefined,
        };
        return syncFmSong;
    }
    async getSongBySearchQuery(query) {
        const ytmusic = await this.getInstance();
        const searchResults = await ytmusic.searchSongs(query);
        if (searchResults.length === 0) {
            throw new Error("No results found");
        }
        const songResult = searchResults[0];
        return this.internal_YTMSongToSyncFMSong(songResult);
        // Normally the code below would work just fine, but we sometimes get a weird edge-case where the videoId isnt valid for getSong,
        // So for now we just convert the search result directly
        // return this.getSongById(songResult.videoId);
    }
    async getArtistBySearchQuery(query) {
        const ytmusic = await this.getInstance();
        const searchResults = await ytmusic.searchArtists(query);
        if (searchResults.length === 0) {
            throw new Error("No results found");
        }
        const artistResult = searchResults[0];
        return this.getArtistById(artistResult.artistId);
    }
    async getAlbumBySearchQuery(query) {
        const ytmusic = await this.getInstance();
        const searchResults = await ytmusic.searchAlbums(query);
        if (searchResults.length === 0) {
            throw new Error("No album results found on YouTube Music for the given query.");
        }
        const albumResult = searchResults[0];
        return this.getAlbumById(albumResult.albumId);
    }
    getIdFromUrl(url) {
        try {
            const parsedUrl = new URL(url);
            const params = parsedUrl.searchParams;
            if (params.has('v'))
                return params.get('v');
            if (params.has('list'))
                return params.get('list');
            const pathname = parsedUrl.pathname;
            if (pathname.startsWith('/browse/')) {
                return pathname.split('/').pop();
            }
            if (pathname.startsWith('/channel/')) {
                return pathname.split('/').pop();
            }
            return null;
        }
        catch (error) {
            console.error("Invalid URL for YouTube Music", error);
            return null;
        }
    }
    getTypeFromUrl(url) {
        try {
            const parsedUrl = new URL(url);
            const pathname = parsedUrl.pathname;
            if (pathname === '/watch')
                return 'song';
            if (pathname === '/playlist')
                return 'album';
            if (pathname.startsWith('/browse/'))
                return 'album';
            if (pathname.startsWith('/channel/'))
                return 'artist';
            return null;
        }
        catch (error) {
            console.error("Invalid URL for YouTube Music", error);
            return null;
        }
    }
    createUrl(id, type) {
        switch (type) {
            case 'song':
                return `https://music.youtube.com/watch?v=${id}`;
            case 'album':
                return `https://music.youtube.com/browse/${id}`;
            case 'artist':
                return `https://music.youtube.com/channel/${id}`;
            case 'playlist':
                return `https://music.youtube.com/playlist?list=${id}`;
            default:
                throw new Error("Invalid type for YouTube Music URL");
        }
    }
    async getBrowseIdFromPlaylist(id) {
        const standard_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:72.0) Gecko/20100101 Firefox/72.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Content-Type": "application/json",
            "X-Goog-AuthUser": "0",
            origin: "https://music.youtube.com",
            "X-Goog-Visitor-Id": "CgtWaTB2WWRDeEFUYyjhv-X8BQ%3D%3D"
        };
        const endpoint = "https://music.youtube.com/playlist";
        try {
            const response = await axios.get(endpoint, {
                headers: standard_headers,
                params: {
                    list: id
                }
            });
            const match = response.data.match(/"MPRE[_a-zA-Z0-9]+/);
            if (!match) {
                throw new Error("Could not find browseId from playlist");
            }
            const albumId = match[0].substr(1);
            return albumId;
        }
        catch (error) {
            console.error("Error fetching playlist:", error);
            throw error;
        }
    }
}
//# sourceMappingURL=YouTubeMusic.js.map