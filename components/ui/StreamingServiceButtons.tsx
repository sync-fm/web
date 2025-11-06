"use client";

import { motion } from "framer-motion";
import { SiApplemusic, SiSpotify, SiYoutubemusic } from "react-icons/si";
import { AlertTriangle } from "lucide-react";
import type { ServiceName } from "syncfm.ts";
import type { ProviderStatus } from "@/lib/normalizeConversionOutcome";
import { useEffect, useState } from "react";

interface StreamingService {
	name: string;
	service: ServiceName;
	color: string;
	Logo: React.ComponentType<{
		className?: string;
		style?: React.CSSProperties;
	}>;
}

const streamingServices: StreamingService[] = [
	{
		name: "Spotify",
		service: "spotify",
		color: "rgb(30, 215, 96)",
		Logo: SiSpotify,
	},
	{
		name: "YouTube Music",
		service: "ytmusic",
		color: "rgb(255, 0, 0)",
		Logo: SiYoutubemusic,
	},
	{
		name: "Apple Music",
		service: "applemusic",
		color: "rgb(250, 250, 250)",
		Logo: SiApplemusic,
	},
];

interface StreamingServiceButtonsProps {
	createUrl: (service: ServiceName) => Promise<string>;
	serviceStatus?: Record<ServiceName, ProviderStatus>;
}

export function StreamingServiceButtons({
	createUrl,
	serviceStatus,
}: StreamingServiceButtonsProps) {
	const [urls, setUrls] = useState<Record<ServiceName, string | null>>({
		spotify: null,
		ytmusic: null,
		applemusic: null,
	});

	const [errors, setErrors] = useState<Record<ServiceName, boolean>>({
		spotify: false,
		ytmusic: false,
		applemusic: false,
	});

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		setLoading(true);

		// Kick off all fetches in parallel and dedupe is handled by createUrl's cache
		Promise.all(
			streamingServices.map((s) =>
				createUrl(s.service)
					.then((u) => ({ service: s.service, url: u, error: false }))
					.catch((err) => {
						console.error(`Failed to get URL for ${s.service}:`, err);
						return { service: s.service, url: "", error: true };
					}),
			),
		).then((results) => {
			if (!mounted) return;
			const nextUrls: Record<ServiceName, string | null> = {
				spotify: null,
				ytmusic: null,
				applemusic: null,
			};
			const nextErrors: Record<ServiceName, boolean> = {
				spotify: false,
				ytmusic: false,
				applemusic: false,
			};
			for (const { service, url, error } of results) {
				nextUrls[service] = url || null;
				nextErrors[service] = error;
			}
			setUrls(nextUrls);
			setErrors(nextErrors);
			setLoading(false);
		});

		return () => {
			mounted = false;
		};
	}, [createUrl]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.5 }}
			className="flex flex-wrap items-stretch justify-center gap-3 md:justify-start"
		>
			{streamingServices.map(({ name, service, color, Logo }) => {
				const url = urls[service];
				const status = serviceStatus?.[service];
				const hasStatusWarning = Boolean(
					status && (!status.available || status.warning),
				);
				const hasError = errors[service] || hasStatusWarning;
				const warningMessage =
					status?.reason ||
					status?.warning ||
					(errors[service] ? "May not work correctly" : "");
				const isDisabled = !url || loading;

				return (
					<motion.a
						key={service}
						href={isDisabled ? undefined : url || undefined}
						target={isDisabled ? undefined : "_blank"}
						rel={isDisabled ? undefined : "noopener noreferrer"}
						whileHover={{
							scale: isDisabled ? 1 : 1.05,
							y: isDisabled ? 0 : -2,
						}}
						whileTap={{ scale: isDisabled ? 1 : 0.95 }}
						className={`group relative flex flex-1 basis-40 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 ${
							isDisabled ? "opacity-60 cursor-default pointer-events-none" : ""
						}`}
						style={{
							background: `
                linear-gradient(135deg,
                  rgba(255, 255, 255, 0.15) 0%,
                  rgba(255, 255, 255, 0.05) 100%
                ),
                rgba(0, 0, 0, 0.2)
              `,
							boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
						}}
					>
						<div className="flex items-center gap-2">
							<Logo className="h-4 w-4 text" style={{ color: color }} />
							<span
								className="text-sm font-medium text-white/90"
								style={{
									textShadow: "0 2px 8px rgba(0, 0, 0, 0.6)",
								}}
							>
								{name}
							</span>
						</div>
						{hasError && (
							<div className="absolute top-1 right-1">
								<div className="relative group/tooltip">
									<AlertTriangle className="h-4 w-4 text-yellow-400" />
									<div className="absolute hidden group-hover/tooltip:block top-full right-0 mt-1 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap z-10">
										{warningMessage || "May not work correctly"}
									</div>
								</div>
							</div>
						)}
						<div
							className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-20"
							style={{ backgroundColor: color }}
						/>
					</motion.a>
				);
			})}
		</motion.div>
	);
}
