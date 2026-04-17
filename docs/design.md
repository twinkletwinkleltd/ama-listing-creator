# AMA Listing Creator — Design

This document pins down the contracts and invariants behind the pretty
pictures in `architecture.md`: API schemas, the Amazon template layout,
error codes, auth, limits, SKU rules, and technology choices.

## 1. API Schema

All routes live under `basePath=/apps/listing` (configured in
`next.config.ts`). Every request is filtered by `middleware.ts` — see
§4 Authentication.

### `GET /apps/listing/api/listings`

Returns listing rows. Three modes:

| Query param         | Behaviour                                    |
|---------------------|----------------------------------------------|
| `sku=<sku>`         | Single matching row, or `null` if not found  |
| `parentSku=<psku>`  | All rows under that Parent (1 Parent + N Children) |
| *(none)*            | All rows in `listings.json`                  |

**Response 200** (array mode):

```json
[
  {
    "sku": "RX224",
    "parentage": "Parent",
    "parentSku": "RX224",
    "itemName": "TWINKLE TWINKLE Reading Glasses — RX224 — {color} {strength}",
    "brand": "TWINKLE TWINKLE",
    "variationTheme": "COLOR/MAGNIFICATION_STRENGTH",
    "listingAction": "Create new listing",
    "lensWidth": "50", "bridgeWidth": "18", "templeLength": "140"
  },
  {
    "sku": "RX224_BK_150",
    "parentage": "Child",
    "parentSku": "RX224",
    "itemName": "TWINKLE TWINKLE Reading Glasses — RX224 — Black +1.5",
    "brand": "TWINKLE TWINKLE",
    "price": "5.69",
    "quantity": "99",
    "color": "Black",
    "colorMap": "Black",
    "strength": "1.5",
    "variationTheme": "COLOR/MAGNIFICATION_STRENGTH",
    "mainImage": "https://m.media-amazon.com/images/I/xxx.jpg"
  }
]
```

### `GET /apps/listing/api/styles`

Returns the style index. No query params.

**Response 200:**

```json
[
  { "parentSku": "RX224",
    "variants": ["RX224_BK_100", "RX224_BK_150", "RX224_TO_100", "..."] }
]
```

### `POST /apps/listing/api/listings/batch`

The workhorse. Receives a `SavedStyleData` payload, validates it,
generates Parent + Children, writes atomically, returns the rows.

**Request body:**

```json
{
  "parentSku": "RX224",
  "brand": "TWINKLE TWINKLE",
  "itemNameTemplate": "TWINKLE TWINKLE Reading Glasses — {parentSku} — {color} {strength}",
  "price": "5.69",
  "quantity": "99",
  "variationTheme": "COLOR/MAGNIFICATION_STRENGTH",
  "colors": [
    { "color": "Black", "colorCode": "BK", "colorMap": "Black",
      "mainImage": "https://.../main.jpg" }
  ],
  "strengths": [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0],
  "dimensions": {
    "lensWidth": "50", "bridgeWidth": "18", "templeLength": "140"
  },
  "bullet1": "Lightweight frame",
  "bullet2": "CR-39 lenses"
}
```

**Response 200:**

```json
{
  "ok": true,
  "parentSku": "RX224",
  "count": 8,
  "listings": [ { "sku": "RX224", "parentage": "Parent", ... }, "..." ]
}
```

**Response 400** (validation failed):

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "colors[0].mainImage",
      "message": "Color #1: main image must be an http/https URL" },
    { "field": "strengths",
      "message": "Duplicate strength value: 1.5" }
  ]
}
```

### `GET /apps/listing/api/listings/export`

Returns an Amazon-ready `.xlsx` workbook.

| Query param         | Behaviour                                     |
|---------------------|-----------------------------------------------|
| `parentSku=<psku>`  | Only that style's rows                        |
| *(none)*            | All rows (capped at `MAX_EXPORT_ROWS=1000`)   |

**Response 200:**

- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="amazon-listing-{parentSku|ALL}-YYYYMMDD.xlsx"`
- `Cache-Control: no-store`
- Body = XLSX buffer.

## 2. Amazon Template (fptcustom)

Source of truth: `lib/amazonTemplate.ts`. Both the CSV exporter
(`lib/exportCsv.ts`) and the XLSX exporter
(`app/api/listings/export/route.ts`) consume `CSV_COLS` and
`buildHeaderMatrix()`. See ADR-008.

