/**
 * API Keys Management Page
 *
 * Create, view, and manage API keys for programmatic access
 */

"use client";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Key, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiKeyCard } from "@/components/dashboard/api-keys/ApiKeyCard";
import { CreateApiKeyModal } from "@/components/dashboard/api-keys/CreateApiKeyModal";
import { DashboardHeader, DashboardHeaderAction } from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { generateApiKey } from "@/lib/api-keys";
import { createClient } from "@/lib/supabase/client";

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

export default function ApiKeysPage() {
	const [user, setUser] = useState<SupabaseUser | null>(null);
	const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [createdKey, setCreatedKey] = useState<string | null>(null);
	const [copiedKey, setCopiedKey] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: a
	useEffect(() => {
		loadApiKeys();
	}, []);

	const loadApiKeys = async () => {
		const supabase = createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return;
		setUser(user);

		// Fetch API keys
		const { data: keysData } = await supabase
			.from("api_keys")
			.select("*")
			.eq("user_id", user.id)
			.order("created_at", { ascending: false });

		// Get usage count for each key
		if (keysData) {
			const keysWithUsage = await Promise.all(
				keysData.map(async (key) => {
					const { count } = await supabase
						.from("usage_metrics")
						.select("*", { count: "exact", head: true })
						.eq("api_key_id", key.id);
					return { ...key, usage_count: count || 0 };
				})
			);
			setApiKeys(keysWithUsage);
		}

		setLoading(false);
	};

	const handleCreateKey = async (name: string, rateLimit: number) => {
		if (!user) return;

		const supabase = createClient();
		const { key, hash, prefix } = generateApiKey();

		const { error } = await supabase.from("api_keys").insert({
			user_id: user.id,
			name,
			key_hash: hash,
			key_prefix: prefix,
			rate_limit_per_hour: rateLimit,
			scopes: ["read", "write"],
			is_active: true,
		});

		if (error) {
			console.error("Failed to create API key:", error);
			return;
		}

		setCreatedKey(key);
		await loadApiKeys();
	};

	const handleRevokeKey = async (keyId: string) => {
		if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
			return;
		}

		const supabase = createClient();
		const { error } = await supabase.from("api_keys").update({ is_active: false }).eq("id", keyId);

		if (!error) {
			await loadApiKeys();
		}
	};

	const handleCopyKey = (key: string) => {
		navigator.clipboard.writeText(key);
		setCopiedKey(true);
		setTimeout(() => setCopiedKey(false), 2000);
	};

	const closeCreateModal = () => {
		setShowCreateModal(false);
		setCreatedKey(null);
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	return (
		<div className="space-y-8">
			<DashboardHeader
				title="API Keys"
				subtitle="Create and manage API keys for programmatic access"
				icon={Key}
				action={
					<DashboardHeaderAction onClick={() => setShowCreateModal(true)} icon={Plus}>
						Create Key
					</DashboardHeaderAction>
				}
			/>

			<div className="space-y-4">
				{apiKeys.length === 0 ? (
					<EmptyState
						icon={Key}
						title="No API keys yet"
						description="Create your first API key to start using the API programmatically"
						action={
							<button
								type="button"
								onClick={() => setShowCreateModal(true)}
								className="glass-bg-medium inline-flex items-center gap-2 rounded-lg px-4 py-2 text-foreground transition hover:glass-bg-strong"
							>
								<Plus className="h-4 w-4" />
								Create API Key
							</button>
						}
					/>
				) : (
					apiKeys.map((apiKey) => (
						<ApiKeyCard key={apiKey.id} apiKey={apiKey} onRevoke={handleRevokeKey} />
					))
				)}
			</div>

			<CreateApiKeyModal
				isOpen={showCreateModal}
				onClose={closeCreateModal}
				onCreate={handleCreateKey}
				createdKey={createdKey}
				onCopyKey={handleCopyKey}
				copiedKey={copiedKey}
			/>
		</div>
	);
}
