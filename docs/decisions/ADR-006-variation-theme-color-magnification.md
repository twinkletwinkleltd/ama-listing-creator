# ADR-006 — Fix variation theme to `COLOR/MAGNIFICATION_STRENGTH`

## Date

2026-02-02

## Status

Accepted

## Context

Amazon's fptcustom template accepts many `variation_theme` values (`COLOR`,
`SIZE`, `COLOR/SIZE`, `COLOR/MAGNIFICATION_STRENGTH`,
`MAGNIFICATION_STRENGTH`, etc.). The theme determines which attributes
the Child rows vary along and how Amazon renders the ASIN's variation
selector on the product page.

AMA's vertical is reading glasses. Every real listing we create varies
on **color and magnification strength** — the shape of the wizard (a
`colors[]` array crossed with a `strengths[]` array) directly reflects
that.

## Decision

Default `variationTheme` in the wizard to `COLOR/MAGNIFICATION_STRENGTH`
and surface it as an editable input (not read-only) so the operator can
override for the rare edge case.

The child-row generator (`generateListingsFromStyle`) writes the same
value into both Parent and Child rows (Amazon requires them to match).

## Consequences

**Positive:**

- 99% of the time the operator types nothing and gets the right answer.
- Wizard UX stays simple (color × strength grid is exactly the variation
  axes).
- `exportCsv.generateBatchCsv` also uses `'color_name/magnification_strength'`
  as its default fallback, keeping CSV and XLSX exports aligned.

**Negative:**

- A listing that varies on only color (no strengths) or only strength
  (no colors) wouldn't match the wizard's data model — it would need a
  different flow. Today we don't create such listings; if we do, the
  wizard can be extended.
- Forgetting to override the theme for an oddly-varying style produces a
  file Amazon rejects. Detectable only on upload; no client-side check
  for "theme matches the data".

## Alternatives rejected

- **Hard-code the theme as read-only** — loses the escape hatch for
  operators who know what they're doing.
- **Dropdown of all valid themes** — more surface, more choices to get
  wrong. Keeping it a free-text input with a sensible default is the
  smallest escape hatch.
