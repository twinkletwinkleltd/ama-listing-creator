# ADR-003 — Batch wizard (Parent + N Children) as the primary creation flow

## Date

2026-01-22

## Status

Accepted

## Context

An Amazon reading-glasses listing is always a Parent ASIN plus N Child
ASINs (one per color × strength combination). Operators do not actually
create "one SKU at a time" — they create a **style** (a Parent and all its
Children together). Missing a Child, or writing a Child without its Parent
being correct, causes Amazon to reject the upload.

The first version of AMA had a single-SKU Editor page (`/editor/[sku]`)
where the operator entered one row at a time. This meant:

- 57 form submissions per style (8 colors × 7 strengths + 1 Parent).
- Operator had to track which SKUs they had already filled.
- Shared fields (brand, item name template, price, bullets) were typed
  57 times.
- No enforcement that all Children under a Parent existed.
- Easy to forget that Parent must have no price/qty (Amazon rejects).

## Decision

Make the 5-step **New Style Wizard** (`app/new-style/NewStyleWizard.tsx`)
the primary creation flow:

- Step 1 — Basics (parentSku, brand, itemNameTemplate, price, quantity,
  variationTheme)
- Step 2 — Colors (N rows; each has color name, colorCode, colorMap,
  mainImage + optional image2..image8)
- Step 3 — Strengths (default `[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]`,
  add/remove)
- Step 4 — Dimensions (lens/bridge/temple/frame, material, shape,
  weight — optional)
- Step 5 — Preview (table of generated rows before save)

On submit, `POST /api/listings/batch` validates the whole style as one
transaction. `generateListingsFromStyle` produces 1 Parent + N×M Children
atomically. `saveStyle` replaces all rows with that `parentSku` before
writing, so re-submitting the wizard with the same parent is an update,
not a duplicate.

The single-SKU Editor still exists for per-child copy edits (bullets,
keywords, extra images), but creating a new style starts from the wizard.

## Consequences

**Positive:**

- One form submission per style, not 57.
- Parent/Child invariants are enforced in one code path
  (`generateListingsFromStyle`).
- Preview step lets operator sanity-check the generated grid before
  saving.
- Re-running the wizard for a parent becomes a clean replace — good for
  "fix a typo in the color code" workflows.

**Negative:**

- Wizard is a bigger component (~680 lines) than a per-field form would
  be. Split across steps, though, it reads linearly.
- Replacing rows on re-submit means per-child copy edits made in the
  Editor can be lost if the operator re-runs the wizard. Operators must
  re-run the wizard **only** to fix style-level fields, then edit copy
  per child after.

## Alternatives rejected

- **Single-SKU editor only** — original V0 approach; operators asked us
  to stop making them fill 57 forms.
- **Spreadsheet-style grid** — attractive but risks Excel-alignment bugs
  (the exact problem AMA solves).
- **CSV import** — just trades the Amazon template for a different
  template; operator still does manual column alignment.
