/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Clock, Music } from "lucide-react";
import type {
	ServiceName,
	SyncFMAlbum,
} from "syncfm.ts";
import { normalizeConversionOutcome, type ProviderStatus } from "@/lib/normalizeConversionOutcome";
import { LoadingUI } from "./ui/LoadingUI";
import { useDominantColors } from "@/lib/useDominantColors";
import { formatDuration, formatTotalDuration } from "@/lib/utils";
import { MusicPlayerCard } from "@/components/ui/MusicPlayerCard";
import { StreamingServiceButtons } from "@/components/ui/StreamingServiceButtons";

interface AlbumViewProps {
	url?: string;
	syncId?: string;
	thinBackgroundColor?: string;
	data?: SyncFMAlbum;
}

export default function AlbumView({
	url,
	syncId,
	thinBackgroundColor,
	data,
}: AlbumViewProps) {
	const [album, setAlbum] = useState<SyncFMAlbum | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { colors: dominantColors, isAnalyzing } = useDominantColors(
		album?.imageUrl,
		!true,
	);
	const [blurHash, setBlurHash] = useState<string | undefined>();

	const normalizedOutcome = useMemo(() => (album ? normalizeConversionOutcome(album) : undefined), [album]);

	const serviceStatus = useMemo(() => {
		if (!normalizedOutcome) return undefined;
		return normalizedOutcome.statuses.reduce((acc, status) => {
			acc[status.service] = status;
			return acc;
		}, {} as Record<ServiceName, ProviderStatus>);
	}, [normalizedOutcome]);

	const hasUnavailableServices = normalizedOutcome ? normalizedOutcome.missingServices.length > 0 : false;

	const getShareFallback = useCallback(
		(service: ServiceName): string | null => {
			if (!album) return null;

			const params = new URLSearchParams({
				syncId: album.syncId,
				service,
				partial: "true",
			});
			return `/album?${params.toString()}`;
		},
		[album],
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
		async function fetchAlbum() {
			setAlbum(null);
			setIsLoading(true);
			if (data) {
				setAlbum(data);
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
						`/api/getBySyncId?syncId=${encodeURIComponent(syncId)}&type=album`,
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
						errorData.error || errorData.message || "Failed to load album data",
					);
					setIsLoading(false);
					return;
				}

				const data = await response.json();
				setAlbum(data);
				if (data.imageUrl) {
					await getBlurHash(data.imageUrl);
				}
				setIsLoading(false);
			} catch (error) {
				console.error("Error fetching album data:", error);
				setError(
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
				);
				setIsLoading(false);
			}
		}
		fetchAlbum();
	}, [url, syncId, data]);

	const uniqueSongs = useMemo(() => {
		if (!album) return [];

		const seen = new Set<string>();
		const uniqueList: typeof album.songs = [];

		album.songs.forEach((song) => {
			if (!seen.has(song.syncId)) {
				uniqueList.push(song);
				seen.add(song.syncId);
			} else {
				const existingIndex = uniqueList.findIndex(
					(s) => s.syncId === song.syncId,
				);
				if (
					existingIndex !== -1 &&
					song.artists.length > uniqueList[existingIndex].artists.length
				) {
					uniqueList[existingIndex] = song;
				}
			}
		});

		return uniqueList;
	}, [album]);

	const streamingUrlCacheRef = useRef<
		Map<ServiceName, Promise<string> | string>
	>(new Map());
	useEffect(() => {
		streamingUrlCacheRef.current.clear();
	}, [album?.syncId]);

	const getStreamingUrl = useCallback(
		async (service: ServiceName): Promise<string> => {
			if (!album) {
				throw new Error("Album not loaded");
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
					const createURLRes: { url?: string | null } = await fetch("/api/createUrl", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							service,
							input: album,
							type: "album",
						}),
					}).then((res) => res.json());
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
		[album, url, syncId, serviceStatus, getShareFallback],
	);

	if (
		isLoading ||
		!album ||
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
						Error Loading Album
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
			<AnimatePresence mode="wait">
				<motion.div
					key={album.syncId}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, ease: "easeInOut" }}
				>
					{/* Main Album Info Section */}
					<div className="flex flex-col md:flex-row gap-6 mb-8">
						<motion.div
							whileHover={{ scale: 1.05 }}
							transition={{ duration: 0.3 }}
							className="relative flex-shrink-0"
						>
							<div className="relative h-48 w-48 mx-auto md:mx-0 overflow-hidden rounded-2xl shadow-2xl">
								<img
									src={
										album.imageUrl ||
										"/placeholder.svg?height=192&width=192&query=album cover"
									}
									alt={`${album.title} cover`}
									className="h-full w-full object-cover"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
							</div>
						</motion.div>

						<div className="flex-1 text-center md:text-left">
							<motion.h1
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}
								className="text-3xl md:text-4xl font-bold text-white mb-3"
								style={{
									textShadow:
										"0 2px 8px rgba(0,0,0,0.8), 0 4px 16px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.9)",
								}}
							>
								{album.title}
							</motion.h1>
							<motion.p
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
								className="text-lg text-white/95 mb-4"
								style={{
									textShadow:
										"0 2px 6px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)",
								}}
							>
								{album.artists.join(", ")}
							</motion.p>
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.4 }}
								className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-white/90 mb-6"
								style={{
									textShadow:
										"0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)",
								}}
							>
								<div className="flex items-center gap-1">
									<Music className="h-4 w-4" />
									<span>
										{album.totalTracks} track
										{album.totalTracks !== 1 ? "s" : ""}
									</span>
								</div>
								{album.duration && (
									<div className="flex items-center gap-1">
										<Clock className="h-4 w-4" />
										<span>{formatTotalDuration(album.duration)}</span>
									</div>
								)}
							</motion.div>
							{hasUnavailableServices && (
								<p className="mb-4 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200 backdrop-blur">
									Some streaming providers are temporarily unavailable. Try another service or check back later.
								</p>
							)}
							<StreamingServiceButtons
								createUrl={getStreamingUrl}
								serviceStatus={serviceStatus}
							/>
						</div>
					</div>

					{/* Tracks Section */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.6 }}
						className="space-y-2"
					>
						<h3
							className="text-lg font-semibold text-white mb-4"
							style={{
								textShadow:
									"0 2px 6px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)",
							}}
						>
							Tracks
						</h3>
						<div className="space-y-1">
							{uniqueSongs.map((song, index) => (
								<motion.div
									key={song.syncId}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: index * 0.02, duration: 0.3 }}
									className="group flex items-center gap-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-3 transition-all duration-300 hover:bg-white/20 hover:border-white/30"
								>
									<div className="flex-shrink-0 w-8 text-center">
										<span
											className="text-sm text-white/70 group-hover:hidden"
											style={{
												textShadow:
													"0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)",
											}}
										>
											{index + 1}
										</span>
										<Play className="h-4 w-4 text-white/90 hidden group-hover:block mx-auto" />
									</div>
									<div className="flex-1 min-w-0">
										<p
											className="text-white font-medium truncate"
											style={{
												textShadow:
													"0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)",
											}}
										>
											{song.title}
										</p>
										<p
											className="text-white/80 text-sm truncate"
											style={{
												textShadow:
													"0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)",
											}}
										>
											{song.artists.join(", ")}
										</p>
									</div>
									<div
										className="flex-shrink-0 text-white/70 text-sm"
										style={{
											textShadow:
												"0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.9)",
										}}
									>
										{formatDuration(song.duration)}
									</div>
								</motion.div>
							))}
						</div>
					</motion.div>
				</motion.div>
			</AnimatePresence>
		</MusicPlayerCard>
	);
}
