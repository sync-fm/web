import type {
    SyncFMAlbum,
    SyncFMArtist,
    SyncFMExternalIdMap,
    SyncFMPlaylist,
    SyncFMSong,
} from "syncfm.ts";
import { formatDuration, formatTotalDuration } from "@/lib/utils";
import { SERVICE_META } from "./constants";
import type {
    ServiceMeta,
    DecodedMeta,
    ComposerPreview,
    PreviewSource,
    ComposerPreviewType,
} from "./types";

export const detectServiceMeta = (link: string): ServiceMeta | undefined => {
    const lower = link.toLowerCase();
    if (lower.includes("spotify.")) {
        return SERVICE_META.find((service) => service.key === "Spotify");
    }
    if (lower.includes("music.apple.com") || lower.includes("itunes.apple.com")) {
        return SERVICE_META.find((service) => service.key === "AppleMusic");
    }
    if (
        lower.includes("music.youtube.com") ||
        lower.includes("youtube.") ||
        lower.includes("youtu.be")
    ) {
        return SERVICE_META.find((service) => service.key === "YouTube");
    }
    return undefined;
};

export const extractIdFromUrl = (link: string): string | undefined => {
    try {
        const parsed = new URL(link);
        const hostname = parsed.hostname.toLowerCase();

        if (
            hostname.includes("youtube.com") ||
            hostname.includes("music.youtube.com")
        ) {
            return (
                parsed.searchParams.get("v") ??
                parsed.pathname.split("/").filter(Boolean).pop() ??
                undefined
            );
        }

        if (hostname.includes("youtu.be")) {
            return parsed.pathname.split("/").filter(Boolean).pop() ?? undefined;
        }

        if (
            hostname.includes("music.apple.com") ||
            hostname.includes("itunes.apple.com")
        ) {
            return (
                parsed.searchParams.get("i") ??
                parsed.pathname.split("/").filter(Boolean).pop() ??
                undefined
            );
        }

        const segments = parsed.pathname.split("/").filter(Boolean);
        if (segments.length > 0) {
            const lastSegment = segments[segments.length - 1];
            return lastSegment.split("?")[0]?.split("&")[0];
        }
    } catch {
        return undefined;
    }

    return undefined;
};

export const decodeLinkMetadata = (link: string): DecodedMeta | null => {
    try {
        const parsed = new URL(link);
        const service = detectServiceMeta(link);
        const id = extractIdFromUrl(link);
        const hostname = parsed.hostname.replace(/^www\./, "");

        return {
            service,
            serviceLabel: service?.label ?? hostname,
            id: id || undefined,
            originalUrl: link,
        };
    } catch {
        return null;
    }
};

export const buildPreview = (
    data: PreviewSource | null | undefined,
): ComposerPreview | null => {
    if (!data || typeof data !== "object") {
        return null;
    }

    const externalIds = (data.externalIds ?? {}) as SyncFMExternalIdMap;
    const shortcode = (data as { shortcode?: string }).shortcode;
    const conversionWarnings = (data as { conversionWarnings?: typeof data.conversionWarnings }).conversionWarnings;
    const normalizedType =
        typeof data.type === "string" ? data.type.toLowerCase() : undefined;

    const albumArtistList = Array.isArray(data.artists)
        ? data.artists.filter(Boolean)
        : [];

    if (
        normalizedType === "artist" ||
        ((data as SyncFMArtist).name &&
            (!data.title || normalizedType === "artist"))
    ) {
        const artist = data as SyncFMArtist;
        const genres = Array.isArray(artist.genre) ? artist.genre : [];
        const subtitle = genres.length ? genres.slice(0, 2).join(" • ") : undefined;
        const releases = Array.isArray(artist.albums) ? artist.albums.length : 0;
        const supporting =
            releases > 0
                ? `${releases} release${releases > 1 ? "s" : ""}`
                : undefined;

        return {
            type: "Artist",
            title: artist.name ?? "Unknown artist",
            subtitle,
            supporting,
            imageUrl: artist.imageUrl ?? artist.albums?.[0]?.imageUrl,
            externalIds,
            shortcode,
            conversionWarnings,
        };
    }

    const isPlaylist =
        normalizedType === "playlist" ||
        ("originalService" in data &&
            Array.isArray((data as SyncFMPlaylist).songs));
    const isAlbum =
        !isPlaylist &&
        (normalizedType === "album" ||
            "songs" in data ||
            typeof data.totalTracks === "number");

    if (isPlaylist || isAlbum) {
        const totalTracks =
            typeof data.totalTracks === "number"
                ? data.totalTracks
                : Array.isArray((data as SyncFMAlbum).songs)
                    ? (data as SyncFMAlbum).songs.length
                    : undefined;
        const durationSeconds = (data as SyncFMAlbum).duration;
        const typeLabel: ComposerPreviewType = isPlaylist ? "Playlist" : "Album";

        const subtitleParts: string[] = [];
        if (albumArtistList.length) {
            subtitleParts.push(albumArtistList.join(", "));
        }
        if ("releaseDate" in data && data.releaseDate) {
            const year = new Date(data.releaseDate as string).getFullYear();
            if (!Number.isNaN(year)) {
                subtitleParts.push(String(year));
            }
        }

        const supportingParts: string[] = [];
        if (totalTracks) {
            supportingParts.push(
                `${totalTracks} track${totalTracks === 1 ? "" : "s"}`,
            );
        }
        if (typeof durationSeconds === "number" && durationSeconds > 0) {
            supportingParts.push(formatTotalDuration(durationSeconds));
        }

        return {
            type: typeLabel,
            title: data.title ?? data.name ?? "Untitled release",
            subtitle: subtitleParts.length ? subtitleParts.join(" • ") : undefined,
            supporting: supportingParts.length
                ? supportingParts.join(" • ")
                : undefined,
            imageUrl: data.imageUrl,
            externalIds,
            shortcode,
            conversionWarnings,
        };
    }

    const song = data as SyncFMSong;
    const artists = Array.isArray(song.artists)
        ? song.artists.join(", ")
        : undefined;
    const subtitleParts = [artists, song.album].filter(Boolean);
    const supportingParts: string[] = [];
    if (typeof song.duration === "number" && song.duration > 0) {
        supportingParts.push(formatDuration(song.duration));
    }
    if (song.explicit) {
        supportingParts.push("Explicit");
    }

    return {
        type: "Song",
        title: song.title ?? "Untitled track",
        subtitle: subtitleParts.length ? subtitleParts.join(" • ") : undefined,
        supporting: supportingParts.length
            ? supportingParts.join(" • ")
            : undefined,
        imageUrl: song.imageUrl,
        explicit: song.explicit ?? false,
        externalIds,
        shortcode,
        conversionWarnings,
    };
};