### Column map (`CSV_COLS`)

AMA populates 34 of the template's 249 columns. The rest stay blank.
Column indices are fixed by Amazon's fptcustom layout — the map
below is the canonical set.

| idx | Label                         | Field                          | Required |
|----:|-------------------------------|--------------------------------|----------|
|   0 | Seller SKU                    | `contribution_sku`             | Y        |
|   1 | Listing Action                | `record_action`                | Y        |
|   2 | Product Type                  | `item_type_keyword`            | Y        |
|   3 | Item Name                     | `item_name`                    | Y        |
|   4 | Brand Name                    | `brand_name`                   | Y        |
|  18 | Item Condition                | `condition_type`               | Y        |
|  44 | Quantity                      | `quantity`                     |          |
|  48 | Price                         | `standard_price`               | Y        |
|  75 | Bullet Point 1                | `bullet_point1`                |          |
|  76 | Bullet Point 2                | `bullet_point2`                |          |
|  77 | Bullet Point 3                | `bullet_point3`                |          |
|  78 | Bullet Point 4                | `bullet_point4`                |          |
|  79 | Bullet Point 5                | `bullet_point5`                |          |
|  80 | Generic Keywords              | `generic_keywords`             |          |
|  91 | Color Map                     | `color_map`                    |          |
|  92 | Colour                        | `color_name`                   |          |
| 116 | Magnification Strength        | `magnification_strength`       |          |
| 117 | Magnification Strength Unit   | `magnification_strength_unit`  |          |
| 125 | Lens Width                    | `lens_width`                   |          |
| 126 | Lens Height                   | `lens_height`                  |          |
| 127 | Bridge Width                  | `bridge_width`                 |          |
| 128 | Temple Length                 | `arm_length`                   |          |
| 129 | Frame Width                   | `frame_width`                  |          |
| 130 | Item Weight                   | `item_weight`                  |          |
| 131 | Frame Material                | `frame_material_type`          |          |
| 132 | Frame Shape                   | `frame_shape`                  |          |
| 160 | Parentage Level               | `parentage_level`              |          |
| 161 | Parent SKU                    | `parent_sku`                   |          |
| 162 | Variation Theme               | `variation_theme`              |          |
| 241 | Main Image URL                | `main_image_url`               | Y        |
| 242 | Image URL 2                   | `other_image_url1`             |          |
| 243 | Image URL 3                   | `other_image_url2`             |          |
| 244 | Image URL 4                   | `other_image_url3`             |          |
| 245 | Image URL 5                   | `other_image_url4`             |          |
| 246 | Image URL 6                   | `other_image_url5`             |          |
| 247 | Image URL 7                   | `other_image_url6`             |          |
| 248 | Image URL 8                   | `other_image_url7`             |          |

### Multi-row header

Amazon's fptcustom expects **5 header rows before the first data row**:

| Row | Contents                                                                                             |
|-----|------------------------------------------------------------------------------------------------------|
| 0   | Template metadata: `TemplateType=fptcustom`, `Version=2023.1116`, `TemplateSignature=...`, `HideTemplateHeaders=n` |
| 1   | Blank row                                                                                             |
| 2   | Human-readable column labels (e.g. `Seller SKU`, `Price`)                                             |
| 3   | Field names Amazon uses internally (e.g. `contribution_sku`, `standard_price`)                       |
| 4   | `Required` / `Optional` per column                                                                    |
| 5+  | Data rows — one per listing (Parent or Child)                                                         |

`buildHeaderMatrix()` returns rows 0–4 as a `string[][]` where each row has
length `TOTAL_COLS=249`. `buildDataRow(entries)` produces a single data row
by scattering `{idx: value}` entries into a 249-wide array. The export
route concatenates header rows with data rows and feeds the matrix to
`XLSX.utils.aoa_to_sheet`.

## 3. 错误码 / Error Codes

| Status | When                                                             | Body shape                                          |
|-------:|------------------------------------------------------------------|-----------------------------------------------------|
|    200 | Success                                                          | JSON payload or XLSX buffer                         |
|    400 | Invalid JSON body or `validateBatch` rejected the payload        | `{ error, details?: ValidationError[] }`            |
|    401 | `X-Portal-User` missing or not in allowlist (API routes)         | `{ error: "unauthenticated", login_url: "/login" }` |
|    302 | Page route hit without auth                                      | Redirect to `/login?next=...`                       |
|    404 | `GET /api/listings/export?parentSku=X` and no rows match         | `{ error: "No listings found for parentSku=..." }`  |
|    413 | `GET /api/listings/export` when listing count > `MAX_EXPORT_ROWS`| `{ error: "Too many listings to export ..." }`      |
|    500 | Filesystem read/write failure or XLSX write failure              | `{ error: <message> }`                              |

