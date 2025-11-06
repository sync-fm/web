/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Calendar, Clock } from "lucide-react";
import type { ServiceName, SyncFMArtist, SyncFMArtistTrack } from "syncfm.ts";
import {
	normalizeConversionOutcome,
	type ProviderStatus,
} from "@/lib/normalizeConversionOutcome";
import { SiSpotify } from "react-icons/si";
import { LoadingUI } from "./ui/LoadingUI";
import { useDominantColors } from "@/lib/useDominantColors";
import { formatDuration } from "@/lib/utils";
import { MusicPlayerCard } from "@/components/ui/MusicPlayerCard";
import { StreamingServiceButtons } from "@/components/ui/StreamingServiceButtons";

interface ArtistViewProps {
	url?: string;
	syncId?: string;
	thinBackgroundColor?: string;
	data?: SyncFMArtist;
}

export function ArtistView({
	url,
	syncId,
	thinBackgroundColor,
	data,
}: ArtistViewProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [artist, setArtist] = useState<SyncFMArtist>();
	const [error, setError] = useState<string | null>(null);
	const { colors: dominantColors, isAnalyzing } = useDominantColors(
		artist?.imageUrl,
		true,
	);
	const [blurHash, setBlurHash] = useState<string | undefined>();
	const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const normalizedOutcome = useMemo(
		() => (artist ? normalizeConversionOutcome(artist) : undefined),
		[artist],
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
			if (!artist) return null;

			const params = new URLSearchParams({
				syncId: artist.syncId,
				service,
				partial: "true",
			});
			return `/artist?${params.toString()}`;
		},
		[artist],
	);

	useEffect(() => {
		const audioEl = audioRef.current;
		if (!audioEl) return;

		if ("mediaSession" in navigator) {
			navigator.mediaSession.setActionHandler("play", () => {
				audioEl.play();
			});
			navigator.mediaSession.setActionHandler("pause", () => {
				audioEl.pause();
			});
		}

		const handlePlay = () => setIsPlaying(true);
		const handlePause = () => setIsPlaying(false);
		audioEl.addEventListener("play", handlePlay);
		audioEl.addEventListener("pause", handlePause);

		return () => {
			audioEl.removeEventListener("play", handlePlay);
			audioEl.removeEventListener("pause", handlePause);
		};
	}, []);

	const handlePlayPause = (track: SyncFMArtistTrack) => {
		if (!track.contentUrl || !audioRef.current || !artist) return;

		if (currentlyPlaying === track.contentUrl) {
			if (isPlaying) {
				audioRef.current.pause();
			} else {
				audioRef.current.play();
			}
		} else {
			setCurrentlyPlaying(track.contentUrl);
			audioRef.current.src = track.contentUrl;
			audioRef.current.play();

			if ("mediaSession" in navigator) {
				navigator.mediaSession.metadata = new MediaMetadata({
					title: track.title,
					artist: artist.name,
					album: "Top Tracks",
					artwork: [{ src: track.thumbnailUrl || "/placeholder.svg" }],
				});
			}
		}
	};

	useEffect(() => {
		async function getBlurHash(imageUrl: string) {
			try {
				const response = await fetch(
					"/api/getBackgroundBlurHash?url=" + encodeURIComponent(imageUrl),
				);
				const data = await response.json();
				if (data.hash) setBlurHash(data.hash);
			} catch (error) {
				console.error("Error fetching blur hash:", error);
			}
		}
		async function fetchArtist() {
			if (data) {
				setArtist(data);
				if (data.imageUrl) await getBlurHash(data.imageUrl);
				setIsLoading(false);
				return;
			}
			try {
				let response: Response;

				if (syncId) {
					response = await fetch(
						`/api/getBySyncId?syncId=${encodeURIComponent(syncId)}&type=artist`,
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
						errorData.error ||
							errorData.message ||
							"Failed to load artist data",
					);
					setIsLoading(false);
					return;
				}

				const fetchedData = await response.json();
				setArtist(fetchedData);
				if (fetchedData.imageUrl) await getBlurHash(fetchedData.imageUrl);
			} catch (error) {
				console.error("Error fetching artist data:", error);
				setError(
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
				);
			} finally {
				setIsLoading(false);
			}
		}
		fetchArtist();
	}, [url, syncId, data]);

	const streamingUrlCacheRef = useRef<
		Map<ServiceName, Promise<string> | string>
	>(new Map());
	useEffect(() => {
		streamingUrlCacheRef.current.clear();
	}, [artist?.syncId]);

	const getStreamingUrl = useCallback(
		async (service: ServiceName): Promise<string> => {
			if (!artist) {
				throw new Error("Artist not loaded");
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
					const response = await fetch("/api/createUrl", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ service, input: artist, type: "artist" }),
					});
					const result: { url?: string | null } = await response.json();
					const resolvedUrl = result?.url ?? null;
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
		[artist, url, syncId, serviceStatus, getShareFallback],
	);

	if (
		isLoading ||
		!artist ||
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
						Error Loading Artist
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
			{/* hidden audio element for playback */}
			<audio
				ref={audioRef}
				onEnded={() => setIsPlaying(false)}
				onTimeUpdate={() => {
					if (audioRef.current && "mediaSession" in navigator) {
						navigator.mediaSession.setPositionState?.({
							duration: audioRef.current.duration,
							position: audioRef.current.currentTime,
						});
					}
				}}
			/>

			{/* Artist Header */}
			<div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
				{/* Artist Image */}
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="relative"
				>
					<div className="relative h-48 w-48 overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm md:h-56 md:w-56">
						{artist.imageUrl ? (
							<img
								src={artist.imageUrl || "/placeholder.svg"}
								alt={artist.name}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center">
								<SiSpotify className="h-16 w-16 text-white/50" />
							</div>
						)}
					</div>
				</motion.div>
				{/* Artist Info */}
				<div className="flex-1 text-center md:text-left">
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.3 }}
						className="mb-4 text-4xl font-bold text-white md:text-5xl"
						style={{
							textShadow:
								"0 4px 20px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.6)",
						}}
					>
						{artist.name}
					</motion.h1>

					{artist.genre && artist.genre.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.4 }}
							className="mb-6 flex flex-wrap justify-center gap-2 md:justify-start"
						>
							{artist.genre.map((genre, index) => (
								<span
									key={index}
									className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white/90 backdrop-blur-sm"
									style={{ textShadow: "0 2px 8px rgba(0, 0, 0, 0.6)" }}
								>
									{genre}
								</span>
							))}
						</motion.div>
					)}

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
			</div>

			{/* Popular Tracks */}
			{artist.tracks && artist.tracks.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.6 }}
					className="mt-8"
				>
					<h2
						className="mb-6 text-2xl font-bold text-white"
						style={{
							textShadow:
								"0 4px 20px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.6)",
						}}
					>
						Popular Tracks
					</h2>
					<div className="space-y-3">
						{artist.tracks.slice(0, 5).map((track, index) => {
							const isActive = currentlyPlaying === track.contentUrl;
							const hasPreview = !!track.contentUrl;

							return (
								<motion.div
									key={index}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: index * 0.02, duration: 0.3 }}
									onClick={() => handlePlayPause(track)}
									className={`group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 ${
										hasPreview
											? "cursor-pointer"
											: "cursor-not-allowed opacity-50"
									}`}
								>
									{/* Track Thumbnail */}
									<div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white/10">
										{track.thumbnailUrl ? (
											<img
												src={track.thumbnailUrl || "/placeholder.svg"}
												alt={track.title}
												className="h-full w-full object-cover"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center">
												<SiSpotify className="h-6 w-6 text-white/50" />
											</div>
										)}
										{/* Play/Pause icon */}
										<div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
											{isActive && isPlaying ? (
												<Pause className="h-4 w-4 text-white" />
											) : (
												<Play className="h-4 w-4 text-white" />
											)}
										</div>
									</div>

									{/* Track Info */}
									<div className="flex-1">
										<h3
											className="font-medium text-white"
											style={{
												textShadow: "0 2px 8px rgba(0, 0, 0, 0.6)",
											}}
										>
											{track.title}
										</h3>
										{track.uploadDate && (
											<div className="flex items-center gap-1 text-sm text-white/70">
												<Calendar className="h-3 w-3" />
												{new Date(track.uploadDate).getFullYear()}
											</div>
										)}
									</div>

									{/* Duration */}
									{track.duration && (
										<div className="flex items-center gap-1 text-sm text-white/70">
											<Clock className="h-3 w-3" />
											{formatDuration(track.duration)}
										</div>
									)}
								</motion.div>
							);
						})}
					</div>
				</motion.div>
			)}
		</MusicPlayerCard>
	);
}
