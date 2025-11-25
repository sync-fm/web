"use client";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { BarChart3, Home, Key, LayoutDashboard, LogOut, Settings } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactElement } from "react";
import { MobileNavigation } from "@/components/dashboard/MobileNavigation";
import DashboardNavigation from "@/components/dashboard/Navigation";
import { NotificationsPopover } from "@/components/dashboard/Notifications";
import { SyncFMIcon } from "@/components/SyncFMIcon";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { NavRoute } from "./Navigation";

const dashboardNavRoutes: NavRoute[] = [
	{
		id: "overview",
		link: "/dashboard",
		matchStrategy: "exact",
		title: "Overview",
		icon: <LayoutDashboard />,
	},
	{
		id: "api-keys",
		link: "/dashboard/api-keys",
		title: "API Keys",
		icon: <Key />,
	},
	{
		id: "usage",
		link: "/dashboard/usage",
		title: "Usage",
		icon: <BarChart3 />,
	},
	{
		id: "settings",
		link: "/dashboard/settings",
		title: "Settings",
		icon: <Settings />,
	},
];

const quickActions: {
	id: string;
	href: Route;
	title: string;
	icon: ReactElement;
	requiresAdmin?: boolean;
}[] = [
	{
		id: "home",
		href: "/",
		title: "Back to Home",
		icon: <Home className="size-4" />,
	},
];

interface DashboardSidebarProps {
	user: SupabaseUser | null;
	profile: {
		username?: string;
		avatar_url?: string;
		subscription_tier?: string;
		is_admin?: boolean;
	} | null;
	handleSignOut: () => Promise<void>;
}

export function DashboardSidebar({ user, profile, handleSignOut }: DashboardSidebarProps) {
	const { state, isMobile, openMobile, setOpenMobile } = useSidebar();
	const isCollapsed = state === "collapsed";
	const filteredQuickActions = quickActions.filter(
		(action) => !action.requiresAdmin || profile?.is_admin
	);
	const displayName = profile?.username || user?.email?.split("@")[0] || "User";
	const tierSource = profile?.subscription_tier?.trim() || "Free";
	const tierValue = tierSource.toLowerCase();
	const tierLabel = tierValue.charAt(0).toUpperCase() + tierValue.slice(1);

	const AvatarCircle = ({ className = "size-10" }: { className?: string }) => {
		if (profile?.avatar_url) {
			return (
				<img
					src={profile.avatar_url}
					alt={displayName}
					className={cn(
						"aspect-square h-auto w-auto rounded-full object-cover ring-2 ring-sidebar-border/60",
						className
					)}
				/>
			);
		}
		return (
			<div
				className={cn(
					"flex aspect-square items-center justify-center rounded-full bg-linear-to-br from-sidebar-primary/90 via-sidebar-primary/80 to-sidebar-accent/80 text-sidebar-primary-foreground ring-1 ring-sidebar-border/60",
					className
				)}
			>
				<span className="text-sm font-semibold">{displayName[0]?.toUpperCase()}</span>
			</div>
		);
	};

	if (isMobile) {
		return (
			<MobileNavigation
				routes={dashboardNavRoutes}
				quickActions={filteredQuickActions}
				displayName={displayName}
				tierLabel={tierLabel}
				avatarUrl={profile?.avatar_url}
				handleSignOut={handleSignOut}
				isAdmin={profile?.is_admin}
				open={openMobile}
				onOpenChange={setOpenMobile}
			/>
		);
	}

	const footerPanel = (
		<div className="space-y-4 rounded-2xl glass-border-light bg-linear-to-br from-glass-bg-medium via-glass-bg-light to-transparent px-3 py-4 text-foreground shadow-glass-lg backdrop-blur-glass">
			{filteredQuickActions.length > 0 && (
				<SidebarMenu className="gap-2">
					{filteredQuickActions.map((action) => (
						<SidebarMenuItem key={action.id}>
							<SidebarMenuButton
								asChild
								tooltip={action.title}
								className="rounded-xl glass-border-light glass-bg-medium text-muted-medium shadow-sm transition hover:glass-border-medium hover:glass-bg-strong hover:text-foreground"
							>
								<Link href={action.href} prefetch={true} className="flex w-full items-center gap-2">
									{action.icon}
									<span className="text-sm font-medium">{action.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			)}

			<div className="flex items-center gap-3 rounded-2xl glass-border-light glass-bg-medium p-3 text-foreground">
				<AvatarCircle />
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
					<p className="text-xs uppercase tracking-wide text-muted-medium">{tierLabel} tier</p>
				</div>
			</div>

			<Button
				type="button"
				onClick={handleSignOut}
				variant="ghost"
				className="w-full justify-center gap-2 rounded-xl glass-border-light glass-bg-medium text-muted-medium transition hover:glass-border-medium hover:glass-bg-strong hover:text-foreground"
			>
				<LogOut className="h-4 w-4" />
				<span>Sign Out</span>
			</Button>
		</div>
	);

	return (
		<Sidebar variant="floating" collapsible="icon">
			<SidebarHeader
				className={cn(
					"flex w-full md:pt-3.5",
					isCollapsed
						? "flex-col items-center justify-center gap-3"
						: "flex-row items-center justify-between"
				)}
			>
				<motion.div
					className={cn(
						"flex items-center gap-2 text-sidebar-foreground transition hover:text-sidebar-foreground/80",
						isCollapsed && "w-full justify-center"
					)}
				>
					<SyncFMIcon
						clickable={true}
						href={"/"}
						animate={false}
						size={10}
						className="rounded-lg"
					/>
					{!isCollapsed && <span className="font-semibold text-foreground">SyncFM</span>}
				</motion.div>

				<motion.div
					key={isCollapsed ? "header-collapsed" : "header-expanded"}
					className={cn(
						"flex items-center gap-2",
						isCollapsed ? "w-full flex-col justify-center" : "flex-row"
					)}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.8 }}
				>
					<NotificationsPopover
						userId={user?.id}
						triggerClassName={cn(
							isCollapsed
								? "mx-auto size-12! rounded-2xl glass-border-light glass-bg-light text-sidebar-foreground hover:glass-bg-medium"
								: "text-sidebar-foreground"
						)}
					/>
					<SidebarTrigger
						className={cn(
							isCollapsed
								? "mx-auto size-12! rounded-2xl glass-border-light glass-bg-light text-sidebar-foreground hover:glass-bg-medium"
								: "text-sidebar-foreground"
						)}
					/>
				</motion.div>
			</SidebarHeader>
			<SidebarContent className="gap-4 px-2 py-4">
				<DashboardNavigation routes={dashboardNavRoutes} />
			</SidebarContent>
			<SidebarFooter className="px-2 pb-4">
				{isCollapsed ? (
					<Popover>
						<PopoverTrigger asChild>
							<motion.button
								type="button"
								className="inline-flex size-12 items-center justify-center rounded-full glass-border-light glass-bg-medium text-sidebar-foreground shadow-glass-md transition hover:glass-border-medium hover:glass-bg-strong"
								whileTap={{ scale: 0.96 }}
								aria-label="Open account menu"
							>
								<AvatarCircle className="size-10" />
							</motion.button>
						</PopoverTrigger>
						<PopoverContent
							side="right"
							align="start"
							className="w-80 glass-border-light bg-sidebar/95 p-0 text-sidebar-foreground shadow-glass-xl backdrop-blur-glass"
						>
							<motion.div
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2, ease: "easeOut" }}
							>
								{footerPanel}
							</motion.div>
						</PopoverContent>
					</Popover>
				) : (
					footerPanel
				)}
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
