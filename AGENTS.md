<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project rules for AI agents

## Read before changing anything structural

- [`docs/architecture.md`](./docs/architecture.md) — before touching
  middleware, route layout, storage, or deployment topology. The
  container/component diagrams and sequence diagram pin down what the
  app actually does.
- [`docs/decisions/`](./docs/decisions/) — before changing the
  standalone deploy process (ADR-001, ADR-007), the JSON storage layer
  (ADR-002), the wizard flow (ADR-003), image handling (ADR-004),
  strength encoding (ADR-005), or the shared column map (ADR-008).
  Every one of these has a "why" that is not obvious from the code.

## Read before changing the Amazon template

- [`lib/amazonTemplate.ts`](./lib/amazonTemplate.ts) is the single
  source of truth for the 249-column fptcustom layout. Both the XLSX
  exporter (`app/api/listings/export/route.ts`) and the CSV exporter
  (`lib/exportCsv.ts`) import from here. Change column indices or
  labels here and they propagate to both sides atomically.
- [`docs/design.md`](./docs/design.md) §2 has the full column table and
  the 5-row header layout Amazon requires.

## Build verification

After `npm run build`, **always** verify:

```bash
ls .next/standalone/.next/static 2>/dev/null && echo "static OK" || echo "MISSING"
```

The standalone bundle does NOT include static chunks by default. If the
build succeeds but `.next/standalone/.next/static` is missing, the
deployed app will serve HTML but `/_next/static/*.(css|js)` will 404
and the UI renders unstyled. The deploy workflow handles this copy
automatically — but if you're running locally against the standalone
bundle, you need to do it yourself. See ADR-001.

## Data safety

`AMA_LISTING_DATA_ROOT` points to a persistent directory **outside**
`.next/standalone`. Never move data into the standalone bundle — every
deploy rebuilds that directory. If a dev writes to `cwd/data` locally
that's fine (dev default); in production the systemd unit sets the env
var explicitly.

Writes go through `writeJsonAtomic` in `listingStore.ts` — `.tmp` then
rename. Don't bypass this for convenience; concurrent readers depend on
the atomic rename.

## Auth

`middleware.ts` gates every route under `/apps/listing/*` via the
`X-Portal-User` header (set by nginx from the portal session cookie).
Local dev uses `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`. Never add a new API
route that bypasses the middleware unless you've thought carefully
about the threat model — the matcher in `middleware.ts` already catches
everything except `_next/static`, `_next/image`, and `favicon`.
