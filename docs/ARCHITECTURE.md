# Architecture

Bluesuite is a Next.js App Router application with a shared visual shell and server-side provider routes.

## Request flow

```text
Browser
  │
  ├── public pages and product UIs
  │      └── POST /api/snapshot
  │
  ├── /admin
  │      └── middleware validates bluesuite_admin cookie
  │             ├── /api/admin/login creates signed 8-hour cookie
  │             └── /api/admin/logout clears cookie
  │
  └── social crawler
         └── /api/og?section=<name> returns a 1200×630 image
```

## Blueshot provider strategy

1. Validate the chain, collection contract, and optional wallet address.
2. If `ALCHEMY_API_KEY` exists, try Alchemy's indexed NFT owner endpoint first.
3. For Robinhood Chain, fall back to a six-worker Multicall3 `ownerOf` sweep when indexed data is unavailable.
4. If token IDs are non-sequential or the RPC sweep cannot cover the reported supply, page Blockscout's holder endpoint with bounded retries.
5. Normalize results to `{ address, items }`, sort by `items` descending, and return JSON to the client.

The client owns filtering and CSV creation so the server does not need to buffer an export. The exported rows are explicitly sorted from the largest holder balance to the smallest.

## Authentication

The login route compares the submitted password using a timing-safe comparison. It signs an expiry timestamp with HMAC-SHA256. Middleware verifies the cookie with Web Crypto before allowing `/admin` routes. Invalid, expired, or malformed cookies fail closed and redirect to `/admin/login`.

## Runtime boundaries

- `app/api/snapshot/route.ts` runs on the Node.js runtime and is allowed up to 60 seconds for large snapshots.
- `app/api/og/route.tsx` runs on the Edge runtime and produces social cards without exposing application secrets.
- Public pages are rendered through the shared `SiteShell`, which owns theme persistence and responsive navigation.
- `lib/chains.ts` is the single source of truth for supported chain labels and provider network names.

## Current limitations

- The admin product toggles and CMS controls are presentation scaffolding; they do not yet persist content or settings.
- Admin auth is a single shared password, not a complete identity provider or role system.
- Alchemy network availability can vary by account and chain; the Robinhood fallback is intentionally retained.

## Collection previews

Before a snapshot begins, Blueshot calls `GET /api/collection-metadata` to load an optional OpenSea collection name, description, slug, and high-resolution image. `OPENSEA_API_KEY` is read only on the Node.js server route. The metadata lookup uses OpenSea's chain identifiers (`ethereum`, `base`, `arbitrum`, and `robinhood`) rather than provider network names, so each supported chain resolves against its own OpenSea catalog. If the key is not configured or an individual collection is not indexed, the operator can still proceed with the snapshot using the existing provider strategy.
