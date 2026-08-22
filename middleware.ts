import { NextRequest, NextResponse } from "next/server";

const COOKIE = "bluesuite_admin";
async function valid(value: string | undefined) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!value || !secret) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || Number(expires) < Math.floor(Date.now() / 1000)) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  // Recompute the base64url signature using Web Crypto and compare without exposing the secret.
  const expected = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(expires));
  const encoded = btoa(String.fromCharCode(...new Uint8Array(expected))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return encoded === signature;
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  if (!(await valid(request.cookies.get(COOKIE)?.value))) return NextResponse.redirect(new URL("/admin/login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
