import type { SyncFMAlbum, SyncFMArtist, SyncFMArtistTrack, SyncFMSong } from "syncfm.ts";

interface StableEntity {
	title: string;
	description: string;
	image: string;
}
type InputMusicEntity = SyncFMSong | SyncFMArtist | SyncFMAlbum;
type WOArtist = Exclude<InputMusicEntity, SyncFMArtist>;
export function createStableEntity(input: SyncFMSong | SyncFMArtist | SyncFMAlbum): StableEntity {
	const title = (input as WOArtist).title || (input as SyncFMArtist).name || "Untitled";

	const image =
		(input as InputMusicEntity).imageUrl ||
		(input as SyncFMArtistTrack).thumbnailUrl ||
		("albums" in input ? input.albums?.find((a) => a.imageUrl)?.imageUrl : undefined) ||
		("songs" in input ? input.songs?.find((s) => s.imageUrl)?.imageUrl : undefined) ||
		"";

	let description = "";

	// --------------------
	// ALBUM
	// --------------------
	if ("artists" in input && "songs" in input) {
		const album = input as SyncFMAlbum;
		const artistList = album.artists?.join(", ") || "Unknown Artist";
		const trackCount = album.totalTracks ?? album.songs?.length ?? 0;
		const genres = album.genres?.join(", ");
		const release = album.releaseDate;
		const label = album.label;

		description =
			album.description ||
			[
				`Album by ${artistList}`,
				release ? `Released ${release}` : undefined,
				genres ? `Genres: ${genres}` : undefined,
				trackCount ? `${trackCount} tracks` : undefined,
				label ? `Label: ${label}` : undefined,
			]
				.filter(Boolean)
				.join(" • ");

		// Creative fallback if still empty
		if (!description) {
			description = `Explore the album *${album.title}* by ${artistList} on SyncFM. Dive into the tracklist and rediscover great music.`;
		}
	}

	// --------------------
	// SONG
	// --------------------
	else if ("artists" in input && "album" in input) {
		const song = input as SyncFMSong;
		const artistList = song.artists?.join(", ") || "Unknown Artist";
		const release = song.releaseDate ? song.releaseDate.toISOString().split("T")[0] : undefined;
		const duration = song.duration ? formatDuration(song.duration) : undefined;

		description =
			song.description ||
			[
				`Song by ${artistList}`,
				song.album ? `From the album "${song.album}"` : undefined,
				release ? `Released ${release}` : undefined,
				duration ? `Duration: ${duration}` : undefined,
				song.explicit ? "Explicit" : undefined,
			]
				.filter(Boolean)
				.join(" • ");

		// Creative fallback
		if (!description) {
			description = `Listen to "${song.title}" by ${artistList} on SyncFM - stream it, save it, and keep your library in sync everywhere.`;
		}
	}

	// --------------------
	// ARTIST
	// --------------------
	else if ("name" in input && "genre" in input) {
		const artist = input as SyncFMArtist;
		const genres = artist.genre?.join(", ");
		const albumCount = artist.albums?.length;
		const trackCount = artist.tracks?.length;

		description =
			[
				genres ? `Genres: ${genres}` : undefined,
				albumCount ? `${albumCount} album${albumCount !== 1 ? "s" : ""}` : undefined,
				trackCount ? `${trackCount} track${trackCount !== 1 ? "s" : ""}` : undefined,
			]
				.filter(Boolean)
				.join(" • ") || "";

		// Creative fallback
		if (!description) {
			description = `Listen to ${artist.name} on SyncFM - discover tracks, albums, and more across your favorite streaming services.`;
		}
	}

	// Absolute final fallback (should never be empty, even for malformed data)
	if (!description) {
		description = `Discover "${title}" on SyncFM - your cross-platform music companion.`;
	}

	return { title, description, image };
}

/* Helper for formatting seconds → mm:ss */
function formatDuration(sec: number): string {
	const minutes = Math.floor(sec / 60);
	const seconds = sec % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
