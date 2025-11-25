"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	ChevronLeft,
	ListMusic,
	MessageSquareQuote,
	Pause,
	Play,
	SkipBack,
	SkipForward,
} from "lucide-react";
import { useState } from "react";
import type { LyricLine } from "@/lib/lyrics";
import { cn } from "@/lib/utils";
import { LyricPlayer } from "./lyric-player";

export interface FullPlayerProps {
	/** Song title */
	title: string;
	/** Album name */
	album: string;
	/** Artist name */
	artist: string;
	/** Cover image URL */
	coverUrl: string;
	/** Array of lyric lines */
	lyricLines: LyricLine[];
	/** Plain lyric text */
	plainLyrics?: string;
	/** Selected lyric presentation */
	lyricMode?: "synced" | "plain";
	/** Whether synced lyrics are available */
	hasSyncedLyrics?: boolean;
	/** Whether plain lyrics are available */
	hasPlainLyrics?: boolean;
	/** Hide lyrics */
	hideLyric?: boolean;
	/** Current playback time in milliseconds */
	currentTime?: number;
	/** Whether the player is playing */
	isPlaying?: boolean;
	/** Track duration in milliseconds */
	duration?: number;
	/** Callback when seeking */
	onSeek?: (time: number) => void;
	/** Callback when play/pause is toggled */
	onPlayPause?: () => void;
	/** Additional class names */
	className?: string;
	/** Callback when switching lyric mode */
	onLyricModeChange?: (mode: "synced" | "plain") => void;
	/** Back button handler */
	onBack?: () => void;
}

