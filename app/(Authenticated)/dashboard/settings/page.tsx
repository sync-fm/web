/**
 * Settings Page
 *
 * User profile settings and account management
 */

"use client";

import type { User as SupabaseUser, UserIdentity } from "@supabase/supabase-js";
import { AnimatePresence } from "framer-motion";
import { Mail, Save, Settings as SettingsIcon, Shield, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { IconType } from "react-icons";
import { FcGoogle } from "react-icons/fc";
import { SiDiscord, SiGithub } from "react-icons/si";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { AlertMessage } from "@/components/dashboard/settings/AlertMessage";
import { ConnectedAccountCard } from "@/components/dashboard/settings/ConnectedAccountCard";
import { FormInput } from "@/components/dashboard/settings/FormInput";
import { SettingsSection } from "@/components/dashboard/settings/SettingsSection";
import { createClient } from "@/lib/supabase/client";

const OAUTH_PROVIDERS = [
	{
		id: "discord",
		name: "Discord",
		icon: SiDiscord,
		brandColor: "#5865F2", // Discord Blurple
	},
	{
		id: "github",
		name: "GitHub",
		icon: SiGithub,
		brandColor: "#FFFFFF", // GitHub White
	},
	{
		id: "google",
		name: "Google",
		icon: FcGoogle,
		brandColor: null, // FcGoogle already has correct colors
	},
] as const satisfies ReadonlyArray<{
	id: "discord" | "github" | "google";
	name: string;
	icon: IconType;
	brandColor: string | null;
}>;

type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]["id"];

const OAUTH_PROVIDER_SET = new Set<OAuthProvider>(OAUTH_PROVIDERS.map((provider) => provider.id));

const getProviderLabel = (providerId: OAuthProvider) =>
	OAUTH_PROVIDERS.find((provider) => provider.id === providerId)?.name ?? providerId;

const isOAuthProvider = (provider: string | null | undefined): provider is OAuthProvider =>
	!!provider && OAUTH_PROVIDER_SET.has(provider as OAuthProvider);

