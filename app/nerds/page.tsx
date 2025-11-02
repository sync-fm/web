"use client";

import { motion } from "framer-motion";
import { NerdsHero } from "@/components/nerds/NerdsHero";
import { UmbrellaProjects } from "@/components/nerds/UmbrellaProjects";
import { ResearchProjects } from "@/components/nerds/ResearchProjects";
import { RoadmapSection } from "@/components/nerds/RoadmapSection";
import { OpenSourceCTA } from "@/components/nerds/OpenSourceCTA";

export default function DevelopersPage() {
	return (
		<div className="min-h-screen bg-slate-950 text-white">
			<div className="relative overflow-hidden">
				<motion.div
					aria-hidden
					className="pointer-events-none absolute inset-0"
					initial={{ opacity: 0.4 }}
					animate={{ opacity: 0.75 }}
					transition={{ duration: 1.4 }}
				>
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,125,0,0.3),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(255,170,40,0.28),transparent_60%),radial-gradient(circle_at_45%_85%,rgba(255,110,10,0.2),transparent_55%)]" />
					<motion.div
						className="absolute -bottom-40 left-1/3 h-[360px] w-[360px] rounded-full bg-orange-500/20 blur-[120px]"
						animate={{ y: [0, 24, 0] }}
						transition={{
							duration: 14,
							repeat: Number.POSITIVE_INFINITY,
							ease: "easeInOut",
						}}
					/>
				</motion.div>

				<div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-14 px-6 pb-24 pt-16 sm:px-10 lg:pt-20">
					<NerdsHero />

					<UmbrellaProjects />

					<section className="grid gap-8 lg:grid-cols-[0.6fr_0.4fr]">
						<ResearchProjects />
						<RoadmapSection />
					</section>

					<OpenSourceCTA />
				</div>
			</div>
		</div>
	);
}
