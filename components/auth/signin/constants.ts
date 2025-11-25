import { type inferParserType, parseAsStringLiteral } from "nuqs";
// biome-ignore lint/correctness/noUnusedImports: later
import { FcGoogle } from "react-icons/fc";
import { SiDiscord, SiGithub } from "react-icons/si";
import type { OAuthProviderConfig } from "@/components/auth/oauth-buttons";

export const providerConfigs: OAuthProviderConfig[] = [
	{
		id: "discord",
		label: "Continue with Discord",
		className: "bg-[#5865F2] hover:bg-[#4752C4] border-transparent",
		textClass: "text-white",
		spinnerClass: "border-white",
		icon: SiDiscord,
		brandColor: "white",
	}/*,
	{
		id: "github",
		label: "Continue with GitHub",
		className: "bg-black hover:bg-neutral-900 border-transparent",
		textClass: "text-white",
		spinnerClass: "border-white",
		icon: SiGithub,
		brandColor: "white",
	},
	{
		id: "google",
		label: "Continue with Google",
		className: "bg-black hover:bg-neutral-900 border-transparent",
		textClass: "text-white",
		spinnerClass: "border-white",
		icon: FcGoogle,
		brandColor: null,
	},*/,
];

export const CARD_VARIANTS = {
	hidden: { opacity: 0, y: 32 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
} as const;

export const COPY_TRANSITION = {
	duration: 0.32,
	ease: [0.21, 0.79, 0.33, 0.99],
} as const;

export const parser = parseAsStringLiteral(["signin", "signup"]);
export type OAuthFlowType = Exclude<inferParserType<typeof parser>, null>;

export type AuthFlowCopySchema = {
	readonly heading: string;
	readonly description: string;
	readonly breadcrumb: string;
	readonly agreementAction: string;
	readonly toggle: {
		readonly prompt: string;
		readonly action: string;
		readonly target: OAuthFlowType;
	};
};

export const AUTH_FLOW_STRINGS: Record<OAuthFlowType, AuthFlowCopySchema> = {
	signin: {
		heading: "Sign in to SyncFM",
		description: "Pick any provider below. We'll redirect you back once you're signed in.",
		breadcrumb: "Sign in",
		agreementAction: "signing in",
		toggle: {
			prompt: "New to SyncFM?",
			action: "Create an account",
			target: "signup",
		},
	},
	signup: {
		heading: "Welcome to SyncFM",
		description: "Pick any provider below. We'll finish setting you up and send you right back.",
		breadcrumb: "Sign up",
		agreementAction: "creating an account",
		toggle: {
			prompt: "Already have an account?",
			action: "Sign in",
			target: "signin",
		},
	},
};
