"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { SyncFMIcon } from "@/components/SyncFMIcon";
import { CARD_VARIANTS } from "./constants";

export function AuthCard({ children }: { children: ReactNode }) {
	return (
		<motion.div
			className="w-full max-w-xl rounded-4xl border glass-border-medium glass-bg-light shadow-glass-md backdrop-blur-glass p-6"
			initial="hidden"
			animate="visible"
			variants={CARD_VARIANTS}
		>
			<SyncFMIcon animate={true} clickable={false} size={22} className="center mx-auto mb-10" />
			{children}
		</motion.div>
	);
}
