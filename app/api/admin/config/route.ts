import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin-auth";
import { hasAlchemyApiKey, hasOpenSeaApiKey, setAlchemyApiKey, setOpenSeaApiKey } from "@/lib/runtime-config";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  return verifySession(request.cookies.get(ADMIN_COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ alchemyConfigured: hasAlchemyApiKey(), openseaConfigured: hasOpenSeaApiKey() }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { alchemyKey?: string; openseaKey?: string };
  const hasAlchemy = typeof body.alchemyKey === "string";
  const hasOpenSea = typeof body.openseaKey === "string";
  if (!hasAlchemy && !hasOpenSea) {
    return NextResponse.json({ error: "Provide an Alchemy or OpenSea API key." }, { status: 400 });
  }
  if (hasAlchemy) {
    const key = body.alchemyKey!.trim();
    if (key.length < 8 || key.length > 256 || /\s/.test(key)) {
      return NextResponse.json({ error: "Enter a valid Alchemy API key." }, { status: 400 });
    }
    setAlchemyApiKey(key);
  }
  if (hasOpenSea) {
    const key = body.openseaKey!.trim();
    if (key.length < 8 || key.length > 256 || /\s/.test(key)) {
      return NextResponse.json({ error: "Enter a valid OpenSea API key." }, { status: 400 });
    }
    setOpenSeaApiKey(key);
  }
  return NextResponse.json({ ok: true, alchemyConfigured: hasAlchemyApiKey(), openseaConfigured: hasOpenSeaApiKey() }, { headers: { "cache-control": "no-store" } });
}
