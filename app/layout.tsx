import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createMetadata } from "@/lib/utils";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata = createMetadata({
	baseUrl: "https://syncfm.dev",
	title: "SyncFM - Universal music links",
	description:
		"Share and convert songs, albums, and artists across streaming platforms - Spotify, Apple Music, YouTube Music and more.",
	url: "https://syncfm.dev/",
	image: "/og-image.png",
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1.0, viewport-fit=cover"
				/>
				<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
				<link rel="icon" href="/favicon.ico" />

				<meta name="theme-color" content="#FF7D00" />
				<meta
					name="apple-mobile-web-app-status-bar-style"
					content="black-translucent"
				/>
			</head>
			<body
				className={`overflow-x-hidden ${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
