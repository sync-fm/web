import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://syncfm.dev'),
  title: "SyncFM — Universal music links",
  description:
    "Discover and convert songs, albums, and artists across streaming platforms — Spotify, Apple Music, YouTube Music and more.",
  openGraph: {
    title: "SyncFM — Universal music links",
    description:
      "Discover and convert songs, albums, and artists across streaming platforms — Spotify, Apple Music, YouTube Music and more.",
    type: "website",
    url: "https://syncfm.dev",
    images: [
      {
        url: "/og-image.png",
        alt: "SyncFM — universal music links",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SyncFM — Universal music links",
    description:
      "Discover and convert songs, albums, and artists across streaming platforms.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