// Helper to format time
function formatTime(ms: number) {
	if (!ms && ms !== 0) return "-:--";
	const seconds = Math.floor(ms / 1000);
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Apple Music-like Full Player
 *
 * A complete music player with animated background, lyrics, and controls
 */
export function FullPlayer({
	title,
	album,
	artist,
	coverUrl,
	lyricLines,
	plainLyrics = "",
	lyricMode = "synced",
	hasSyncedLyrics = false,
	hasPlainLyrics = false,
	hideLyric = false,
	currentTime = 0,
	duration = 0,
	isPlaying = false,
	onSeek,
	onPlayPause,
	className,
	onLyricModeChange,
	onBack,
}: FullPlayerProps) {
	const [showLyrics, setShowLyrics] = useState(!hideLyric);
	const [backGestureStartY, setBackGestureStartY] = useState<number | null>(null);
	const canToggleLyrics = hasSyncedLyrics && hasPlainLyrics;
	const hasReadablePlainLyrics = hasPlainLyrics && plainLyrics.trim().length > 0;
	const mobileCoverSize = "min(420px, calc(100vw - 3rem))";

	const changeLyricMode = (mode: "synced" | "plain") => {
		if (mode === lyricMode) return;
		if (mode === "synced" && !hasSyncedLyrics) return;
		if (mode === "plain" && !hasPlainLyrics) return;
		onLyricModeChange?.(mode);
	};

	// Progress bar interaction
	const handleProgressBarClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (!duration || !onSeek) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const percentage = Math.max(0, Math.min(1, x / rect.width));
		onSeek(percentage * duration);
	};

	const handleBackGestureStart = (event: React.TouchEvent<HTMLDivElement>) => {
		if (!onBack || event.touches.length !== 1) return;
		const touch = event.touches[0];
		if (touch.clientY > 120) return;
		setBackGestureStartY(touch.clientY);
	};

	const handleBackGestureEnd = (event: React.TouchEvent<HTMLDivElement>) => {
		if (!onBack || backGestureStartY === null) return;
		const touch = event.changedTouches[0];
		const delta = touch.clientY - backGestureStartY;
		setBackGestureStartY(null);
		if (delta > 80) {
			onBack();
		}
	};

	return (
		<div
			className={cn(
				"fixed inset-0 z-50 select-none overflow-hidden font-sans text-white",
				className
			)}
		>
			<div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex w-full items-center justify-end px-4 py-4 md:px-6 lg:justify-between">
				<button
					type="button"
					onClick={() => onBack?.()}
					className={cn(
						"pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur-md transition hover:bg-white/20 order-2 lg:order-1",
						!showLyrics && "hidden lg:inline-flex"
					)}
				>
					<ChevronLeft size={20} />
					Back
				</button>
				{canToggleLyrics && (
					<div className="pointer-events-auto hidden lg:flex order-2">
						<LyricModeTabs
							mode={lyricMode}
							onChange={changeLyricMode}
							disabledSynced={!hasSyncedLyrics}
							disabledPlain={!hasPlainLyrics}
						/>
					</div>
				)}
			</div>
			{/* Main Layout */}
			<div className="relative z-10 mx-auto flex h-dvh max-w-[1920px] flex-col lg:flex-row">
				{/* Mobile Layout (lg:hidden) */}
				<div
					className="relative flex h-full w-full flex-col lg:hidden"
					onTouchStart={handleBackGestureStart}
					onTouchEnd={handleBackGestureEnd}
				>
					{/* Content Area (Lyrics or Art) */}
					<div className="relative flex-1 overflow-hidden min-h-0">
						<AnimatePresence mode="wait">
							{showLyrics ? (
								<motion.div
									key="lyrics"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="absolute inset-0 flex flex-col"
								>
									{/* Header for Lyrics View */}
									<div className="z-20 flex shrink-0 items-center gap-4 bg-linear-to-b from-black/40 to-transparent p-6">
										<img
											src={coverUrl}
											alt={album}
											className="h-12 w-12 rounded-md object-cover shadow-lg"
										/>
										<div className="flex min-w-0 flex-1 flex-col justify-center">
											<h1 className="truncate font-bold text-lg leading-tight drop-shadow-md">
												{title}
											</h1>
											<p className="truncate font-medium text-sm text-white/70 drop-shadow-sm">
												{artist}
											</p>
										</div>
									</div>

									{/* Lyrics Area */}
									<div className="relative z-10 flex-1 min-h-0">
										{lyricMode === "plain" ? (
											hasReadablePlainLyrics ? (
												<PlainLyricsView lyrics={plainLyrics} className="h-full px-6" />
											) : (
												<LyricsFallback message="Plain lyrics unavailable" />
											)
										) : hasSyncedLyrics ? (
											<LyricPlayer
												lyricLines={lyricLines}
												currentTime={currentTime}
												playing={isPlaying}
												onLyricLineClick={(line) => onSeek?.(line.startTime)}
												className="relative z-10 flex-1"
											/>
										) : (
											<LyricsFallback message="No lyrics available" />
										)}
									</div>
								</motion.div>
							) : (
								<motion.div
									key="art"
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9 }}
									className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6 pb-2"
								>
									<div
										className="w-full max-w-md self-center overflow-hidden rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
										style={{
											width: mobileCoverSize,
											height: mobileCoverSize,
											aspectRatio: "1 / 1",
										}}
									>
										<img src={coverUrl} alt={album} className="h-full w-full object-cover" />
									</div>
									<div className="flex w-full items-center justify-between px-1">
										<div className="min-w-0 flex-1 space-y-1 text-left">
											<h1 className="truncate font-bold text-2xl leading-tight">{title}</h1>
											<p className="truncate font-medium text-lg text-white/70">{artist}</p>
											{album && (
												<p className="truncate text-sm font-semibold uppercase tracking-wide text-white/40">
													{album}
												</p>
											)}
										</div>
										<div className="flex shrink-0 items-center gap-4">
											<button
												type="button"
												onClick={() => onBack?.()}
												className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80"
											>
												<ChevronLeft size={20} />
											</button>
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Footer Controls */}
					<div className="z-20 flex shrink-0 flex-col gap-4 bg-linear-to-t from-black/90 via-black/60 to-transparent px-6 pt-2 pb-8">
						{/* Progress */}
						<div className="w-full">
							<button
								type="button"
								className="group block w-full cursor-pointer py-2 outline-none"
								onClick={handleProgressBarClick}
							>
								<div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/20">
									<motion.div
										className="relative z-10 h-full rounded-full bg-white"
										style={{
											width: `${duration ? (currentTime / duration) * 100 : 0}%`,
										}}
										layoutId="progress-mobile"
									/>
								</div>
							</button>
							<div className="mt-1 flex justify-between font-semibold text-white/60 text-xs tabular-nums">
								<span>{formatTime(currentTime)}</span>
								<span>{formatTime(duration)}</span>
							</div>
						</div>

						{/* Main Controls */}
						<div className="flex items-center justify-center gap-10">
							<button
								type="button"
								className="text-white/60 transition-all hover:text-white active:scale-90"
							>
								<SkipBack size={32} fill="currentColor" />
							</button>
							<button
								type="button"
								className="text-white drop-shadow-lg transition-all hover:scale-105 active:scale-95"
								onClick={onPlayPause}
							>
								{isPlaying ? (
									<Pause size={56} fill="currentColor" />
								) : (
									<Play size={56} fill="currentColor" className="ml-1" />
								)}
							</button>
							<button
								type="button"
								className="text-white/60 transition-all hover:text-white active:scale-90"
							>
								<SkipForward size={32} fill="currentColor" />
							</button>
						</div>

						{/* Volume slider intentionally hidden for mobile parity */}

						{/* Bottom Actions */}
						<div className="flex items-center justify-between px-4 pt-2">
							<button
								type="button"
								className={cn(
									"rounded-full p-2 transition-colors",
									showLyrics ? "bg-white/20 text-white" : "text-white/40 hover:text-white"
								)}
								onClick={() => setShowLyrics(!showLyrics)}
							>
								<MessageSquareQuote size={24} />
							</button>

							{canToggleLyrics ? (
								<LyricModeTabsMobile mode={lyricMode} onChange={changeLyricMode} />
							) : (
								<button type="button" className="text-white/40 transition-colors hover:text-white">
									<ListMusic size={24} />
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Desktop Layout (hidden lg:flex) */}
				<div className="hidden h-full w-full flex-row gap-20 p-16 lg:flex">
					{/* Left Side: Artwork & Controls (Desktop) */}
					<div className="flex w-full max-w-xl flex-1 flex-col items-start justify-center">
						<motion.div
							className="relative mb-12 aspect-square w-full max-w-[480px] overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
							initial={{ scale: 0.9, opacity: 0, y: 20 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							transition={{ duration: 0.6, ease: "easeOut" }}
						>
							<img src={coverUrl} alt={album} className="h-full w-full object-cover" />
						</motion.div>

						<div className="mb-10 w-full space-y-2 text-left">
							<motion.h1
								className="truncate font-bold text-4xl leading-tight"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}
							>
								{title}
							</motion.h1>
							<motion.h2
								className="truncate font-medium text-2xl text-white/70"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
							>
								{artist}
							</motion.h2>
							<motion.p
								className="font-semibold text-sm text-white/40 uppercase tracking-widest"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.4 }}
							>
								{album}
							</motion.p>
						</div>

						{/* Progress & Controls */}
						<div className="w-full space-y-6">
							{/* Progress Bar */}
							<button
								type="button"
								className="group w-full cursor-pointer py-2 outline-none"
								onClick={handleProgressBarClick}
							>
								<div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
									<motion.div
										className="relative z-10 h-full rounded-full bg-white/90"
										style={{
											width: `${duration ? (currentTime / duration) * 100 : 0}%`,
										}}
										layoutId="progress"
									/>
								</div>
								<div className="mt-2 flex justify-between font-medium text-white/40 text-xs tabular-nums">
									<span>{formatTime(currentTime)}</span>
									<span>{formatTime(duration)}</span>
								</div>
							</button>

							{/* Controls */}
							<div className="flex items-center justify-start gap-10">
								<button type="button" className="text-white/60 transition-colors hover:text-white">
									<SkipBack size={32} fill="currentColor" className="h-10 w-10" />
								</button>
								<button
									type="button"
									className="rounded-full bg-white p-5 text-black shadow-lg shadow-white/10 transition-all hover:scale-105 active:scale-95"
									onClick={onPlayPause}
								>
									{isPlaying ? (
										<Pause size={32} fill="currentColor" className="h-10 w-10" />
									) : (
										<Play size={32} fill="currentColor" className="ml-1 h-10 w-10" />
									)}
								</button>
								<button type="button" className="text-white/60 transition-colors hover:text-white">
									<SkipForward size={32} fill="currentColor" className="h-10 w-10" />
								</button>
							</div>
						</div>
					</div>

					{/* Right Side: Lyrics */}
					<div className="relative flex-1 pt-12 min-h-0 overflow-hidden">
						{lyricMode === "plain" ? (
							hasReadablePlainLyrics ? (
								<PlainLyricsView lyrics={plainLyrics} className="h-full px-6" />
							) : (
								<LyricsFallback message="Plain lyrics unavailable" className="h-full" />
							)
						) : hasSyncedLyrics ? (
							<LyricPlayer
								lyricLines={lyricLines}
								currentTime={currentTime}
								playing={isPlaying}
								onLyricLineClick={(line) => onSeek?.(line.startTime)}
								className="h-full"
							/>
						) : (
							<LyricsFallback message="No lyrics available" className="h-full" />
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

interface PlainLyricsViewProps {
	lyrics: string;
	className?: string;
}

function PlainLyricsView({ lyrics, className }: PlainLyricsViewProps) {
	if (!lyrics.trim()) {
		return <LyricsFallback message="Plain lyrics unavailable" className={className} />;
	}

	const paragraphs = lyrics
		.trim()
		.split(/\n{2,}/)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean);

	return (
		<div
			className={cn(
				"relative h-full min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide space-y-6 py-[16vh] sm:py-[18vh] md:py-[20vh] lg:py-[18vh]",
				className
			)}
			style={{
				maskImage:
					"linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)",
				WebkitMaskImage:
					"linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)",
			}}
		>
			{paragraphs.map((paragraph, index) => (
				<p
					key={`${index}-${paragraph.slice(0, 16)}`}
					className="whitespace-pre-line text-left font-semibold text-3xl leading-relaxed text-white/90 md:text-4xl"
				>
					{paragraph}
				</p>
			))}
		</div>
	);
}

function LyricsFallback({ message, className }: { message: string; className?: string }) {
	return (
		<div
			className={cn(
				"flex h-full items-center justify-center px-6 text-center text-white/70",
				className
			)}
		>
			<p className="text-base md:text-lg">{message}</p>
		</div>
	);
}

interface LyricModeTabsProps {
	mode: "synced" | "plain";
	onChange: (mode: "synced" | "plain") => void;
	disabledSynced?: boolean;
	disabledPlain?: boolean;
}

function LyricModeTabs({ mode, onChange, disabledPlain, disabledSynced }: LyricModeTabsProps) {
	return (
		<div className="flex items-center rounded-full bg-white/10 p-1 text-sm font-semibold text-white/80 shadow-lg shadow-black/20 backdrop-blur">
			<button
				type="button"
				onClick={() => onChange("synced")}
				disabled={disabledSynced}
				className={cn(
					"rounded-full px-4 py-1.5 transition",
					mode === "synced" ? "bg-white text-black" : "text-white/70",
					disabledSynced && "opacity-40"
				)}
			>
				Synced
			</button>
			<button
				type="button"
				onClick={() => onChange("plain")}
				disabled={disabledPlain}
				className={cn(
					"rounded-full px-4 py-1.5 transition",
					mode === "plain" ? "bg-white text-black" : "text-white/70",
					disabledPlain && "opacity-40"
				)}
			>
				Text
			</button>
		</div>
	);
}

interface LyricModeTabsMobileProps {
	mode: "synced" | "plain";
	onChange: (mode: "synced" | "plain") => void;
}

function LyricModeTabsMobile({ mode, onChange }: LyricModeTabsMobileProps) {
	return (
		<div className="inline-flex items-center rounded-full bg-white/10 px-1 py-0.5 text-xs font-semibold text-white/80 shadow-inner shadow-black/20">
			<button
				type="button"
				className={cn(
					"rounded-full px-3 py-1 transition",
					mode === "synced" ? "bg-white text-black" : "text-white/70"
				)}
				onClick={() => onChange("synced")}
			>
				Synced
			</button>
			<button
				type="button"
				className={cn(
					"rounded-full px-3 py-1 transition",
					mode === "plain" ? "bg-white text-black" : "text-white/70"
				)}
				onClick={() => onChange("plain")}
			>
				Text
			</button>
		</div>
	);
}
