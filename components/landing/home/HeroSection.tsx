"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import LinkComposer from "@/components/LinkComposer/LinkComposer";
import { cn } from "@/lib/utils";
import {
	HERO_CTA_ITEM_VARIANTS,
	HERO_CTA_WRAPPER_VARIANTS,
	heroQuickHits,
	SHARE_TYPES,
} from "./constants";

interface HeroSectionProps {
	composerActive: boolean;
	composerExpanded: boolean;
	onComposerExpandedChange: (expanded: boolean) => void;
	onComposerActiveChange: (active: boolean) => void;
	onOpenComposer: () => void;
}

export function HeroSection({
	composerActive,
	composerExpanded,
	onComposerExpandedChange,
	onComposerActiveChange,
	onOpenComposer,
}: HeroSectionProps) {
	const [shareIndex, setShareIndex] = useState(0);
	const [ctaVisible, setCtaVisible] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}
		const interval = window.setInterval(() => {
			setShareIndex((index) => (index + 1) % SHARE_TYPES.length);
		}, 2600);
		return () => window.clearInterval(interval);
	}, []);

	useEffect(() => {
		setCtaVisible(true);
	}, []);

	const currentShareType = SHARE_TYPES[shareIndex];

	return (
		<section
			id="hero"
			className={cn(
				"grid grid-cols-1 gap-12 pt-8 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-16",
				composerActive ? "items-start" : "items-center"
			)}
		>
			<motion.div
				layout
				transition={{
					layout: {
						type: "spring",
						stiffness: 220,
						damping: 32,
						mass: 0.75,
					},
				}}
				className="space-y-8"
			>
				<motion.span
					className="hidden items-center gap-2 rounded-full border border-primary/50 bg-primary/15 px-4 py-1 text-sm font-medium uppercase tracking-[0.35em] text-brand md:inline-flex"
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
				>
					<Sparkles className="h-4 w-4" />
					early access :3
				</motion.span>
				<motion.h1
					className="text-4xl font-black leading-tight text-foreground drop-shadow-[0_15px_45px_var(--shadow-brand-sm)] md:text-5xl lg:text-6xl"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15, duration: 0.6, type: "spring" }}
				>
					Drop one link. Everyone hits play.
				</motion.h1>
				<motion.p
					className="max-w-xl text-base text-muted-strong sm:text-lg"
					initial={{ opacity: 0, y: 14 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.25, duration: 0.6 }}
				>
					Paste the streaming link you have and SyncFM turns it into a polished short page with
					buttons for today&apos;s top services - and more on the way.
				</motion.p>

				<motion.div layout className="flex flex-wrap gap-3">
					{heroQuickHits.map((label, index) => (
						<motion.span
							key={label}
							className="inline-flex items-center rounded-full border glass-border-medium glass-bg-light px-3 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-muted-strong"
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.25, delay: index * 0.04 }}
						>
							{label}
						</motion.span>
					))}
				</motion.div>

				<motion.div
					layout
					className="flex flex-wrap items-center gap-4"
					initial="hidden"
					animate={ctaVisible ? "visible" : "hidden"}
					variants={HERO_CTA_WRAPPER_VARIANTS}
					style={{ pointerEvents: ctaVisible ? "auto" : "none" }}
				>
					<motion.button
						type="button"
						onClick={onOpenComposer}
						className="group hidden items-center gap-1.5 rounded-full bg-gradient-brand px-5 py-2.5 text-base font-semibold leading-tight text-primary-foreground shadow-brand-md transition-transform hover:-translate-y-0.5 md:inline-flex"
						variants={HERO_CTA_ITEM_VARIANTS}
					>
						<span className="flex items-center gap-1.5 text-base">
							<span className="leading-none">Share a</span>
							<span className="relative flex h-[1.4rem] min-w-14 items-center overflow-hidden">
								<AnimatePresence mode="wait">
									<motion.span
										key={currentShareType}
										initial={{ y: 12, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										exit={{ y: -12, opacity: 0 }}
										transition={{ duration: 0.3 }}
										className="block w-full text-left capitalize leading-none"
									>
										{currentShareType}
									</motion.span>
								</AnimatePresence>
							</span>
						</span>
						<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
					</motion.button>
				</motion.div>
			</motion.div>

			<LinkComposer
				expanded={composerExpanded}
				onExpandedChange={onComposerExpandedChange}
				onActiveChange={onComposerActiveChange}
			/>
		</section>
	);
}
