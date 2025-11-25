"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import type { ComposerStatus } from "./types";

type ComposerActionsProps = {
	generatedUrl: string;
	status: ComposerStatus;
	onReset: () => void;
	layoutSpring: object;
};

export const ComposerActions = ({
	generatedUrl,
	status,
	onReset,
	layoutSpring,
}: ComposerActionsProps) => {
	return (
		<motion.div
			layout
			transition={{ layout: layoutSpring }}
			className="flex flex-wrap items-center gap-3"
		>
			<AnimatePresence mode="wait">
				{generatedUrl || status === "loading" ? (
					<motion.button
						key="reset-button"
						type="button"
						onClick={onReset}
						disabled={status === "loading"}
						layout
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.25, layout: layoutSpring }}
						className="flex w-full flex-1 items-center justify-center gap-2 rounded-2xl border glass-border-light glass-bg-light px-5 py-3 text-sm font-semibold text-muted-foreground transition hover:glass-border-medium hover:text-foreground disabled:opacity-50"
					>
						<motion.span
							layout
							className="flex items-center gap-2"
							transition={{ layout: layoutSpring }}
						>
							{status === "loading" ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									<span>Generating…</span>
								</>
							) : (
								<>
									<RefreshCw className="h-4 w-4" />
									<span>Reset</span>
								</>
							)}
						</motion.span>
					</motion.button>
				) : (
					<motion.button
						key="create-button"
						type="submit"
						layout
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.25, layout: layoutSpring }}
						className="flex w-full flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground shadow-brand-md transition hover:-translate-y-[1px] hover:shadow-brand-lg focus:outline-none"
					>
						<motion.span
							layout
							className="flex items-center gap-2"
							transition={{ layout: layoutSpring }}
						>
							Create SyncFM link
						</motion.span>
					</motion.button>
				)}
			</AnimatePresence>
		</motion.div>
	);
};
