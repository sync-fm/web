export const SHARE_TYPES = ["album", "song", "artist"] as const;

export const heroQuickHits = [
	"Different service? No problem",
	"It just works*",
	"Never gonna give you up",
];

export const shareBenefits = [
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

export const howItWorksSteps = [
	{
		title: "Drop any music link",
		description: "Paste a song, album, or artist from the service you already have open.",
	},
	{
		title: "We recognise it instantly",
		description:
			"SyncFM reads the link, fetches the official details, and builds a polished page automatically.",
	},
	{
		title: "Friends pick their player",
		description: "They tap the app they use - thats it. No accounts, no hoops, just play.",
	},
];

export const featureHighlights = [
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

export const whySyncfmPoints = [
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

export const roadmapItems = [
	{
		era: "Now shipping",
		title: "Song, album, and artist pages",
		description:
			"Polished landing experiences powered by syncfm.ts for Spotify, Apple Music, and YouTube Music.",
		accent: "from-primary via-secondary to-secondary",
	},
	{
		era: "Up next",
		title: "More services",
		description:
			"Someone told us people use other services too? wild. Tidal, Deezer, SoundCLoud, and Amazon Music are all on the shortlist.",
		accent: "from-primary via-secondary to-secondary",
	},
	{
		era: "In research",
		title: "Playlists, lyrics, and richer context",
		description:
			"We're looking into adding support for sharing your playlists, showing lyrics, and deeper stats into the same easy sharing experience.",
		accent: "from-secondary via-primary to-secondary",
	},
];

export const HOW_IT_WORKS_WRAPPER_VARIANTS = {
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

export const HOW_IT_WORKS_CARD_VARIANTS = {
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

export const HERO_CTA_WRAPPER_VARIANTS = {
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

export const HERO_CTA_ITEM_VARIANTS = {
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
