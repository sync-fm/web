"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
	return (
		<motion.div
			aria-hidden
			className="pointer-events-none absolute inset-0"
			initial={{ opacity: 0 }}
			animate={{ opacity: 0.65 }}
			transition={{ duration: 1.2 }}
		>
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--primary)_0%,transparent_55%),radial-gradient(circle_at_80%_30%,var(--secondary)_0%,transparent_60%),radial-gradient(circle_at_50%_90%,var(--primary)_0%,transparent_55%)] opacity-35" />
			<motion.div
				className="absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-primary/30 blur-[120px]"
				animate={{ y: [0, 30, 0], opacity: [0.35, 0.55, 0.35] }}
				transition={{
					duration: 12,
					ease: "easeInOut",
					repeat: Number.POSITIVE_INFINITY,
				}}
			/>
			<motion.div
				className="absolute -right-40 top-2/3 h-96 w-96 rounded-full bg-secondary/25 blur-[140px]"
				animate={{ y: [0, -45, 0], opacity: [0.2, 0.4, 0.2] }}
				transition={{
					duration: 16,
					ease: "easeInOut",
					repeat: Number.POSITIVE_INFINITY,
				}}
			/>
		</motion.div>
	);
}
