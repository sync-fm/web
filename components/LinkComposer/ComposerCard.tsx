"use client";

import { LayoutGroup, motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComposerActions } from "./ComposerActions";
import { ComposerInput } from "./ComposerInput";
import { ComposerOutput } from "./ComposerOutput";
import { ComposerStatusMessage } from "./ComposerStatusMessage";
import type { ComposerPreview, ComposerStatus, DecodedMeta } from "./types";

type ComposerCardProps = {
	context: "inline" | "modal";
	fieldId: string;
	input: string;
	onInputChange: (value: string) => void;
	decodedMeta: DecodedMeta | null;
	status: ComposerStatus;
	onPaste: () => void;
	isPasting: boolean;
	inputRef: React.RefObject<HTMLInputElement>;
	formRef: React.RefObject<HTMLFormElement>;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	onReset: () => void;
	onExpand?: () => void;
	onClose?: () => void;
	statusLabel: string;
	generatedUrl: string;
	copied: boolean;
	onCopy: () => void;
	preview: ComposerPreview | null;
	layoutSpring: object;
	contentTransition: object;
};

export const ComposerCard = ({
	context,
	fieldId,
	input,
	onInputChange,
	decodedMeta,
	status,
	onPaste,
	isPasting,
	inputRef,
	formRef,
	onSubmit,
	onReset,
	onExpand,
	onClose,
	statusLabel,
	generatedUrl,
	copied,
	onCopy,
	preview,
	layoutSpring,
	contentTransition,
}: ComposerCardProps) => {
	const isModal = context === "modal";

	return (
		<LayoutGroup id={`composer-${context}`}>
			<motion.section
				layout
				className={cn(
					"relative flex flex-col gap-6 rounded-[32px] border shadow-glass-md backdrop-blur-glass",
					isModal
						? "mx-auto w-full max-w-4xl glass-border-light bg-background/80 px-10 pb-9 pt-8 sm:px-12 sm:pb-11 sm:pt-10"
						: "glass-border-medium glass-bg-medium px-6 pb-5 pt-4"
				)}
				transition={{
					layout: layoutSpring,
				}}
			>
				<motion.div
					layout
					transition={{ layout: layoutSpring }}
					className="flex items-start justify-between gap-4"
				>
					<div className="flex flex-col gap-2">
						<h2
							className="text-xl font-semibold text-foreground"
							id={isModal ? `${fieldId}-modal-title` : undefined}
						>
							Create a SyncFM link
						</h2>
						<p className="text-xs text-muted-foreground">
							Instant, platform-smart shortlinks with artwork pulled in for you.
						</p>
					</div>

					{isModal ? (
						<button
							type="button"
							onClick={onClose}
							className="flex h-9 w-9 items-center justify-center rounded-full border glass-border-light glass-bg-light text-muted-foreground transition hover:glass-border-medium hover:text-foreground"
							aria-label="Close composer"
						>
							<X className="h-4 w-4" />
						</button>
					) : (
						<button
							type="button"
							onClick={onExpand}
							className="hidden h-10 w-10 items-center justify-center rounded-full border glass-border-light glass-bg-light text-muted-foreground transition hover:glass-border-medium hover:text-foreground sm:flex"
							aria-label="Expand composer"
						>
							<Maximize2 className="h-4 w-4" />
						</button>
					)}
				</motion.div>

				<motion.form
					ref={formRef}
					layout
					transition={{ layout: layoutSpring }}
					onSubmit={onSubmit}
					className="space-y-4"
				>
					<ComposerInput
						fieldId={fieldId}
						input={input}
						onInputChange={onInputChange}
						decodedMeta={decodedMeta}
						status={status}
						onPaste={onPaste}
						isPasting={isPasting}
						inputRef={inputRef}
						isModal={isModal}
						layoutSpring={layoutSpring}
						contentTransition={contentTransition}
					/>

					<ComposerActions
						generatedUrl={generatedUrl}
						status={status}
						onReset={onReset}
						layoutSpring={layoutSpring}
					/>
				</motion.form>

				<ComposerStatusMessage
					fieldId={fieldId}
					status={status}
					statusLabel={statusLabel}
					layoutSpring={layoutSpring}
					contentTransition={contentTransition}
				/>

				<ComposerOutput
					generatedUrl={generatedUrl}
					copied={copied}
					onCopy={onCopy}
					preview={preview}
					status={status}
					layoutSpring={layoutSpring}
					contentTransition={contentTransition}
				/>
			</motion.section>
		</LayoutGroup>
	);
};
