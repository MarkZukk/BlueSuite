import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FoundersBot",
  description: "Seven-chain wallet intelligence, readable Discord alerts, protected copy-minting, and private operator workflows for BlueValleyDAO.",
  openGraph: { title: "FoundersBot — Your community's alpha layer.", description: "Seven-chain wallet intelligence, readable Discord alerts, protected copy-minting, and private operator workflows for BlueValleyDAO.", images: [{ url: "/api/og?section=foundersbot", width: 1200, height: 630, alt: "FoundersBot — Your community's alpha layer" }] },
  twitter: { card: "summary_large_image", images: ["/api/og?section=foundersbot"] },
};

export default function FoundersBotLayout({ children }: { children: React.ReactNode }) { return children; }
