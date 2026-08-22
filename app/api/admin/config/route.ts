import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin-auth";
import { hasAlchemyApiKey, setAlchemyApiKey } from "@/lib/runtime-config";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  return verifySession(request.cookies.get(ADMIN_COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ alchemyConfigured: hasAlchemyApiKey() }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { alchemyKey?: string };
  const key = typeof body.alchemyKey === "string" ? body.alchemyKey.trim() : "";
  if (key.length < 8 || key.length > 256 || /\s/.test(key)) {
    return NextResponse.json({ error: "Enter a valid Alchemy API key." }, { status: 400 });
  }
  const configured = setAlchemyApiKey(key);
  return NextResponse.json({ ok: true, alchemyConfigured: configured }, { headers: { "cache-control": "no-store" } });
}
