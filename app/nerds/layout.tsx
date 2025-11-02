import { createMetadata } from "@/lib/utils";

export const metadata = createMetadata({
	baseUrl: "https://syncfm.dev",
	title: "SyncFM for the nerds",
	description: `A lil place for the nerds who care about the * in "it just works*" - Explore the infrastructure, adapters, and experiments that make universal music links work & help us press play on the future of music sharing.`,
	url: "https://syncfm.dev/nerds",
	image: "/og-image.png",
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return children;
}
