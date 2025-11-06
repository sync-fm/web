"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

import {
	initPosthogClient,
	registerPosthogGlobals,
	unregisterPosthogGlobals,
} from "@/lib/analytics/client";

const release = process.env.NEXT_PUBLIC_APP_VERSION;
const environment = process.env.NEXT_PUBLIC_RUNTIME_ENV ?? process.env.NODE_ENV;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const lastPathRef = useRef<string | null>(null);

	useEffect(() => {
		const client = initPosthogClient();
		if (!client) return;

		const globals = Object.fromEntries(
			Object.entries({ environment, release }).filter(([, value]) => value),
		);
		if (Object.keys(globals).length) {
			registerPosthogGlobals(globals);
		}
		return () => {
			if (Object.keys(globals).length) {
				unregisterPosthogGlobals(Object.keys(globals));
			}
		};
	}, []);

	const url = useMemo(() => {
		if (!pathname) return undefined;
		const search = searchParams?.toString();
		return search ? `${pathname}?${search}` : pathname;
	}, [pathname, searchParams]);

	useEffect(() => {
		const client = initPosthogClient();
		if (!client || !url) return;

		if (lastPathRef.current === url) return;
		lastPathRef.current = url;

		client.capture("$pageview", {
			$current_url: typeof window !== "undefined" ? window.location.href : url,
			pathname,
			search: searchParams?.toString() || "",
		});
	}, [pathname, searchParams, url]);

	return <PHProvider client={posthog}>{children}</PHProvider>;
}
