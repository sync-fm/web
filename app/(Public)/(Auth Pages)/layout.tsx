import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type ReactNode, Suspense } from "react";
export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<Suspense>
			<NuqsAdapter>{children}</NuqsAdapter>
		</Suspense>
	);
}
