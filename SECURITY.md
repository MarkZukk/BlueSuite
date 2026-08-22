# Security policy

Bluesuite handles blockchain lookups and includes a password-protected operator area. Please do not disclose security issues in a public issue until maintainers have had a chance to investigate.

## Reporting

Open a private security report through the repository's GitHub security contact, or contact BlueValley Labs through its official public channel. Include:

- affected route, component, or deployment;
- clear reproduction steps;
- impact and likely exploit conditions;
- a minimal proof of concept when safe.

Do not include real API keys, administrator passwords, session cookies, or private wallet data. Rotate any secret that may have been exposed before reporting.

## Scope reminders

- Never put `ALCHEMY_API_KEY`, `ADMIN_PASSWORD`, or `ADMIN_SESSION_SECRET` in client code or a `NEXT_PUBLIC_` variable.
- Use a unique, high-entropy `ADMIN_SESSION_SECRET` separate from `ADMIN_PASSWORD`.
- The `/admin` UI is an operator surface, not an identity provider or multi-user authorization system.
- Blueshot is read-only and should not request wallet signatures.
