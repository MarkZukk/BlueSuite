import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Control Center",
  description: "Secure Bluesuite operator control center.",
  openGraph: { title: "Bluesuite Control Center", description: "Secure Bluesuite operator control center.", images: [{ url: "/api/og?section=admin", width: 1200, height: 630, alt: "Bluesuite Control Center" }] },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) { return children; }
