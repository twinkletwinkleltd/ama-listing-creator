# AMA Listing Creator

Amazon Seller Central batch listing generator for Twinkle Twinkle Ltd's
reading-glasses products. An operator fills in a 5-step wizard (basics
→ colors → strengths → dimensions → preview) and AMA emits one Parent
row + N Child rows as an Amazon-ready `.xlsx` matching the **fptcustom**
flat-file template.

Deployed as a Next.js standalone app behind the portal's nginx at
`ordercleaner.twinkletwinkle.uk/apps/listing`.

## Quick start (local dev)

```bash
# install deps
npm install

# run the Next.js dev server
NEXT_PUBLIC_DEV_BYPASS_AUTH=true npm run dev
# → open http://localhost:3000/apps/listing
```

`NEXT_PUBLIC_DEV_BYPASS_AUTH=true` tells `middleware.ts` to skip the
`X-Portal-User` allowlist check so you can work without the portal's
nginx auth layer in front of the app.

Data files land in `./data/` (created on first write) unless you set
`AMA_LISTING_DATA_ROOT` to a different path.

## Build for production

```bash
npm run build

# Copy static assets into the standalone bundle — next's standalone
# output does not include these automatically.
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
[ -d public ] && cp -r public .next/standalone/public

# Run
PORT=3002 HOSTNAME=127.0.0.1 \
AMA_LISTING_DATA_ROOT=/path/to/persistent/data \
node .next/standalone/server.js
```

Without the `cp -r .next/static ...` step, the page HTML loads but
`/_next/static/*.(css|js)` returns 404 and the UI renders unstyled. See
`docs/decisions/ADR-001-nextjs-standalone-output.md`.

## Deploy

Automated on push to `main` via
`.github/workflows/deploy.yml`:

1. GitHub Actions SSHes to the VPS.
2. Pulls latest, backs up current `.next/standalone` to
   `/opt/deploy-backups/ama-listing-creator/<sha>` (keeps last 5).
3. `npm install` + `npm run build`.
4. Copies `.next/static` + `public` into `.next/standalone`.
5. `systemctl restart ama-listing.service`.
6. Health-checks the HTTP endpoint **and** a referenced static asset
   URL. Deploy fails if either fails.

Systemd unit: `deploy/ama-listing.service`. Data root is
`/opt/portal-system/apps/ama-listing-creator/data` (outside the
standalone bundle, so rebuilds never clobber live data).

## Read more

Full documentation under [`docs/`](./docs/):

- [`docs/product.md`](./docs/product.md) — product vision, users,
  value proposition, non-goals.
- [`docs/architecture.md`](./docs/architecture.md) — C4 Context /
  Container / Component diagrams, sequence, data model, deployment.
- [`docs/design.md`](./docs/design.md) — API schemas, Amazon template
  layout, error codes, auth, input limits, SKU rules, tech choices.
- [`docs/decisions/`](./docs/decisions/) — 8 ADRs covering standalone
  output, JSON storage, wizard flow, image handling, strength encoding,
  variation theme, tracing root, shared column map.

If you are changing the deploy pipeline or the Amazon template layout,
**read the ADRs first** — there are sharp edges documented there.

## Also see

- [`AGENTS.md`](./AGENTS.md) — rules for AI coding agents working in
  this project (Next.js 16.2 has breaking changes vs. older docs).
- Main portal system: `../../../CLAUDE.md`
