import { NextResponse } from "next/server";
import { alchemyNftUrl, chains, isAddress, type ChainId } from "@/lib/chains";

export const runtime = "nodejs";
export const maxDuration = 60;

const ROBINHOOD_API = "https://robinhoodchain.blockscout.com/api/v2";
const ROBINHOOD_RPC = "https://rpc.mainnet.chain.robinhood.com";
const MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11";
const RPC_BATCH = 500;
const RPC_CONCURRENCY = 6;

type Holder = { address: string; items: number };
type Collection = {
  type?: string;
  total_supply?: string | number;
  holders_count?: string | number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      chain?: ChainId;
      collection?: string;
      address?: string;
      checkAddress?: boolean;
    };
    const chain = body.chain && body.chain in chains ? body.chain : "ethereum";
    const collection = body.collection?.trim();
    const address = body.address?.trim();

    if (!collection || !isAddress(collection)) {
      return NextResponse.json({ error: "A valid collection contract address is required." }, { status: 400 });
    }
    if (body.checkAddress && (!address || !isAddress(address))) {
      return NextResponse.json({ error: "Enter a valid wallet address to check." }, { status: 400 });
    }

    const key = process.env.ALCHEMY_API_KEY;
    if (key) {
      try {
        // Alchemy's indexed owner endpoint is the fastest path when the
        // configured network supports it, including Robinhood Chain.
        return NextResponse.json(body.checkAddress
          ? await checkAlchemyAddress(chain, collection, address!, key)
          : await snapshotAlchemy(chain, collection, key));
      } catch {
        // Robinhood still has a reliable public-RPC fallback. Other chains
        // report the provider error instead of silently changing networks.
        if (chain !== "robinhood") throw new Error("Chain provider unavailable.");
      }
    } else if (chain !== "robinhood") {
      return NextResponse.json({ error: "Snapshot service is not configured. Add ALCHEMY_API_KEY on the server." }, { status: 503 });
    }

    return NextResponse.json(body.checkAddress
      ? await checkRobinhoodAddress(collection, address!)
      : await snapshotRobinhood(collection));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid snapshot request.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

async function snapshotRobinhood(collection: string) {
  const metadata = await fetchJson<Collection>(`${ROBINHOOD_API}/tokens/${collection}`);
  const supply = Number(metadata.total_supply);
  let holders: Holder[] | null = null;

  // Sequential ERC-721 collections can be resolved with six concurrent
  // Multicall3 requests. This is substantially faster than explorer paging.
  if (metadata.type === "ERC-721" && Number.isSafeInteger(supply) && supply > 0 && supply <= 100_000) {
    holders = await snapshotViaRpc(collection, supply).catch(() => null);
  }
  if (!holders) holders = await fetchAllRobinhoodHolders(collection);
  if (!holders.length) throw new Error("No holders found for this collection.");
  return { chain: "robinhood", collection, holders };
}

async function checkRobinhoodAddress(collection: string, address: string) {
  const metadata = await fetchJson<Collection>(`${ROBINHOOD_API}/tokens/${collection}`);
  if (metadata.type === "ERC-721") {
    const data = "0x70a08231" + address.slice(2).toLowerCase().padStart(64, "0");
    const result = await rpcCall({ to: collection, data });
    const items = Number(BigInt(result || "0x0"));
    return { chain: "robinhood", collection, address, holding: items > 0, items };
  }
  const holder = await findRobinhoodHolder(collection, address);
  return { chain: "robinhood", collection, address, holding: Boolean(holder), items: holder?.items ?? 0 };
}

async function snapshotAlchemy(chain: ChainId, collection: string, key: string) {
  const response = await fetch(alchemyNftUrl(chain, key, collection), { cache: "no-store" });
  if (!response.ok) throw new Error("Chain provider unavailable.");
  const data = await response.json();
  const holders = (data.owners ?? []).map((owner: { ownerAddress?: string; tokenBalances?: { balance?: string }[] }) => ({
    address: owner.ownerAddress,
    items: (owner.tokenBalances ?? []).reduce((total, token) => total + Number(token.balance ?? 1), 0),
  })).filter((holder: { address?: string; items: number }): holder is Holder => Boolean(holder.address) && holder.items > 0);
  if (!holders.length) throw new Error("No holders found for this collection.");
  return { chain, collection, holders };
}

async function checkAlchemyAddress(chain: ChainId, collection: string, address: string, key: string) {
  const url = new URL(`https://${chains[chain].nftNetwork}.g.alchemy.com/nft/v3/${key}/getNFTsForOwner`);
  url.searchParams.set("owner", address);
  url.searchParams.append("contractAddresses[]", collection);
  url.searchParams.set("withMetadata", "false");
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Chain provider unavailable.");
  const data = await response.json();
  const items = Array.isArray(data.ownedNfts) ? data.ownedNfts.length : 0;
  return { chain, collection, address, holding: items > 0, items };
}

