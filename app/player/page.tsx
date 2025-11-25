import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { SyncFMSong } from "syncfm.ts";
import { processResourceRequest } from "@/lib/internal/resource.actions";
import { SafeParseProps } from "@/lib/internal/SafeParseProps";
import type { LyricLine } from "@/lib/lyrics";
import { parseLrcToLyricLines } from "@/lib/lyrics";
import { getThinBackgroundColorFromImageUrl } from "@/lib/serverColors";
import { getBaseURLFromHeaders } from "@/lib/utils";
import { searchLyrics } from "./actions";
import { PlayerClient } from "./PlayerClient";

async function PlayerPageContent(props: {
	params: Promise<{ searchParams: { url: string; syncId: string } }>;
	searchParams: Promise<{ url: string; syncId: string }>;
}) {
	const baseURL = await getBaseURLFromHeaders(headers);

	const { canUse, identifierType, identifier } = await SafeParseProps(props);
	if (!canUse) {
		return null;
	}

	const resourceRes = await processResourceRequest<SyncFMSong>({
		identifier,
		identifierType,
		resourceType: "song",
	});

	if (resourceRes.isErr()) {
		// Redirect to error page
		const errorData = resourceRes.error;
		const errorUrl = new URL(`${baseURL}/error`);
		errorUrl.searchParams.set("errorType", identifierType === "syncId" ? "fetch" : "conversion");
		errorUrl.searchParams.set("entityType", "song");
		switch (identifierType) {
			case "url":
				errorUrl.searchParams.set("url", identifier);
				break;
			case "syncId":
				errorUrl.searchParams.set("syncId", identifier);
				break;
		}
		errorUrl.searchParams.set("message", errorData.error || "Failed to fetch song data");

		return redirect(`/error${errorUrl.search}` as Route);
	}

	const data = resourceRes.value;
	let syncedLyrics: LyricLine[] = [];
	let plainLyrics: string | null = null;
	let thinBackgroundColor = "#000000";

	try {
		if (data.imageUrl) {
			thinBackgroundColor = await getThinBackgroundColorFromImageUrl(data.imageUrl);
		}

		const lyricsRes = await searchLyrics(data);
		if (lyricsRes?.syncedLyrics) {
			syncedLyrics = parseLrcToLyricLines(lyricsRes.syncedLyrics);
		}
		if (lyricsRes?.plainLyrics) {
			plainLyrics = lyricsRes.plainLyrics;
		}
	} catch (error) {
		console.error("Error fetching lyrics or colors:", error);
	}

	return (
		<PlayerClient
			song={data}
			thinBackgroundColor={thinBackgroundColor}
			syncedLyrics={syncedLyrics}
			plainLyrics={plainLyrics}
		/>
	);
}

export default async function PlayerPage(props: {
	params: Promise<{ searchParams: { url: string; syncId: string } }>;
	searchParams: Promise<{ url: string; syncId: string }>;
}) {
	return (
		<Suspense
			fallback={
				<div className="flex h-screen w-screen items-center justify-center bg-black text-white">
					Loading...
				</div>
			}
		>
			<PlayerPageContent {...props} />
		</Suspense>
	);
}
