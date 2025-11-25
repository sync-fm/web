"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatedBackground } from "@/components/landing/home/AnimatedBackground";
import { DiscordSection } from "@/components/landing/home/DiscordSection";
import { FeatureHighlightsSection } from "@/components/landing/home/FeatureHighlightsSection";
import { HeroSection } from "@/components/landing/home/HeroSection";
import { HowItWorksSection } from "@/components/landing/home/HowItWorksSection";
import { RoadmapSection } from "@/components/landing/home/RoadmapSection";
import { WhySyncFMSection } from "@/components/landing/home/WhySyncFMSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";

export default function LandingV2Page() {
	const [composerExpanded, setComposerExpanded] = useState(false);
	const [composerActive, setComposerActive] = useState(false);
	const [howItWorksVisible, setHowItWorksVisible] = useState(false);

	useEffect(() => {
		const timeout = window.setTimeout(() => setHowItWorksVisible(true), 120);
		return () => window.clearTimeout(timeout);
	}, []);

	const focusComposer = useCallback(() => {
		if (typeof window === "undefined") {
			return;
		}
		window.requestAnimationFrame(() => {
			document
				.getElementById("create-link")
				?.scrollIntoView({ behavior: "smooth", block: "center" });
		});
	}, []);

	const openComposer = useCallback(() => {
		// On mobile (< 640px), just scroll to composer. On desktop, open modal
		if (typeof window !== "undefined" && window.innerWidth < 640) {
			focusComposer();
		} else {
			setComposerExpanded(true);
			focusComposer();
		}
	}, [focusComposer]);

	return (
		<div className="relative min-h-screen overflow-hidden bg-background text-foreground">
			<AnimatedBackground />

			<div className="relative z-10 flex min-h-screen flex-col">
				<LandingNav />

				<main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 pt-8 px-6 pb-28 sm:px-10">
					<HeroSection
						composerActive={composerActive}
						composerExpanded={composerExpanded}
						onComposerExpandedChange={setComposerExpanded}
						onComposerActiveChange={setComposerActive}
						onOpenComposer={openComposer}
					/>

					<HowItWorksSection visible={howItWorksVisible} />

					<FeatureHighlightsSection />

					<WhySyncFMSection />

					<DiscordSection />

					<RoadmapSection />
				</main>

				<LandingFooter />
			</div>
		</div>
	);
}
