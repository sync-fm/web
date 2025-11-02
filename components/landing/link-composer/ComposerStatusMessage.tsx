"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ComposerStatus } from "./types";

type ComposerStatusMessageProps = {
	fieldId: string;
	status: ComposerStatus;
	statusLabel: string;
	layoutSpring: object;
	contentTransition: object;
};

export const ComposerStatusMessage = ({
	fieldId,
	status,
	statusLabel,
	layoutSpring,
	contentTransition,
}: ComposerStatusMessageProps) => {
	return (
		<motion.div
			layout
			transition={{ layout: layoutSpring }}
			id={`${fieldId}-help`}
			className="rounded-3xl border border-white/12 bg-black/45 p-5 text-sm shadow-inner"
		>
			<AnimatePresence mode="wait" initial={false}>
				<motion.p
					key={statusLabel}
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8 }}
					transition={contentTransition}
					className={cn(
						"leading-relaxed",
						status === "error"
							? "text-rose-200"
							: status === "warning"
								? "text-amber-200"
								: "text-white/70",
					)}
				>
					{statusLabel}
				</motion.p>
			</AnimatePresence>
		</motion.div>
	);
};
