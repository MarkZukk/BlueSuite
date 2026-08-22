import { NextRequest, NextResponse } from "next/server";

const COOKIE = "bluesuite_admin";
async function valid(value: string | undefined) {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
    if (!value || !secret) return false;
    const [expires, signature] = value.split(".");
    const expiry = Number(expires);
    if (!expires || !signature || !Number.isSafeInteger(expiry) || expiry < Math.floor(Date.now() / 1000)) return false;
    // This key is used to recompute the signature, so its Web Crypto usage
    // must be "sign" (using "verify" here makes the middleware throw).
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const expected = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(expires));
    const encoded = btoa(String.fromCharCode(...new Uint8Array(expected))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return encoded === signature;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  if (!(await valid(request.cookies.get(COOKIE)?.value))) return NextResponse.redirect(new URL("/admin/login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
