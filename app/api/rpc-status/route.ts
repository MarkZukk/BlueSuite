import { NextResponse } from "next/server";
import { hasAlchemyApiKey } from "@/lib/runtime-config";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ configured: hasAlchemyApiKey() }, { headers: { "cache-control": "no-store" } });
}
