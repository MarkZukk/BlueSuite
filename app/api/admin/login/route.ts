import { NextResponse } from "next/server";
import { ADMIN_COOKIE, configured, createSession, passwordMatches } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!configured()) return NextResponse.json({ error: "Admin authentication is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET." }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { password?: string };
  if (!body.password || !passwordMatches(body.password)) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createSession(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 8 });
  return response;
}
