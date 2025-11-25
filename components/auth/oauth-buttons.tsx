import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { isValidElement, type ReactElement } from "react";
import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";

export type Provider = "discord" | "github" | "google";

export type OAuthIcon = ReactElement | IconType | (() => ReactElement);

export interface OAuthProviderConfig {
	id: Provider;
	label: string;
	className: string;
	textClass?: string;
	spinnerClass?: string;
	icon: OAuthIcon;
	brandColor?: string | null;
}

interface OAuthProviderButtonProps extends OAuthProviderConfig {
	isLoading: boolean;
	disabled: boolean;
	onSelect?: (provider: Provider) => void;
}

const DEFAULT_SPINNER_CLASSES = "border-white";

export const OauthButton = ({
	id,
	label,
	className,
	textClass,
	spinnerClass,
	isLoading,
	disabled,
	icon,
	brandColor,
	onSelect,
}: OAuthProviderButtonProps) => {
	const renderIcon = () => {
		if (isValidElement(icon)) {
			return icon;
		}
		const IconComponent = icon as IconType | (() => ReactElement);
		return <IconComponent style={brandColor ? { color: brandColor } : undefined} />;
	};

	return (
		<motion.button
			key={id}
			type="button"
			onClick={() => onSelect?.(id)}
			disabled={disabled}
			whileHover={{ translateY: -2 }}
			whileTap={{ scale: 0.98 }}
			className={cn(
				"group flex w-full items-center flex-col gap-1 rounded-3xl border glass-border-light px-5 py-4 text-left shadow-glass-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-70",
				className,
				textClass ?? "text-slate-950",
				"cursor-pointer"
			)}
		>
			<div className="flex items-center gap-3 text-base font-semibold">
				{isLoading ? (
					<span
						className={cn(
							"h-5 w-5 animate-spin rounded-full border-2 border-t-transparent",
							spinnerClass ?? DEFAULT_SPINNER_CLASSES
						)}
					/>
				) : (
					renderIcon()
				)}
				{label}
				<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
			</div>
		</motion.button>
	);
};

export interface OAuthSignInHandlerParams {
	provider: Provider;
	loading: Provider | null;
	setLoading: (provider: Provider | null) => void;
	error: string | null;
	setError: (error: string | null) => void;
}

export type OAuthSignInHandler = ({
	provider,
	loading,
	setLoading,
	error,
	setError,
}: OAuthSignInHandlerParams) => Promise<void>;

interface OauthButtonGroupProps {
	providers: OAuthProviderConfig[];
	onSignIn?: OAuthSignInHandler;
	loading: Provider | null;
	setLoading: (provider: Provider | null) => void;
	error?: string | null;
	setError?: (error: string | null) => void;
	className?: string;
}

export const OauthButtonGroup = ({
	providers,
	onSignIn,
	loading,
	setLoading,
	error = null,
	setError,
	className,
}: OauthButtonGroupProps) => {
	const handleSelect = (providerId: Provider) => {
		if (!onSignIn) return;
		const safeSetError = setError ?? (() => undefined);
		onSignIn({
			provider: providerId,
			loading,
			setLoading,
			error,
			setError: safeSetError,
		});
	};

	return (
		<div className={cn("flex w-full flex-col justify-center gap-4", className)}>
			{providers.map((provider) => (
				<OauthButton
					key={provider.id}
					{...provider}
					onSelect={handleSelect}
					disabled={loading !== null}
					isLoading={loading === provider.id}
				/>
			))}
		</div>
	);
};
