"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useMemo, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuItem as SidebarMenuSubItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type NavRoute = {
	id: string;
	title: string;
	icon?: React.ReactNode;
	link: Route;
	matchStrategy?: "exact" | "startsWith";
	subs?: {
		title: string;
		link: Route;
		icon?: React.ReactNode;
	}[];
};

export default function DashboardNavigation({ routes }: { routes: NavRoute[] }) {
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";
	const pathname = usePathname();
	const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);

	const normalizedPath = useMemo(() => pathname?.replace(/\/$/, "") || "/", [pathname]);

	const normalizeLink = (link: string) => (link === "/" ? "/" : link.replace(/\/$/, ""));

	const isNavRouteActive = (route: NavRoute) => {
		const base = normalizeLink(route.link);
		const strategy = route.matchStrategy ?? "startsWith";
		const matchesExact = normalizedPath === base;

		if (strategy === "exact") {
			return matchesExact;
		}

		return matchesExact || normalizedPath.startsWith(`${base}/`);
	};

	return (
		<SidebarMenu>
			{routes.map((route) => {
				const routeActive = isNavRouteActive(route);
				const isOpen = !isCollapsed && (openCollapsible === route.id || routeActive);
				const hasSubNavRoutes = !!route.subs?.length;

				return (
					<SidebarMenuItem key={route.id}>
						{hasSubNavRoutes ? (
							<Collapsible
								open={isOpen}
								onOpenChange={(open) => setOpenCollapsible(open ? route.id : null)}
								className="w-full"
							>
								<CollapsibleTrigger asChild>
									<SidebarMenuButton
										className={cn(
											"flex w-full items-center rounded-xl px-3 py-2 transition-all duration-200",
											routeActive
												? "bg-sidebar-primary/10 text-sidebar-primary font-medium shadow-sm ring-1 ring-sidebar-primary/20"
												: isOpen
													? "glass-bg-medium text-foreground font-medium"
													: "text-muted-foreground hover:glass-bg-light hover:text-foreground",
											isCollapsed && "justify-center"
										)}
									>
										{route.icon}
										{!isCollapsed && (
											<span className="ml-2 flex-1 text-sm font-medium">{route.title}</span>
										)}
										{!isCollapsed && hasSubNavRoutes && (
											<span className="ml-auto">
												{isOpen ? (
													<ChevronUp className="size-4" />
												) : (
													<ChevronDown className="size-4" />
												)}
											</span>
										)}
									</SidebarMenuButton>
								</CollapsibleTrigger>

								{!isCollapsed && (
									<CollapsibleContent>
										<SidebarMenuSub className="my-1 ml-3.5">
											{route.subs?.map((subNavRoute) => (
												<SidebarMenuSubItem
													key={`${route.id}-${subNavRoute.title}`}
													className="h-auto"
												>
													<SidebarMenuSubButton asChild>
														<Link
															href={subNavRoute.link}
															prefetch={true}
															className={cn(
																"flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
																normalizedPath ===
																	(subNavRoute.link === "/"
																		? "/"
																		: subNavRoute.link.replace(/\/$/, ""))
																	? "bg-sidebar-primary/10 text-sidebar-primary font-semibold shadow-sm ring-1 ring-sidebar-primary/20"
																	: "text-muted-light hover:glass-bg-light hover:text-foreground"
															)}
															aria-current={
																normalizedPath ===
																(subNavRoute.link === "/"
																	? "/"
																	: subNavRoute.link.replace(/\/$/, ""))
																	? "page"
																	: undefined
															}
														>
															{subNavRoute.title}
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											))}
										</SidebarMenuSub>
									</CollapsibleContent>
								)}
							</Collapsible>
						) : (
							<SidebarMenuButton
								tooltip={route.title}
								className={cn(
									routeActive
										? "bg-sidebar-primary/10 text-sidebar-primary font-medium shadow-sm ring-1 ring-sidebar-primary/20"
										: "text-muted-foreground hover:glass-bg-light hover:text-foreground"
								)}
								asChild
							>
								<Link
									href={route.link}
									prefetch={true}
									className={cn(
										"flex items-center rounded-xl px-3 py-2 transition-all duration-200",
										isCollapsed && "justify-center"
									)}
									aria-current={routeActive ? "page" : undefined}
								>
									{route.icon}
									{!isCollapsed && <span className="ml-2 text-sm font-medium">{route.title}</span>}
								</Link>
							</SidebarMenuButton>
						)}
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);
}
