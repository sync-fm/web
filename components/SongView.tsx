/* eslint-disable @next/next/no-img-element */
"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import type { ServiceName, SyncFMSong } from "syncfm.ts";
import {
	normalizeConversionOutcome,
	type ProviderStatus,
} from "@/lib/normalizeConversionOutcome";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { LoadingUI } from "./ui/LoadingUI";
import { useDominantColors } from "@/lib/useDominantColors";
import { formatDuration } from "@/lib/utils";
import { MusicPlayerCard } from "@/components/ui/MusicPlayerCard";
import { StreamingServiceButtons } from "@/components/ui/StreamingServiceButtons";

interface SongViewProps {
	url?: string;
	syncId?: string;
	thinBackgroundColor?: string;
	data?: SyncFMSong;
}

export function SongView({
	url,
	syncId,
	thinBackgroundColor,
	data,
}: SongViewProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [song, setSong] = useState<SyncFMSong>();
	const [error, setError] = useState<string | null>(null);
	const { colors: dominantColors, isAnalyzing } = useDominantColors(
		song?.imageUrl,
		true,
	);
	const [blurHash, setBlurHash] = useState<string | undefined>();

	const normalizedOutcome = useMemo(
		() => (song ? normalizeConversionOutcome(song) : undefined),
		[song],
	);

	const serviceStatus = useMemo(() => {
		if (!normalizedOutcome) return undefined;
		return normalizedOutcome.statuses.reduce(
			(acc, status) => {
				acc[status.service] = status;
				return acc;
			},
			{} as Record<ServiceName, ProviderStatus>,
		);
	}, [normalizedOutcome]);

	const hasUnavailableServices = normalizedOutcome
		? normalizedOutcome.missingServices.length > 0
		: false;

	const getShareFallback = useCallback(
		(service: ServiceName): string | null => {
			if (!song) return null;

			const params = new URLSearchParams({
				syncId: song.syncId,
				service,
				partial: "true",
			});
			return `/song?${params.toString()}`;
		},
		[song],
	);

	useEffect(() => {
		async function getBlurHash(imageUrl: string) {
			try {
				const response = await fetch(
					"/api/getBackgroundBlurHash?url=" + encodeURIComponent(imageUrl),
				);
				const data = await response.json();
				if (data.hash) {
					setBlurHash(data.hash);
				} else {
					console.warn("No blur hash returned from API");
				}
			} catch (error) {
				console.error("Error fetching blur hash:", error);
			}
		}
		async function fetchSong() {
			if (data) {
				setSong(data);
				if (data.imageUrl) {
					await getBlurHash(data.imageUrl);
				}
				setIsLoading(false);
				return;
			}
			try {
				let response: Response;

				if (syncId) {
					response = await fetch(
						`/api/getBySyncId?syncId=${encodeURIComponent(syncId)}&type=song`,
					);
				} else if (url) {
					response = await fetch(
						`/api/handle/syncfm?url=${encodeURIComponent(url)}`,
					);
				} else {
					setError("No URL or syncId provided");
					setIsLoading(false);
					return;
				}

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					setError(
						errorData.error || errorData.message || "Failed to load song data",
					);
					setIsLoading(false);
					return;
				}

				const data = await response.json();
				setSong(data);
				if (data.imageUrl) {
					await getBlurHash(data.imageUrl);
				}
			} catch (error) {
				console.error("Error fetching song data:", error);
				setError(
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
				);
			} finally {
				setIsLoading(false);
			}
		}
		fetchSong();
	}, [url, syncId, data]);

	const streamingUrlCacheRef = useRef<
		Map<ServiceName, Promise<string> | string>
	>(new Map());
	useEffect(() => {
		streamingUrlCacheRef.current.clear();
	}, [song?.syncId]);

	const getStreamingUrl = useCallback(
		async (service: ServiceName): Promise<string> => {
			if (!song) {
				throw new Error("song not loaded");
			}

			const cache = streamingUrlCacheRef.current;
			const cached = cache.get(service);
			if (cached) {
				return typeof cached === "string" ? cached : cached;
			}

			const status = serviceStatus?.[service];
			const shareFallback = getShareFallback(service);

			if (status && !status.available && shareFallback) {
				cache.set(service, shareFallback);
				return shareFallback;
			}

			const promise = (async (): Promise<string> => {
				try {
					const createURLRes: { url?: string | null } = await fetch(
						"/api/createUrl",
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								service,
								input: song,
								type: "song",
							}),
						},
					).then((res) => res.json());
					const resolvedUrl = createURLRes?.url ?? null;
					if (resolvedUrl) {
						streamingUrlCacheRef.current.set(service, resolvedUrl);
						return resolvedUrl;
					}
				} catch (error) {
					console.error("createUrl failed:", error);
				}

				if (shareFallback) {
					streamingUrlCacheRef.current.set(service, shareFallback);
					return shareFallback;
				}

				if (url) {
					const fallback = `/api/handle/${service}?url=${encodeURIComponent(url)}`;
					streamingUrlCacheRef.current.set(service, fallback);
					return fallback;
				}
				if (syncId) {
					const fallback = `/api/handle/${service}?syncId=${encodeURIComponent(syncId)}`;
					streamingUrlCacheRef.current.set(service, fallback);
					return fallback;
				}

				throw new Error("Cannot create URL: no url or syncId available");
			})();

			cache.set(service, promise);
			return promise;
		},
		[song, url, syncId, serviceStatus, getShareFallback],
	);

	if (
		isLoading ||
		!song ||
		isAnalyzing ||
		!blurHash ||
		typeof blurHash !== "string"
	) {
		return <LoadingUI />;
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-950 via-slate-900 to-slate-950">
				<div className="text-center p-8">
					<h1 className="text-2xl font-bold text-white mb-4">
						Error Loading Song
					</h1>
					<p className="text-white/70 mb-6">{error}</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<MusicPlayerCard
			hash={blurHash}
			dominantColors={dominantColors}
			thinBackgroundColor={thinBackgroundColor || "#000"}
		>
			<div className="relative max-w-sm w-full z-10 mx-auto">
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ delay: 0.2, duration: 0.6 }}
					className="relative mb-6"
				>
					<div className="aspect-square rounded-2xl overflow-hidden shadow-2xl relative">
						{song.imageUrl ? (
							<img
								src={song.imageUrl || "/placeholder.svg"}
								alt={`${song.title} cover`}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full bg-muted flex items-center justify-center">
								<Play className="w-16 h-16 text-muted-foreground" />
							</div>
						)}
						<div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/20 rounded-2xl" />
						<div className="absolute inset-0 backdrop-blur-[0.5px] bg-white/5 rounded-2xl" />
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4, duration: 0.6 }}
					className="text-center mb-6"
				>
					<h1 className="text-2xl font-bold text-white mb-2 leading-tight drop-shadow-lg [text-shadow:_0_2px_8px_rgb(0_0_0_/_80%)]">
						{song.title}
					</h1>
					<p className="text-lg text-white/90 mb-1 drop-shadow-md [text-shadow:_0_1px_4px_rgb(0_0_0_/_60%)]">
						{song.artists.join(", ")}
					</p>
					{song.album && (
						<p className="text-sm text-white/80 mb-2 drop-shadow-md [text-shadow:_0_1px_4px_rgb(0_0_0_/_60%)]">
							{song.album}
						</p>
					)}
					<p className="text-sm text-white/70 drop-shadow-md [text-shadow:_0_1px_4px_rgb(0_0_0_/_60%)]">
						{formatDuration(song.duration)}
					</p>
				</motion.div>

				{hasUnavailableServices && (
					<p className="mb-4 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200 backdrop-blur">
						Some streaming providers are temporarily unavailable. Try another
						service or check back later.
					</p>
				)}
				<StreamingServiceButtons
					createUrl={getStreamingUrl}
					serviceStatus={serviceStatus}
				/>
			</div>
		</MusicPlayerCard>
	);
}
