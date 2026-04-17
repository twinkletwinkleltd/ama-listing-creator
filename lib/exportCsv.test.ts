// lib/exportCsv.test.ts
import { describe, it, expect } from 'vitest'
import {
  checkReadiness,
  generateSingleCsv,
  generateBatchCsv,
  type EditorFormData,
  type ListingData,
  type DraftData,
} from './exportCsv'
import { TEMPLATE_METADATA } from './amazonTemplate'

function baseForm(): EditorFormData {
  return {
    itemName: 'R140 Black +1.5',
    brand: 'TWINKLE TWINKLE',
    listingAction: 'Create new listing',
    price: '9.99',
    quantity: '10',
    parentage: 'child',
    parentSku: 'R140',
    variationTheme: 'color_name/magnification_strength',
    bullet1: 'One, with comma',
    bullet2: 'Two "quoted"',
    bullet3: 'Three',
    bullet4: 'Four',
    bullet5: 'Five',
    description: 'Desc',
    keywords: 'reading glasses',
    colorMap: 'Black',
    color: 'Black',
    strength: '1.5',
    mainImage: 'https://x.com/a.jpg',
    image2: 'https://x.com/b.jpg',
    image3: '',
    image4: '',
    image5: '',
    image6: '',
    image7: '',
    image8: '',
  }
}

describe('checkReadiness', () => {
  // U-bonus (covered under U2/U5 slot — kept as implicit coverage, no dedicated ID)
  it('identifies missing required vs suggested fields', () => {
    const listing: ListingData = {
      sku: 'R140_BK_150',
      itemName: '',
      price: '',
      quantity: '',
      color: 'Black',
      colorMap: 'Black',
      strength: '1.5',
      parentage: 'child',
      parentSku: 'R140',
      variationTheme: 'vt',
      mainImage: '',
      image2: '',
      image3: '',
    }
    const result = checkReadiness(listing, null)
    expect(result.ready).toBe(false)
    expect(result.missingRequired).toEqual(
      expect.arrayContaining(['Item Name', 'Price', 'Quantity', 'Main Image']),
    )
    expect(result.missingSuggested).toEqual(
      expect.arrayContaining(['Bullet 1', 'Bullet 2', 'Bullet 3', 'Keywords']),
    )

    // With draft filling suggestions + listing filling required
    const listing2: ListingData = {
      ...listing,
      itemName: 'X',
      price: '1',
      quantity: '1',
      mainImage: 'https://x.com/m.jpg',
    }
    const draft: DraftData = {
      bullet1: 'b1',
      bullet2: 'b2',
      bullet3: 'b3',
      keywords: 'k',
    }
    const result2 = checkReadiness(listing2, draft)
    expect(result2.ready).toBe(true)
    expect(result2.missingSuggested).toEqual([])
  })
})

describe('generateSingleCsv', () => {
  it('emits 5 header rows + 1 data row with escaped commas and quoted quotes', () => {
    const csv = generateSingleCsv(baseForm(), 'R140_BK_150')
    const lines = csv.split('\n')
    // 5 header rows + 1 data row
    expect(lines).toHaveLength(6)
    expect(lines[0].startsWith(TEMPLATE_METADATA.templateType)).toBe(true)
    // SKU placed at column 0 of data row
    const dataCols = lines[5].split(',')
    expect(dataCols[0]).toBe('R140_BK_150')
    // Comma-containing bullet must be quoted
    expect(csv).toContain('"One, with comma"')
    // Double-quote escaped as ""
    expect(csv).toContain('"Two ""quoted"""')
  })

  it('falls back to "new-listing" when sku is empty', () => {
    const csv = generateSingleCsv(baseForm(), '')
    const lines = csv.split('\n')
    const dataCols = lines[5].split(',')
    expect(dataCols[0]).toBe('new-listing')
  })
})

describe('generateBatchCsv', () => {
  it('emits parent row + one child per listing; drafts merged per SKU', () => {
    const listings: ListingData[] = [
      {
        sku: 'R140_BK_150',
        itemName: 'R140 Black',
        price: '9.99',
        quantity: '10',
        color: 'Black',
        colorMap: 'Black',
        strength: '1.5',
        parentage: 'child',
        parentSku: 'R140',
        variationTheme: 'color_name/magnification_strength',
        mainImage: 'https://x.com/a.jpg',
        image2: 'https://x.com/b.jpg',
        image3: '',
      },
      {
        sku: 'R140_RD_200',
        itemName: 'R140 Red',
        price: '9.99',
        quantity: '10',
        color: 'Red',
        colorMap: 'Red',
        strength: '2.0',
        parentage: 'child',
        parentSku: 'R140',
        variationTheme: 'color_name/magnification_strength',
        mainImage: 'https://x.com/r.jpg',
        image2: '',
        image3: '',
      },
    ]

    const drafts: Record<string, DraftData> = {
      R140_BK_150: {
        bullet1: 'Black bullet',
        keywords: 'black reading',
        image4: 'https://x.com/b4.jpg',
      },
    }
    const csv = generateBatchCsv('R140', listings, (sku) => drafts[sku] ?? null)
    const lines = csv.split('\n')
    // 5 header rows + 1 parent + 2 children
    expect(lines).toHaveLength(8)

    const parentCols = lines[5].split(',')
    expect(parentCols[0]).toBe('R140')
    // Parent gets parentage 'parent' at column 160
    expect(parentCols[160]).toBe('parent')

    const child1Cols = lines[6].split(',')
    expect(child1Cols[0]).toBe('R140_BK_150')
    expect(child1Cols[160]).toBe('child')
    expect(child1Cols[161]).toBe('R140')
    // Draft image4 merged
    expect(child1Cols[244]).toBe('https://x.com/b4.jpg')

    const child2Cols = lines[7].split(',')
    expect(child2Cols[0]).toBe('R140_RD_200')
    // No draft → bullets/image4 blank
    expect(child2Cols[75]).toBe('')
    expect(child2Cols[244]).toBe('')
  })

  it('defaults variationTheme when listings[0] has none', () => {
    const listings: ListingData[] = [
      {
        sku: 'CHILD',
        itemName: '',
        price: '',
        quantity: '',
        color: '',
        colorMap: '',
        strength: '',
        parentage: 'child',
        parentSku: 'P',
        variationTheme: '',
        mainImage: '',
        image2: '',
        image3: '',
      },
    ]
    const csv = generateBatchCsv('P', listings, () => null)
    const lines = csv.split('\n')
    const parent = lines[5].split(',')
    expect(parent[162]).toBe('color_name/magnification_strength')
  })
})