async function snapshotViaRpc(collection: string, supply: number): Promise<Holder[]> {
  const chunks: number[][] = [];
  for (let start = 0; start <= supply; start += RPC_BATCH) {
    chunks.push(Array.from({ length: Math.min(RPC_BATCH, supply - start + 1) }, (_, i) => start + i));
  }
  const owners = new Map<string, number>();
  let itemsSeen = 0;
  let failures = 0;

  async function worker() {
    while (chunks.length) {
      const ids = chunks.shift()!;
      try {
        for (const owner of await ownerOfBatch(collection, ids)) {
          const normalized = owner.toLowerCase();
          owners.set(normalized, (owners.get(normalized) ?? 0) + 1);
          itemsSeen++;
        }
      } catch (error) {
        failures++;
        if (failures > 30) throw error;
        chunks.push(ids);
        await sleep(700 * failures);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(RPC_CONCURRENCY, chunks.length) }, worker));
  if (itemsSeen < supply * 0.98) throw new Error("Collection token ids are not sequential.");
  return [...owners.entries()].map(([address, items]) => ({ address, items })).sort((a, b) => b.items - a.items);
}

async function ownerOfBatch(collection: string, ids: number[]) {
  const word = (value: number) => value.toString(16).padStart(64, "0");
  const calls = ids.map(id => "6352211e" + word(id));
  let data = "0xbce38bd7" + word(0) + word(0x40) + word(calls.length);
  let offsets = "";
  let tail = "";
  for (const call of calls) {
    offsets += word(calls.length * 32 + tail.length / 2);
    tail += collection.slice(2).toLowerCase().padStart(64, "0") + word(0x40) + word(call.length / 2) + call.padEnd(Math.ceil(call.length / 64) * 64, "0");
  }
  data += offsets + tail;
  const result = await rpcCall({ to: MULTICALL3, data });
  const words = result.slice(2).match(/.{64}/g) ?? [];
  const count = parseInt(words[1] ?? "0", 16);
  const found: string[] = [];
  for (let i = 0; i < count; i++) {
    const at = parseInt(words[2 + i] ?? "0", 16) / 32 + 2;
    if (parseInt(words[at] ?? "0", 16) !== 1 || parseInt(words[at + 2] ?? "0", 16) < 32) continue;
    const owner = "0x" + words[at + 3].slice(24);
    if (owner !== "0x0000000000000000000000000000000000000000") found.push(owner);
  }
  return found;
}

async function fetchAllRobinhoodHolders(collection: string) {
  const holders: Holder[] = [];
  let params: Record<string, string> | undefined;
  do {
    const url = new URL(`${ROBINHOOD_API}/tokens/${collection}/holders`);
    Object.entries(params ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));
    const page = await fetchJson<{ items?: { address?: { hash?: string }; value?: string }[]; next_page_params?: Record<string, string> }>(url.toString());
    for (const item of page.items ?? []) {
      const items = Number(item.value);
      if (item.address?.hash && items > 0) holders.push({ address: item.address.hash, items });
    }
    params = page.next_page_params;
  } while (params);
  return holders;
}

async function findRobinhoodHolder(collection: string, address: string) {
  let params: Record<string, string> | undefined;
  do {
    const url = new URL(`${ROBINHOOD_API}/tokens/${collection}/holders`);
    Object.entries(params ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));
    const page = await fetchJson<{ items?: { address?: { hash?: string }; value?: string }[]; next_page_params?: Record<string, string> }>(url.toString());
    const found = (page.items ?? []).find(item => item.address?.hash?.toLowerCase() === address.toLowerCase() && Number(item.value) > 0);
    if (found?.address?.hash) return { address: found.address.hash, items: Number(found.value) };
    params = page.next_page_params;
  } while (params);
  return null;
}

async function fetchJson<T>(url: string, tries = 4): Promise<T> {
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) return await response.json() as T;
      if (response.status !== 429 && response.status < 500) throw new Error(`Explorer returned ${response.status}.`);
    } catch (error) {
      if (attempt === tries - 1) throw error;
    }
    await sleep(500 * (attempt + 1) + Math.random() * 300);
  }
  throw new Error("The chain provider kept rate-limiting the request. Try again shortly.");
}

async function rpcCall(call: { to: string; data: string }) {
  const response = await fetch(ROBINHOOD_RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [call, "latest"] }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`RPC returned ${response.status}.`);
  const data = await response.json() as { result?: string; error?: { message?: string } };
  if (data.error) throw new Error(data.error.message || "RPC error.");
  if (!data.result) throw new Error("RPC returned no result.");
  return data.result;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
