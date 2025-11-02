"use client";

import { useSearchParams } from "next/navigation";
import { AlertTriangle, RefreshCw, Home, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Suspense } from "react";

type ErrorType = "conversion" | "fetch" | "redirect" | "unknown";
type EntityType = "song" | "album" | "artist";

function ErrorPageContent() {
	const searchParams = useSearchParams();
	const errorType = (searchParams.get("errorType") as ErrorType) || "unknown";
	const entityType = (searchParams.get("entityType") as EntityType) || "song";
	const originalUrl = searchParams.get("url") || "";
	const message = searchParams.get("message") || "";
	const service = searchParams.get("service") || "";

	const getErrorTitle = () => {
		switch (errorType) {
			case "conversion":
				return `Failed to Convert ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;
			case "fetch":
				return `Failed to Fetch ${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Information`;
			case "redirect":
				return `Redirect to ${service.charAt(0).toUpperCase() + service.slice(1)} Failed`;
			default:
				return "Something Went Wrong";
		}
	};

	const getErrorMessage = () => {
		if (message) return message;

		switch (errorType) {
			case "conversion":
				return `We couldn't convert this ${entityType} to other streaming services. The ${entityType} might not be available on all platforms, or there might be a temporary issue with the conversion service.`;
			case "fetch":
				return `We couldn't retrieve information about this ${entityType}. The URL might be invalid, or the streaming service might be temporarily unavailable.`;
			case "redirect":
				return `We couldn't redirect you to ${service}. The ${entityType} might not be available on ${service}, or there might be a temporary issue with the service.`;
			default:
				return "An unexpected error occurred while processing your request. Please try again later.";
		}
	};

	const getSuggestions = () => {
		const suggestions = [];

		if (originalUrl) {
			suggestions.push({
				icon: ExternalLink,
				text: "Try opening the original URL",
				action: () => window.open(originalUrl, "_blank"),
			});
		}

		suggestions.push({
			icon: RefreshCw,
			text: "Refresh and try again",
			action: () => window.location.reload(),
		});

		suggestions.push({
			icon: Home,
			text: "Go to homepage",
			action: () => {
				window.location.href = "/";
			},
		});

		return suggestions;
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-950 via-slate-900 to-slate-950">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="max-w-2xl w-full"
			>
				<div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
					{/* Error Icon */}
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
						className="flex justify-center mb-6"
					>
						<div className="relative">
							<div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
							<AlertTriangle
								className="w-20 h-20 text-red-400 relative z-10"
								strokeWidth={1.5}
							/>
						</div>
					</motion.div>

					{/* Error Title */}
					<motion.h1
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.3 }}
						className="text-3xl font-bold text-white text-center mb-4"
						style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
					>
						{getErrorTitle()}
					</motion.h1>

					{/* Error Message */}
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4 }}
						className="text-white/80 text-center mb-8 leading-relaxed"
						style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
					>
						{getErrorMessage()}
					</motion.p>

					{/* Suggestions */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5 }}
						className="space-y-3"
					>
						<p className="text-white/60 text-sm text-center mb-4">
							What you can try:
						</p>
						{getSuggestions().map((suggestion) => (
							<motion.button
								key={suggestion.text}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={suggestion.action}
								className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200"
							>
								<suggestion.icon className="w-5 h-5 text-white/60" />
								<span className="text-white/90 text-sm font-medium">
									{suggestion.text}
								</span>
							</motion.button>
						))}
					</motion.div>

					{/* Technical Details (if available) */}
					{(errorType !== "unknown" || service) && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.6 }}
							className="mt-6 pt-6 border-t border-white/10"
						>
							<details className="text-white/40 text-xs">
								<summary className="cursor-pointer hover:text-white/60 transition-colors">
									Technical Details
								</summary>
								<div className="mt-2 space-y-1 font-mono">
									<div>Error Type: {errorType}</div>
									<div>Entity Type: {entityType}</div>
									{service && <div>Service: {service}</div>}
									{originalUrl && (
										<div className="break-all">Original URL: {originalUrl}</div>
									)}
								</div>
							</details>
						</motion.div>
					)}
				</div>
			</motion.div>
		</div>
	);
}

export default function ErrorPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-950 via-slate-900 to-slate-950">
					<div className="text-white/60">Loading...</div>
				</div>
			}
		>
			<ErrorPageContent />
		</Suspense>
	);
}
