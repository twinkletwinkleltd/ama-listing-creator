import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

function loadListings() {
  const filePath = join(process.cwd(), 'data', 'listings.json')
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentSku = searchParams.get('parentSku')
    const sku = searchParams.get('sku')

    const listings = loadListings()

    if (sku) {
      const item = listings.find((l: { sku: string }) => l.sku === sku) ?? null
      return NextResponse.json(item)
    }
    if (parentSku) {
      return NextResponse.json(listings.filter((l: { parentSku: string }) => l.parentSku === parentSku))
    }
    return NextResponse.json(listings)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load listings' }, { status: 500 })
  }
}
