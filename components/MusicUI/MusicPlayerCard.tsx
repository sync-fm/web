"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { BlurredBackground } from "./BlurredBackground";

interface MusicPlayerCardProps {
	hash: string;
	dominantColors: string[];
	children: ReactNode;
	thinBackgroundColor: string;
}

export function MusicPlayerCard({
	hash,
	dominantColors,
	children,
	thinBackgroundColor,
}: MusicPlayerCardProps) {
	return (
		<div className="flex min-h-screen items-center justify-center p-4 relative">
			<BlurredBackground
				hash={hash}
				dominantColors={dominantColors}
				thinBackgroundColor={thinBackgroundColor}
			/>

			<div className="relative w-full max-w-4xl z-10">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, ease: "easeOut" }}
					className="relative overflow-hidden rounded-3xl border border-white/20 bg-black/20 p-8 backdrop-blur-xl"
					style={{
						boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              inset 0 -1px 0 rgba(255, 255, 255, 0.1)
            `,
					}}
				>
					{children}
				</motion.div>
			</div>
		</div>
	);
}
