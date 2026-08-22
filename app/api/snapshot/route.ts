import { NextResponse } from "next/server";
import { alchemyNftUrl, chains, isAddress, type ChainId } from "@/lib/chains";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.json() as { chain?: ChainId; collection?: string; address?: string };
    const chain = body.chain && body.chain in chains ? body.chain : "ethereum";
    const key = process.env.ALCHEMY_API_KEY;
    if (!body.collection || !isAddress(body.collection)) return NextResponse.json({ error: "A valid collection contract address is required." }, { status: 400 });
    if (!key) return NextResponse.json({ error: "Snapshot service is not configured. Add ALCHEMY_API_KEY on the server." }, { status: 503 });
    // Robinhood's explorer exposes the same paginated holder primitive used by Mojihood.
    if (chain === "robinhood") {
      const holders: { address: string; items: number }[] = [];
      let next: Record<string, string> | undefined;
      do {
        const url = new URL(`https://robinhoodchain.blockscout.com/api/v2/tokens/${body.collection}/holders`);
        Object.entries(next ?? {}).forEach(([k, v]) => url.searchParams.set(k, v));
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return NextResponse.json({ error: `Robinhood explorer returned ${response.status}.` }, { status: 502 });
        const page = await response.json();
        for (const item of page.items ?? []) if (item.address?.hash && Number(item.value) > 0) holders.push({ address: item.address.hash, items: Number(item.value) });
        next = page.next_page_params;
      } while (next);
      if (!holders.length) return NextResponse.json({ error: "No holders found for this collection." }, { status: 404 });
      return NextResponse.json({ chain, collection: body.collection, holders });
    }
    const response = await fetch(alchemyNftUrl(chain, key, body.collection), { cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "Chain provider unavailable." }, { status: 502 });
    const data = await response.json();
    const holders = (data.owners ?? []).map((owner: { ownerAddress?: string; tokenBalances?: { tokenId?: string; balance?: string }[] }) => ({ address: owner.ownerAddress, items: (owner.tokenBalances ?? []).reduce((total, token) => total + Number(token.balance ?? 1), 0) })).filter((holder: { address?: string; items: number }) => holder.address && holder.items > 0);
    return NextResponse.json({ chain, collection: body.collection, holders });
  } catch { return NextResponse.json({ error: "Invalid snapshot request." }, { status: 400 }); }
}
