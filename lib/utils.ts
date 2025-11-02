import type { Metadata } from "next";
import { clsx, type ClassValue } from "clsx"
import type { ServiceName, SyncFMExternalIdMap } from "syncfm.ts"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a duration in seconds into a "mm:ss" string.
 * @param seconds The duration in seconds.
 * @returns A formatted string like "3:05".
 */
export const formatDuration = (seconds?: number) => {
  if (!seconds) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

/**
 * Formats a total duration in seconds into a "Xh Ym" string.
 * @param seconds The total duration in seconds.
 * @returns A formatted string like "1h 30m" or "55 min".
 */
export const formatTotalDuration = (seconds?: number) => {
  if (!seconds) return "0 min"
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins} min`
}

export const SERVICE_TO_EXTERNAL_KEY: Record<ServiceName, keyof SyncFMExternalIdMap | undefined> = {
  applemusic: "AppleMusic",
  ytmusic: "YouTube",
  spotify: "Spotify",
};

interface createMetaOpts {
  title: string;
  description: string;
  url: string;
  image?: string;
  baseUrl?: string;
  type?: {
    twitter: "summary" | "summary_large_image" | "app" | "player";
    og: "website" | "article" | "book" | "profile" | "music.song" | "music.album" | "music.playlist" | "music.radio_station";
  }
}
const createMetaDefaults: Partial<createMetaOpts> = {
  baseUrl: "https://syncfm.dev",
  type: {
    twitter: "summary",
    og: "article",
  }
}
interface CombinedMetaOpts extends createMetaOpts {
  baseUrl: string;
  type: {
    twitter: "summary" | "summary_large_image" | "app" | "player";
    og: "website" | "article" | "book" | "profile" | "music.song" | "music.album" | "music.playlist" | "music.radio_station";
  }
}
export const createMetadata = (meta: createMetaOpts): Metadata => {
  const m = { ...createMetaDefaults, ...meta } as CombinedMetaOpts;
  const outputMeta: Metadata = {
    metadataBase: new URL(m.baseUrl),
    title: m.title,
    description:
      m.description,
    openGraph: {
      title: m.title,
      description:
        m.description,
      type: m.type.og,
      url: m.url,
    },
    twitter: {
      card: m.type.twitter,
      title: m.title,
      description:
        m.description,
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

  return outputMeta
}