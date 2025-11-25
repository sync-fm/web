import { type ClassValue, clsx } from "clsx";
import type { Metadata } from "next";
import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import type { MusicEntityType, ServiceName, SyncFMExternalIdMap } from "syncfm.ts";
import { twMerge } from "tailwind-merge";

export async function getBaseURLFromHeaders(
	headersFunc: () => Promise<ReadonlyHeaders>
): Promise<URL> {
	const headersList = await headersFunc();
	const host = headersList.get("host") || "localhost:3000";
	const protocol = headersList.get("x-forwarded-proto") || "http";
	return new URL(`${protocol}://${host}`);
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatRelativeTime(input?: string | number | Date | null): string {
	if (!input) return "Unknown";

	const date = input instanceof Date ? input : new Date(input);
	if (Number.isNaN(date.getTime())) return "Unknown";

	const diff = Date.now() - date.getTime();
	const minute = 60_000;
	const hour = 60 * minute;
	const day = 24 * hour;

	if (diff < minute) return "Just now";
	if (diff < hour) {
		const mins = Math.floor(diff / minute);
		return `${mins} min${mins === 1 ? "" : "s"} ago`;
	}
	if (diff < day) {
		const hrs = Math.floor(diff / hour);
		return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
	}
	const days = Math.floor(diff / day);
	return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function getInitials(value?: string | null): string {
	if (!value) return "";

	const initials = value
		.split(" ")
		.filter(Boolean)
		.map((part) => part[0]?.toUpperCase())
		.join("");

	return initials.slice(0, 2);
}

/**
 * Formats a duration in seconds into a "mm:ss" string.
 * @param seconds The duration in seconds.
 * @returns A formatted string like "3:05".
 */
export const formatDuration = (seconds?: number) => {
	if (!seconds) return "0:00";
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

/**
 * Formats a total duration in seconds into a "Xh Ym" string.
 * @param seconds The total duration in seconds.
 * @returns A formatted string like "1h 30m" or "55 min".
 */
export const formatTotalDuration = (seconds?: number) => {
	if (!seconds) return "0 min";
	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	if (hours > 0) {
		return `${hours}h ${mins}m`;
	}
	return `${mins} min`;
};

export const SERVICE_TO_EXTERNAL_KEY: Record<ServiceName, keyof SyncFMExternalIdMap | undefined> = {
	applemusic: "AppleMusic",
	ytmusic: "YouTube",
	spotify: "Spotify",
};
export const createMetadataURL = (
	syncId: string,
	shortcode: string | undefined,
	type: MusicEntityType
): string => {
	if (shortcode) {
		return `https://syncfm.dev/s/${shortcode}`;
	}
	return `https://syncfm.dev/s/${type}/${syncId}`;
};

interface createMetaOpts {
	title: string;
	description: string;
	url: string;
	image?: string;
	baseUrl?: string;
	type?: {
		twitter: "summary" | "summary_large_image" | "app" | "player";
		og:
			| "website"
			| "article"
			| "book"
			| "profile"
			| "music.song"
			| "music.album"
			| "music.playlist"
			| "music.radio_station";
	};
}
const createMetaDefaults: Partial<createMetaOpts> = {
	baseUrl: "https://syncfm.dev",
	type: {
		twitter: "summary",
		og: "article",
	},
};
interface CombinedMetaOpts extends createMetaOpts {
	baseUrl: string;
	type: {
		twitter: "summary" | "summary_large_image" | "app" | "player";
		og:
			| "website"
			| "article"
			| "book"
			| "profile"
			| "music.song"
			| "music.album"
			| "music.playlist"
			| "music.radio_station";
	};
}
export const createMetadata = (meta: createMetaOpts): Metadata => {
	const m = { ...createMetaDefaults, ...meta } as CombinedMetaOpts;
	const outputMeta: Metadata = {
		metadataBase: new URL(m.baseUrl),
		title: m.title,
		description: m.description,
		openGraph: {
			title: m.title,
			description: m.description,
			type: m.type.og,
			url: m.url,
		},
		twitter: {
			card: m.type.twitter,
			title: m.title,
			description: m.description,
		},
	};
	if (m.image) {
		outputMeta.openGraph = {
			...outputMeta.openGraph,
			images: [
				{
					url: m.image,
					alt: m.title,
				},
			],
		};
		outputMeta.twitter = {
			...outputMeta.twitter,
			images: [m.image],
		};
	}

	return outputMeta;
};
