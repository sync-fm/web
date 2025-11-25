"use server";
import { err, ok, type Result, ResultAsync } from "neverthrow";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";
import type { MusicEntityType, SyncFMAlbum, SyncFMArtist, SyncFMSong } from "syncfm.ts";
import { SyncFM } from "syncfm.ts";
import { z } from "zod";
import syncfmconfig from "@/syncfm.config";
import { createMetadata, createMetadataURL } from "../utils";
import { createStableEntity } from "./MusicResourceToStable";

const syncfm = new SyncFM(syncfmconfig);
const createMetadataOptionsSchema = z.object({
	identifier: z.string().min(1),
	identifierType: z.enum(["url", "syncId"]),
	resourceType: z.enum(["song", "album", "artist"]),
});
interface createMetadataOptions {
	identifier: string;
	identifierType: "url" | "syncId";
	resourceType: MusicEntityType;
}
type ResourceToTypeMap = {
	SyncFMAlbum: "album";
	SyncFMSong: "song";
	SyncFMArtist: "artist";
};
type Resource = SyncFMAlbum | SyncFMSong | SyncFMArtist;
type ResourceKey<T> = T extends SyncFMAlbum
	? "SyncFMAlbum"
	: T extends SyncFMSong
		? "SyncFMSong"
		: T extends SyncFMArtist
			? "SyncFMArtist"
			: never;

interface createMetadataFromResourceOptions<T extends Resource> {
	resource: T;
	resourceType: ResourceToTypeMap[ResourceKey<T>];
}

const MusicInfoFromSyncIdSchema = z.object({
	syncId: z.string().min(1),
	type: z.enum(["song", "album", "artist"]),
});

const createMetadataFromResourceOptionsSchema = z.object({
	resource: z.any(),
	resourceType: z.enum(["song", "album", "artist"]),
});

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchInputResource(url: string, type: MusicEntityType): Promise<Resource> {
	switch (type) {
		case "song":
			return syncfm.getInputSongInfo(url);
		case "album":
			return syncfm.getInputAlbumInfo(url);
		case "artist":
			return syncfm.getInputArtistInfo(url);
		default:
			throw new Error("Unsupported input type for metadata generation");
	}
}

async function convertResourceToSpotify<T extends Resource>(
	resource: T,
	type: MusicEntityType
): Promise<T> {
	switch (type) {
		case "song":
			return syncfm.convertSong(resource as SyncFMSong, "spotify") as Promise<T>;
		case "album":
			return syncfm.convertAlbum(resource as SyncFMAlbum, "spotify") as Promise<T>;
		case "artist":
			return syncfm.convertArtist(resource as SyncFMArtist, "spotify") as Promise<T>;
		default:
			throw new Error("Unsupported input type for metadata generation");
	}
}

async function fetchExistingResourceBySyncId<T extends Resource>(
	syncId: string,
	type: MusicEntityType
): Promise<T | null> {
	switch (type) {
		case "song":
			return (await syncfm.getSongBySyncId(syncId)) as T | null;
		case "album":
			return (await syncfm.getAlbumBySyncId(syncId)) as T | null;
		case "artist":
			return (await syncfm.getArtistBySyncId(syncId)) as T | null;
		default:
			return null;
	}
}

async function pollForExistingResource<T extends Resource>(
	syncId: string,
	type: MusicEntityType,
	attempts = 8,
	initialDelayMs = 350,
	backoffFactor = 1.35
): Promise<T | null> {
	let delay = initialDelayMs;
	for (let attempt = 0; attempt < attempts; attempt++) {
		const existing = await fetchExistingResourceBySyncId<T>(syncId, type);
		if (existing) {
			return existing;
		}
		if (attempt < attempts - 1) {
			await wait(delay);
			delay = Math.ceil(delay * backoffFactor);
		}
	}
	return null;
}

async function convertResourceWithDbFallback<T extends Resource>(
	resource: T,
	type: MusicEntityType
): Promise<Result<T, { error: string }>> {
	if (!resource.syncId) {
		return err({ error: "Resource is missing a syncId" });
	}

	const existingBeforeConvert = await fetchExistingResourceBySyncId<T>(resource.syncId, type);
	if (existingBeforeConvert) {
		return ok(existingBeforeConvert);
	}

	try {
		const converted = await convertResourceToSpotify(resource, type);
		return ok(converted as T);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error(`[resource.actions] Failed to convert ${type} ${resource.syncId}`, error);
		const fallback = await pollForExistingResource<T>(resource.syncId, type, 12, 400);
		if (fallback) {
			console.warn(
				`[resource.actions] Using database fallback for ${type} ${resource.syncId} after conversion error.`
			);
			return ok(fallback);
		}
		return err({ error: `Failed to convert ${type}: ${message}` });
	}
}

