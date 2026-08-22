# Contributing to Bluesuite

Thank you for helping improve Bluesuite, an open-source project built by BlueValley Labs and theweb3proxy.

## Before opening an issue

- Search existing issues and pull requests first.
- Include the route or product affected, expected behavior, actual behavior, and reproducible steps.
- Remove API keys, wallet credentials, passwords, and private deployment information from logs and screenshots.

## Local workflow

```bash
npm install
npm run dev
npm run build
```

Use a `.env.local` file based on `.env.example`. Never commit it. For Blueshot changes, test both a normal holder snapshot and the conditional address-check flow when possible.

## Pull requests

- Keep each pull request focused on one change.
- Explain the user-facing behavior and implementation boundary.
- Update the README or `docs/` when configuration, API behavior, or architecture changes.
- Include the commands used to verify the change.
- Preserve the attribution in `LICENSE` and `NOTICE`.

## Code conventions

- Prefer strict TypeScript and small, composable server helpers.
- Keep provider keys and administrator secrets server-side.
- Validate external input at API boundaries.
- Treat chain providers as unreliable: use bounded retries, clear errors, and safe fallbacks.
- Keep UI animations subtle and respect `prefers-reduced-motion`.

By contributing, you agree that your contribution may be distributed under the repository's MIT License.
