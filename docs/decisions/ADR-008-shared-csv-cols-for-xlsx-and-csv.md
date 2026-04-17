# ADR-008 — Share `CSV_COLS` between XLSX and CSV exporters

## Date

2026-02-15

## Status

Accepted

## Context

AMA emits the Amazon fptcustom template in two flavours:

- **Single-listing CSV** from `lib/exportCsv.ts`
  (`generateSingleCsv`, `generateBatchCsv`), triggered by the Editor and
  Listings pages on the client.
- **Multi-listing XLSX** from `app/api/listings/export/route.ts`, built
  server-side with `xlsx` and downloaded as `.xlsx`.

Both formats have the same 249-column layout with the same 5-row header.
The column indices (`0 = Seller SKU`, `48 = Price`, `241 = Main Image
URL`, …) are dictated by Amazon's template and are non-negotiable.

Initial implementations duplicated the column layout — the CSV side had
inline `{0: sku, 1: action, ...}` literals with the column indices, the
XLSX side had its own copy. Every schema fix (e.g. adding `Magnification
Strength Unit`) had to be made in both places, and drift was inevitable.

## Decision

Extract the column map and header metadata into `lib/amazonTemplate.ts`:

```ts
export const TOTAL_COLS = 249

export const TEMPLATE_METADATA = {
  templateType: 'TemplateType=fptcustom',
  version: 'Version=2023.1116',
  signature: 'TemplateSignature=...',
  hideHeaders: 'HideTemplateHeaders=n',
}

export const CSV_COLS: AmazonColumn[] = [
  { idx: 0, label: 'Seller SKU', field: 'contribution_sku', req: true },
  // ... 33 more entries
]

export function buildHeaderMatrix(): string[][] {
  // Returns 5 rows × TOTAL_COLS cols
}
export function buildDataRow(entries: Record<number, string>): string[] {
  // Returns 1 row × TOTAL_COLS cols with entries scattered by idx
}
```

`lib/exportCsv.ts` imports `CSV_COLS`, `TOTAL_COLS`, `TEMPLATE_METADATA`
and rebuilds its header rows from those.

`app/api/listings/export/route.ts` imports `buildHeaderMatrix`,
`buildDataRow`, `TOTAL_COLS` and feeds the resulting matrix into
`XLSX.utils.aoa_to_sheet`.

## Consequences

**Positive:**

- One place to change when Amazon revises a column or the template
  version bumps.
- Drift between the two exporters is now impossible by construction —
  they share the same constant.
- New exporters (e.g. TSV, JSON-schema-for-upload-API) plug into the
  same source of truth.

**Negative:**

- The module has to expose both a "row-as-array" helper (`buildDataRow`
  for XLSX) and a "row-as-escaped-CSV-string" helper (inline in
  `exportCsv.ts`). Not a real burden — CSV escaping is kept local to
  the CSV exporter, and the array form is the shared primitive.

## Alternatives rejected

- **Keep them separate** — guaranteed drift, already bitten us during
  the dimensions-columns rollout.
- **Generate one format from the other** (e.g. serialize CSV then parse
  to XLSX) — adds a parse step that can misinterpret cell types
  (numbers vs strings) and is slower.
