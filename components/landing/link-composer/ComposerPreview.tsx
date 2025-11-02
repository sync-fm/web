/* eslint-disable @next/next/no-img-element */
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SERVICE_META } from "./constants";
import type { ComposerPreview, ServiceStatus } from "./types";

type ComposerPreviewProps = {
	preview: ComposerPreview;
	layoutSpring: object;
};

export const ComposerPreviewCard = ({
	preview,
	layoutSpring,
}: ComposerPreviewProps) => {
	const serviceStatuses: ServiceStatus[] = SERVICE_META.map((service) => ({
		...service,
		hasId: Boolean(preview.externalIds[service.key]),
	}));

	// Check which services have warnings
	const serviceWarnings = preview.conversionWarnings || {};

	return (
		<motion.div
			layout
			transition={{ layout: layoutSpring }}
			className="rounded-[28px] border border-white/12 bg-white/8 p-5 backdrop-blur-2xl"
		>
			<motion.div
				layout
				transition={{ layout: layoutSpring }}
				className="flex flex-col gap-4 sm:flex-row sm:items-center"
			>
				<motion.div
					layout
					transition={{ layout: layoutSpring }}
					className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-white/12 bg-white/10"
				>
					{preview.imageUrl ? (
						<img
							src={preview.imageUrl}
							alt={preview.title}
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.35em] text-white/45">
							{preview.type}
						</div>
					)}
				</motion.div>
				<motion.div
					layout
					transition={{ layout: layoutSpring }}
					className="flex-1"
				>
					<motion.p
						layout
						transition={{ layout: layoutSpring }}
						className="text-[11px] uppercase tracking-[0.3em] text-white/45"
					>
						{preview.type}
					</motion.p>
					<motion.p
						layout
						transition={{ layout: layoutSpring }}
						className="mt-2 text-lg font-semibold text-white"
					>
						{preview.title}
					</motion.p>
					{preview.subtitle && (
						<motion.p
							layout
							transition={{ layout: layoutSpring }}
							className="text-sm text-white/70"
						>
							{preview.subtitle}
						</motion.p>
					)}
					{preview.supporting && (
						<motion.p
							layout
							transition={{ layout: layoutSpring }}
							className="mt-2 text-xs uppercase tracking-[0.3em] text-white/45"
						>
							{preview.supporting}
						</motion.p>
					)}
					{serviceStatuses.length > 0 && (
						<motion.div
							layout="position"
							transition={{ layout: layoutSpring }}
							className="mt-4 flex flex-wrap gap-2.5"
						>
							{serviceStatuses.map((service) => {
								const Icon = service.icon;
								const hasWarning = serviceWarnings[service.label] !== undefined;

								let statusClass: string;
								let iconClass: string;
								let tooltipText: string;

								if (service.hasId && hasWarning) {
									// Has ID but with warning (syncId mismatch - used fallback)
									statusClass =
										"border-amber-400/35 bg-amber-500/15 text-amber-50";
									iconClass = "bg-amber-400/30 text-amber-50";
									tooltipText = `${service.label} - Closest match used`;
								} else if (service.hasId) {
									// Has ID without warning (exact match)
									statusClass =
										"border-emerald-400/35 bg-emerald-500/15 text-emerald-50";
									iconClass = "bg-emerald-400/30 text-emerald-50";
									tooltipText = `${service.label} ready`;
								} else {
									// No ID (unavailable)
									statusClass =
										"border-rose-500/35 bg-rose-500/12 text-rose-100/85";
									iconClass = "bg-rose-500/30 text-rose-100";
									tooltipText = `${service.label} unavailable`;
								}

								return (
									<motion.span
										layout
										transition={{ layout: layoutSpring }}
										key={service.key}
										className={cn(
											"inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium tracking-wide transition-colors",
											statusClass,
										)}
										title={tooltipText}
									>
										<span
											className={cn(
												"flex h-6 w-6 items-center justify-center rounded-full text-base",
												iconClass,
											)}
										>
											<Icon className="h-3.5 w-3.5" />
										</span>
										{service.label}
									</motion.span>
								);
							})}
						</motion.div>
					)}
				</motion.div>
			</motion.div>
		</motion.div>
	);
};
