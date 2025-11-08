import type { Metadata } from "next";
import { SongView } from "@/components/SongView";
import { getThinBackgroundColorFromImageUrl } from "@/lib/serverColors";
import type { SyncFMSong } from "syncfm.ts";
import { headers } from "next/headers";
import { meowenv } from "@/lib/meow-env";
const env = new meowenv(true);
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata(props: {
	params: Promise<{ searchParams: { url: string; syncId: string } }>;
	searchParams: Promise<{ url: string; syncId: string }>;
}): Promise<Metadata> {
	const paramsObj = (await props.params) ? await props.params : undefined;
	const searchParams = await props.searchParams;
	const rawUrl = paramsObj?.searchParams?.url ?? searchParams?.url;
	const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;
	const rawSyncId = paramsObj?.searchParams?.syncId ?? searchParams?.syncId;
	const syncId = Array.isArray(rawSyncId) ? rawSyncId[0] : rawSyncId;

	if (!url && !syncId) return {};

	try {
		const headersList = await headers();
		const host = headersList.get("host") || "localhost:3000";
		const protocol =
			headersList.get("x-forwarded-proto") ||
			(env.get("NODE_ENV") === "production" ? "https" : "http");
		const baseUrl = `${protocol}://${host}`;

		let data: SyncFMSong;

		if (syncId) {
			data = await fetch(
				`${baseUrl}/api/getBySyncId?syncId=${encodeURIComponent(syncId)}&type=song`,
			).then((res) => res.json());
		} else {
			data = await fetch(
				`${baseUrl}/api/convertAll?url=${encodeURIComponent(url)}`,
			).then((res) => res.json());
		}

		if (!data) return {};

		return {
			metadataBase: new URL("https://syncfm.dev"),
			title: `${data.title} - SyncFM`,
			description:
				data.description ||
				(data.artists
					? `${data.artists.join(", ")} - ${data.album || ""}`
					: undefined),
			openGraph: {
				title: `${data.title} - SyncFM`,
				description:
					data.description ||
					(data.artists
						? `${data.artists.join(", ")} - ${data.album || ""}`
						: undefined),
				images: data.imageUrl
					? [{ url: data.imageUrl, alt: data.title }]
					: undefined,
			},
			twitter: {
				card: "summary",
				title: `${data.title} - SyncFM`,
				description:
					data.description ||
					(data.artists
						? `${data.artists.join(", ")} - ${data.album || ""}`
						: undefined),
				images: data.imageUrl
					? [{ url: data.imageUrl, alt: data.title }]
					: undefined,
			},
		};
	} catch {
		return {};
	}
}

export default async function SongPage(props: {
	params: Promise<{ searchParams: { url: string; syncId: string } }>;
	searchParams: Promise<{ url: string; syncId: string }>;
}) {
	const paramsObj = (await props.params) ? await props.params : undefined;
	const searchParams = await props.searchParams;
	const rawUrl = paramsObj?.searchParams?.url ?? searchParams?.url;
	const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;
	const rawSyncId = paramsObj?.searchParams?.syncId ?? searchParams?.syncId;
	const syncId = Array.isArray(rawSyncId) ? rawSyncId[0] : rawSyncId;

	if (!url && !syncId) {
		return null;
	}

	const headersList = await headers();
	const host = headersList.get("host") || "localhost:3000";
	const protocol =
		headersList.get("x-forwarded-proto") ||
		(env.get("NODE_ENV") === "production" ? "https" : "http");
	const baseUrl = `${protocol}://${host}`;

	try {
		let response: Response;

		if (syncId) {
			response = await fetch(
				`${baseUrl}/api/getBySyncId?syncId=${encodeURIComponent(syncId)}&type=song`,
			);
		} else {
			response = await fetch(
				`${baseUrl}/api/convertAll?url=${encodeURIComponent(url)}`,
			);
		}

		if (!response.ok) {
			// Redirect to error page
			const errorData = await response.json().catch(() => ({}));
			const errorUrl = new URL("/error", baseUrl);
			errorUrl.searchParams.set("errorType", syncId ? "fetch" : "conversion");
			errorUrl.searchParams.set("entityType", "song");
			if (url) errorUrl.searchParams.set("url", url);
			if (syncId) errorUrl.searchParams.set("syncId", syncId);
			errorUrl.searchParams.set(
				"message",
				errorData.error || errorData.message || "Failed to fetch song data",
			);

			// Use redirect from next/navigation
			const { redirect } = await import("next/navigation");
			redirect(errorUrl.toString());
		}

		const data = (await response.json()) as SyncFMSong;
		const thinBg = await getThinBackgroundColorFromImageUrl(data?.imageUrl);

		return (
			<SongView
				url={url}
				syncId={syncId}
				data={data}
				thinBackgroundColor={thinBg}
			/>
		);
	} catch (error) {
		console.error("Error in SongPage:", error);

		// Redirect to error page
		const errorUrl = new URL("/error", baseUrl);
		errorUrl.searchParams.set("errorType", "fetch");
		errorUrl.searchParams.set("entityType", "song");
		if (url) errorUrl.searchParams.set("url", url);
		if (syncId) errorUrl.searchParams.set("syncId", syncId);
		errorUrl.searchParams.set(
			"message",
			error instanceof Error ? error.message : "An unexpected error occurred",
		);

		// Use redirect from next/navigation
		const { redirect } = await import("next/navigation");
		redirect(errorUrl.toString());
	}
}
