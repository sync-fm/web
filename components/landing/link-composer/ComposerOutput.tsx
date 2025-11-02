"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clipboard, ClipboardCheck, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComposerPreviewCard } from "./ComposerPreview";
import type { ComposerPreview, ComposerStatus } from "./types";

type ComposerOutputProps = {
	generatedUrl: string;
	copied: boolean;
	onCopy: () => void;
	preview: ComposerPreview | null;
	status: ComposerStatus;
	layoutSpring: object;
	contentTransition: object;
};

export const ComposerOutput = ({
	generatedUrl,
	copied,
	onCopy,
	preview,
	status,
	layoutSpring,
	contentTransition,
}: ComposerOutputProps) => {
	if (!generatedUrl) return null;

	// Check if we're waiting for the shortcode (loading state and URL doesn't start with /s/)
	const isWaitingForShortcode =
		status === "loading" && !generatedUrl.includes("/s/");

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				layout
				key="composer-output"
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 16 }}
				transition={{
					opacity: {
						duration: (contentTransition as { duration: number }).duration,
						ease: (
							contentTransition as { ease: [number, number, number, number] }
						).ease,
					},
					y: {
						duration: (contentTransition as { duration: number }).duration,
						ease: (
							contentTransition as { ease: [number, number, number, number] }
						).ease,
					},
					layout: layoutSpring,
				}}
				className="space-y-4"
			>
				<motion.div
					layout
					transition={{ layout: layoutSpring }}
					className={cn(
						"rounded-3xl border border-orange-400/35 bg-orange-500/12 p-5 text-sm text-white/80",
						isWaitingForShortcode && "relative overflow-hidden",
					)}
				>
					{/* Pulsing overlay while waiting for shortcode */}
					{isWaitingForShortcode && (
						<motion.div
							className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
							animate={{
								x: ["-100%", "100%"],
							}}
							transition={{
								duration: 1.5,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeInOut",
							}}
						/>
					)}

					<div className="flex flex-col gap-3 relative z-10">
						{/* Desktop: badge with buttons on same row */}
						<div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-3">
							<span className="rounded-full border border-orange-400/45 bg-orange-500/18 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-orange-100/85 flex items-center gap-2">
								{isWaitingForShortcode && (
									<Loader2 className="h-3 w-3 animate-spin" />
								)}
								SyncFM link
							</span>
							<div className="flex flex-wrap items-center gap-2 sm:ml-auto">
								<button
									type="button"
									onClick={onCopy}
									className={cn(
										"inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition",
										copied
											? "border-emerald-400/45 bg-emerald-500/18 text-emerald-50"
											: "border-orange-400/45 bg-orange-500/18 text-orange-50 hover:border-orange-300/70 hover:text-white",
									)}
									aria-live="polite"
								>
									{copied ? (
										<>
											<ClipboardCheck className="h-3.5 w-3.5" />
											Copied
										</>
									) : (
										<>
											<Clipboard className="h-3.5 w-3.5" />
											Copy
										</>
									)}
								</button>
								<a
									href={generatedUrl}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/85 transition hover:border-white/35 hover:text-white"
								>
									Open
									<ExternalLink className="h-3.5 w-3.5" />
								</a>
							</div>
						</div>

						{/* Mobile: just text label */}
						<div className="sm:hidden">
							<p className="text-[11px] uppercase tracking-[0.3em] text-orange-100/85 flex items-center gap-2">
								{isWaitingForShortcode && (
									<Loader2 className="h-3 w-3 animate-spin" />
								)}
								SyncFM link
							</p>
						</div>
					</div>

					<p className="mt-3 break-all font-mono text-xs text-orange-100/90">
						{generatedUrl}
					</p>

					{/* Mobile: larger buttons below the link */}
					<div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
						<button
							type="button"
							onClick={onCopy}
							className={cn(
								"flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition",
								copied
									? "border-emerald-400/45 bg-emerald-500/18 text-emerald-50"
									: "border-orange-400/45 bg-orange-500/18 text-orange-50 active:scale-95",
							)}
							aria-live="polite"
						>
							{copied ? (
								<>
									<ClipboardCheck className="h-4 w-4" />
									Copied
								</>
							) : (
								<>
									<Clipboard className="h-4 w-4" />
									Copy
								</>
							)}
						</button>
						<a
							href={generatedUrl}
							target="_blank"
							rel="noreferrer"
							className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white/85 transition active:scale-95"
						>
							Open
							<ExternalLink className="h-4 w-4" />
						</a>
					</div>
				</motion.div>

				<AnimatePresence mode="sync">
					{preview ? (
						<motion.div
							layout
							key="link-preview"
							initial={{ opacity: 0, y: 14 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 14 }}
							transition={{
								...contentTransition,
								layout: layoutSpring,
							}}
						>
							<ComposerPreviewCard
								preview={preview}
								layoutSpring={layoutSpring}
							/>
						</motion.div>
					) : (
						status === "loading" && (
							<motion.div
								key="preview-loading"
								layout="size"
								initial={{ opacity: 0, y: 14 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 14 }}
								transition={contentTransition}
								className="rounded-[28px] border border-white/12 bg-white/8 p-5 backdrop-blur-2xl"
							>
								<div className="flex items-center gap-3 text-sm text-white/70">
									<Loader2 className="h-4 w-4 animate-spin" />
									Looking up artwork and details…
								</div>
							</motion.div>
						)
					)}
				</AnimatePresence>
			</motion.div>
		</AnimatePresence>
	);
};
