import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BlueHelper",
  description: "Batch operations for the heavy lifting on-chain.",
  openGraph: { title: "BlueHelper — The heavy lifting, handled in batches.", description: "Batch operations for the heavy lifting on-chain.", images: [{ url: "/api/og?section=bluehelper", width: 1200, height: 630, alt: "BlueHelper — Batch operations" }] },
  twitter: { card: "summary_large_image", images: ["/api/og?section=bluehelper"] },
};

export default function BlueHelperLayout({ children }: { children: React.ReactNode }) { return children; }
