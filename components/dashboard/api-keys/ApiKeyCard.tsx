/**
 * API Key Card Component
 * Displays individual API key information
 */

"use client";

import { motion } from "framer-motion";
import { Activity, Calendar, CheckCircle, Trash2, XCircle } from "lucide-react";

interface ApiKey {
	id: string;
	name: string;
	key_prefix: string;
	rate_limit_per_hour: number;
	scopes: string[];
	is_active: boolean;
	last_used_at: string | null;
	created_at: string;
	usage_count?: number;
}

interface ApiKeyCardProps {
	apiKey: ApiKey;
	onRevoke: (id: string) => void;
}

export function ApiKeyCard({ apiKey, onRevoke }: ApiKeyCardProps) {
	return (
		<motion.div
			className="rounded-2xl border glass-border-light glass-bg-light p-6 backdrop-blur-xl shadow-glass-sm"
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.3 }}
		>
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<h3 className="text-lg font-semibold text-foreground">{apiKey.name}</h3>
						{apiKey.is_active ? (
							<span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">
								<CheckCircle className="h-3 w-3" />
								Active
							</span>
						) : (
							<span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-xs font-medium text-red-300">
								<XCircle className="h-3 w-3" />
								Revoked
							</span>
						)}
					</div>
					<div className="mt-2 flex items-center gap-2">
						<code className="rounded glass-bg-medium px-2 py-1 font-mono text-sm text-foreground/80">
							{apiKey.key_prefix}
						</code>
					</div>
				</div>
				{apiKey.is_active && (
					<button
						type="button"
						onClick={() => onRevoke(apiKey.id)}
						className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/20"
						aria-label="Revoke key"
					>
						<Trash2 className="h-5 w-5" />
					</button>
				)}
			</div>

			<div className="mt-4 grid gap-4 sm:grid-cols-3">
				<div className="rounded-xl glass-bg-light p-3">
					<div className="flex items-center gap-2 text-primary/80">
						<Activity className="h-4 w-4" />
						<p className="text-xs text-muted-medium">Rate Limit</p>
					</div>
					<p className="mt-1 text-lg font-semibold text-foreground">
						{apiKey.rate_limit_per_hour.toLocaleString()}/hr
					</p>
				</div>
				<div className="rounded-xl glass-bg-light p-3">
					<p className="text-xs text-muted-medium">Usage</p>
					<p className="mt-1 text-lg font-semibold text-foreground">
						{apiKey.usage_count?.toLocaleString() || 0}
					</p>
				</div>
				<div className="rounded-xl glass-bg-light p-3">
					<p className="text-xs text-muted-medium">Last Used</p>
					<p className="mt-1 text-sm text-foreground">
						{apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleDateString() : "Never"}
					</p>
				</div>
			</div>

			<div className="mt-4 flex items-center gap-2 text-xs text-muted-faint">
				<Calendar className="h-3 w-3" />
				Created {new Date(apiKey.created_at).toLocaleDateString()}
			</div>
		</motion.div>
	);
}
