import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SyncFMAlbum, SyncFMArtist, SyncFMArtistTrack, SyncFMSong } from './types/syncfm';
import { normalizeSongData } from './utils';

export class Database {
    private supabase: SupabaseClient;
    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    // Example method to get a song by its syncId
    async getSongBySyncId(syncId: string): Promise<SyncFMSong | null> {
        const { data, error } = await this.supabase
            .from('songs')
            .select('*')
            .eq('syncId', syncId)
            .single();

        if (error) {
            console.error(`Error fetching song: ${error.message}`);
            return null;
        }
        return data;
    }

    async getArtistBySyncId(syncId: string): Promise<SyncFMArtist | null> {
        const { data, error } = await this.supabase
            .from('artists')
            .select('*')
            .eq('syncId', syncId)
            .single();
        if (error) {
            console.error(`Error fetching artist: ${error.message}`);
            return null;
        }
        return data;
    }

    async getAlbumBySyncId(syncId: string): Promise<SyncFMAlbum | null> {
        const { data, error } = await this.supabase
            .from('albums')
            .select('*')
            .eq('syncId', syncId)
            .single();
        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
            throw new Error(`Error checking existing album: ${error.message}`);
        }
        return data;
    }

    async upsertSong(songData: SyncFMSong): Promise<SyncFMSong> {
        let normalizedSongData = normalizeSongData(songData);
        songData = { ...songData, title: normalizedSongData.cleanTitle, artists: normalizedSongData.allArtists };
        const { data: existingSong, error: fetchError } = await this.supabase
            .from('songs')
            .select('*')
            .eq('syncId', songData.syncId)
            .single();
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
            throw new Error(`Error checking existing song: ${fetchError.message}`);
        }
        if ((existingSong as SyncFMSong)) {
            // combine existing songData.externalIds with new songData.externalIds
           songData.externalIds = { ...existingSong.externalIds, ...songData.externalIds };
            // Combine artists arrays and remove duplicates
            const combinedArtists = Array.from(new Set([...(existingSong.artists || []), ...(songData.artists || [])]));
            songData.artists = combinedArtists;
            if (!songData.releaseDate || songData.releaseDate === undefined) {
                songData.releaseDate = (existingSong as SyncFMSong).releaseDate;
            }
            if (!songData.album || songData.album === undefined) {
                songData.album = (existingSong as SyncFMSong).album;
            }

        }

        const { data, error } = await this.supabase
            .from('songs')
            .upsert(songData)
            .single();

        if (error) {
            throw new Error(`Error adding song: ${error.message}`);
        }
        return data as SyncFMSong;
    }

    async upsertArtist(artistData: SyncFMArtist): Promise<SyncFMArtist> {
        const { data: existingArtist, error: fetchError } = await this.supabase
            .from('artists')
            .select('*')
            .eq('syncId', artistData.syncId)
            .single();
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
            throw new Error(`Error checking existing artist: ${fetchError.message}`);
        }
        if ((existingArtist as SyncFMArtist)) {
            // combine existing artistData.externalIds with new artistData.externalIds 
            artistData.externalIds = { ...existingArtist.externalIds, ...artistData.externalIds };
            // Combine artist tracks and albums and remove duplicates based on syncId
            if (existingArtist.tracks && artistData.tracks) {
                const combinedTracksMap = new Map<string, SyncFMArtistTrack>();
                existingArtist.tracks.forEach((track: SyncFMArtistTrack) => combinedTracksMap.set(track.name, track));
                artistData.tracks.forEach(track => combinedTracksMap.set(track.name, track));
                artistData.tracks = Array.from(combinedTracksMap.values());
            }
            if (existingArtist.albums && artistData.albums) {
                const combinedAlbumsMap = new Map<string, SyncFMAlbum>();
                existingArtist.albums.forEach((album: SyncFMAlbum) => combinedAlbumsMap.set(album.syncId, album));
                artistData.albums.forEach(album => combinedAlbumsMap.set(album.syncId, album));
                artistData.albums = Array.from(combinedAlbumsMap.values());
            }
        }

        const { data, error } = await this.supabase
            .from('artists')
            .upsert(artistData)
            .single();

        if (error) {
            throw new Error(`Error adding artist: ${error.message}`);
        }
        return data as SyncFMArtist;
    }

    async upsertAlbum(albumData: SyncFMAlbum):Promise<SyncFMAlbum> {
        const { data: existingAlbum, error: fetchError } = await this.supabase
            .from('albums')
            .select('*')
            .eq('syncId', albumData.syncId)
            .single();
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
            throw new Error(`Error checking existing album: ${fetchError.message}`);
        }
        if ((existingAlbum as SyncFMAlbum)) {
            // combine existingAlbum.externalIds with new albumData.externalIds 
            albumData.externalIds = { ...existingAlbum.externalIds, ...albumData.externalIds };
            // Combine album tracks and albums and remove duplicates based on syncId
            if (existingAlbum.songs && albumData.songs) {
                const combinedTracksMap = new Map<string, SyncFMSong>();
                existingAlbum.songs.forEach((track:SyncFMSong) => combinedTracksMap.set(track.title, track));
                albumData.songs.forEach(track => combinedTracksMap.set(track.title, track));
                albumData.songs = Array.from(combinedTracksMap.values());
            }
            const combinedArtists = Array.from(new Set([...(existingAlbum.artists || []), ...(albumData.artists || [])]));
            albumData.artists = combinedArtists;
        }

        const { data, error } = await this.supabase
            .from('albums')
            .upsert(albumData)
            .single();

        if (error) {
            throw new Error(`Error adding album: ${error.message}`);
        }
        return data as SyncFMAlbum;
    }

    async uploadSongAnimatedArtwork(imageBuffer: Buffer, syncId: string): Promise<string> {
        const { error } = await this.supabase
            .storage
            .from('songs-animated-artwork')
            .upload(`${syncId}.webp`, imageBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: 'image/webp'
            });

        if (error) {
            throw new Error(`Error uploading animated artwork: ${error.message}`);
        }

        const { data } = this.supabase
            .storage
            .from('songs-animated-artwork')
            .getPublicUrl(`${syncId}.webp`);

        if (!data || !data.publicUrl) {
            throw new Error('Error retrieving public URL for animated artwork');
        }
        const publicURL = data.publicUrl.split('?')[0];

        return publicURL;
    }

    async getSongAnimatedArtworkUrl(syncId: string): Promise<string | null> {
        const { data } = this.supabase
            .storage
            .from('songs-animated-artwork')
            .getPublicUrl(`${syncId}.webp`);

        if (!data || !data.publicUrl) {
            return null;
        }
        const publicURL = data.publicUrl.split('?')[0];

        return publicURL;
    }
}