## 4. 认证 / Authentication

Handled in `middleware.ts`. Every request to `/apps/listing/*` (pages
and APIs) is gated.

- **Header:** `X-Portal-User` — injected by nginx from the portal's
  session cookie. The AMA app never sees the cookie itself.
- **Allowlist:** `ALLOWED_USERS_FALLBACK = ['star000', 'star001', 'star002', 'star003']`.
- **Bypasses:**
  - Static asset paths (`/_next/*`, `favicon`, `*.ico/png/jpg/svg/webp`).
  - Local dev: `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` in `.env.local`.
- **Unauthenticated response:**
  - API routes (path contains `/api/`) → `401` JSON with
    `login_url: '/login'`.
  - Page routes → `302` redirect to `/login?next=<original>`.
- Successful requests receive header `X-Ama-Auth-Checked: true` (helps
  diagnose proxy misconfigurations).

## 5. 输入校验上限 / Input Limits

Defined in `lib/validateBatch.ts`. These caps exist to defend against
accidental or malicious huge inputs that could OOM the XLSX writer.

| Constant          | Value | Meaning                                                 |
|-------------------|------:|---------------------------------------------------------|
| `MAX_COLORS`      |    20 | colors per style (typical real listing: ~8)             |
| `MAX_STRENGTHS`   |    30 | strengths per style (typical real listing: 7)           |
| `MAX_CHILD_SKUS`  |   500 | colors × strengths cap (20 × 30 = 600 blocked)          |
| `MAX_EXPORT_ROWS` |  1000 | total rows emittable in a single export (→ 413 above)   |

Additional per-field rules:

- `parentSku` must match `/^[A-Za-z0-9_-]+$/`.
- Every color needs a non-empty `color`, non-empty unique `colorCode`, and
  an `http(s)://` `mainImage`. Optional `image2..image8` must also be
  `http(s)://` if present.
- Strengths are positive finite numbers with no duplicates.
- Parent SKU must differ from every generated child SKU.
- All generated child SKUs must be unique within the style.

## 6. 性能预算 / Performance Budget

Rough targets on the VPS hardware (single-process Node on shared host).
No benchmark suite yet; numbers come from manual timing on ~150-row
exports.

| Endpoint                                  | p50     | p95      | Notes                                          |
|-------------------------------------------|---------|----------|------------------------------------------------|
| `GET /api/styles`                         | <10 ms  | <30 ms   | Bounded by JSON file size (small)              |
| `GET /api/listings`                       | <20 ms  | <80 ms   | Linear in listing count                        |
| `GET /api/listings?parentSku=X`           | <30 ms  | <100 ms  | Full scan + filter                             |
| `POST /api/listings/batch` (8 × 7 = 56)   | <80 ms  | <250 ms  | Validation + generation + 2 atomic writes      |
| `GET /api/listings/export?parentSku=X`    | <150 ms | <400 ms  | XLSX encode for ~60 rows                       |
| `GET /api/listings/export` (all, 500 rows)| <600 ms | <1200 ms | Near `MAX_EXPORT_ROWS` ceiling                 |

## 7. 数据流图 / Data Flow

```
Operator ─→ Wizard state (React)
             ↓
          POST /api/listings/batch
             ↓
          validateBatch → 400 on fail
             ↓
          generateListingsFromStyle
             ├─ Parent row (no price/qty/color/image/strength)
             └─ Child rows (1 per color × strength)
             ↓
          saveStyle
             ├─ listings.json  (replace-by-parentSku then append)
             └─ styles.json    (upsert { parentSku, variants })
             ↓
          200 JSON → wizard

Operator ─→ anchor.click() (download trigger)
             ↓
          GET /api/listings/export?parentSku=X
             ↓
          getAllListings → filter → sortParentFirst
             ↓
          buildHeaderMatrix  +  listingToRow × N
             ↓
          XLSX.write → Buffer → attachment response
             ↓
          browser download → operator uploads to Amazon
```

