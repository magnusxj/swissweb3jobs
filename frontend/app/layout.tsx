import type { Metadata, Viewport } from "next";
import {
  HOME_DESCRIPTION,
  HOME_KEYWORDS,
  HOME_TITLE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import { Oswald } from "next/font/google";
const oswald = Oswald({ subsets: ["latin"], weight: ["700"], variable: "--font-oswald" });

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: "%s | Web3 Jobs Switzerland",
  },
  description: HOME_DESCRIPTION,
  keywords: [...HOME_KEYWORDS],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: SITE_NAME,
    url: "/",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full scroll-smooth antialiased ${oswald.variable}`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
