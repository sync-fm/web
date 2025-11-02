"use client";

import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { defaultStatusCopy } from "./constants";
import { decodeLinkMetadata, buildPreview } from "./utils";
import { ComposerCard } from "./ComposerCard";
import type {
	ComposerStatus,
	ComposerPreview,
	DecodedMeta,
	PreviewSource,
	LinkComposerProps,
} from "./types";

const LinkComposer = ({
	expanded: expandedProp,
	onExpandedChange,
	onActiveChange,
}: LinkComposerProps) => {
	const inputId = useId();
	const [internalExpanded, setInternalExpanded] = useState(false);
	const expanded = expandedProp ?? internalExpanded;

	const setExpandedState = useCallback(
		(value: boolean) => {
			// Disable modal on mobile (screens smaller than 640px)
			if (value && typeof window !== "undefined" && window.innerWidth < 640) {
				return;
			}
			onExpandedChange?.(value);
			if (expandedProp === undefined) {
				setInternalExpanded(value);
			}
		},
		[expandedProp, onExpandedChange],
	);

	const inputRef = useRef<HTMLInputElement>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const [input, setInput] = useState("");
	const [generatedUrl, setGeneratedUrl] = useState("");
	const [status, setStatus] = useState<ComposerStatus>("idle");
	const [error, setError] = useState("");
	const [preview, setPreview] = useState<ComposerPreview | null>(null);
	const [copied, setCopied] = useState(false);
	const [decodedMeta, setDecodedMeta] = useState<DecodedMeta | null>(null);
	const [isPasting, setIsPasting] = useState(false);

	const layoutSpring = useMemo(
		() => ({
			type: "spring" as const,
			stiffness: 220,
			damping: 32,
			mass: 0.75,
		}),
		[],
	);

	const contentTransition = useMemo(
		() => ({
			duration: 0.35,
			ease: [0.25, 0.1, 0.25, 1] as const,
		}),
		[],
	);

	const requestRef = useRef<number | null>(null);
	const copyTimeoutRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (copyTimeoutRef.current) {
				window.clearTimeout(copyTimeoutRef.current);
				copyTimeoutRef.current = null;
			}
		};
	}, []);

	const copyToClipboard = useCallback(async (value: string) => {
		try {
			if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(value);
			} else if (typeof document !== "undefined") {
				const textarea = document.createElement("textarea");
				textarea.value = value;
				textarea.setAttribute("readonly", "");
				textarea.style.position = "fixed";
				textarea.style.opacity = "0";
				document.body.appendChild(textarea);
				textarea.select();
				document.execCommand("copy");
				document.body.removeChild(textarea);
			}

			setCopied(true);
			if (copyTimeoutRef.current) {
				window.clearTimeout(copyTimeoutRef.current);
			}
			copyTimeoutRef.current = window.setTimeout(() => {
				setCopied(false);
				copyTimeoutRef.current = null;
			}, 1600);
		} catch (clipError) {
			console.error("Failed to copy", clipError);
		}
	}, []);

	const handleSubmit = useCallback(
		async (event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const trimmed = input.trim();

			if (!trimmed) {
				setError("Paste a streaming link to get started.");
				setStatus("error");
				return;
			}

			if (!/^https?:\/\//i.test(trimmed)) {
				setError("Include the full https:// link so we know where to look.");
				setStatus("error");
				return;
			}

			if (trimmed.includes("syncfm.dev")) {
				setError(
					"That's already a SyncFM link! Drop the original streaming URL instead.",
				);
				setStatus("error");
				return;
			}

			setStatus("loading");
			setError("");
			setPreview(null);
			onActiveChange?.(true);

			const decoded = decodeLinkMetadata(trimmed);
			if (decoded) {
				setDecodedMeta(decoded);
				setInput("");
			} else {
				setDecodedMeta(null);
			}

			const shortUrl = `https://syncfm.dev/${encodeURIComponent(trimmed)}`;
			setGeneratedUrl(shortUrl);
			void copyToClipboard(shortUrl);

			const requestId = Date.now();
			requestRef.current = requestId;

			try {
				const response = await fetch(
					`/api/handle/syncfm?url=${encodeURIComponent(trimmed)}`,
				);
				if (requestRef.current !== requestId) {
					return;
				}

				if (!response.ok) {
					const errorPayload = await response.json().catch(() => ({}));
					throw new Error(
						errorPayload?.message ||
							errorPayload?.error ||
							"Failed to fetch preview",
					);
				}

				const payload = (await response.json()) as PreviewSource;
				const built = buildPreview(payload);
				setPreview(built);

				// Check if there are any conversion warnings
				const hasWarnings =
					built?.conversionWarnings &&
					Object.keys(built.conversionWarnings).length > 0;
				setStatus(hasWarnings ? "warning" : "success");

				// Update the generated URL with the shortcode if available
				if (built?.shortcode) {
					const shortcodeUrl = `https://syncfm.dev/s/${built.shortcode}`;
					setGeneratedUrl(shortcodeUrl);
				}

				if (built) {
					setDecodedMeta((current) =>
						current ? { ...current, typeLabel: built.type } : current,
					);
				}
			} catch (fetchError) {
				console.error("Failed to compose preview", fetchError);
				if (requestRef.current === requestId) {
					setStatus("error");
					setError(
						fetchError instanceof Error
							? fetchError.message
							: "We couldn't look up that link just now. Try again in a moment.",
					);
				}
			}
		},
		[copyToClipboard, input, onActiveChange],
	);

	const clearComposerState = useCallback(
		(options?: { keepExpanded?: boolean }) => {
			setGeneratedUrl("");
			setPreview(null);
			setStatus("idle");
			setError("");
			setCopied(false);
			setDecodedMeta(null);
			requestRef.current = null;
			onActiveChange?.(false);
			if (!options?.keepExpanded) {
				setExpandedState(false);
			}
		},
		[setExpandedState, onActiveChange],
	);

	const handleReset = useCallback(() => {
		setInput("");
		clearComposerState();
		inputRef.current?.focus();
	}, [clearComposerState]);

	const handlePaste = useCallback(async () => {
		if (!inputRef.current || isPasting) {
			return;
		}

		setIsPasting(true);

		// Clear any existing state first
		clearComposerState({ keepExpanded: true });
		setInput("");

		try {
			let clipboardText = "";

			// Try modern Clipboard API first (works on desktop and some mobile browsers)
			if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
				try {
					clipboardText = await navigator.clipboard.readText();
				} catch (clipError) {
					// Clipboard API failed, try execCommand fallback
					console.log("Clipboard API failed, trying execCommand", clipError);
				}
			}

			// If Clipboard API didn't work, use execCommand (works on iOS)
			if (!clipboardText && typeof document !== "undefined") {
				// Store the current value
				const originalValue = inputRef.current.value;

				// Clear the input and focus it
				inputRef.current.value = "";
				inputRef.current.focus();

				// Execute paste command - this will trigger iOS native paste menu
				const pasteSuccessful = document.execCommand("paste");

				if (pasteSuccessful && inputRef.current.value) {
					clipboardText = inputRef.current.value;
				}

				// Restore original value if paste failed
				if (!clipboardText) {
					inputRef.current.value = originalValue;
				}
			}

			clipboardText = clipboardText.trim();

			if (!clipboardText) {
				setError("Copy a music link first, then tap paste.");
				setStatus("error");
				setIsPasting(false);
				return;
			}

			setInput(clipboardText);
			setStatus("idle");
			setError("");
			inputRef.current.focus({ preventScroll: true });

			// Auto-submit the form after a short delay to allow state to update
			setTimeout(() => {
				formRef.current?.requestSubmit();
			}, 50);
		} catch (pasteError) {
			console.error("Failed to paste", pasteError);
			setError(
				"We couldn't access your clipboard. Try pasting manually into the field.",
			);
			setStatus("error");
		} finally {
			setIsPasting(false);
		}
	}, [clearComposerState, isPasting]);

	const handleInputChange = useCallback(
		(value: string) => {
			setInput(value);
			if (error) {
				setError("");
				setStatus("idle");
			}
		},
		[error],
	);

	const statusLabel = useMemo(() => {
		if (status === "error") {
			return error || defaultStatusCopy.error;
		}
		return defaultStatusCopy[status];
	}, [error, status]);

	return (
		<>
			<motion.div
				layout
				id="create-link"
				className="relative"
				initial={{ opacity: 0, scale: 0.94, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				transition={{
					delay: 0.35,
					duration: 0.6,
					ease: [0.21, 0.79, 0.33, 0.99],
					layout: layoutSpring,
				}}
			>
				<ComposerCard
					context="inline"
					fieldId={inputId}
					input={input}
					onInputChange={handleInputChange}
					decodedMeta={decodedMeta}
					status={status}
					onPaste={handlePaste}
					isPasting={isPasting}
					inputRef={inputRef as React.RefObject<HTMLInputElement>}
					formRef={formRef as React.RefObject<HTMLFormElement>}
					onSubmit={handleSubmit}
					onReset={handleReset}
					onExpand={() => setExpandedState(true)}
					statusLabel={statusLabel}
					generatedUrl={generatedUrl}
					copied={copied}
					onCopy={() => copyToClipboard(generatedUrl)}
					preview={preview}
					layoutSpring={layoutSpring}
					contentTransition={contentTransition}
				/>
			</motion.div>

			<AnimatePresence>
				{expanded && (
					<motion.div
						key="composer-modal"
						className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-slate-950/85 p-4 backdrop-blur-xl sm:p-8"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setExpandedState(false)}
					>
						<motion.div
							className="relative flex w-full max-h-[calc(100vh-4rem)] items-start justify-center overflow-hidden px-2 py-6 sm:items-center"
							initial={{ opacity: 0, scale: 0.92, y: 30 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.92, y: 30 }}
							transition={{ type: "spring", stiffness: 120, damping: 16 }}
							onClick={(event) => event.stopPropagation()}
							role="dialog"
							aria-modal="true"
							aria-labelledby={`${inputId}-modal-title`}
						>
							<div className="w-full max-h-full overflow-y-auto">
								<ComposerCard
									context="modal"
									fieldId={inputId}
									input={input}
									onInputChange={handleInputChange}
									decodedMeta={decodedMeta}
									status={status}
									onPaste={handlePaste}
									isPasting={isPasting}
									inputRef={inputRef as React.RefObject<HTMLInputElement>}
									formRef={formRef as React.RefObject<HTMLFormElement>}
									onSubmit={handleSubmit}
									onReset={handleReset}
									onClose={() => setExpandedState(false)}
									statusLabel={statusLabel}
									generatedUrl={generatedUrl}
									copied={copied}
									onCopy={() => copyToClipboard(generatedUrl)}
									preview={preview}
									layoutSpring={layoutSpring}
									contentTransition={contentTransition}
								/>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
};

export default LinkComposer;