## 8. SKU 生成规则 / SKU Generation Rules

```
child_sku = `${parentSku}_${colorCode}_${strengthCode}`
strengthCode = floor(strength × 100).toString().padStart(3, '0')
```

Examples:

| parentSku | colorCode | strength | strengthCode | Child SKU          |
|-----------|-----------|---------:|--------------|--------------------|
| RX224     | BK        | 1.0      | `100`        | `RX224_BK_100`     |
| RX224     | BK        | 1.5      | `150`        | `RX224_BK_150`     |
| RX224     | TO        | 2.75     | `275`        | `RX224_TO_275`     |
| RX224     | DEMI      | 0.75     | `075`        | `RX224_DEMI_075`   |

**Why `floor(× 100)`** — keeps the code an integer (no decimal point in
the SKU) and preserves quarter-diopter granularity Amazon allows. `0.75
→ 075` zero-pads to width 3 so all SKUs have uniform length for a given
colorCode. See ADR-005.

**Invariants enforced by `validateBatch`:**

- Child SKU uniqueness within a style.
- Parent SKU ≠ any generated child SKU.

## 9. Parentage 规则 / Parent vs Child Row Rules

Amazon requires a Parent row to be **non-sellable** — the child rows are
the actual ASINs customers buy. Enforced in `generateListingsFromStyle`
and `listingToRow`:

| Field                     | Parent | Child |
|---------------------------|:------:|:-----:|
| `sku`                     |   Y    |   Y   |
| `parentage_level`         | `Parent` | `Child` |
| `parent_sku`              |   Y    |   Y   |
| `item_name` (template)    |   Y    |   Y   |
| `brand_name`              |   Y    |   Y   |
| `variation_theme`         |   Y    |   Y   |
| `standard_price`          |   —    |   Y   |
| `quantity`                |   —    |   Y   |
| `color_name`, `color_map` |   —    |   Y   |
| `magnification_strength`  |   —    |   Y   |
| `main_image_url`, others  |   —    |   Y   |
| Physical dimensions       |   Y    |   Y   |
| Bullets, keywords, desc.  |   Y    |   Y   |

The export route's `listingToRow` explicitly guards this: the
price/qty/color/strength/image entries are added **only when
`parentage !== 'Parent'`**.

## 10. 数据持久化 / Persistence

### Why JSON files, not SQLite

See ADR-002. Summary:

- Dataset is tiny (dozens of styles, hundreds of rows).
- No schema migration overhead; shape changes are just code.
- Easy to `cat` / diff / grep / edit by hand during debugging.
- Atomic rename is enough for single-writer safety.

### Atomic write protocol

```ts
// listingStore.ts
function writeJsonAtomic(file: string, data: unknown): void {
  ensureDataRoot()
  const tmp = file + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
  fs.renameSync(tmp, file)
}
```

The rename is atomic on POSIX filesystems, so a reader never sees a
partial file; it either sees the old version or the new one. A crash
mid-write leaves `<file>.tmp` behind, which is harmless (the next
write overwrites it).

### Data root resolution

```ts
getDataRoot() {
  return process.env.AMA_LISTING_DATA_ROOT || path.join(process.cwd(), 'data')
}
```

In production, systemd sets `AMA_LISTING_DATA_ROOT=/opt/portal-system/apps/ama-listing-creator/data` — **outside** `.next/standalone`, so each deploy rebuilds the bundle without touching live data.

## 11. 技术选型 / Technology Choices

| Decision                     | Chosen                    | See   |
|------------------------------|---------------------------|-------|
| Framework                    | Next.js 16.2.1 App Router | ADR-001 |
| Deploy mode                  | `output: 'standalone'`    | ADR-001 |
| State store                  | JSON files on disk        | ADR-002 |
| UX pattern                   | 5-step batch wizard       | ADR-003 |
| Image handling               | URL only (no upload)      | ADR-004 |
| Strength code format         | `floor(strength × 100)`   | ADR-005 |
| Variation theme              | `COLOR/MAGNIFICATION_STRENGTH` | ADR-006 |
| `outputFileTracingRoot`      | Pinned to project         | ADR-007 |
| Column map                   | `CSV_COLS` shared         | ADR-008 |
| XLSX library                 | `xlsx@0.18.5`             | runtime dep |

No other runtime dependencies. React + Next + xlsx, that's it.