export default function SettingsPage() {
	const router = useRouter();
	const [user, setUser] = useState<SupabaseUser | null>(null);
	const [identities, setIdentities] = useState<UserIdentity[]>([]);
	const [username, setUsername] = useState("");
	const [fullName, setFullName] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [linkingProvider, setLinkingProvider] = useState<OAuthProvider | null>(null);
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	const loadProfile = useCallback(async () => {
		const supabase = createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return;
		setUser(user);

		// Get user identities (OAuth providers)
		const { data: identitiesData } = await supabase.auth.getUserIdentities();
		setIdentities(identitiesData?.identities ?? []);

		const { data: profileData } = await supabase
			.from("profiles")
			.select("username, full_name")
			.eq("id", user.id)
			.single();

		if (profileData) {
			setUsername(profileData.username || "");
			setFullName(profileData.full_name || "");
		}

		setLoading(false);
	}, []);

	useEffect(() => {
		void loadProfile();
	}, [loadProfile]);

	const handleLinkProvider = async (provider: string) => {
		if (!isOAuthProvider(provider)) return;

		setLinkingProvider(provider);
		setMessage(null);

		try {
			const supabase = createClient();
			const { error } = await supabase.auth.linkIdentity({
				provider,
				options: {
					redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard/settings`,
				},
			});

			if (error) {
				setMessage({
					type: "error",
					text: `Failed to link ${getProviderLabel(provider)}: ${error.message}`,
				});
				setLinkingProvider(null);
				return;
			}

			// Browser will redirect to OAuth provider
		} catch (err) {
			console.error("Link provider error:", err);
			setMessage({ type: "error", text: "An unexpected error occurred" });
			setLinkingProvider(null);
		}
	};

	const handleUnlinkProvider = async (provider: string) => {
		if (!isOAuthProvider(provider)) return;
		const providerLabel = getProviderLabel(provider);
		const linkedOAuthCount = identities.filter((identity) =>
			isOAuthProvider(identity.provider)
		).length;

		if (linkedOAuthCount <= 1) {
			setMessage({
				type: "error",
				text: "You must keep at least one provider connected to sign in",
			});
			return;
		}

		if (
			!confirm(
				`Are you sure you want to unlink your ${providerLabel} account? You won't be able to sign in with it.`
			)
		) {
			return;
		}

		try {
			const supabase = createClient();
			const identity = identities.find((item) => item.provider === provider);
			if (!identity) {
				setMessage({
					type: "error",
					text: `${providerLabel} identity not found`,
				});
				return;
			}

			const { error } = await supabase.auth.unlinkIdentity(identity);

			if (error) {
				setMessage({
					type: "error",
					text: `Failed to unlink ${providerLabel}: ${error.message}`,
				});
				return;
			}

			setMessage({
				type: "success",
				text: `${providerLabel} account disconnected`,
			});
			await loadProfile();
		} catch (err) {
			console.error("Unlink provider error:", err);
			setMessage({ type: "error", text: "An unexpected error occurred" });
		}
	};

	const linkedOAuthCount = useMemo(
		() => identities.filter((identity) => isOAuthProvider(identity.provider)).length,
		[identities]
	);

	const handleSave = async () => {
		if (!user) return;

		setSaving(true);
		setMessage(null);

		const supabase = createClient();
		const { error } = await supabase
			.from("profiles")
			.update({
				username: username.trim() || null,
				full_name: fullName.trim() || null,
			})
			.eq("id", user.id);

		if (error) {
			setMessage({ type: "error", text: "Failed to update profile" });
		} else {
			setMessage({ type: "success", text: "Profile updated successfully!" });
			await loadProfile();
		}

		setSaving(false);
	};

	const handleDeleteAccount = async () => {
		if (
			!confirm(
				"Are you absolutely sure? This will permanently delete your account, all API keys, and usage data. This action cannot be undone."
			)
		) {
			return;
		}

		if (!confirm("Last chance! Type 'DELETE' in the next prompt to confirm account deletion.")) {
			return;
		}

		const confirmation = prompt('Type "DELETE" (in all caps) to permanently delete your account:');
		if (confirmation !== "DELETE") {
			alert("Account deletion cancelled");
			return;
		}

		const supabase = createClient();
		// Note: This will cascade delete via database policies
		const { error } = await supabase.from("profiles").delete().eq("id", user?.id);

		if (error) {
			alert("Failed to delete account. Please contact support.");
		} else {
			await supabase.auth.signOut();
			router.push("/");
		}
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	return (
		<div className="space-y-8">
			<DashboardHeader
				title="Settings"
				subtitle="Manage your account settings and preferences"
				icon={SettingsIcon}
			/>

			<AnimatePresence mode="wait">
				{message && <AlertMessage type={message.type} message={message.text} />}
			</AnimatePresence>

			<SettingsSection
				title="Profile Information"
				description="Update your personal information and display name"
				icon={User}
				delay={0.1}
			>
				<div className="space-y-4">
					<FormInput
						id="settings-username"
						label="Username"
						value={username}
						onChange={setUsername}
						placeholder="your-username"
						helpText="Your unique username for the platform"
					/>

					<FormInput
						id="settings-full-name"
						label="Full Name"
						value={fullName}
						onChange={setFullName}
						placeholder="John Doe"
					/>

					<FormInput
						id="settings-email"
						label="Email"
						value={user?.email || ""}
						onChange={() => {}}
						icon={Mail}
						disabled
						helpText="Email cannot be changed"
						type="email"
					/>

					<div className="pt-2">
						<button
							type="button"
							onClick={handleSave}
							disabled={saving}
							className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-brand-sm transition hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<Save className="h-5 w-5" />
							<span>{saving ? "Saving..." : "Save Changes"}</span>
						</button>
					</div>
				</div>
			</SettingsSection>

			<SettingsSection
				title="Connected Accounts"
				description="Link multiple providers so you always have a backup way to sign in"
				icon={Shield}
				delay={0.2}
				badge={`${linkedOAuthCount} / ${OAUTH_PROVIDERS.length} linked`}
			>
				<div className="space-y-3">
					{OAUTH_PROVIDERS.map((provider) => {
						const identity = identities.find((item) => item.provider === provider.id);
						const disableUnlink =
							!!identity && linkedOAuthCount <= 1 && isOAuthProvider(identity.provider);

						return (
							<ConnectedAccountCard
								key={provider.id}
								provider={provider}
								identity={identity}
								linkingProvider={linkingProvider}
								onLink={handleLinkProvider}
								onUnlink={handleUnlinkProvider}
								disableUnlink={disableUnlink}
							/>
						);
					})}
				</div>
			</SettingsSection>

			<SettingsSection
				title="Danger Zone"
				description="Once you delete your account, there is no going back. This will permanently delete your profile, all API keys, and usage history."
				icon={Trash2}
				variant="danger"
				delay={0.3}
			>
				<button
					type="button"
					onClick={handleDeleteAccount}
					className="group inline-flex items-center justify-center gap-2 rounded-full border border-red-500/50 bg-red-500/20 px-6 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/30 active:scale-95"
				>
					<Trash2 className="h-5 w-5" />
					<span>Delete Account</span>
				</button>
			</SettingsSection>
		</div>
	);
}
