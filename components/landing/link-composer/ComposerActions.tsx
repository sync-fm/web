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
						className="flex w-full flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-50"
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
						className="flex w-full flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_14px_40px_rgba(255,120,0,0.28)] transition hover:-translate-y-[1px] hover:shadow-[0_18px_60px_rgba(255,120,0,0.42)] focus:outline-none"
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
