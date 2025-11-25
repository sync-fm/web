/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: most will be used later */
"use client";

import { motion, type Transition } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { LyricLine } from "@/lib/lyrics";
import { cn } from "@/lib/utils";

export interface LyricPlayerProps {
	/** Array of lyric lines */
	lyricLines?: LyricLine[];
	/** Current playback time in milliseconds */
	currentTime?: number;
	/** Whether the player is playing */
	playing?: boolean;
	/** Whether seeking is in progress */
	isSeeking?: boolean;
	/** Alignment anchor point */
	alignAnchor?: "top" | "bottom" | "center";
	/** Alignment position (0-1) */
	alignPosition?: number;
	/** Enable spring animations */
	enableSpring?: boolean;
	/** Enable blur effect on inactive lines */
	enableBlur?: boolean;
	/** Enable scale effect */
	enableScale?: boolean;
	/** Hide passed lines */
	hidePassedLines?: boolean;
	/** Callback when a line is clicked */
	onLyricLineClick?: (line: LyricLine, index: number) => void;
	/** Additional class names */
	className?: string;
	/** Override line class names */
	lineClassName?: string;
	/** Override active line class names */
	activeLineClassName?: string;
}

/**
 * Apple Music-like Lyrics Player
 *
 * A lyric display component with smooth animations and word-by-word highlighting
 */
