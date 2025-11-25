"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, LogOut } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavRoute } from "./Navigation";

type QuickAction = {
	id: string;
	href: Route;
	title: string;
	icon: ReactNode;
	requiresAdmin?: boolean;
};

interface MobileNavigationProps {
	routes: NavRoute[];
	quickActions: QuickAction[];
	displayName: string;
	tierLabel: string;
	avatarUrl?: string;
	handleSignOut: () => Promise<void>;
	isAdmin?: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function MobileNavigation({
	routes,
	quickActions,
	displayName,
	tierLabel,
	avatarUrl,
	handleSignOut,
	isAdmin,
	open,
	onOpenChange,
}: MobileNavigationProps) {
	const pathname = usePathname();

	const filteredQuickActions = quickActions.filter((action) => !action.requiresAdmin || isAdmin);

	const normalizedPath = pathname?.replace(/\/$/, "") || "/";
	const normalizeLink = (link: string) => (link === "/" ? "/" : link.replace(/\/$/, ""));

	const isNavRouteActive = (route: NavRoute) => {
		const base = normalizeLink(route.link);
		const matchesExact = normalizedPath === base;
		const strategy = route.matchStrategy ?? "startsWith";

		if (strategy === "exact") {
			return matchesExact;
		}

		return matchesExact || normalizedPath.startsWith(`${base}/`);
	};

	const handleClose = () => onOpenChange(false);

	const handleSignOutClick = async () => {
		handleClose();
		await handleSignOut();
	};

	const AvatarCircle = () => {
		if (avatarUrl) {
			return (
				<Avatar className="size-12 ring-2 glass-border-light">
					<AvatarImage src={avatarUrl} alt={displayName} />
					<AvatarFallback className="glass-bg-medium text-muted-medium">
						{displayName[0]?.toUpperCase()}
					</AvatarFallback>
				</Avatar>
			);
		}
		return (
			<div className="flex size-12 items-center justify-center rounded-full bg-linear-to-br from-primary/90 via-primary/80 to-secondary/80 text-primary-foreground ring-2 glass-border-light">
				<span className="text-base font-semibold">{displayName[0]?.toUpperCase()}</span>
			</div>
		);
	};

	return (
		<>
			{open && (
				<div
					className="fixed inset-0 z-40 bg-background/20 backdrop-blur-sm lg:hidden"
					onClick={handleClose}
					aria-hidden="true"
				/>
			)}
			<div className="fixed left-4 right-4 top-20 z-50 lg:hidden">
				<AnimatePresence mode="wait">
					{open && (
						<motion.div
							initial={{ opacity: 0, y: -10, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -10, scale: 0.95 }}
							transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
							className="mx-auto w-full max-w-md rounded-2xl p-0 glass-border-light bg-background/95 shadow-glass-xl backdrop-blur-glass overflow-hidden"
						>
							{/* iOS-style folder navigation */}
							<div className="max-h-[70vh] overflow-y-auto p-4 space-y-2">
								<div className="grid grid-cols-2 gap-2">
									{routes.map((route) => {
										const isActive = isNavRouteActive(route);
										return (
											<Link
												key={route.id}
												href={route.link}
												onClick={handleClose}
												className={cn(
													"group relative flex flex-col items-center gap-3 rounded-2xl p-4 transition-all duration-200",
													isActive
														? "bg-sidebar-primary/10 ring-1 ring-sidebar-primary/20 shadow-sm"
														: "glass-bg-light hover:glass-bg-medium active:scale-95"
												)}
											>
												<motion.div
													className={cn(
														"flex size-14 items-center justify-center rounded-2xl transition-all duration-200",
														isActive
															? "bg-sidebar-primary text-primary-foreground shadow-brand-sm"
															: "glass-bg-medium text-foreground group-hover:glass-bg-strong"
													)}
													whileTap={{ scale: 0.95 }}
												>
													<div className="size-6">{route.icon}</div>
												</motion.div>
												<span
													className={cn(
														"text-xs font-medium text-center line-clamp-2 transition-colors duration-200",
														isActive
															? "text-sidebar-primary font-semibold"
															: "text-muted-medium group-hover:text-foreground"
													)}
												>
													{route.title}
												</span>
												{isActive && (
													<motion.div
														layoutId="active-indicator"
														className="absolute inset-0 rounded-2xl bg-sidebar-primary/5"
														transition={{
															type: "spring",
															stiffness: 400,
															damping: 30,
														}}
													/>
												)}
											</Link>
										);
									})}
								</div>
							</div>

							{/* Divider */}
							<div className="h-px glass-bg-subtle" />

							{/* Quick Actions */}
							{filteredQuickActions.length > 0 && (
								<>
									<div className="p-3 space-y-1">
										{filteredQuickActions.map((action) => (
											<Link
												key={action.id}
												href={action.href}
												onClick={handleClose}
												className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 glass-bg-light hover:glass-bg-medium active:scale-[0.98]"
											>
												<span className="flex items-center gap-2.5 text-muted-medium">
													<span className="flex size-8 items-center justify-center rounded-lg glass-bg-medium text-foreground">
														{action.icon}
													</span>
													<span>{action.title}</span>
												</span>
												<ChevronRight className="size-4 text-muted-subtle" />
											</Link>
										))}
									</div>
									<div className="h-px glass-bg-subtle" />
								</>
							)}

							{/* User Info & Sign Out */}
							<div className="p-4 space-y-3 mt-auto">
								<div className="flex items-center gap-3 rounded-2xl glass-bg-medium p-3">
									<AvatarCircle />
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
										<p className="text-xs uppercase tracking-wide text-muted-medium">
											{tierLabel} tier
										</p>
									</div>
								</div>

								<Button
									type="button"
									onClick={handleSignOutClick}
									className="w-full justify-center gap-2 rounded-xl bg-primary text-primary-foreground shadow-brand-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
								>
									<LogOut className="size-4" />
									<span>Sign Out</span>
								</Button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</>
	);
}
