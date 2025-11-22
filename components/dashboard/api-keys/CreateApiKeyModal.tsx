/**
 * Create API Key Modal Component
 * Modal for creating new API keys
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Copy } from "lucide-react";
import { useState } from "react";

interface CreateApiKeyModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (name: string, rateLimit: number) => Promise<void>;
	createdKey: string | null;
	onCopyKey: (key: string) => void;
	copiedKey: boolean;
}

export function CreateApiKeyModal({
	isOpen,
	onClose,
	onCreate,
	createdKey,
	onCopyKey,
	copiedKey,
}: CreateApiKeyModalProps) {
	const [keyName, setKeyName] = useState("");
	const [rateLimit, setRateLimit] = useState(1000);
	const [creating, setCreating] = useState(false);

	const handleCreate = async () => {
		if (!keyName.trim()) return;
		setCreating(true);
		try {
			await onCreate(keyName.trim(), rateLimit);
			setKeyName("");
			setRateLimit(1000);
		} finally {
			setCreating(false);
		}
	};

	const handleClose = () => {
		setKeyName("");
		setRateLimit(1000);
		onClose();
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={handleClose}
						className="fixed inset-0 z-50 glass-bg-strong backdrop-blur-sm"
					/>
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border glass-border-medium glass-bg-medium p-6 shadow-glass-xl backdrop-blur-xl"
					>
						{createdKey ? (
							// Show created key
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<div className="rounded-full bg-green-500/20 p-3">
										<CheckCircle className="h-6 w-6 text-green-400" />
									</div>
									<div>
										<h3 className="text-lg font-semibold text-foreground">API Key Created!</h3>
										<p className="text-sm text-muted-medium">
											Copy this key now - you won't see it again
										</p>
									</div>
								</div>

								<div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
									<p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary-foreground/80">
										Your API Key
									</p>
									<div className="flex items-center gap-2">
										<code className="flex-1 overflow-x-auto rounded glass-bg-light px-3 py-2 font-mono text-sm text-foreground">
											{createdKey}
										</code>
										<button
											type="button"
											onClick={() => onCopyKey(createdKey)}
											className="glass-bg-light rounded-lg p-2 transition hover:glass-bg-medium"
											aria-label="Copy key"
										>
											{copiedKey ? (
												<CheckCircle className="h-5 w-5 text-green-400" />
											) : (
												<Copy className="h-5 w-5 text-foreground" />
											)}
										</button>
									</div>
								</div>

								<p className="text-sm text-muted-medium">
									⚠️ Store this key securely. For security reasons, we won't show it again.
								</p>

								<button
									type="button"
									onClick={handleClose}
									className="w-full rounded-lg bg-gradient-brand px-4 py-2 font-semibold text-primary-foreground shadow-brand-sm transition hover:shadow-brand-md"
								>
									Done
								</button>
							</div>
						) : (
							// Create key form
							<div className="space-y-4">
								<h3 className="text-xl font-bold text-foreground">Create New API Key</h3>

								<div>
									<label className="mb-2 block text-sm font-medium text-foreground/80">
										Key Name
										<input
											type="text"
											value={keyName}
											onChange={(e) => setKeyName(e.target.value)}
											placeholder="Production App"
											className="glass-bg-light glass-border-medium w-full rounded-lg px-4 py-2 text-foreground placeholder-white/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
										/>
									</label>
								</div>

								<div>
									<label className="mb-2 block text-sm font-medium text-foreground/80">
										Rate Limit (requests/hour)
										<input
											type="number"
											value={rateLimit}
											onChange={(e) => setRateLimit(Number.parseInt(e.target.value, 10))}
											min="1"
											max="10000"
											className="glass-bg-light glass-border-medium w-full rounded-lg px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
										/>
									</label>
									<p className="mt-1 text-xs text-muted-faint">Maximum requests allowed per hour</p>
								</div>

								<div className="flex gap-3">
									<button
										type="button"
										onClick={handleClose}
										className="glass-bg-light glass-border-medium flex-1 rounded-lg px-4 py-2 font-medium text-foreground transition hover:glass-bg-medium"
									>
										Cancel
									</button>
									<button
										type="button"
										onClick={handleCreate}
										disabled={!keyName.trim() || creating}
										className="flex-1 rounded-lg bg-gradient-brand px-4 py-2 font-semibold text-primary-foreground shadow-brand-sm transition hover:shadow-brand-md disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{creating ? "Creating..." : "Create Key"}
									</button>
								</div>
							</div>
						)}
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
