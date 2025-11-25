/* eslint-disable @next/next/no-img-element */
"use client";

import { motion } from "framer-motion";
import { MessageSquareQuote, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ServiceName, SyncFMSong } from "syncfm.ts";
import { searchLyrics } from "@/app/player/actions";
import { BlurredBackground } from "@/components/MusicUI/BlurredBackground";
import { LoadingUI } from "@/components/MusicUI/LoadingUI";
import { MusicPlayerCard } from "@/components/MusicUI/MusicPlayerCard";
import { FullPlayer } from "@/components/MusicUI/player";
import { StreamingServiceButtons } from "@/components/MusicUI/StreamingServiceButtons";
import { getLuminance } from "@/lib/colorUtils";
import type { LyricLine } from "@/lib/lyrics";
import { parseLrcToLyricLines } from "@/lib/lyrics";
import { normalizeConversionOutcome, type ProviderStatus } from "@/lib/normalizeConversionOutcome";
import { useDominantColors } from "@/lib/useDominantColors";
import { formatDuration } from "@/lib/utils";

interface SongViewProps {
	url?: string;
	syncId?: string;
	thinBackgroundColor?: string;
	data?: SyncFMSong;
}

export function SongView({ url, syncId, thinBackgroundColor, data }: SongViewProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [song, setSong] = useState<SyncFMSong>();
	const [error, setError] = useState<string | null>(null);
	const { colors: dominantColors, isAnalyzing } = useDominantColors(song?.imageUrl, true);
	const [blurHash, setBlurHash] = useState<string | undefined>();

	// Lyrics state
	const [syncedLyrics, setSyncedLyrics] = useState<LyricLine[]>([]);
	const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
	const [lyricsLoaded, setLyricsLoaded] = useState(false);

	// Player state
	const [showPlayer, setShowPlayer] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const startTimeRef = useRef(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const hasSyncedLyrics = syncedLyrics.length > 0;
	const hasPlainLyrics = Boolean(plainLyrics && plainLyrics.trim().length > 0);
	const hasAnyLyrics = hasSyncedLyrics || hasPlainLyrics;
	const [lyricMode, setLyricMode] = useState<"synced" | "plain">("synced");

	// Calculate dim level for player background
	const luminance = dominantColors?.[0] ? getLuminance(dominantColors[0]) : 0;
	const dimLevel = luminance > 0.4 ? Math.min(0.6, (luminance - 0.4) * 1.2) : 0;

	const normalizedOutcome = useMemo(
		() => (song ? normalizeConversionOutcome(song) : undefined),
		[song]
	);

	const serviceStatus = useMemo(() => {
		if (!normalizedOutcome) return undefined;
		return normalizedOutcome.statuses.reduce(
			(acc, status) => {
				acc[status.service] = status;
				return acc;
			},
			{} as Record<ServiceName, ProviderStatus>
		);
	}, [normalizedOutcome]);

	const hasUnavailableServices = normalizedOutcome
		? normalizedOutcome.missingServices.length > 0
		: false;

	useEffect(() => {
		async function getBlurHash(imageUrl: string) {
			try {
				const response = await fetch(
					`/api/getBackgroundBlurHash?url=${encodeURIComponent(imageUrl)}`
				);
				const data = await response.json();
				if (data.hash) {
					setBlurHash(data.hash);
				}
			} catch {
				// Silently fail - blur hash is optional
			}
		}

		async function fetchLyrics(songData: SyncFMSong) {
			try {
				const lyricsRes = await searchLyrics(songData);
				if (lyricsRes?.syncedLyrics) {
					setSyncedLyrics(parseLrcToLyricLines(lyricsRes.syncedLyrics));
				}
				if (lyricsRes?.plainLyrics) {
					setPlainLyrics(lyricsRes.plainLyrics);
				}
			} finally {
				setLyricsLoaded(true);
			}
		}

		async function fetchSong() {
			if (data) {
				setSong(data);
				if (data.imageUrl) {
					await getBlurHash(data.imageUrl);
				}
				fetchLyrics(data);
				setIsLoading(false);
				return;
			}
			try {
				let response: Response;

				if (syncId) {
					response = await fetch(`/api/getBySyncId?syncId=${encodeURIComponent(syncId)}&type=song`);
				} else if (url) {
					response = await fetch(`/api/handle/syncfm?url=${encodeURIComponent(url)}`);
				} else {
					setError("No URL or syncId provided");
					setIsLoading(false);
					return;
				}

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					setError(errorData.error || errorData.message || "Failed to load song data");
					setIsLoading(false);
					return;
				}

				const data = await response.json();
				setSong(data);
				if (data.imageUrl) {
					await getBlurHash(data.imageUrl);
				}
				fetchLyrics(data);
			} catch (error) {
				setError(error instanceof Error ? error.message : "An unexpected error occurred");
			} finally {
				setIsLoading(false);
			}
		}
		fetchSong();
	}, [url, syncId, data]);

	// Update lyric mode when lyrics load
	useEffect(() => {
		if (lyricsLoaded) {
			setLyricMode(hasSyncedLyrics ? "synced" : "plain");
		}
	}, [lyricsLoaded, hasSyncedLyrics]);

	// Reset player state when song changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: we want to reset when syncId changes
	useEffect(() => {
		setCurrentTime(0);
		setIsPlaying(false);
		setShowPlayer(false);
	}, [song?.syncId]);

	// Player timer
	// biome-ignore lint/correctness/useExhaustiveDependencies: currentTime is updated in the loop
	useEffect(() => {
		const stopTimer = () => {
			if (intervalRef.current !== null) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};

		if (!isPlaying || !showPlayer) {
			stopTimer();
			return undefined;
		}

		startTimeRef.current = performance.now() - currentTime;
		const durationMs = (song?.duration || 0) * 1000;

		const tick = () => {
			const now = performance.now();
			const newTime = now - startTimeRef.current;

			if (durationMs > 0 && newTime >= durationMs) {
				stopTimer();
				setIsPlaying(false);
				setCurrentTime(0);
				return;
			}

			setCurrentTime(newTime);
		};

		intervalRef.current = setInterval(tick, 1000 / 60);

		return stopTimer;
	}, [isPlaying, showPlayer]);

	const handleSeek = (time: number) => {
		setCurrentTime(time);
		if (isPlaying) {
			startTimeRef.current = performance.now() - time;
		}
	};

	const streamingUrlCacheRef = useRef<Map<ServiceName, Promise<string> | string>>(new Map());
	// biome-ignore lint/correctness/useExhaustiveDependencies: we gotta wait until song.synId is defined
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

			const promise = (async (): Promise<string> => {
				try {
					const createURLRes: { url?: string | null } = await fetch("/api/createUrl", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							service,
							input: song,
							type: "song",
						}),
					}).then((res) => res.json());
					const resolvedUrl = createURLRes?.url ?? null;
					if (resolvedUrl) {
						streamingUrlCacheRef.current.set(service, resolvedUrl);
						return resolvedUrl;
					}
				} catch {
					// Fall through to fallback URL
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
		[song, url, syncId]
	);

	if (isLoading || !song || isAnalyzing || !blurHash || typeof blurHash !== "string") {
		return <LoadingUI />;
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center p-8">
					<h1 className="text-2xl font-bold text-foreground mb-4">Error Loading Song</h1>
					<p className="text-muted-strong mb-6">{error}</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="px-6 py-2 glass-bg-light hover:glass-bg-medium text-foreground rounded-lg border glass-border-light transition-colors"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	// Show player view
	if (showPlayer) {
		return (
			<>
				<BlurredBackground
					hash={blurHash}
					dominantColors={dominantColors}
					thinBackgroundColor={thinBackgroundColor || "hsl(var(--background))"}
					dimLevel={dimLevel}
				/>
				<div className="relative z-10">
					<FullPlayer
						title={song.title}
						album={song.album || ""}
						artist={song.artists.join(", ")}
						coverUrl={song.imageUrl || ""}
						lyricLines={syncedLyrics}
						plainLyrics={hasPlainLyrics ? plainLyrics || "" : ""}
						lyricMode={lyricMode}
						hasSyncedLyrics={hasSyncedLyrics}
						hasPlainLyrics={hasPlainLyrics}
						onLyricModeChange={(mode) => {
							if (mode === lyricMode) return;
							if (mode === "synced" && !hasSyncedLyrics) return;
							if (mode === "plain" && !hasPlainLyrics) return;
							setLyricMode(mode);
						}}
						currentTime={currentTime}
						duration={(song.duration || 0) * 1000}
						isPlaying={isPlaying}
						onSeek={handleSeek}
						onPlayPause={() => setIsPlaying(!isPlaying)}
						onBack={() => setShowPlayer(false)}
					/>
				</div>
			</>
		);
	}

	// Show song view
	return (
		<MusicPlayerCard
			hash={blurHash}
			dominantColors={dominantColors}
			thinBackgroundColor={thinBackgroundColor || "hsl(var(--background))"}
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
						<div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-white/20 rounded-2xl" />
						<div className="absolute inset-0 backdrop-blur-[0.5px] bg-white/5 rounded-2xl" />
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4, duration: 0.6 }}
					className="text-center mb-6"
				>
					<h1 className="text-2xl font-bold text-white mb-2 leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
						{song.title}
					</h1>
					<p className="text-lg text-white/90 mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
						{song.artists.join(", ")}
					</p>
					{song.album && (
						<p className="text-sm text-white/80 mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
							{song.album}
						</p>
					)}
					<div className="flex items-center justify-center gap-2">
						<p className="text-sm text-white/70 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
							{formatDuration(song.duration)}
						</p>
						{hasAnyLyrics && (
							<button
								type="button"
								onClick={() => setShowPlayer(true)}
								className="text-white/70 hover:text-white transition-colors drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
								title="View Lyrics"
							>
								<MessageSquareQuote size={16} />
							</button>
						)}
					</div>
				</motion.div>

				{hasUnavailableServices && (
					<p className="mb-4 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200 backdrop-blur">
						Some streaming providers are temporarily unavailable. Try another service or check back
						later.
					</p>
				)}
				<StreamingServiceButtons createUrl={getStreamingUrl} serviceStatus={serviceStatus} />
			</div>
		</MusicPlayerCard>
	);
}
