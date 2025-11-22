import type { NotificationVariant } from "@/lib/notifications";

export interface NotificationTheme {
	badge: string;
	spotlight: string;
	dot: string;
}

export const NOTIFICATION_THEME: Record<NotificationVariant, NotificationTheme> = {
	info: {
		badge: "bg-sky-500/20 text-sky-100 border-sky-500/25",
		spotlight: "rgba(56,189,248,0.35)",
		dot: "bg-sky-300",
	},
	success: {
		badge: "bg-emerald-500/20 text-emerald-100 border-emerald-500/25",
		spotlight: "rgba(52,211,153,0.35)",
		dot: "bg-emerald-300",
	},
	warning: {
		badge: "bg-amber-500/25 text-amber-100 border-amber-400/25",
		spotlight: "rgba(251,191,36,0.35)",
		dot: "bg-amber-300",
	},
	danger: {
		badge: "bg-rose-500/25 text-rose-100 border-rose-500/30",
		spotlight: "rgba(244,114,182,0.35)",
		dot: "bg-rose-300",
	},
	system: {
		badge: "bg-purple-500/25 text-purple-100 border-purple-500/30",
		spotlight: "rgba(167,139,250,0.35)",
		dot: "bg-purple-300",
	},
};

export const DEFAULT_NOTIFICATION_THEME = NOTIFICATION_THEME.info;
