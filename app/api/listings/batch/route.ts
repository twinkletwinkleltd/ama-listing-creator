/**
 * POST /api/listings/batch
 *
 * Receives a style's batch form data, validates, generates parent + child
 * listing rows, and saves via listingStore.saveStyle (which replaces any
 * previous rows with the same parentSku).
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateListingsFromStyle, saveStyle, type SavedStyleData } from '@/lib/listingStore'
import { validateBatch } from '@/lib/validateBatch'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let body: Partial<SavedStyleData>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  const validation = validateBatch(body)
  if (!validation.ok) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.errors },
      { status: 400 },
    )
  }

  // At this point validation passed, so the fields are present.
  const data = body as SavedStyleData

  try {
    const rows = generateListingsFromStyle(data)
    const saved = saveStyle(data.parentSku, rows)
    return NextResponse.json({
      ok: true,
      parentSku: data.parentSku,
      count: saved.length,
      listings: saved,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save'
    console.error('[api/listings/batch] save error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
