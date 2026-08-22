import "@fontsource/bricolage-grotesque/600.css";
import "@fontsource/bricolage-grotesque/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")),
  title: { default: "Bluesuite — Tools for the blockchain", template: "%s — Bluesuite" },
  description: "Purpose-built blockchain tooling from BLUEVALLEY LABS.",
  icons: { icon: "/bluevalleydao.jpg", apple: "/bluevalleydao.jpg" },
  openGraph: { type: "website", siteName: "Bluesuite", title: "Bluesuite — Tools for the blockchain", description: "Purpose-built blockchain tooling from BLUEVALLEY LABS.", images: [{ url: "/api/og?section=home", width: 1200, height: 630, alt: "Bluesuite — Tools for the blockchain" }] },
  twitter: { card: "summary_large_image", title: "Bluesuite — Tools for the blockchain", description: "Purpose-built blockchain tooling from BLUEVALLEY LABS.", images: ["/api/og?section=home"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><SiteShell>{children}</SiteShell></body></html>;
}
