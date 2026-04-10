import fs from 'fs'
import path from 'path'
import EditorClient from '../components/EditorClient'

interface Listing {
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
  source: string
}

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ sku?: string }>
}) {
  const { sku = '' } = await searchParams
  let listing: Listing | null = null
  let allSkus: string[] = []

  try {
    const dataDir = path.join(process.cwd(), 'data')
    const listings: Listing[] = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'listings.json'), 'utf-8')
    )
    allSkus = listings.map((l) => l.sku)
    if (sku) listing = listings.find((l) => l.sku === sku) ?? null
  } catch (e) {
    console.error('Failed to read listing:', e)
  }

  return <EditorClient initialListing={listing} sku={sku} allSkus={allSkus} />
}
