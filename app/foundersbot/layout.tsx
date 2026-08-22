import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FoundersBot",
  description: "The private operating layer for BlueValleyDAO.",
  openGraph: { title: "FoundersBot — A private operating layer.", description: "The private operating layer for BlueValleyDAO.", images: [{ url: "/api/og?section=foundersbot", width: 1200, height: 630, alt: "FoundersBot — A private operating layer" }] },
  twitter: { card: "summary_large_image", images: ["/api/og?section=foundersbot"] },
};

export default function FoundersBotLayout({ children }: { children: React.ReactNode }) { return children; }
