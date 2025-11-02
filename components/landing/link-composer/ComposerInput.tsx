"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ClipboardPaste, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_PLACEHOLDER } from "./constants";
import type { ComposerStatus, DecodedMeta } from "./types";

type ComposerInputProps = {
	fieldId: string;
	input: string;
	onInputChange: (value: string) => void;
	decodedMeta: DecodedMeta | null;
	status: ComposerStatus;
	onPaste: () => void;
	isPasting: boolean;
	inputRef: React.RefObject<HTMLInputElement>;
	isModal: boolean;
	layoutSpring: object;
	contentTransition: object;
};

export const ComposerInput = ({
	fieldId,
	input,
	onInputChange,
	decodedMeta,
	status,
	onPaste,
	isPasting,
	inputRef,
	isModal,
	layoutSpring,
	contentTransition,
}: ComposerInputProps) => {
	const ServiceIcon = decodedMeta?.service?.icon;
	const serviceLabel = decodedMeta?.serviceLabel;
	const truncatedId =
		decodedMeta?.id && decodedMeta.id.length > 20
			? `${decodedMeta.id.slice(0, 20)}…`
			: decodedMeta?.id;
	const typeBadgeLabel =
		decodedMeta?.typeLabel ??
		(decodedMeta
			? status === "loading"
				? "Matching…"
				: undefined
			: undefined);

	return (
		<motion.div
			layout
			transition={{ layout: layoutSpring }}
			className="relative flex items-center"
		>
			<input
				ref={inputRef}
				disabled={Boolean(decodedMeta)}
				id={fieldId}
				type="url"
				value={input}
				onChange={(event) => {
					onInputChange(event.target.value);
				}}
				placeholder={decodedMeta ? "" : DEFAULT_PLACEHOLDER}
				className={cn(
					"w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-3 pr-14 text-base text-white placeholder-white/50 backdrop-blur-xl transition focus:border-orange-300/60 focus:outline-none focus:ring-2 focus:ring-orange-400/30",
					"sm:pr-28",
					decodedMeta && "cursor-default text-white/80",
				)}
				autoComplete="off"
				spellCheck={false}
				aria-describedby={`${fieldId}-help`}
			/>
			<div className="absolute inset-y-0 right-2 z-20 flex items-center gap-2">
				{status === "loading" && (
					<Loader2 className="h-4 w-4 animate-spin text-orange-200/80" />
				)}
				<button
					type="button"
					onClick={onPaste}
					disabled={isPasting || status === "loading"}
					className={cn(
						"inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/35 hover:text-white",
						(isPasting || status === "loading") && "opacity-70",
					)}
					aria-label="Paste from clipboard"
				>
					{isPasting ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<ClipboardPaste className="h-3.5 w-3.5" />
					)}
					<span className="hidden sm:inline">
						{isPasting ? "Pasting…" : "Paste"}
					</span>
				</button>
			</div>
			<AnimatePresence>
				{decodedMeta ? (
					<motion.div
						key="composer-meta"
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 6 }}
						transition={contentTransition}
						className={cn(
							"pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center gap-2 px-5",
							isModal ? "right-32" : "right-[7rem] overflow-hidden",
						)}
					>
						{serviceLabel && ServiceIcon && (
							<span
								className={cn(
									"inline-flex items-center rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-medium text-white/90",
									isModal ? "gap-1.5" : "gap-0.5 px-2.5",
								)}
							>
								<ServiceIcon className="h-3.5 w-3.5 text-white/80" />
								{isModal ? (
									<span className="truncate">{serviceLabel}</span>
								) : null}
							</span>
						)}
						{typeBadgeLabel && (
							<span className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
								<span className="text-white/55">Type</span>
								<span>{typeBadgeLabel}</span>
							</span>
						)}
						{truncatedId && (
							<span className="hidden items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-medium text-white/75 sm:inline-flex">
								<span className="text-white/55">ID</span>
								<span className="flex min-w-[3.5rem] items-center justify-center font-mono text-[11px] leading-none">
									{truncatedId}
								</span>
							</span>
						)}
					</motion.div>
				) : null}
			</AnimatePresence>
		</motion.div>
	);
};
