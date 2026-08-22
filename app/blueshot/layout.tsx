import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blueshot",
  description: "Fast, read-only NFT ownership snapshots across supported chains.",
  openGraph: { title: "Blueshot — Snapshot ownership. Keep moving.", description: "Fast, read-only NFT ownership snapshots across supported chains.", images: [{ url: "/api/og?section=blueshot", width: 1200, height: 630, alt: "Blueshot — Snapshot ownership" }] },
  twitter: { card: "summary_large_image", images: ["/api/og?section=blueshot"] },
};

export default function BlueshotLayout({ children }: { children: React.ReactNode }) { return children; }
