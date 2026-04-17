# ADR-005 — Strength code = `floor(strength × 100)` zero-padded to 3 digits

## Date

2026-01-28

## Status

Accepted

## Context

Reading glasses come in magnification strengths `+1.00, +1.25, +1.50, ...
+4.00` (quarter-diopter steps). Each (color × strength) pair is a Child
SKU, and the SKU needs to carry the strength in a way that's:

- Unambiguous (no `1.5` vs `1.50` collisions)
- Sortable as text
- Amazon-safe (no decimal point, no `+` sign)
- Uniform width across a style (so `RX224_BK_100` and `RX224_BK_275` line
  up in CSVs and the UI)

## Decision

Encode strength as `floor(strength × 100).toString().padStart(3, '0')`.

```ts
strengthCode(1.0)   // "100"
strengthCode(1.5)   // "150"
strengthCode(2.75)  // "275"
strengthCode(0.75)  // "075"   ← zero-padded
strengthCode(4.0)   // "400"
```

This produces the child-SKU template:

```
${parentSku}_${colorCode}_${strengthCode}
```

Example: `RX224_BK_150` for parent `RX224`, color code `BK`, strength
`+1.5`.

## Consequences

**Positive:**

- No decimal point in the SKU — safe across Amazon, CSV, Excel, URL
  encoding.
- Uniform 3-digit width for strengths in the `[0.00, 9.99]` range (all
  realistic reading-glasses strengths).
- Text-sortable: `_075, _100, _150, _200, _275, _400` sort in the correct
  magnification order.
- Simple mental model: strip underscores, last 3 digits = strength × 100.

**Negative:**

- Strengths beyond `9.99` would overflow 3 digits (yielding `1000+`). Not a
  real concern for reading glasses, but would need a format change for, say,
  prescription lenses.
- `floor` silently truncates if someone passes `1.499` — we considered
  `Math.round` but `floor` is safer against accidental float creep
  (`1.0 * 100` sometimes gives `99.99999...`; `floor(99.999)` = `99`, then
  `padStart → "099"`). Mitigated by the wizard UX which only allows
  quarter-diopter steps.

## Alternatives rejected

- **`strength.toString()`** — `"1.5"` has a dot; also varies in width
  (`"1"` vs `"1.5"` vs `"1.25"`).
- **`strength.toFixed(2).replace('.', '')`** — `"1.50" → "150"` works, but
  requires remembering the fixed width depends on strengths ≥ 10 never
  occurring.
- **Two separate fields (`strengthInt`, `strengthFrac`)** — overcomplicated.

## Note on the `.toFixed(2)` edge case

We use `Math.floor(value * 100)` rather than `Math.round` deliberately.
Quarter-diopter steps (`0.25`, `0.50`, `0.75`) are exact in float
representation; half-steps (`1.5`) are as well. The only inputs that
would differ between `floor` and `round` are non-quarter values, which
the wizard UX doesn't allow.
