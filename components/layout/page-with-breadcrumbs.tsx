"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export interface Breadcrumb {
	label: string;
	href: Route;
}

interface PageWithBreadcrumbsProps {
	crumbs: Breadcrumb[];
	children: ReactNode;
}

export const PageWithBreadcrumbs = ({ crumbs, children }: PageWithBreadcrumbsProps) => {
	return (
		<div className="relative z-10 flex min-h-screen w-full flex-col">
			<motion.nav
				className="border-b glass-border-subtle glass-bg-light backdrop-blur-glass px-6 py-4 sm:px-10"
				initial={{ opacity: 0, y: -12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
			>
				<div className="mx-auto flex max-w-4xl items-center gap-2 text-sm">
					{crumbs.map((crumb, index) => {
						const isLast = index === crumbs.length - 1;
						return (
							<div key={crumb.href} className="flex items-center gap-2">
								{index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
								{isLast ? (
									<span className="font-medium text-foreground">{crumb.label}</span>
								) : (
									<Link
										href={crumb.href}
										className="text-muted-foreground transition hover:text-foreground"
									>
										{crumb.label}
									</Link>
								)}
							</div>
						);
					})}
				</div>
			</motion.nav>
			{children}
		</div>
	);
};
