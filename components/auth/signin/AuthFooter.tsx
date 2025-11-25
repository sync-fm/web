import Link from "next/link";
import type { AuthFlowCopySchema } from "./constants";

interface AuthFooterProps {
	copy: AuthFlowCopySchema;
}

export function AuthFooter({ copy }: AuthFooterProps) {
	return (
		<div className="mt-8 space-y-2 rounded-3xl border glass-border-light glass-bg-medium p-4 text-center text-xs text-muted-foreground">
			<p>
				By {copy.agreementAction} you agree to our{" "}
				<Link href="/terms" className="text-primary/80 underline-offset-2 hover:underline">
					Terms of Service
				</Link>{" "}
				and{" "}
				<Link href="/privacy" className="text-primary/80 underline-offset-2 hover:underline">
					Privacy Policy
				</Link>
				.
			</p>
			<p className="text-muted-foreground/80">
				Need help? Email{" "}
				<a href="mailto:hi@syncfm.dev" className="underline-offset-2 hover:underline">
					hi@syncfm.dev
				</a>{" "}
				or hop in the Discord.
			</p>
		</div>
	);
}
