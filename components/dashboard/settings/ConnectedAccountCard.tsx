/**
 * Connected Account Card Component
 * Displays OAuth provider connection status and actions
 */

"use client";

import type { UserIdentity } from "@supabase/supabase-js";
import { Link as LinkIcon, Unlink } from "lucide-react";
import type { IconType } from "react-icons";

interface ConnectedAccountCardProps {
	provider: {
		id: string;
		name: string;
		icon: IconType;
		brandColor: string | null;
	};
	identity?: UserIdentity;
	linkingProvider: string | null;
	disableUnlink: boolean;
	onLink: (provider: string) => void;
	onUnlink: (provider: string) => void;
}

type IdentityMetadata = {
	username?: string;
	full_name?: string;
	name?: string;
	preferred_username?: string;
	email?: string;
};

function getIdentityDisplayName(identity?: UserIdentity) {
	if (!identity) return null;
	const metadata = identity.identity_data as IdentityMetadata | null;
	return (
		metadata?.username ??
		metadata?.preferred_username ??
		metadata?.full_name ??
		metadata?.name ??
		metadata?.email ??
		null
	);
}

function formatTimestamp(timestamp?: string | null) {
	if (!timestamp) return null;
	const date = new Date(timestamp);
	if (Number.isNaN(date.valueOf())) return null;
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function ConnectedAccountCard({
	provider,
	identity,
	linkingProvider,
	disableUnlink,
	onLink,
	onUnlink,
}: ConnectedAccountCardProps) {
	const Icon = provider.icon;
	const isLinked = Boolean(identity);
	const identityLabel = getIdentityDisplayName(identity);
	const linkedDate = formatTimestamp(identity?.created_at);
	const lastUsedDate = formatTimestamp(identity?.last_sign_in_at);

	return (
		<div className="rounded-2xl border glass-border-light glass-bg-light p-5 backdrop-blur-xl transition hover:glass-border-medium hover:glass-bg-medium">
			<div className="flex flex-wrap items-center gap-4">
				<div className="flex h-12 w-12 items-center justify-center rounded-2xl glass-bg-medium">
					<Icon
						className="h-6 w-6"
						style={provider.brandColor ? { color: provider.brandColor } : undefined}
						aria-hidden
					/>
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-base font-semibold text-foreground">{provider.name}</p>
					{identityLabel && (
						<p className="mt-1 text-xs text-muted-faint">
							Linked as <span className="font-semibold text-foreground">{identityLabel}</span>
							{lastUsedDate && <> · Last used {lastUsedDate}</>}
						</p>
					)}
				</div>
				<span
					className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
						isLinked ? "bg-green-500/15 text-green-200" : "glass-bg-medium text-muted-medium"
					}`}
				>
					{isLinked ? "Connected" : "Not connected"}
				</span>
			</div>
			<div className="mt-4 flex flex-wrap items-center justify-end gap-3">
				{isLinked ? (
					<button
						type="button"
						onClick={() => onUnlink(provider.id)}
						disabled={disableUnlink}
						className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
					>
						<Unlink className="h-4 w-4" />
						{disableUnlink ? "Required" : "Unlink"}
					</button>
				) : (
					<button
						type="button"
						onClick={() => onLink(provider.id)}
						disabled={linkingProvider === provider.id}
						className="glass-bg-medium glass-border-medium inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-foreground transition hover:glass-border-strong hover:glass-bg-strong disabled:cursor-not-allowed disabled:opacity-60"
					>
						<LinkIcon className="h-4 w-4" />
						{linkingProvider === provider.id ? "Redirecting..." : `Link ${provider.name}`}
					</button>
				)}
			</div>
			{isLinked && linkedDate && (
				<p className="mt-3 text-xs text-muted-faint">Linked on {linkedDate}</p>
			)}
			{isLinked && disableUnlink && (
				<p className="mt-1 text-xs text-red-200/70">Keep at least one provider connected</p>
			)}
		</div>
	);
}
