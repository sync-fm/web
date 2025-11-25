"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SyncFMSong } from "syncfm.ts";
import { BlurredBackground } from "@/components/MusicUI/BlurredBackground";
import { FullPlayer } from "@/components/MusicUI/player";
import { getLuminance } from "@/lib/colorUtils";
import type { LyricLine } from "@/lib/lyrics";
import { useDominantColors } from "@/lib/useDominantColors";

interface PlayerClientProps {
	song: SyncFMSong;
	thinBackgroundColor: string;
	syncedLyrics: LyricLine[];
	plainLyrics?: string | null;
}

export function PlayerClient({
	song,
	thinBackgroundColor,
	syncedLyrics,
	plainLyrics,
}: PlayerClientProps) {
	const { colors: dominantColors, isAnalyzing } = useDominantColors(song.imageUrl, true);
	const router = useRouter();

	// Calculate dim level based on luminance of the dominant color
	const luminance = dominantColors?.[0] ? getLuminance(dominantColors[0]) : 0;
	// If luminance is high (> 0.4), dim the background up to 60% opacity
	const dimLevel = luminance > 0.4 ? Math.min(0.6, (luminance - 0.4) * 1.2) : 0;

	const [blurHash, setBlurHash] = useState<string | undefined>();
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const hasSyncedLyrics = syncedLyrics.length > 0;
	const hasPlainLyrics = useMemo(
		() => Boolean(plainLyrics && plainLyrics.trim().length > 0),
		[plainLyrics]
	);
	const [lyricMode, setLyricMode] = useState<"synced" | "plain">(
		hasSyncedLyrics ? "synced" : "plain"
	);
	const startTimeRef = useRef(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const songRef = useRef(song);

	useEffect(() => {
		songRef.current = song;
	}, [song]);

	// Reset state when song changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: we want to reset when syncId changes
	useEffect(() => {
		setCurrentTime(0);
		setIsPlaying(false);
	}, [song.syncId]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: mode should reset when syncId changes
	useEffect(() => {
		setLyricMode(hasSyncedLyrics ? "synced" : "plain");
	}, [song.syncId, hasSyncedLyrics]);

	useEffect(() => {
		if (lyricMode === "synced" && !hasSyncedLyrics && hasPlainLyrics) {
			setLyricMode("plain");
		}
		if (lyricMode === "plain" && !hasPlainLyrics && hasSyncedLyrics) {
			setLyricMode("synced");
		}
	}, [hasPlainLyrics, hasSyncedLyrics, lyricMode]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: currentTime is updated in the loop, we don't want to restart the loop
	useEffect(() => {
		const stopTimer = () => {
			if (intervalRef.current !== null) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};

		if (!isPlaying) {
			stopTimer();
			return undefined;
		}

		startTimeRef.current = performance.now() - currentTime;
		const durationMs = (songRef.current.duration || 0) * 1000;

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
	}, [isPlaying]);

	const handleSeek = (time: number) => {
		setCurrentTime(time);
		if (isPlaying) {
			startTimeRef.current = performance.now() - time;
		}
	};

	useEffect(() => {
		async function getBlurHash(imageUrl: string) {
			try {
				const response = await fetch(
					`/api/getBackgroundBlurHash?url=${encodeURIComponent(imageUrl)}`
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

		if (song.imageUrl) {
			getBlurHash(song.imageUrl);
		}
	}, [song.imageUrl]);

	if (isAnalyzing) {
		return (
			<>
				<BlurredBackground
					hash={blurHash}
					dominantColors={dominantColors}
					thinBackgroundColor={thinBackgroundColor}
					dimLevel={dimLevel}
				/>
				<div className="flex h-screen w-screen items-center justify-center text-white">
					Loading...
				</div>
			</>
		);
	}

	return (
		<>
			<BlurredBackground
				hash={blurHash}
				dominantColors={dominantColors}
				thinBackgroundColor={thinBackgroundColor}
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
					onBack={() => router.back()}
				/>
			</div>
		</>
	);
}
