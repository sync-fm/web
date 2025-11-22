import { SiApplemusic, SiSpotify, SiYoutubemusic } from "react-icons/si";
import type { ComposerStatus, ServiceMeta } from "./types";

export const SERVICE_META: ServiceMeta[] = [
	{ key: "Spotify", label: "Spotify", icon: SiSpotify },
	{ key: "AppleMusic", label: "Apple Music", icon: SiApplemusic },
	{ key: "YouTube", label: "YouTube Music", icon: SiYoutubemusic },
];

export const defaultStatusCopy: Record<ComposerStatus, string> = {
	idle: "Paste any streaming link and we'll build a SyncFM share instantly.",
	loading: "Matching services and grabbing artwork…",
	success: "Link copied. Share it anywhere you hang out.",
	warning: "Link copied. Some services used closest match (check yellow badges).",
	error: "We couldn't build that link just now.",
};

export const DEFAULT_PLACEHOLDER = "Paste a music link from any service…";
