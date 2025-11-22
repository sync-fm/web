"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { SiDiscord } from "react-icons/si";

export function DiscordSection() {
	const router = useRouter();
	return (
		<section
			id="discord-bot"
			className="rounded-4xl border glass-border-light glass-bg-light p-8 backdrop-blur-glass"
		>
			<div className="mb-8 space-y-3">
				<p className="inline-flex items-center gap-2 rounded-full border glass-border-medium glass-bg-medium px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-muted-light">
					<Activity className="h-3.5 w-3.5" />
					Discord Integration
				</p>
				<h3 className="text-2xl font-semibold text-foreground">
					SyncFM, now in your Discord servers.
				</h3>
				<p className="text-sm text-muted-strong">
					Our Discord bot brings SyncFM's universal music link conversion directly to your servers
					and DMs. Share music instantly without leaving Discord.
				</p>
			</div>
			<div className="grid gap-6 md:grid-cols-2">
				<motion.div
					className="rounded-3xl border glass-border-medium glass-bg-medium p-6"
					initial={{ opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.45 }}
				>
					<p className="text-xs uppercase tracking-[0.3em] text-brand">Right-click magic</p>
					<p className="mt-3 text-sm text-muted-strong">
						See a music link in chat? Just right-click the message and select "Convert to SyncFM" to
						instantly share it as a beautiful embed with buttons for all streaming services.
					</p>
				</motion.div>
				<motion.div
					className="rounded-3xl border glass-border-medium glass-bg-medium p-6"
					initial={{ opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.45, delay: 0.1 }}
				>
					<p className="text-xs uppercase tracking-[0.3em] text-brand">Slash command ready</p>
					<p className="mt-3 text-sm text-muted-strong">
						Use{" "}
						<code className="rounded glass-bg-medium px-1.5 py-0.5 text-xs font-mono">/share</code>{" "}
						followed by any Spotify, Apple Music, or YouTube Music link to convert and post it
						instantly.
					</p>
				</motion.div>
			</div>
			<div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-2">
					<p className="text-sm font-medium text-foreground">Works everywhere Discord does</p>
					<p className="text-xs text-muted-medium">
						Install once, use in servers, DMs, and group chats. No server permissions needed.
					</p>
				</div>
				<motion.button
					className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-brand-md transition hover:shadow-brand-lg hover:scale-[1.02]"
					onClick={() =>
						router.push("https://discord.com/oauth2/authorize?client_id=1432684540991770684")
					}
				>
					<SiDiscord className="h-5 w-5" />
					Add to Discord
				</motion.button>
			</div>
		</section>
	);
}
