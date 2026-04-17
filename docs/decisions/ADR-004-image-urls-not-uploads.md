# ADR-004 — Image URLs only, no file upload (V1)

## Date

2026-01-25

## Status

Accepted

## Context

Amazon listings need up to 8 images per Child ASIN (1 main + 7 additional).
AMA has to get image references into the `.xlsx` somehow.

Two options:

1. **Operator uploads image files to AMA**, AMA hosts them at a public
   URL, AMA puts that URL in the template.
2. **Operator provides image URLs** from an external host
   (typically `m.media-amazon.com` from previous listings, or an S3 bucket
   managed separately), AMA just stores the string.

## Decision

V1 stores image URLs only. The wizard (Step 2) has a `http/https required`
URL field for `mainImage` per color and an optional details-disclosure for
`image2..image8`. Validation in `validateBatch` rejects non-http(s) values.

## Consequences

**Positive:**

- **No image hosting ops** — no storage quota, no CDN, no signed URLs, no
  moderation, no DMCA pipeline. Keeps AMA a pure file generator.
- Amazon itself ultimately requires publicly-hostable image URLs; operators
  are already managing these. AMA just needs the strings.
- Simpler auth model: no "can user X upload to bucket Y" question.
- Smaller attack surface — no multipart uploads, no image parsing.

**Negative:**

- Operator must keep track of where images live. If the external host
  goes down, the listing breaks. (This is identical to the current
  manual workflow, so no regression.)
- No thumbnail preview in the wizard's Step 5 preview table (we show the
  URL string, not the image). Could be added later by rendering `<img
  src={url}>`.

## Alternatives rejected

- **Upload to AMA-local `public/uploads/`** — would need cleanup on
  listing delete, size limits, and a deploy-safe storage location (the
  standalone bundle gets rebuilt, so uploads would need a persistent
  volume like `data/`). Too much surface for V1.
- **Upload to S3 / Cloudflare R2** — adds a cloud dependency and secret
  management, and the operator would still need a way to get existing
  Amazon images re-hosted.

## Revisit trigger

Revisit if:

- Operators start asking for inline image previews and paste-from-clipboard.
- We standardize on a single image host the operators don't already use.
