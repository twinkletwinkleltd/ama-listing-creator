# AMA Listing Creator — Product

## 一句话 / TL;DR

AMA (Amazon Listing Assistant) is a batch listing creator for Amazon Seller
Central. An operator fills in a 5-step wizard (basics → colors → strengths →
dimensions → preview) and AMA emits one Parent row plus N Child rows as an
Amazon-ready `.xlsx` file conforming to the **fptcustom** flat-file template.

## 用户 / Users

| 角色 / Role             | 痛点 / Pain                                                 | AMA 解决 / Solution                              |
|-------------------------|-------------------------------------------------------------|--------------------------------------------------|
| Listing operator        | 逐 SKU 填 Excel 行,一款眼镜(8 色 × 7 度数) = 57 行手填      | 填一次,自动展开成 1 + 56 行                       |
| Seller account manager  | 子款缺字段/父款错填价格导致上架失败                          | Parent/Child 字段由规则强制,Parent 无价格无库存   |
| Excel operator          | fptcustom 模板 249 列,手敲列号经常串行                       | 列表在 `amazonTemplate.ts` 单一来源,导出严格匹配  |

## 问题 / The Problem Today

Amazon reading-glasses listings must be uploaded via the **fptcustom**
flat-file Excel template. The current manual workflow:

- Download Amazon's blank `.xlsx` template (5 header rows, 249 columns).
- Type one Parent row (no price, no quantity, no strength — Amazon requires
  parents be non-sellable).
- Copy/paste N Child rows, one per `(color × strength)` combination.
- Manually compute each child's SKU (e.g. `RX224_BK_150`).
- Paste image URLs per color (main + up to 7 additional).
- Repeat bullets/keywords across all children.
- Cross-check that Parent SKU and Child SKUs match, variation theme is set,
  parentage level is correct.

A single reading-glasses style with 8 colors × 7 strengths = **57 rows**. At
~1–2 minutes per row with manual column alignment, one listing is **1–2
hours of Excel surgery** plus a round of Amazon rejection fixes because
someone typed a price on the Parent row.

## 核心价值主张 / Value Proposition

| Dimension            | Manual Excel template                          | AMA wizard                                                             |
|----------------------|------------------------------------------------|------------------------------------------------------------------------|
| Input surface        | 249-column grid, 57-row template               | 5 steps, ~20 fields total                                              |
| SKU generation       | Typed by hand, typos common                    | `{parentSku}_{colorCode}_{strengthCode}` auto-built,unique-checked     |
| Parent/Child fields  | Operator must remember which cells to blank    | Parent row strictly lacks price/qty/strength/color/image               |
| Image URLs           | Pasted per child row (8 URLs × 57 rows = 456)  | Pasted per color (8 URLs × 8 colors = 64), auto-distributed            |
| Column alignment     | 249 columns, drift-prone                       | `CSV_COLS` map is single source of truth for both XLSX and CSV exports |
| Validation           | Amazon bounces the file after upload           | Client + server reject before generation (unique SKU, http URLs, etc.) |
| Time per listing     | 1–2 hours + rework                             | ~5 minutes                                                             |

## 功能 / Features (MVP)

- **5-step New Style Wizard** (`/new-style`): Basics, Colors, Strengths,
  Dimensions, Preview.
- **Batch generation** (`POST /api/listings/batch`): validates, generates
  Parent + `colors × strengths` children, saves atomically.
- **Amazon `.xlsx` export** (`GET /api/listings/export`): returns a workbook
  matching the fptcustom template (5-row header + data rows, 249 columns).
- **Persistence**: `data/listings.json` (flat row store) + `data/styles.json`
  (parent → variant list index). Atomic `.tmp` + rename on every write.
- **Filter by parentSku**: export or list can be scoped to one style.
- **Per-SKU draft editor** (EditorClient) for tweaking bullets/keywords and
  generating a single-listing CSV.
- **Auth-guarded** by `middleware.ts`: requires `X-Portal-User` header set
  by the portal's nginx layer; allowlist of portal usernames.

## 不做的事 / Non-Goals

- **No Amazon SP-API integration.** AMA produces the file; the operator
  uploads it in Seller Central. This is a deliberate scope boundary — SP-API
  integration requires auth, throttling, and listing lifecycle management
  that belong in a different service.
- **No inventory management.** Quantity is a template value; actual stock
  counts live in the portal's inventory service, not here.
- **No order management.** Orders flow through `portal-system` cleaners;
  AMA only creates listings, not orders.
- **No image hosting.** Only image URLs are stored. Amazon requires publicly
  accessible URLs anyway, so there's no value in uploading images to AMA.
- **No listing research / keyword suggestions.** Copy is the operator's job.

## 定价 / Pricing

Internal tool. No external pricing — runs on the company VPS alongside the
rest of `portal-system`, accessed via `ordercleaner.twinkletwinkle.uk/apps/listing`.

## 竞品 / Competitive Landscape

| Tool            | Scope                                           | Overlap with AMA                              |
|-----------------|-------------------------------------------------|-----------------------------------------------|
| Helium 10       | Product research, keyword tracking, PPC         | None — research, not creation                 |
| Jungle Scout    | Market research, supplier database              | None — research, not creation                 |
| Amazon template | Blank fptcustom `.xlsx` from Seller Central     | AMA replaces the manual fill-in workflow      |
| SellerApp       | Listing optimizer (keyword density, A+ content) | Adjacent — AMA creates, SellerApp optimizes   |

AMA occupies a different niche: these are research / analytics tools aimed
at outside sellers exploring the market. AMA is an **internal listing-file
generator** specific to a known product line (reading glasses with color ×
magnification strength variations). The fptcustom template and
Parent/Child rules are hard-coded for that vertical.
