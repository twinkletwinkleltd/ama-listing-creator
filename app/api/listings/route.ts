import { NextRequest, NextResponse } from 'next/server'
import { getAllListings } from '@/lib/listingStore'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentSku = searchParams.get('parentSku')
    const sku = searchParams.get('sku')

    const listings = getAllListings()

    if (sku) {
      const item = listings.find((l) => l.sku === sku) ?? null
      return NextResponse.json(item)
    }
    if (parentSku) {
      return NextResponse.json(listings.filter((l) => l.parentSku === parentSku))
    }
    return NextResponse.json(listings)
  } catch (err) {
    console.error('[api/listings] GET error:', err)
    return NextResponse.json({ error: 'Failed to load listings' }, { status: 500 })
  }
}
