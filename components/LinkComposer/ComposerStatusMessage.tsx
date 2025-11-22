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
			className="rounded-3xl border glass-border-medium glass-bg-strong p-5 text-sm shadow-inner"
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
							? "text-destructive"
							: status === "warning"
								? "text-secondary"
								: "text-muted-foreground"
					)}
				>
					{statusLabel}
				</motion.p>
			</AnimatePresence>
		</motion.div>
	);
};
