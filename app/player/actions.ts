"use server";
import type { SyncFMSong } from "syncfm.ts";

export interface LyricsSearchResult {
	syncedLyrics: string | null;
	plainLyrics: string | null;
}

interface LrclibSearchItem {
	plainLyrics?: string | null;
	syncedLyrics?: string | null;
	[id: string]: unknown;
}

export async function searchLyrics(song: SyncFMSong): Promise<LyricsSearchResult | null> {
	const params = new URLSearchParams({
		track_name: song.title,
		artist_name: song.artists[0] || "",
		album_name: song.album?.replace(" - Single", "").replace(" - EP", "") || "",
		duration: Math.round(song.duration || 0).toString(),
	});

	const response = await fetch(`https://lrclib.net/api/search?${params.toString()}`);
	if (!response.ok) {
		return null;
	}

	const rawData = await response.json();
	if (!Array.isArray(rawData) || rawData.length === 0) {
		return null;
	}

	const data = rawData as LrclibSearchItem[];
	const syncedMatch = data.find((item) => Boolean(item.syncedLyrics));
	const plainMatch = data.find((item) => Boolean(item.plainLyrics));

	return {
		syncedLyrics: syncedMatch?.syncedLyrics ?? null,
		plainLyrics: plainMatch?.plainLyrics ?? null,
	};
}
