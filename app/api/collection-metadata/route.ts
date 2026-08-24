import { NextRequest, NextResponse } from "next/server";
import { chains, isAddress, type ChainId } from "@/lib/chains";
import { getOpenSeaApiKey } from "@/lib/runtime-config";

export const runtime = "nodejs";

const OPENSEA_API = "https://api.opensea.io/api/v2";

type OpenSeaRecord = Record<string, unknown>;
type CollectionPreview = {
  name: string;
  imageUrl: string | null;
  description: string | null;
  slug: string | null;
  openseaUrl: string | null;
};

export async function GET(request: NextRequest) {
  const chainParam = request.nextUrl.searchParams.get("chain") as ChainId | null;
  const contract = request.nextUrl.searchParams.get("contract")?.trim() ?? "";
  const chain = chainParam && chainParam in chains ? chainParam : null;

  if (!chain || !isAddress(contract)) {
    return NextResponse.json({ error: "A supported chain and valid collection contract are required." }, { status: 400 });
  }

  const key = getOpenSeaApiKey();
  if (!key) {
    return NextResponse.json({ configured: false, preview: null, message: "Add OPENSEA_API_KEY to load collection previews." }, { headers: { "cache-control": "no-store" } });
  }

  try {
    const openSeaChain = chains[chain].openSeaNetwork;
    const contractData = await openSeaFetch(`/chain/${openSeaChain}/contract/${encodeURIComponent(contract)}`, key);
    const slug = extractSlug(contractData);
    const collectionData = slug ? await openSeaFetch(`/collections/${encodeURIComponent(slug)}`, key).catch(() => null) : null;
    const preview = normalizePreview([collectionData, contractData], slug, chain, contract);
    return NextResponse.json({ configured: true, preview }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ configured: true, preview: null, message: "OpenSea could not load this collection preview." }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}

async function openSeaFetch(path: string, key: string) {
  const response = await fetch(`${OPENSEA_API}${path}`, {
    headers: { accept: "application/json", "x-api-key": key },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`OpenSea returned ${response.status}.`);
  return await response.json() as OpenSeaRecord;
}

function extractSlug(data: OpenSeaRecord) {
  const collection = data.collection;
  if (typeof data.collection === "string") return data.collection;
  if (isRecord(collection) && typeof collection.slug === "string") return collection.slug;
  if (typeof data.collection_slug === "string") return data.collection_slug;
  if (typeof data.slug === "string") return data.slug;
  return null;
}

function normalizePreview(records: Array<OpenSeaRecord | null>, slug: string | null, chain: ChainId, contract: string): CollectionPreview {
  const nestedCollections = records.map(data => data && isRecord(data.collection) ? data.collection : null);
  const name = firstString(
    ...fieldValues(records, ["name", "collection_name"]),
    ...fieldValues(nestedCollections, ["name", "slug"]),
    slug,
  ) || `${chains[chain].label} collection`;
  const image = firstString(
    ...fieldValues(records, ["image_url", "image", "logo_url", "logo", "banner_image_url"]),
    ...fieldValues(nestedCollections, ["image_url", "image", "logo_url", "logo", "banner_image_url"]),
  );
  const description = firstString(...fieldValues(records, ["description"]), ...fieldValues(nestedCollections, ["description"]));
  const openseaUrl = firstString(
    ...fieldValues(records, ["opensea_url"]),
    ...fieldValues(nestedCollections, ["opensea_url"]),
    slug ? `https://opensea.io/collection/${encodeURIComponent(slug)}` : null,
  );
  return {
    name,
    imageUrl: image ? highResolutionImage(image) : null,
    description,
    slug,
    openseaUrl: openseaUrl || `https://opensea.io/assets/${chains[chain].openSeaNetwork}/${contract}`,
  };
}

function fieldValues(records: Array<OpenSeaRecord | null>, fields: string[]) {
  return records.flatMap(record => fields.map(field => record?.[field]));
}

function highResolutionImage(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname.includes("seadn.io")) {
      url.searchParams.set("w", "1200");
      url.searchParams.set("auto", "format");
    }
    return url.toString();
  } catch {
    return value;
  }
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() ?? null;
}

function isRecord(value: unknown): value is OpenSeaRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
