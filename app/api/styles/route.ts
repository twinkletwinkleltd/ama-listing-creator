import { NextResponse } from 'next/server'
import { getAllStyles } from '@/lib/listingStore'

export const runtime = 'nodejs'

export async function GET() {
  try {
    return NextResponse.json(getAllStyles())
  } catch (err) {
    console.error('[api/styles] GET error:', err)
    return NextResponse.json({ error: 'Failed to load styles' }, { status: 500 })
  }
}
