"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles, Shuffle, Activity, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import LinkComposer from "@/components/landing/link-composer/LinkComposer";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

const SHARE_TYPES = ["album", "song", "artist"] as const;

const heroQuickHits = [
	"Different service? No problem",
	"It just works*",
	"Never gonna give you up",
];

const shareBenefits = [
	{
		title: "Friends see their player",
		description:
			"Spotify, Apple Music, YouTube Music - and more on the way! Everyone gets buttons for the apps they actually use.",
	},
	{
		title: "oooo prettyyy",
		description:
			"We pull info like cover art, music info, and colors & theme everything dynamically to make it look super cute :3",
	},
	{
		title: "It just works",
		description:
			"Plain and simple. sharing music is supposed to be fun, not a hassle. When in doubt, just slap syncfm.dev/ in front & go.",
	},
];

const howItWorksSteps = [
	{
		title: "Drop any music link",
		description:
			"Paste a song, album, or artist from the service you already have open.",
	},
	{
		title: "We recognise it instantly",
		description:
			"SyncFM reads the link, fetches the official details, and builds a polished page automatically.",
	},
	{
		title: "Friends pick their player",
		description:
			"They tap the app they use - thats it. No accounts, no hoops, just play.",
	},
];

const featureHighlights = [
	{
		title: "pretty pixels",
		description:
			"Each share page mirrors the energy of the release itself, pulling in cover art, colors, and dynamic theming.",
		points: [
			"You do NOT want to know how much tech is behind the way we make our backgrounds",
			"Dynamic colors pulled from the artwork keep every drop on-brand",
			"Clean, modern layouts put the focus on the music and not the service",
		],
	},
	{
		title: "links that just work",
		description:
			"Share a syncfm.dev link when you want the chooser, or use service shortcuts for direct plays without locking anyone out.",
		points: [
			"syncfm.dev/... gives friends the option to pick their player",
			"s.syncfm.dev/... sends them straight to Spotify",
			"am. and yt. shortcuts cover Apple Music and YouTube Music, with more services on the way",
		],
	},
	{
		title: "we are stealing ALL your data",
		description:
			"give it to us. your data. all of it. just kidding! but seriously, we do keep track of what people are converting (anonymously) so we dont have to convert the same song twice.",
		points: [
			"Anonymous of course. why would we need your personal info?",
			"Reduces load times by serving from our cache whenever possible",
			"Helps us not get IP blocked by fuckass youtube music",
		],
	},
];

const whySyncfmPoints = [
	{
		title: "Sharing should be effortless",
		description:
			"No more screenshots, no more juggling links - just drop the song you love and keep the conversation moving.",
	},
	{
		title: "Music shouldn&apos;t be locked to one app",
		description:
			"Friends use different services; SyncFM keeps everyone in the same moment without asking them to switch.",
	},
	{
		title: "We&apos;re building with listeners in mind",
		description:
			"Today it&apos;s songs, albums, and artists. Next comes playlists, richer context, and the next wave of streaming services.",
	},
];

const roadmapItems = [
	{
		era: "Now shipping",
		title: "Song, album, and artist pages",
		description:
			"Polished landing experiences powered by syncfm.ts for Spotify, Apple Music, and YouTube Music.",
		accent: "from-orange-500 via-amber-500 to-amber-400",
	},
	{
		era: "Up next",
		title: "More services",
		description:
			"Someone told us people use other services too? wild. Tidal, Deezer, SoundCLoud, and Amazon Music are all on the shortlist.",
		accent: "from-orange-400 via-rose-500 to-pink-500",
	},
	{
		era: "In research",
		title: "Playlists, lyrics, and richer context",
		description:
			"We're looking into adding support for sharing your playlists, showing lyrics, and deeper stats into the same easy sharing experience.",
		accent: "from-amber-400 via-orange-500 to-yellow-400",
	},
];

const HOW_IT_WORKS_WRAPPER_VARIANTS = {
	hidden: {
		opacity: 0,
		y: 32,
	},
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.55,
			ease: "easeOut",
			staggerChildren: 0.08,
			delayChildren: 0.1,
		},
	},
} as const;