export async function retrieveMusicResourceInfoFromURL<T extends Resource>(
	URL: string
): Promise<Result<T, { error: string }>> {
	if (!z.string().min(1).safeParse(URL).success) {
		return err({ error: "Invalid parameters" });
	}

	let inputType: MusicEntityType;
	try {
		inputType = await syncfm.getInputTypeFromUrl(URL);
	} catch (error) {
		console.error("[resource.actions] Failed to get input type from URL", error);
		return err({ error: "Failed to get input type" });
	}

	let inputResourceInfo: Resource;
	try {
		inputResourceInfo = await fetchInputResource(URL, inputType);
	} catch (error) {
		console.error(`[resource.actions] Failed to retrieve ${inputType} info from URL`, error);
		return err({ error: `Failed to retrieve ${inputType} info` });
	}

	const conversionResult = await convertResourceWithDbFallback<T>(
		inputResourceInfo as T,
		inputType
	);
	return conversionResult;
}

export async function retrieveMusicResourceInfoFromSyncID<T extends Resource>(params: {
	syncId: string;
	type: MusicEntityType;
}): Promise<Result<T, { error: string }>> {
	if (!MusicInfoFromSyncIdSchema.safeParse(params).success) {
		return err({ error: "Invalid parameters" });
	}

	let convertedDataRes: Result<T, { error: string }>;
	switch (params.type) {
		case "song": {
			convertedDataRes = (await ResultAsync.fromPromise(
				syncfm.getSongBySyncId(params.syncId),
				() => ({ error: "Failed to convert song" })
			)) as Result<T, { error: string }>;
			break;
		}
		case "album": {
			convertedDataRes = (await ResultAsync.fromPromise(
				syncfm.getAlbumBySyncId(params.syncId),
				() => ({ error: "Failed to convert album" })
			)) as Result<T, { error: string }>;
			break;
		}
		case "artist": {
			convertedDataRes = (await ResultAsync.fromPromise(
				syncfm.getArtistBySyncId(params.syncId),
				() => ({ error: "Failed to convert artist" })
			)) as Result<T, { error: string }>;
			break;
		}
		default:
			return err({ error: "Unsupported input type for metadata generation" });
	}

	if (convertedDataRes.isErr()) {
		return err(convertedDataRes.error);
	}

	return ok(convertedDataRes.value);
}

export async function generateMetadata<T extends Resource>(
	params: createMetadataOptions
): Promise<Result<Metadata, { error: string; fallback: Metadata }>> {
	if (!createMetadataOptionsSchema.safeParse(params).success) {
		return err({ error: "Invalid parameters", fallback: {} });
	}
	const musicInfoRes = await processResourceRequest<T>(params);

	if (musicInfoRes.isErr()) {
		return err({ error: musicInfoRes.error.error, fallback: {} });
	}
	const musicInfo = musicInfoRes.value;
	const stable = createStableEntity(musicInfo);
	const metadata = createMetadata({
		title: stable.title,
		description: stable.description,
		url: `https://syncfm.dev/s/${musicInfo.shortcode}`,
		image: stable.image,
	});

	return ok(metadata);
}

export async function generateMetadataFromResource<T extends Resource>(
	params: createMetadataFromResourceOptions<T>
): Promise<Result<Metadata, { error: string; fallback: Metadata }>> {
	if (!createMetadataFromResourceOptionsSchema.safeParse(params).success) {
		return err({ error: "Invalid parameters", fallback: {} });
	}
	const musicInfo = params.resource;
	const stable = createStableEntity(musicInfo);
	const metadata = createMetadata({
		title: stable.title,
		description: stable.description,
		url: createMetadataURL(musicInfo.syncId, musicInfo.shortcode, params.resourceType),
		image: stable.image,
	});

	return ok(metadata);
}

const cachedProcessResourceRequest = cache(
	async (params: createMetadataOptions): Promise<Result<Resource, { error: string }>> => {
		if (!createMetadataOptionsSchema.safeParse(params).success) {
			return err({ error: "Invalid parameters" });
		}

		let musicInfoRes: Result<Resource, { error: string }>;
		switch (params.identifierType) {
			case "url": {
				const res = await retrieveMusicResourceInfoFromURL<Resource>(params.identifier);
				musicInfoRes = res;
				break;
			}
			case "syncId": {
				const res = await retrieveMusicResourceInfoFromSyncID<Resource>({
					syncId: params.identifier,
					type: params.resourceType,
				});
				musicInfoRes = res;
				break;
			}
			default:
				return err({ error: "Unsupported identifier type for metadata generation" });
		}

		if (musicInfoRes.isErr()) {
			return err({ error: musicInfoRes.error.error });
		}

		return ok(musicInfoRes.value);
	}
);

export async function processResourceRequest<T extends Resource>(
	params: createMetadataOptions
): Promise<Result<T, { error: string }>> {
	const result = await cachedProcessResourceRequest(params);
	return result as Result<T, { error: string }>;
}
export async function useResourceRequest<T extends Resource>(
	params: createMetadataOptions
): Promise<{ error?: string; data?: T }> {
	"use cache: private";
	cacheTag(`music-resource:${params.identifierType}:${params.identifier}`);
	cacheLife("seconds");
	const res = await processResourceRequest<T>(params);
	if (res.isErr()) {
		return { error: res.error.error };
	}
	return { data: res.value };
}
