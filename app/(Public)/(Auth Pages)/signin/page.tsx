"use client";

import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import {
	type OAuthSignInHandler,
	OauthButtonGroup,
	type Provider,
} from "@/components/auth/oauth-buttons";
import { AuthCard } from "@/components/auth/signin/AuthCard";
import { AuthError } from "@/components/auth/signin/AuthError";
import { AuthFooter } from "@/components/auth/signin/AuthFooter";
import { AuthHeader } from "@/components/auth/signin/AuthHeader";
import { AuthToggle } from "@/components/auth/signin/AuthToggle";
import {
	AUTH_FLOW_STRINGS,
	type AuthFlowCopySchema,
	type OAuthFlowType,
	parser,
	providerConfigs,
} from "@/components/auth/signin/constants";
import { createStateStringResolver } from "@/components/auth/signin/utils";
import { LandingFooter } from "@/components/layout/footer";
import { PageBackground } from "@/components/layout/page-background";
import type { Breadcrumb } from "@/components/layout/page-with-breadcrumbs";
import { PageWithBreadcrumbs } from "@/components/layout/page-with-breadcrumbs";
import { createClient } from "@/lib/supabase/client";

const resolveAuthFlowStrings = createStateStringResolver<OAuthFlowType, AuthFlowCopySchema>(
	AUTH_FLOW_STRINGS,
	"signin"
);

export default function SignInPage() {
	const [loading, setLoading] = useState<Provider | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [signInType, setSignInType] = useQueryState("t", parser.withDefault("signin"));
	const copy = useMemo(() => resolveAuthFlowStrings(signInType), [signInType]);
	const crumbs = useMemo(
		() =>
			[
				{ label: "Home", href: "/" },
				{ label: copy.breadcrumb, href: "/auth/signin" },
			] as Breadcrumb[],
		[copy.breadcrumb]
	);

	const handleSignIn: OAuthSignInHandler = async ({ provider, setLoading, setError }) => {
		setLoading(provider);
		setError(null);

		try {
			const supabase = createClient();
			const { error } = await supabase.auth.signInWithOAuth({
				provider,
				options: {
					redirectTo: `${window.location.origin}/api/auth/callback`,
					skipBrowserRedirect: false,
				},
			});

			if (error) {
				setError(error.message);
				setLoading(null);
				return;
			}
		} catch (err) {
			console.error("Sign in error:", err);
			setError("An unexpected error occurred");
			setLoading(null);
		}
	};

	return (
		<PageBackground>
			<PageWithBreadcrumbs crumbs={crumbs}>
				<main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 pb-16 pt-8 sm:px-10">
					<section className="flex flex-1 items-center justify-center py-6">
						<AuthCard>
							<AuthHeader signInType={signInType} copy={copy} />

							<AuthError error={error} />

							<div className="mt-6 flex flex-col gap-3">
								<OauthButtonGroup
									providers={providerConfigs}
									onSignIn={handleSignIn}
									loading={loading}
									setLoading={setLoading}
									error={error}
									setError={setError}
								/>
							</div>

							<AuthToggle
								signInType={signInType}
								copy={copy}
								onToggle={(target) => void setSignInType(target)}
							/>

							<AuthFooter copy={copy} />
						</AuthCard>
					</section>
				</main>
				<LandingFooter />
			</PageWithBreadcrumbs>
		</PageBackground>
	);
}
