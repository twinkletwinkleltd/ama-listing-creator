# ADR-001 — Use Next.js `output: 'standalone'` for deployment

## Date

2026-01-15

## Status

Accepted

## Context

AMA is a Next.js app that must run on the company VPS alongside the Flask
portal. Default Next.js production deployment (`next start`) requires
`node_modules` to be present and reachable, which means either copying the
full dependency tree to the VPS (~200 MB for Next alone) or running `npm
install` on each deploy. Both are slow and fragile.

Options considered:

- **Default `next start`** — ship full `node_modules`, run `npm ci` on every
  deploy.
- **Vercel / managed host** — not viable; we need the app inside the portal
  auth perimeter on our VPS.
- **Docker image** — adds a layer of tooling and registry ops for what is
  essentially one Node process.
- **`output: 'standalone'`** — Next emits a self-contained bundle with only
  the minimum deps traced from the server entry.

## Decision

Use `output: 'standalone'` in `next.config.ts`. The `npm run build` step
produces `.next/standalone/server.js` plus a trimmed `node_modules/` tree.
The systemd unit runs that `server.js` directly with `node`.

Two post-build copies are required (handled by
`.github/workflows/deploy.yml`):

1. `cp -r .next/static .next/standalone/.next/static` — standalone omits
   the static chunks; without them `/_next/static/*` returns 404.
2. `cp -r public .next/standalone/public` — if a `public/` directory
   exists.

The deploy workflow also health-checks a referenced `/_next/static/*.(css|js)`
URL after restart, because an HTML 200 alone does not prove the page
actually renders styled.

## Consequences

**Positive:**

- Deploy artifact is small — only the deps actually reachable from
  `server.js`.
- Single `node server.js` process managed by systemd; no `npm install`
  at runtime.
- Predictable: the bundle has the same shape on every deploy.

**Negative:**

- Two manual post-build copies (`static/` and `public/`) — easy to forget
  without the deploy script. Mitigated by the static-asset health check
  that fails the deploy if assets don't serve.
- `outputFileTracingRoot` must be pinned explicitly (see ADR-007),
  otherwise the bundle nests under a surprising path.

## Alternatives rejected

- **Default `next start`** — deploy would need full `node_modules/`; slower
  and heavier.
- **Docker** — over-engineered for a single-user-scale internal tool; adds
  an image registry to the ops surface.
- **Vercel** — cannot live behind our nginx auth layer; would require a
  different auth scheme.
