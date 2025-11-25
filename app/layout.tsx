import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "SyncFM - Universal Music Links",
	description: "Share music across all streaming platforms with one link",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<head>
				<script async crossOrigin="anonymous" src="https://tweakcn.com/live-preview.min.js" />
			</head>
			<body>{children}</body>
		</html>
	);
}
