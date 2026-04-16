/**
 * Shared CSV generation for Amazon flat file format (fptcustom template)
 * Used by both EditorClient (single export) and ListingsClient (batch export)
 *
 * The column map (`CSV_COLS`) lives in lib/amazonTemplate.ts so the XLSX
 * export route can reuse it.
 */

import { CSV_COLS, TOTAL_COLS, TEMPLATE_METADATA } from './amazonTemplate'

// ─── Helpers ───────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

function makeRow(entries: Record<number, string>): string {
  const row = new Array(TOTAL_COLS).fill('')
  for (const [k, v] of Object.entries(entries)) row[Number(k)] = v
  return row.map(esc).join(',')
}

function buildHeaderRows(): string[] {
  const labels: Record<number, string> = {}
  const fields: Record<number, string> = {}
  const reqs:   Record<number, string> = {}
  for (const c of CSV_COLS) {
    labels[c.idx] = c.label
    fields[c.idx] = c.field
    reqs[c.idx]   = c.req ? 'Required' : 'Optional'
  }
  return [
    makeRow({
      0: TEMPLATE_METADATA.templateType,
      1: TEMPLATE_METADATA.version,
      2: TEMPLATE_METADATA.signature,
      3: TEMPLATE_METADATA.hideHeaders,
    }),
    makeRow({}),
    makeRow(labels),
    makeRow(fields),
    makeRow(reqs),
  ]
}

// ─── Public types ──────────────────────────────────────────────────────────

export interface ListingData {
  sku: string
  itemName: string
  price: string
  quantity: string
  color: string
  colorMap: string
  strength: string
  parentage: string
  parentSku: string
  variationTheme: string
  mainImage: string
  image2: string
  image3: string
}

/** Content fields stored in localStorage per-SKU draft */
export interface DraftData {
  itemName?: string
  brand?: string
  listingAction?: string
  bullet1?: string
  bullet2?: string
  bullet3?: string
  bullet4?: string
  bullet5?: string
  description?: string
  keywords?: string
  image4?: string
  image5?: string
  image6?: string
  image7?: string
  image8?: string
}

export interface ReadinessResult {
  sku: string
  ready: boolean
  missingRequired: string[]
  missingSuggested: string[]
}

// ─── Readiness check ───────────────────────────────────────────────────────

export function checkReadiness(listing: ListingData, draft: DraftData | null): ReadinessResult {
  const d = draft ?? {}
  const missingRequired: string[] = []
  const missingSuggested: string[] = []

  if (!(d.itemName || listing.itemName)) missingRequired.push('Item Name')
  if (!listing.price)     missingRequired.push('Price')
  if (!listing.quantity)  missingRequired.push('Quantity')
  if (!listing.mainImage) missingRequired.push('Main Image')

  if (!d.bullet1)   missingSuggested.push('Bullet 1')
  if (!d.bullet2)   missingSuggested.push('Bullet 2')
  if (!d.bullet3)   missingSuggested.push('Bullet 3')
  if (!d.keywords)  missingSuggested.push('Keywords')

  return {
    sku: listing.sku,
    ready: missingRequired.length === 0,
    missingRequired,
    missingSuggested,
  }
}

// ─── Single-listing export (used by EditorClient) ──────────────────────────

/** Full form as entered in the EditorClient */
export interface EditorFormData {
  itemName: string; brand: string; listingAction: string
  price: string; quantity: string; parentage: string; parentSku: string; variationTheme: string
  bullet1: string; bullet2: string; bullet3: string; bullet4: string; bullet5: string
  description: string; keywords: string
  colorMap: string; color: string; strength: string
  mainImage: string; image2: string; image3: string; image4: string
  image5: string; image6: string; image7: string; image8: string
}

export function generateSingleCsv(form: EditorFormData, sku: string): string {
  const data: Record<number, string> = {
    0:   sku || 'new-listing',
    1:   form.listingAction,
    2:   'corrective_eyeglasses',
    3:   form.itemName,
    4:   form.brand,
    18:  'New',
    44:  form.quantity,
    48:  form.price,
    75:  form.bullet1,  76: form.bullet2,  77: form.bullet3,
    78:  form.bullet4,  79: form.bullet5,
    80:  form.keywords,
    91:  form.colorMap, 92: form.color,
    116: form.strength, 117: 'diopters',
    160: form.parentage, 161: form.parentSku, 162: form.variationTheme,
    241: form.mainImage, 242: form.image2, 243: form.image3, 244: form.image4,
    245: form.image5,    246: form.image6, 247: form.image7, 248: form.image8,
  }
  return [...buildHeaderRows(), makeRow(data)].join('\n')
}

// ─── Batch export (used by ListingsClient) ─────────────────────────────────

/**
 * Generate a single CSV containing the parent row + all child variants.
 * Draft content (bullets, keywords, etc.) is merged in via getDraft().
 */
export function generateBatchCsv(
  parentSku: string,
  listings: ListingData[],
  getDraft: (sku: string) => DraftData | null,
): string {
  const rows: string[] = [...buildHeaderRows()]

  const variationTheme = listings[0]?.variationTheme || 'color_name/magnification_strength'

  // Find the first draft that has meaningful content for shared fields
  const sharedDraft = listings
    .map((l) => getDraft(l.sku))
    .find((d) => d?.bullet1 || d?.keywords) ?? null

  // Parent row
  rows.push(makeRow({
    0:   parentSku,
    1:   sharedDraft?.listingAction || 'Create new listing',
    2:   'corrective_eyeglasses',
    3:   sharedDraft?.itemName || listings[0]?.itemName || parentSku,
    4:   sharedDraft?.brand || 'TWINKLE TWINKLE',
    18:  'New',
    160: 'parent',
    162: variationTheme,
  }))

  // Child rows — merge listing data with per-SKU draft
  for (const listing of listings) {
    const d = getDraft(listing.sku) ?? {}
    rows.push(makeRow({
      0:   listing.sku,
      1:   d.listingAction || 'Create new listing',
      2:   'corrective_eyeglasses',
      3:   d.itemName || listing.itemName,
      4:   d.brand || 'TWINKLE TWINKLE',
      18:  'New',
      44:  listing.quantity,
      48:  listing.price,
      75:  d.bullet1  || '', 76: d.bullet2 || '', 77: d.bullet3 || '',
      78:  d.bullet4  || '', 79: d.bullet5 || '',
      80:  d.keywords || '',
      91:  listing.colorMap, 92: listing.color,
      116: listing.strength, 117: 'diopters',
      160: 'child',
      161: listing.parentSku,
      162: listing.variationTheme || variationTheme,
      241: listing.mainImage,
      242: listing.image2,
      243: listing.image3,
      244: d.image4 || '',
      245: d.image5 || '',
      246: d.image6 || '',
      247: d.image7 || '',
      248: d.image8 || '',
    }))
  }

  return rows.join('\n')
}

// ─── Download helper ───────────────────────────────────────────────────────

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
