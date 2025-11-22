/**
 * Notification Filters Component
 * Filter bar for notifications with search and variant filters
 */

"use client";

import { Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type VariantFilter = "all" | "info" | "success" | "warning" | "danger" | "system";

const VARIANT_LABELS: Record<VariantFilter, string> = {
	all: "All",
	info: "Info",
	success: "Success",
	warning: "Warnings",
	danger: "Alerts",
	system: "System",
};

interface NotificationFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	variantFilter: VariantFilter;
	onVariantFilterChange: (variant: VariantFilter) => void;
	showPinnedOnly: boolean;
	onShowPinnedOnlyChange: (value: boolean) => void;
}

export function NotificationFilters({
	search,
	onSearchChange,
	variantFilter,
	onVariantFilterChange,
	showPinnedOnly,
	onShowPinnedOnlyChange,
}: NotificationFiltersProps) {
	return (
		<div className="flex flex-col gap-4 md:flex-row md:items-center">
			<div className="relative flex-1 md:max-w-sm">
				<Search className="absolute left-2.5 top-2.5 size-4 text-muted-faint" />
				<Input
					type="search"
					placeholder="Search..."
					className="glass-border-medium glass-bg-light pl-9 text-foreground placeholder:text-muted-faint"
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
				/>
			</div>
			<div className="flex items-center gap-2">
				<Button
					variant={showPinnedOnly ? "secondary" : "ghost"}
					size="sm"
					onClick={() => onShowPinnedOnlyChange(!showPinnedOnly)}
					className={cn(
						"text-foreground hover:glass-bg-medium",
						showPinnedOnly && "glass-bg-medium"
					)}
				>
					<Star className={cn("mr-2 size-4", showPinnedOnly && "fill-current")} />
					Pinned
				</Button>
				<div className="h-4 w-px glass-bg-medium" />
				{(Object.keys(VARIANT_LABELS) as VariantFilter[]).map((variant) => (
					<Button
						key={variant}
						variant={variantFilter === variant ? "secondary" : "ghost"}
						size="sm"
						onClick={() => onVariantFilterChange(variant)}
						className={cn(
							"capitalize text-foreground hover:glass-bg-medium",
							variantFilter === variant && "glass-bg-medium"
						)}
					>
						{VARIANT_LABELS[variant]}
					</Button>
				))}
			</div>
		</div>
	);
}