const HOW_IT_WORKS_CARD_VARIANTS = {
	hidden: {
		opacity: 0,
		y: 28,
	},
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.45,
			ease: "easeOut",
		},
	},
} as const;

const HERO_CTA_WRAPPER_VARIANTS = {
	hidden: {
		opacity: 0,
		scale: 0.97,
		filter: "blur(6px)",
	},
	visible: {
		opacity: 1,
		scale: 1,
		filter: "blur(0px)",
		transition: {
			duration: 0.45,
			ease: "easeOut",
			staggerChildren: 0.12,
			when: "beforeChildren",
		},
	},
} as const;

const HERO_CTA_ITEM_VARIANTS = {
	hidden: {
		opacity: 0,
		y: 0,
		scale: 0.96,
	},
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: {
			duration: 0.35,
			ease: "easeOut",
		},
	},
} as const;

export default function LandingV2Page() {
	const [composerExpanded, setComposerExpanded] = useState(false);
	const [composerActive, setComposerActive] = useState(false);
	const [shareIndex, setShareIndex] = useState(0);
	const [ctaVisible, setCtaVisible] = useState(false);
	const [howItWorksVisible, setHowItWorksVisible] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}
		const interval = window.setInterval(() => {
			setShareIndex((index) => (index + 1) % SHARE_TYPES.length);
		}, 2600);
		return () => window.clearInterval(interval);
	}, []);

	useEffect(() => {
		setCtaVisible(true);
		const timeout = window.setTimeout(() => setHowItWorksVisible(true), 120);
		return () => window.clearTimeout(timeout);
	}, []);

	const currentShareType = SHARE_TYPES[shareIndex];

	const focusComposer = useCallback(() => {
		if (typeof window === "undefined") {
			return;
		}
		window.requestAnimationFrame(() => {
			document
				.getElementById("create-link")
				?.scrollIntoView({ behavior: "smooth", block: "center" });
		});
	}, []);

	const openComposer = useCallback(() => {
		// On mobile (< 640px), just scroll to composer. On desktop, open modal
		if (typeof window !== "undefined" && window.innerWidth < 640) {
			focusComposer();
		} else {
			setComposerExpanded(true);
			focusComposer();
		}
	}, [focusComposer]);

	return (
		<div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
			<motion.div
				aria-hidden
				className="pointer-events-none absolute inset-0"
				initial={{ opacity: 0 }}
				animate={{ opacity: 0.65 }}
				transition={{ duration: 1.2 }}
			>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,120,0,0.35),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(255,160,40,0.28),transparent_60%),radial-gradient(circle_at_50%_90%,rgba(255,90,0,0.25),transparent_55%)]" />
				<motion.div
					className="absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-orange-500/30 blur-[120px]"
					animate={{ y: [0, 30, 0], opacity: [0.35, 0.55, 0.35] }}
					transition={{
						duration: 12,
						ease: "easeInOut",
						repeat: Number.POSITIVE_INFINITY,
					}}
				/>
				<motion.div
					className="absolute -right-40 top-2/3 h-96 w-96 rounded-full bg-amber-400/25 blur-[140px]"
					animate={{ y: [0, -45, 0], opacity: [0.2, 0.4, 0.2] }}
					transition={{
						duration: 16,
						ease: "easeInOut",
						repeat: Number.POSITIVE_INFINITY,
					}}
				/>
			</motion.div>

			<div className="relative z-10 flex min-h-screen flex-col">
				<LandingNav onCreateLink={openComposer} />

				<main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 pt-8 px-6 pb-28 sm:px-10">
					<section
						id="hero"
						className={cn(
							"grid grid-cols-1 gap-12 pt-8 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-16",
							composerActive ? "items-start" : "items-center",
						)}
					>
						<motion.div
							layout
							transition={{
								layout: {
									type: "spring",
									stiffness: 220,
									damping: 32,
									mass: 0.75,
								},
							}}
							className="space-y-8"
						>
							<motion.span
								className="hidden items-center gap-2 rounded-full border border-orange-400/50 bg-orange-500/15 px-4 py-1 text-sm font-medium uppercase tracking-[0.35em] text-orange-200/90 md:inline-flex"
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.4 }}
							>
								<Sparkles className="h-4 w-4" />
								early access :3
							</motion.span>
							<motion.h1
								className="text-4xl font-black leading-tight text-white drop-shadow-[0_15px_45px_rgba(255,120,0,0.2)] md:text-5xl lg:text-6xl"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.15, duration: 0.6, type: "spring" }}
							>
								Drop one link. Everyone hits play.
							</motion.h1>
							<motion.p
								className="max-w-xl text-base text-white/75 sm:text-lg"
								initial={{ opacity: 0, y: 14 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.25, duration: 0.6 }}
							>
								Paste the streaming link you have and SyncFM turns it into a
								polished short page with buttons for today&apos;s top services -
								and more on the way.
							</motion.p>

							<motion.div layout className="flex flex-wrap gap-3">
								{heroQuickHits.map((label, index) => (
									<motion.span
										key={label}
										className="inline-flex items-center rounded-full border border-white/14 bg-white/6 px-3 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-white/75"
										initial={{ opacity: 0, y: 6 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.25, delay: index * 0.04 }}
									>
										{label}
									</motion.span>
								))}
							</motion.div>

							<motion.div
								layout
								className="flex flex-wrap items-center gap-4"
								initial="hidden"
								animate={ctaVisible ? "visible" : "hidden"}
								variants={HERO_CTA_WRAPPER_VARIANTS}
								style={{ pointerEvents: ctaVisible ? "auto" : "none" }}
							>
								<motion.button
									type="button"
									onClick={openComposer}
									className="group hidden items-center gap-1.5 rounded-full bg-linear-to-br from-orange-500 to-amber-400 px-5 py-2.5 text-base font-semibold leading-tight text-slate-950 shadow-[0_18px_50px_rgba(255,120,0,0.35)] transition-transform hover:-translate-y-0.5 md:inline-flex"
									variants={HERO_CTA_ITEM_VARIANTS}
								>
									<span className="flex items-center gap-1.5 text-base">
										<span className="leading-none">Share a</span>
										<span className="relative flex h-[1.4rem] min-w-14 items-center overflow-hidden">
											<AnimatePresence mode="wait">
												<motion.span
													key={currentShareType}
													initial={{ y: 12, opacity: 0 }}
													animate={{ y: 0, opacity: 1 }}
													exit={{ y: -12, opacity: 0 }}
													transition={{ duration: 0.3 }}
													className="block w-full text-left capitalize leading-none"
												>
													{currentShareType}
												</motion.span>
											</AnimatePresence>
										</span>
									</span>
									<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
								</motion.button>
								<motion.div variants={HERO_CTA_ITEM_VARIANTS}>
									<Link
										href="/nerds"
										className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
									>
										See what we&apos;re shipping next
										<ArrowRight className="h-4 w-4" />
									</Link>
								</motion.div>
							</motion.div>
						</motion.div>

						<LinkComposer
							expanded={composerExpanded}
							onExpandedChange={setComposerExpanded}
							onActiveChange={setComposerActive}
						/>
					</section>

					<motion.section
						id="how-it-works"
						className="rounded-4xl border border-white/10 bg-white/5 p-8 shadow-[0_25px_80px_rgba(10,10,45,0.55)] backdrop-blur-2xl"
						initial={{ opacity: 0, y: 32 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: "easeOut" }}
					>
						<div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
							<div className="max-w-xl space-y-2">
								<p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-white/50">
									<Shuffle className="h-3.5 w-3.5" />
									How it works
								</p>
								<h3 className="text-2xl font-semibold text-white">
									Share once. Let SyncFM handle the rest.
								</h3>
								<p className="text-sm text-white/65">
									Drop the link you already have - SyncFM fetches everything
									needed, gives you a nice little page, and lets your friends
									pick their preferred service.
								</p>
							</div>
						</div>
						<motion.div
							className="grid gap-6 md:grid-cols-3"
							initial="hidden"
							animate={howItWorksVisible ? "visible" : "hidden"}
							variants={HOW_IT_WORKS_WRAPPER_VARIANTS}
						>
							{howItWorksSteps.map((step, index) => (
								<motion.div
									key={step.title}
									className="rounded-3xl border border-white/12 bg-linear-to-br from-white/10 via-white/6 to-white/14 p-6 backdrop-blur-xl"
									variants={HOW_IT_WORKS_CARD_VARIANTS}
								>
									<span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-orange-500 to-amber-400 text-sm font-semibold text-slate-950 shadow-[0_10px_28px_rgba(255,120,0,0.32)]">
										{index + 1}
									</span>
									<p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-orange-200/75">
										{step.title}
									</p>
									<p className="mt-3 text-sm text-white/75">
										{step.description}
									</p>
								</motion.div>
							))}
						</motion.div>
					</motion.section>

					<section
						id="what-you-get"
						className="rounded-4xl border border-white/10 bg-white/5 p-8 shadow-[0_25px_80px_rgba(10,10,45,0.55)] backdrop-blur-2xl"
					>
						<div className="mb-10 space-y-3">
							<p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-white/50">
								<Activity className="h-3.5 w-3.5" />
								What you get
							</p>
							<h3 className="text-2xl font-semibold text-white">
								A share page that does the heavy lifting for you.
							</h3>
							<p className="text-sm text-white/65">
								Whether you&apos;re texting a friend or posting to a community,
								SyncFM keeps the experience consistent and ready for the next
								wave of services.
							</p>
						</div>
						<div className="grid gap-8 lg:grid-cols-3">
							{featureHighlights.map((feature) => (
								<motion.div
									key={feature.title}
									className="flex flex-col gap-4 rounded-3xl border border-white/12 bg-linear-to-br from-white/10 via-white/6 to-white/14 p-6 backdrop-blur-xl"
									initial={{ opacity: 0, y: 18 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ duration: 0.5 }}
								>
									<div>
										<p className="text-xs uppercase tracking-[0.3em] text-orange-200/75">
											{feature.title}
										</p>
										<p className="mt-3 text-sm text-white/75">
											{feature.description}
										</p>
									</div>
									<ul className="space-y-3 text-sm text-white/70">
										{feature.points.map((point) => (
											<li key={point} className="flex gap-3">
												<span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-linear-to-br from-orange-400 to-amber-400" />
												<span>{point}</span>
											</li>
										))}
									</ul>
								</motion.div>
							))}
						</div>
						<div className="mt-10 grid gap-6 md:grid-cols-3">
							{shareBenefits.map((item) => (
								<motion.div
									key={item.title}
									className="rounded-3xl border border-white/12 bg-white/6 p-5 shadow-[0_18px_55px_rgba(10,10,35,0.45)] backdrop-blur-2xl"
									initial={{ opacity: 0, y: 16 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ duration: 0.45 }}
								>
									<p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-200/75">
										{item.title}
									</p>
									<p className="mt-3 text-sm text-white/75">
										{item.description}
									</p>
								</motion.div>
							))}
						</div>
					</section>

					<section
						id="why-syncfm"
						className="rounded-4xl border border-white/10 bg-linear-to-br from-orange-500/12 via-orange-500/6 to-black/60 p-8 backdrop-blur-2xl"
					>
						<div className="mb-8 space-y-3">
							<p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-white/55">
								<Activity className="h-3.5 w-3.5" />
								Why we built it
							</p>
							<h3 className="text-2xl font-semibold text-white">
								The whole point is to keep sharing simple.
							</h3>
							<p className="text-sm text-white/70">
								SyncFM started as a way to stop digging for alternate links.
								It&apos;s grown into a tool that lets every listener stay in the
								moment together.
							</p>
						</div>
						<div className="grid gap-6 md:grid-cols-3">
							{whySyncfmPoints.map((point) => (
								<motion.div
									key={point.title}
									className="rounded-3xl border border-white/12 bg-black/45 p-6"
									initial={{ opacity: 0, y: 16 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ duration: 0.45 }}
								>
									<p className="text-xs uppercase tracking-[0.3em] text-white/50">
										{point.title}
									</p>
									<p className="mt-3 text-sm text-white/75">
										{point.description}
									</p>
								</motion.div>
							))}
						</div>
					</section>

					<section
						id="discord-bot"
						className="rounded-4xl border border-white/10 bg-linear-to-br from-indigo-500/12 via-purple-500/6 to-black/60 p-8 backdrop-blur-2xl"
					>
						<div className="mb-8 space-y-3">
							<p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-white/55">
								<Activity className="h-3.5 w-3.5" />
								Discord Integration
							</p>
							<h3 className="text-2xl font-semibold text-white">
								SyncFM, now in your Discord servers.
							</h3>
							<p className="text-sm text-white/70">
								Our Discord bot brings SyncFM's universal music link conversion
								directly to your servers and DMs. Share music instantly without
								leaving Discord.
							</p>
						</div>
						<div className="grid gap-6 md:grid-cols-2">
							<motion.div
								className="rounded-3xl border border-white/12 bg-black/45 p-6"
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.45 }}
							>
								<p className="text-xs uppercase tracking-[0.3em] text-indigo-200/75">
									Right-click magic
								</p>
								<p className="mt-3 text-sm text-white/75">
									See a music link in chat? Just right-click the message and
									select "Convert to SyncFM" to instantly share it as a
									beautiful embed with buttons for all streaming services.
								</p>
							</motion.div>
							<motion.div
								className="rounded-3xl border border-white/12 bg-black/45 p-6"
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.45, delay: 0.1 }}
							>
								<p className="text-xs uppercase tracking-[0.3em] text-indigo-200/75">
									Slash command ready
								</p>
								<p className="mt-3 text-sm text-white/75">
									Use{" "}
									<code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono">
										/share
									</code>{" "}
									followed by any Spotify, Apple Music, or YouTube Music link to
									convert and post it instantly.
								</p>
							</motion.div>
						</div>
						<div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="space-y-2">
								<p className="text-sm font-medium text-white">
									Works everywhere Discord does
								</p>
								<p className="text-xs text-white/60">
									Install once, use in servers, DMs, and group chats. No server
									permissions needed.
								</p>
							</div>
							<Link
								href="https://discord.com/oauth2/authorize?client_id=1432684540991770684"
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-medium text-white shadow-[0_8px_32px_rgba(99,102,241,0.3)] transition hover:shadow-[0_8px_32px_rgba(99,102,241,0.4)] hover:scale-[1.02]"
							>
								Add to Discord
								<ArrowRight className="h-4 w-4" />
							</Link>
						</div>
					</section>

					<section
						id="roadmap"
						className="rounded-4xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl"
					>
						<div className="flex flex-col gap-10 lg:flex-row lg:items-center">
							<div className="flex-1 space-y-6">
								<p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/45">
									<Rocket className="h-4 w-4" />
									forward roadmap
								</p>
								<h2 className="text-3xl font-bold text-white md:text-4xl">
									Built for listeners. Built by nerds
								</h2>
								<p className="max-w-2xl text-sm text-white/70 md:text-base">
									SyncFM is just getting started. Here&apos;s a peek at
									what&apos;s next on our roadmap. But that&apos;s not all. We
									invite all the nerds to go look at our nerd log ;3
								</p>
								<Link
									href="/nerds"
									className="inline-flex items-center gap-2 text-sm text-orange-200/80 transition hover:text-orange-200"
								>
									Read the nerd log
									<ArrowRight className="h-4 w-4" />
								</Link>
							</div>
							<div className="flex-1 space-y-4">
								{roadmapItems.map((item) => (
									<motion.div
										key={item.title}
										className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-xl"
										initial={{ opacity: 0, y: 20 }}
										whileInView={{ opacity: 1, y: 0 }}
										viewport={{ once: true }}
										transition={{ duration: 0.6 }}
									>
										<p className="text-xs uppercase tracking_[0.35em] text-white/40">
											{item.era}
										</p>
										<p
											className={`mt-2 inline-flex items-center rounded-full bg-linear-to-r ${item.accent} px-3 py-1 text-xs font-medium text-black/85`}
										>
											{item.title}
										</p>
										<p className="mt-3 text-sm text-white/70">
											{item.description}
										</p>
									</motion.div>
								))}
							</div>
						</div>
					</section>
				</main>

				<LandingFooter />
			</div>
		</div>
	);
}
