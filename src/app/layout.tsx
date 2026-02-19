import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FontFinder — Discover & Download Fonts from Any Website",
  description:
    "Scan any website URL to discover all fonts used. Preview, compare side by side, and download individually or in bulk as ZIP. Supports Google Fonts, Adobe Typekit, and custom web fonts.",
  keywords: ["font finder", "web fonts", "font downloader", "font scanner", "google fonts", "woff2", "font preview"],
  authors: [{ name: "FontFinder" }],
  openGraph: {
    title: "FontFinder — Discover & Download Fonts from Any Website",
    description: "Scan any website URL to discover all fonts used. Preview, compare, and download them.",
    url: "https://website-font-finder.vercel.app",
    siteName: "FontFinder",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FontFinder — Discover & Download Fonts from Any Website",
    description: "Scan any website to find, preview, compare, and download fonts.",
  },
  metadataBase: new URL("https://website-font-finder.vercel.app"),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