export function LyricPlayer({
	lyricLines = [],
	currentTime = 0,
	playing = true,
	isSeeking = false,
	alignAnchor = "center",
	alignPosition = 0.35,
	enableSpring = true,
	enableBlur = true,
	enableScale = true,
	hidePassedLines = false,
	onLyricLineClick,
	className,
	lineClassName,
	activeLineClassName,
}: LyricPlayerProps) {
	const [activeIndex, setActiveIndex] = useState(-1);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [isUserScrolling, setIsUserScrolling] = useState(false);
	const userScrollTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
	const isAutoScrolling = useRef(false);

	// Find active lyric line based on current time
	useEffect(() => {
		if (lyricLines.length === 0) return;

		const index = lyricLines.findIndex((line, i) => {
			const nextLine = lyricLines[i + 1];
			return currentTime >= line.startTime && (!nextLine || currentTime < nextLine.startTime);
		});

		if (index !== -1) {
			setActiveIndex(index);
		} else if (currentTime < lyricLines[0].startTime) {
			setActiveIndex(-1);
		} else if (currentTime >= lyricLines[lyricLines.length - 1].endTime) {
			setActiveIndex(lyricLines.length - 1);
		}
	}, [currentTime, lyricLines]);

	// Auto-scroll to active line
	useEffect(() => {
		if (isUserScrolling || !scrollRef.current || activeIndex === -1) return;

		const container = scrollRef.current;
		const activeElement = container.children[activeIndex] as HTMLElement;

		if (activeElement) {
			isAutoScrolling.current = true;

			const containerRect = container.getBoundingClientRect();
			const elementRect = activeElement.getBoundingClientRect();

			let targetPosition: number;
			if (alignAnchor === "top") {
				targetPosition = alignPosition * containerRect.height;
			} else if (alignAnchor === "bottom") {
				targetPosition = (1 - alignPosition) * containerRect.height - elementRect.height;
			} else {
				// center
				targetPosition = alignPosition * containerRect.height - elementRect.height / 2;
			}

			const currentOffset = elementRect.top - containerRect.top;
			const scrollDelta = currentOffset - targetPosition;

			container.scrollBy({
				top: scrollDelta,
				behavior: enableSpring ? "smooth" : "auto",
			});

			setTimeout(() => {
				isAutoScrolling.current = false;
			}, 1000);
		}
	}, [activeIndex, alignAnchor, alignPosition, enableSpring, isUserScrolling]);

	// Handle user scroll
	const handleScroll = () => {
		if (isAutoScrolling.current) return;

		setIsUserScrolling(true);
		if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);

		userScrollTimeout.current = setTimeout(() => {
			setIsUserScrolling(false);
		}, 2000);
	};

	// Get word progress for active line
	const getWordProgress = (line: LyricLine, wordIndex: number): number => {
		if (!line.words || line.words.length === 0) return 0;

		const word = line.words[wordIndex];
		if (!word) return 0;

		if (currentTime < word.startTime) return 0;
		if (currentTime >= word.endTime) return 1;

		const progress = (currentTime - word.startTime) / (word.endTime - word.startTime);
		return Math.max(0, Math.min(1, progress));
	};

	const transition: Transition = enableSpring
		? {
				type: "spring",
				damping: 25,
				stiffness: 100,
				mass: 1,
			}
		: {
				duration: 0.4,
				ease: "easeOut",
			};

	if (lyricLines.length === 0) {
		return (
			<div className={cn("flex h-full items-center justify-center", className)}>
				<p className="text-lg text-muted-foreground">No lyrics available</p>
			</div>
		);
	}

	return (
		<div
			ref={scrollRef}
			onScroll={handleScroll}
			className={cn(
				"relative h-full overflow-y-auto overflow-x-hidden",
				"scrollbar-hide space-y-8 py-[16vh] sm:py-[18vh] md:py-[20vh] lg:py-[18vh]",
				className
			)}
			style={{
				maskImage:
					"linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)",
				WebkitMaskImage:
					"linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)",
			}}
		>
			{lyricLines.map((line, index) => {
				const isActive = index === activeIndex;
				const isPast = index < activeIndex;
				const _isFuture = index > activeIndex;

				if (hidePassedLines && isPast && !isActive) return null;

				return (
					<motion.div
						key={`${line.startTime}-${index}`}
						layout={enableSpring}
						initial={false}
						animate={{
							scale: enableScale ? (isActive ? 1 : 0.95) : 1,
							opacity: isActive ? 1 : isPast ? 0.4 : 0.3,
							filter: enableBlur ? (isActive ? "blur(0px)" : "blur(1.5px)") : "none",
							y: 0,
						}}
						transition={transition}
						onClick={() => onLyricLineClick?.(line, index)}
						className={cn(
							"cursor-pointer transition-colors duration-300",
							"px-8 leading-tight",
							isActive
								? cn(
										"font-bold text-4xl text-foreground md:text-5xl lg:text-6xl",
										activeLineClassName
									)
								: cn(
										"font-semibold text-3xl text-foreground/80 md:text-4xl lg:text-5xl",
										lineClassName
									),
							line.isDuet && "text-right"
						)}
					>
						{line.words && line.words.length > 0 ? (
							<span className="inline-block">
								{line.words.map((word, wordIndex) => {
									const progress = isActive
										? line.isWordSynced === false
											? 1
											: getWordProgress(line, wordIndex)
										: isPast
											? 1
											: 0;

									return (
										<span
											key={`${word.startTime}-${wordIndex}`}
											className="relative mr-[0.3em] inline-block"
										>
											{/* Background text */}
											<span className="opacity-50">{word.word}</span>
											{/* Highlighted text */}
											<span
												className="absolute inset-0 overflow-hidden"
												style={{
													width: `${progress * 100}%`,
												}}
											>
												<span className="opacity-100">{word.word}</span>
											</span>
										</span>
									);
								})}
							</span>
						) : (
							<span>{line.words?.[0]?.word || "..."}</span>
						)}

						{/* Translated lyric */}
						{line.translatedLyric && isActive && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 0.6, y: 0 }}
								className="mt-2 font-normal text-base md:text-lg"
							>
								{line.translatedLyric}
							</motion.div>
						)}

						{/* Background vocal indicator */}
						{line.isBG && <span className="ml-2 text-sm opacity-50">(BG)</span>}
					</motion.div>
				);
			})}
		</div>
	);
}
