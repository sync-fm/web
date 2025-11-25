import type { IconType } from "react-icons";
import type {
	SyncFMAlbum,
	SyncFMArtist,
	SyncFMExternalIdMap,
	SyncFMPlaylist,
	SyncFMSong,
} from "syncfm.ts";
export interface ServiceConversionWarning {
	message: string;
	timestamp: Date;
}

export interface ConversionWarningMap {
	[service: string]: ServiceConversionWarning;
}

export type ComposerStatus = "idle" | "loading" | "success" | "error" | "warning";
export type ComposerPreviewType = "Song" | "Album" | "Artist" | "Playlist";

export type ComposerPreview = {
	type: ComposerPreviewType;
	title: string;
	subtitle?: string;
	supporting?: string;
	imageUrl?: string;
	explicit?: boolean;
	externalIds: SyncFMExternalIdMap;
	shortcode?: string;
	conversionWarnings?: ConversionWarningMap;
};

export type ServiceMeta = {
	key: keyof SyncFMExternalIdMap;
	label: string;
	icon: IconType;
};

export type ServiceStatus = ServiceMeta & { hasId: boolean };

export type LinkComposerProps = {
	expanded?: boolean;
	onExpandedChange?: (expanded: boolean) => void;
	onActiveChange?: (active: boolean) => void;
	hideInline?: boolean;
};

export type PreviewSource = Partial<SyncFMSong & SyncFMAlbum & SyncFMArtist & SyncFMPlaylist> & {
	type?: string;
};

export type DecodedMeta = {
	service?: ServiceMeta;
	serviceLabel: string;
	id?: string;
	typeLabel?: string;
	originalUrl: string;
};
