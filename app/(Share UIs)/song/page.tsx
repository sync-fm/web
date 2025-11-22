import type { Metadata, Route } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import type { SyncFMSong } from "syncfm.ts";
import { LoadingUI } from "@/components/MusicUI/LoadingUI";
import { SongView } from "@/components/MusicUI/SongView";
import {
	generateMetadataFromResource,
	processResourceRequest,
} from "@/lib/internal/resource.actions";
import { SafeParseProps } from "@/lib/internal/SafeParseProps";
import { getThinBackgroundColorFromImageUrl } from "@/lib/serverColors";
import { getBaseURLFromHeaders } from "@/lib/utils";

export async function generateMetadata(props: {
	params: Promise<{ searchParams: { url: string; syncId: string } }>;
	searchParams: Promise<{ url: string; syncId: string }>;
}): Promise<Metadata> {
	const { canUse, identifierType, identifier } = await SafeParseProps(props);
	if (!canUse) {
		return {};
	}

	const resourceRes = await processResourceRequest<SyncFMSong>({
		identifier,
		identifierType,
		resourceType: "song",
	});

	if (resourceRes.isErr()) {
		return {};
	}
	const data = resourceRes.value;

	const metadataRes = await generateMetadataFromResource<SyncFMSong>({
		resource: data,
		resourceType: "song",
	});
	if (metadataRes.isErr()) {
		return {};
	}
	return metadataRes.value;
}

export async function SongPageContent(props: {
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

		// Use redirect from next/navigation
		const { redirect } = await import("next/navigation");
		return redirect(`/error${errorUrl.search}` as Route);
	}
	const data = resourceRes.value;

	try {
		const thinBg = await getThinBackgroundColorFromImageUrl(data?.imageUrl);

		return (
			<SongView
				url={identifierType === "url" ? identifier : undefined}
				syncId={identifierType === "syncId" ? identifier : undefined}
				data={data}
				thinBackgroundColor={thinBg}
			/>
		);
	} catch (error) {
		console.error("Error in SongPage:", error);

		// Redirect to error page
		const errorUrl = new URL(`${baseURL}/error`);
		errorUrl.searchParams.set("errorType", "fetch");
		errorUrl.searchParams.set("entityType", "song");
		switch (identifierType) {
			case "url":
				errorUrl.searchParams.set("url", identifier);
				break;
			case "syncId":
				errorUrl.searchParams.set("syncId", identifier);
				break;
		}
		errorUrl.searchParams.set(
			"message",
			error instanceof Error ? error.message : "An unexpected error occurred"
		);

		// Use redirect from next/navigation
		const { redirect } = await import("next/navigation");
		return redirect(`/error${errorUrl.search}` as Route);
	}
}

export default async function SongPage(props: {
	params: Promise<{ searchParams: { url: string; syncId: string } }>;
	searchParams: Promise<{ url: string; syncId: string }>;
}) {
	return (
		<Suspense fallback={<LoadingUI />}>
			<SongPageContent {...props} />
		</Suspense>
	);
}
