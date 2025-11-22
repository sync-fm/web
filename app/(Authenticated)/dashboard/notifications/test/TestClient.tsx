"use client";

import { AlertCircle, Check, Loader2, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { NOTIFICATION_VARIANTS, type Notification } from "@/lib/notifications";
import { createNotification, listNotificationsAction } from "@/lib/notifications.server";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface NotificationsTestClientProps {
	initialUserId: string | null;
}

interface FormState {
	title: string;
	body: string;
	variant: (typeof NOTIFICATION_VARIANTS)[number];
	actionUrl: string;
	avatarUrl: string;
	icon: string;
	metadata: string;
	badgeText: string;
	accentColor: string;
	thumbnailUrl: string;
	expiresAt: string;
	isPinned: boolean;
	targetUserId: string;
}

const INITIAL_FORM: FormState = {
	title: "",
	body: "",
	variant: "info",
	actionUrl: "",
	avatarUrl: "",
	icon: "",
	metadata: "",
	badgeText: "",
	accentColor: "",
	thumbnailUrl: "",
	expiresAt: "",
	isPinned: false,
	targetUserId: "",
};

export default function NotificationsTestClient({ initialUserId }: NotificationsTestClientProps) {
	const router = useRouter();
	const [userId, setUserId] = useState<string | null>(initialUserId);
	const [form, setForm] = useState<FormState>({
		...INITIAL_FORM,
		targetUserId: initialUserId ?? "",
	});
	const [submitting, startSubmit] = useTransition();
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [recent, setRecent] = useState<Notification[]>([]);
	const [refreshing, startRefresh] = useTransition();

	useEffect(() => {
		if (initialUserId) return;
		const supabase = createClient();
		let cancelled = false;
		supabase.auth.getUser().then(({ data }) => {
			if (!cancelled) {
				const id = data.user?.id ?? null;
				setUserId(id);
				setForm((prev) => ({ ...prev, targetUserId: id ?? "" }));
			}
		});
		return () => {
			cancelled = true;
		};
	}, [initialUserId]);

	useEffect(() => {
		if (!userId) return;
		startRefresh(() => {
			listNotificationsAction({ limit: 10 })
				.then((items) => setRecent(items))
				.catch((err) => console.error("Failed to load recent notifications", err));
		});
	}, [userId]);

	const targetUserId = useMemo(
		() => form.targetUserId || userId || "",
		[form.targetUserId, userId]
	);

	const handleChange =
		(field: keyof FormState) =>
		(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			const value =
				event.target.type === "checkbox"
					? (event.target as HTMLInputElement).checked
					: event.target.value;
			setForm((prev) => ({ ...prev, [field]: value }));
		};

	const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
		event.preventDefault();
		setMessage(null);
		setError(null);

		if (!targetUserId) {
			setError("A target user ID is required.");
			return;
		}

		let parsedMetadata: Record<string, unknown> | undefined;
		if (form.metadata.trim().length > 0) {
			try {
				parsedMetadata = JSON.parse(form.metadata);
			} catch {
				setError("Metadata must be valid JSON.");
				return;
			}
		}

		const expiresAtValue = form.expiresAt ? new Date(form.expiresAt) : undefined;

		startSubmit(async () => {
			try {
				const created = await createNotification({
					userId: targetUserId,
					title: form.title || "Test Notification",
					body: form.body || undefined,
					variant: form.variant,
					actionUrl: form.actionUrl || undefined,
					avatarUrl: form.avatarUrl || undefined,
					icon: form.icon || undefined,
					metadata: parsedMetadata,
					context:
						form.badgeText || form.accentColor || form.thumbnailUrl
							? {
									badgeText: form.badgeText || undefined,
									accentColor: form.accentColor || undefined,
									thumbnailUrl: form.thumbnailUrl || undefined,
								}
							: undefined,
					expiresAt: expiresAtValue,
					isPinned: form.isPinned,
				});

				setMessage(`Notification sent! ID: ${created.id}`);
				setForm((prev) => ({
					...INITIAL_FORM,
					targetUserId: prev.targetUserId,
				}));
				setRecent((current) => [created, ...current].slice(0, 10));
			} catch (err) {
				console.error("Failed to create notification", err);
				setError("Could not create notification. Check the console for details.");
			}
		});
	};

	const handleCreateSample = (variant: (typeof NOTIFICATION_VARIANTS)[number]) => {
		if (!targetUserId) {
			setError("A target user ID is required.");
			return;
		}
		setError(null);
		setMessage(null);
		startSubmit(async () => {
			try {
				const created = await createNotification({
					userId: targetUserId,
					title: `${variant.toUpperCase()} sample notification`,
					variant,
					body: `This is a ${variant} level notification created at ${new Date().toLocaleString()}.`,
					metadata: { origin: "tester", variant },
					isPinned: variant === "danger" || variant === "system",
				});
				setMessage(`Sample ${variant} notification sent (ID: ${created.id}).`);
				setRecent((current) => [created, ...current].slice(0, 10));
			} catch (err) {
				console.error("Failed to create sample notification", err);
				setError("Unable to create sample notification.");
			}
		});
	};

	const refreshRecent = () => {
		if (!userId) return;
		startRefresh(async () => {
			try {
				const items = await listNotificationsAction({ limit: 10 });
				setRecent(items);
			} catch (err) {
				console.error("Failed to refresh notifications", err);
			}
		});
	};

	return (
		<div className="space-y-8">
			<section className="rounded-3xl border border-white/10 bg-linear-to-b from-slate-900/90 via-slate-950/80 to-slate-950 p-8 text-white">
				<h1 className="text-3xl font-bold">Notifications Test Lab</h1>
				<p className="mt-2 max-w-2xl text-sm text-white/70">
					Craft and dispatch notifications to yourself (or another user) to verify the delivery
					pipeline, realtime updates, and UI rendering.
				</p>
				<div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-white/50">
					<span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
						<Check className="size-4" /> Signed in as {userId ?? "unknown"}
					</span>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push("/dashboard/notifications")}
						className="text-white/80 hover:text-white"
					>
						View notifications page
					</Button>
				</div>
			</section>

			<section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
				<form
					onSubmit={handleSubmit}
					className="space-y-6 rounded-3xl border border-white/10 bg-slate-950/80 p-6 text-white"
				>
					<div className="space-y-1">
						<label className="text-sm text-white/70" htmlFor="targetUserId">
							Target user ID
						</label>
						<Input
							id="targetUserId"
							value={targetUserId}
							onChange={handleChange("targetUserId")}
							placeholder="Defaults to your user"
							className="border-white/10 bg-white/5 text-white"
						/>
						<p className="text-xs text-white/40">
							Leave empty to target yourself. Provide another user7s ID to send to them.
						</p>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-1">
							<label className="text-sm text-white/70" htmlFor="title">
								Title
							</label>
							<Input
								id="title"
								value={form.title}
								onChange={handleChange("title")}
								required
								placeholder="Something happened"
								className="border-white/10 bg-white/5 text-white"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-sm text-white/70" htmlFor="variant">
								Variant
							</label>
							<select
								id="variant"
								value={form.variant}
								onChange={(event) =>
									setForm((prev) => ({
										...prev,
										variant: event.target.value as FormState["variant"],
									}))
								}
								className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
							>
								{NOTIFICATION_VARIANTS.map((variant) => (
									<option key={variant} value={variant} className="bg-slate-900 text-white">
										{variant.toUpperCase()}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="space-y-1">
						<label className="text-sm text-white/70" htmlFor="body">
							Body
						</label>
						<textarea
							id="body"
							value={form.body}
							onChange={handleChange("body")}
							placeholder="Optional longer description"
							rows={4}
							className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
						/>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-1">
							<label className="text-sm text-white/70" htmlFor="actionUrl">
								Action URL
							</label>
							<Input
								id="actionUrl"
								value={form.actionUrl}
								onChange={handleChange("actionUrl")}
								placeholder="https:// or /internal-route"
								className="border-white/10 bg-white/5 text-white"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-sm text-white/70" htmlFor="avatarUrl">
								Avatar URL
							</label>
							<Input
								id="avatarUrl"
								value={form.avatarUrl}
								onChange={handleChange("avatarUrl")}
								placeholder="Optional image"
								className="border-white/10 bg-white/5 text-white"
							/>
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-3">
						<div className="space-y-1">
							<label className="text-sm text-white/70" htmlFor="icon">
								Icon (emoji)
							</label>
							<Input
								id="icon"
								value={form.icon}
								onChange={handleChange("icon")}
								placeholder="🔔"
								className="border-white/10 bg-white/5 text-white"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-sm text-white/70" htmlFor="expiresAt">
								Expires at
							</label>
							<Input
								type="datetime-local"
								id="expiresAt"
								value={form.expiresAt}
								onChange={handleChange("expiresAt")}
								className="border-white/10 bg-white/5 text-white"
							/>
						</div>
						<div className="flex items-center gap-3 border border-white/10 bg-white/5 px-3 py-2 rounded-md">
							<input
								type="checkbox"
								id="isPinned"
								checked={form.isPinned}
								onChange={handleChange("isPinned")}
								className="size-4 rounded border border-white/40 bg-transparent"
							/>
							<label htmlFor="isPinned" className="text-sm text-white/70">
								Pinned
							</label>
						</div>
					</div>

					<div className="space-y-1">
						<label className="text-sm text-white/70" htmlFor="metadata">
							Metadata (JSON)
						</label>
						<textarea
							id="metadata"
							value={form.metadata}
							onChange={handleChange("metadata")}
							rows={3}
							placeholder='{"key":"value"}'
							className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
						/>
					</div>

					<div className="grid gap-4 md:grid-cols-3">
						<div className="space-y-1">
							<label className="text-sm text-white/70" htmlFor="badgeText">
								Context badge text
							</label>
							<Input
								id="badgeText"
								value={form.badgeText}
								onChange={handleChange("badgeText")}
								placeholder="BETA"
								className="border-white/10 bg-white/5 text-white"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-sm text-white/70" htmlFor="accentColor">
								Accent color
							</label>
							<Input
								id="accentColor"
								value={form.accentColor}
								onChange={handleChange("accentColor")}
								placeholder="#FF7A18"
								className="border-white/10 bg-white/5 text-white"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-sm text-white/70" htmlFor="thumbnailUrl">
								Thumbnail URL
							</label>
							<Input
								id="thumbnailUrl"
								value={form.thumbnailUrl}
								onChange={handleChange("thumbnailUrl")}
								placeholder="Optional"
								className="border-white/10 bg-white/5 text-white"
							/>
						</div>
					</div>

					{error && (
						<div className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-sm text-rose-100">
							<AlertCircle className="mr-2 inline size-4" />
							{error}
						</div>
					)}

					{message && (
						<div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-sm text-emerald-100">
							<Check className="mr-2 inline size-4" />
							{message}
						</div>
					)}

					<div className="flex flex-wrap items-center gap-3">
						<Button type="submit" disabled={submitting}>
							{submitting ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Plus className="size-4" />
							)}
							<span className="ml-2">Send notification</span>
						</Button>
						<Button type="button" variant="secondary" disabled={refreshing} onClick={refreshRecent}>
							{refreshing ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Sparkles className="size-4" />
							)}
							<span className="ml-2">Refresh recent</span>
						</Button>
					</div>
				</form>

				<div className="space-y-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-white">
					<div className="flex flex-col gap-3">
						<h2 className="text-lg font-semibold">Quick samples</h2>
						<p className="text-sm text-white/60">
							Use these shortcuts to generate common notification variants instantly.
						</p>
						<div className="grid gap-2 text-sm">
							{NOTIFICATION_VARIANTS.map((variant) => (
								<Button
									key={`sample-${variant}`}
									variant="ghost"
									onClick={() => handleCreateSample(variant)}
									disabled={submitting}
									className="justify-start gap-3 text-white/80 hover:text-white"
								>
									<span className="size-2 rounded-full bg-white/40" />
									{variant.toUpperCase()} sample
								</Button>
							))}
						</div>
					</div>

					<Separator className="border-white/10" />

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold">Recent sent notifications</h2>
							<Button variant="ghost" size="sm" onClick={refreshRecent} disabled={refreshing}>
								{refreshing ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<Sparkles className="size-4" />
								)}
								<span className="ml-2">Refresh</span>
							</Button>
						</div>
						<div className="space-y-3 text-sm text-white/70">
							{recent.length === 0 ? (
								<p className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/60">
									No notifications yet. Create one with the form.
								</p>
							) : (
								recent.map((notification) => (
									<div
										key={notification.id}
										className="rounded-xl border border-white/10 bg-white/5 p-4"
									>
										<div className="flex items-center justify-between gap-3">
											<div>
												<p className="font-medium text-white">{notification.title}</p>
												<p className="text-xs text-white/40">
													{notification.variant} •{" "}
													{new Date(notification.createdAt).toLocaleString()}
												</p>
											</div>
											<span
												className={cn(
													"text-xs",
													notification.isPinned ? "text-orange-300" : "text-white/50"
												)}
											>
												{notification.isPinned ? "Pinned" : "Standard"}
											</span>
										</div>
										{notification.body && (
											<p className="mt-2 text-sm text-white/70">{notification.body}</p>
										)}
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
