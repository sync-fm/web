/**
 * Subscription Tier Card Component
 * Displays subscription tier information
 */

"use client";

import { Check, Zap } from "lucide-react";

interface SubscriptionTierCardProps {
	tier: string;
}

const TIER_INFO = {
	free: {
		name: "Free",
		limit: "100 requests per hour",
		features: ["Basic API access", "Community support", "Standard rate limits"],
		color: "text-gray-400",
		bgColor: "bg-gray-400/20",
	},
	pro: {
		name: "Pro",
		limit: "1,000 requests per hour",
		features: ["Enhanced API access", "Priority support", "Higher rate limits"],
		color: "text-blue-400",
		bgColor: "bg-blue-400/20",
	},
	enterprise: {
		name: "Enterprise",
		limit: "10,000 requests per hour",
		features: ["Unlimited API access", "24/7 premium support", "Custom rate limits"],
		color: "text-purple-400",
		bgColor: "bg-purple-400/20",
	},
} as const;

export function SubscriptionTierCard({ tier }: SubscriptionTierCardProps) {
	const tierKey = (tier || "free") as keyof typeof TIER_INFO;
	const info = TIER_INFO[tierKey] || TIER_INFO.free;

	return (
		<div className="rounded-2xl border glass-border-light glass-bg-light p-6 backdrop-blur-xl">
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<div className={`rounded-full ${info.bgColor} p-2`}>
							<Zap className={`h-5 w-5 ${info.color}`} />
						</div>
						<div>
							<h3 className="text-xl font-bold text-foreground">{info.name}</h3>
							<p className="text-sm text-muted-medium">{info.limit}</p>
						</div>
					</div>

					<div className="mt-6 space-y-3">
						{info.features.map((feature) => (
							<div key={feature} className="flex items-center gap-2">
								<Check className="h-4 w-4 text-green-400 shrink-0" />
								<span className="text-sm text-foreground">{feature}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
