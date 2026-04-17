# ADR-002 — JSON files on disk, not SQLite, for listings and styles

## Date

2026-01-18

## Status

Accepted

## Context

AMA needs to persist two pieces of state:

1. The flat list of generated listing rows (Parent + Children across all
   styles).
2. The index mapping `parentSku → variant child SKUs` so the UI can
   list known styles without full-scanning all rows.

Options considered:

- **SQLite** — durable, schema-enforced, good query surface.
- **JSON files with atomic rename** — trivial, hand-inspectable, no schema
  migration.
- **External database (Postgres on VPS)** — adds a service dependency.
- **In-memory only** — loses state on restart.

Dataset sizes are small: a store with 50 styles × ~60 rows each = ~3000
rows. Each row is a flat object of about 40 string fields. The whole
`listings.json` is on the order of a few hundred KB.

## Decision

Use two JSON files under `<AMA_LISTING_DATA_ROOT>/`:

- `listings.json` — flat array of `Listing` objects
- `styles.json` — array of `{ parentSku, variants }`

Writes go through `writeJsonAtomic(file, data)`, which writes to
`<file>.tmp` then calls `fs.renameSync`. The rename is atomic on POSIX,
so concurrent readers never see a partial file.

Reads are whole-file `JSON.parse`. `getStyle(parentSku)` and the export
filter are linear scans; at this data volume it's faster than SQLite
round-trip overhead.

## Consequences

**Positive:**

- Zero schema migration cost. Shape changes are pure code.
- Easy to inspect during debugging: `jq '.[0]' listings.json`.
- Easy to back up: `cp -r data/ data.backup-$(date +%F)/`.
- Atomic rename is enough for single-writer safety (AMA is a single
  node process).
- No external service dependency.

**Negative:**

- Not safe for concurrent writers (doesn't apply today — AMA runs as one
  systemd-managed process).
- Full-file rewrite on every mutation; acceptable at current volume but
  would need rethinking at ~10 MB / 50k rows.
- No query language — all filtering happens in TypeScript.

## Alternatives rejected

- **SQLite** — fine answer, but migration overhead and the better-fit day
  is not today. Revisit if listing count blows past 10,000 rows or
  concurrent writers become a requirement.
- **Postgres** — explicit non-goal; adds a runtime service to our
  deployment footprint for negligible benefit at this volume.
- **In-memory + periodic snapshot** — loses data on crash; the atomic
  rename approach gives us durability "for free".
