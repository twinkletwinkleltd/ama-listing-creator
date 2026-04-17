/**
 * GET /api/listings/export
 *
 * Export listings as an Amazon-compatible .xlsx file using the fptcustom
 * template layout. When parentSku is provided, only that style is exported;
 * otherwise all listings are exported.
 *
 * Filename: amazon-listing-{parentSku|ALL}-{YYYYMMDD}.xlsx
 */

import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'

import {
  buildDataRow,
  buildHeaderMatrix,
  TOTAL_COLS,
} from '@/lib/amazonTemplate'
import { getAllListings, type Listing } from '@/lib/listingStore'

export const runtime = 'nodejs'

// Max rows allowed in a single Excel export. Above this, return 413 with a
// hint to filter by parentSku. Prevents OOM from accidental "export all"
// when listings.json grows huge.
const MAX_EXPORT_ROWS = 1000

// ── Map Listing → row values keyed by Amazon column index ───────────────────

function listingToRow(l: Listing): string[] {
  const isParent = l.parentage === 'Parent'

  const entries: Record<number, string> = {
    0:   l.sku || '',
    1:   l.listingAction || 'Create new listing',
    2:   'corrective_eyeglasses',
    3:   l.itemName || '',
    4:   l.brand || 'TWINKLE TWINKLE',
    18:  'New',
    75:  l.bullet1 || '',
    76:  l.bullet2 || '',
    77:  l.bullet3 || '',
    78:  l.bullet4 || '',
    79:  l.bullet5 || '',
    80:  l.keywords || '',
    125: l.lensWidth || '',
    126: l.lensHeight || '',
    127: l.bridgeWidth || '',
    128: l.templeLength || '',
    129: l.frameWidth || '',
    130: l.itemWeight || '',
    131: l.frameMaterial || '',
    132: l.frameShape || '',
    160: isParent ? 'Parent' : 'Child',
    161: l.parentSku || '',
    162: l.variationTheme || 'COLOR/MAGNIFICATION_STRENGTH',
  }

  // Parent rows do NOT include price/quantity/strength/color/images
  // (Amazon requires parents be non-sellable).
  if (!isParent) {
    entries[44]  = l.quantity || ''
    entries[48]  = l.price || ''
    entries[91]  = l.colorMap || l.color || ''
    entries[92]  = l.color || ''
    entries[116] = l.strength || ''
    entries[117] = l.strength ? 'diopters' : ''
    entries[241] = l.mainImage || ''
    entries[242] = l.image2 || ''
    entries[243] = l.image3 || ''
    entries[244] = l.image4 || ''
    entries[245] = l.image5 || ''
    entries[246] = l.image6 || ''
    entries[247] = l.image7 || ''
    entries[248] = l.image8 || ''
  }

  return buildDataRow(entries)
}

// ── Sort: parent row first, then children (stable within) ───────────────────

function sortParentFirst(listings: Listing[]): Listing[] {
  return [...listings].sort((a, b) => {
    if (a.parentSku !== b.parentSku) return a.parentSku.localeCompare(b.parentSku)
    if (a.parentage === 'Parent' && b.parentage !== 'Parent') return -1
    if (b.parentage === 'Parent' && a.parentage !== 'Parent') return 1
    return a.sku.localeCompare(b.sku)
  })
}

function todayStamp(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

// ── Handler ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const parentSku = request.nextUrl.searchParams.get('parentSku')?.trim() || null

  let listings: Listing[]
  try {
    const all = getAllListings()
    listings = parentSku ? all.filter((l) => l.parentSku === parentSku) : all
  } catch (err) {
    console.error('[api/listings/export] load error:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to load listings' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (parentSku && listings.length === 0) {
    return new Response(
      JSON.stringify({ error: `No listings found for parentSku=${parentSku}` }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (listings.length > MAX_EXPORT_ROWS) {
    return new Response(
      JSON.stringify({
        error: `Too many listings to export at once: ${listings.length} > ${MAX_EXPORT_ROWS}. Filter by parentSku to narrow the result.`,
      }),
      { status: 413, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Build matrix: 5 header rows + N data rows
  const header = buildHeaderMatrix()
  const sorted = sortParentFirst(listings)
  const dataRows = sorted.map(listingToRow)
  const matrix: string[][] = [...header, ...dataRows]

  // Ensure every row is exactly TOTAL_COLS wide
  for (const row of matrix) {
    while (row.length < TOTAL_COLS) row.push('')
  }

  // Build workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(matrix)
  XLSX.utils.book_append_sheet(wb, ws, 'Template')

  const buffer: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const tag = parentSku || 'ALL'
  const filename = `amazon-listing-${tag}-${todayStamp()}.xlsx`

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
