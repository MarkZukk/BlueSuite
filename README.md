# Bluesuite

Bluesuite is an open-source collection of focused tools for operating on-chain. It is built and maintained by **BlueValley Labs** and **theweb3proxy**.

The project is intentionally small in scope: each product should make a real blockchain workflow faster, clearer, and easier to audit.

## Products

### Blueshot

Blueshot snapshots NFT ownership for a collection and exports a holder CSV. It supports Ethereum, Base, Arbitrum, and Robinhood Chain.

- Uses the Alchemy indexed NFT API when `ALCHEMY_API_KEY` is configured.
- Uses a parallel Robinhood Chain RPC/Multicall3 path when Alchemy is unavailable there.
- Falls back to Robinhood Blockscout holder pagination when token IDs are not sequential.
- Supports a read-only “check if an address is holding a collection” query.
- Sorts holder exports from the largest balance to the smallest balance.

### FoundersBot

A private BlueValleyDAO operating layer and product surface. The current page is the public product shell; private workflows can be added behind the same application structure.

### BlueHelper

The batch-operations product surface for token transfers, NFT transfers, and balance consolidation. It is currently presented as an upcoming product.

### Control Center

The password-protected `/admin` surface provides a home for operator settings and product controls. Authentication uses an HttpOnly, signed eight-hour session cookie.

## Technology

- Next.js App Router and React
- TypeScript with strict checking
- CSS-first visual system with light/dark themes
- Alchemy NFT API for indexed ownership queries
- Robinhood Chain Blockscout API and public RPC fallback
- Web Crypto HMAC verification in middleware
- Dynamic Open Graph cards at `/api/og`

## Getting started

Requirements:

- Node.js 20 or newer
- npm
- An Alchemy API key for Ethereum, Base, and Arbitrum snapshots

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Create a local environment file from the example:

```bash
Copy-Item .env.example .env.local
```

Then fill in the values below. Server-only secrets must never use a `NEXT_PUBLIC_` prefix.

| Variable | Required | Purpose |
| --- | --- | --- |
| `ALCHEMY_API_KEY` | For non-Robinhood snapshots | Alchemy NFT API key. Robinhood also tries it first when configured. |
| `ADMIN_PASSWORD` | For `/admin` | Password used to sign in to the control center. |
| `ADMIN_SESSION_SECRET` | For `/admin` | Separate long random secret used to sign session cookies. |
| `NEXT_PUBLIC_SITE_URL` | Recommended in production | Canonical URL used for metadata and social cards. |

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Production commands

```bash
npm run build
npm run start
```

The application is suitable for Vercel. Add the environment variables in the project settings for the Production environment, then redeploy. The repository intentionally remains `private` in `package.json` to prevent accidental npm publication; GitHub source visibility and npm package publication are independent concerns.

## Snapshot API

`POST /api/snapshot` accepts JSON:

```json
{
  "chain": "robinhood",
  "collection": "0x0000000000000000000000000000000000000000",
  "checkAddress": false
}
```

For an address check, send `checkAddress: true` and a wallet `address`. All addresses are validated as EVM addresses before a provider is called.

Snapshot responses contain `chain`, `collection`, and a `holders` array with `{ address, items }` entries. Address checks return `holding` and `items` instead. Provider failures are returned as JSON errors rather than exposing credentials.

## Repository map

```text
app/
  api/snapshot/       NFT ownership API and provider fallbacks
  api/admin/          login/logout endpoints
  api/og/             dynamic social preview image generator
  admin/              protected operator control center
  blueshot/           snapshot UI and CSV export
  foundersbot/        FoundersBot product surface
  bluehelper/         BlueHelper product surface
components/
  site-shell.tsx      shared navigation, theme, and footer
lib/
  chains.ts           supported chain/provider mapping
  admin-auth.ts       password and signed-session helpers
public/
  bluevalleydao.jpg   BlueValleyDAO/BlueValley Labs brand mark
docs/
  ARCHITECTURE.md     runtime and data-flow notes
```

## Security notes

- Never commit `.env.local`, provider keys, administrator passwords, or session secrets.
- `ALCHEMY_API_KEY` is only read in server routes and is never sent to the browser.
- Admin sessions are HttpOnly, `SameSite=Strict`, and eight hours by default.
- The admin middleware fails closed when a cookie is malformed, expired, or unverifiable.
- Snapshot requests are read-only; Blueshot does not connect to or request signing from a wallet.
- Report suspected vulnerabilities privately using the process in [`SECURITY.md`](SECURITY.md).

## Contributing

Bug fixes, documentation improvements, provider adapters, tests, and accessibility improvements are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request. Please keep changes focused and include the verification command you ran.

## Attribution

Bluesuite was built by **BlueValley Labs** and **theweb3proxy**. The BlueValleyDAO brand mark in `public/bluevalleydao.jpg` is used by the project with the project attribution notice in [`NOTICE`](NOTICE).

## License

Bluesuite is released under the [MIT License](LICENSE), with attribution information preserved in [`NOTICE`](NOTICE).
