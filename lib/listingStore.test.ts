// lib/listingStore.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import fsPromises from 'fs/promises'
import os from 'os'
import path from 'path'
import crypto from 'crypto'

// NOTE: getDataRoot() reads AMA_LISTING_DATA_ROOT at call time, so setting
// the env var in beforeEach is sufficient — no need for dynamic imports.

let tmpRoot: string
let prevEnv: string | undefined

beforeEach(async () => {
  prevEnv = process.env.AMA_LISTING_DATA_ROOT
  tmpRoot = path.join(os.tmpdir(), `ama-listing-${crypto.randomUUID()}`)
  await fsPromises.mkdir(tmpRoot, { recursive: true })
  process.env.AMA_LISTING_DATA_ROOT = tmpRoot
})

afterEach(async () => {
  if (prevEnv === undefined) delete process.env.AMA_LISTING_DATA_ROOT
  else process.env.AMA_LISTING_DATA_ROOT = prevEnv
  try {
    await fsPromises.rm(tmpRoot, { recursive: true, force: true })
  } catch {
    // ignore
  }
})

describe('listingStore paths + helpers', () => {
  // U9: getDataRoot reads env var; formatStrength + strengthCode encode correctly
  it('U9: getDataRoot honours env var; formatStrength / strengthCode encode correctly', async () => {
    const { getDataRoot, formatStrength, strengthCode } = await import('./listingStore')
    expect(getDataRoot()).toBe(tmpRoot)
    expect(formatStrength(1.5)).toBe('1.5')
    expect(formatStrength(2)).toBe('2.0')
    expect(formatStrength(Number.NaN)).toBe('')
    expect(formatStrength(Number.POSITIVE_INFINITY)).toBe('')
    expect(strengthCode(1.5)).toBe('150')
    expect(strengthCode(0.75)).toBe('075')
    expect(strengthCode(-5)).toBe('000')
  })
})

describe('listingStore.saveStyle + reads', () => {
  // U10: saveStyle writes listings + styles files atomically (no leftover .tmp)
  it('U10: saveStyle writes both files and leaves no .tmp artifacts', async () => {
    const { saveStyle, getAllListings, getAllStyles } = await import('./listingStore')
    const parentRow = {
      sku: 'R140',
      parentage: 'Parent' as const,
      parentSku: 'R140',
      itemName: 'R140 parent',
    }
    const childRow = {
      sku: 'R140_BK_150',
      parentage: 'Child' as const,
      parentSku: 'R140',
      itemName: 'R140 Black +1.5',
      color: 'Black',
      strength: '1.5',
    }
    saveStyle('R140', [parentRow, childRow])

    const listings = getAllListings()
    expect(listings).toHaveLength(2)
    expect(listings.map((l) => l.sku).sort()).toEqual(['R140', 'R140_BK_150'])

    const styles = getAllStyles()
    expect(styles).toHaveLength(1)
    expect(styles[0]).toEqual({ parentSku: 'R140', variants: ['R140_BK_150'] })

    // Verify no leftover .tmp files (atomic rename should have cleaned them up)
    const files = fs.readdirSync(tmpRoot)
    expect(files.filter((f) => f.endsWith('.tmp'))).toEqual([])
    expect(files.sort()).toEqual(['listings.json', 'styles.json'])
  })

  // U11: saveStyle replaces rows for same parentSku without touching others
  it('U11: saveStyle replaces only rows under same parentSku, updates styles entry', async () => {
    const { saveStyle, getAllListings, getStyle, getStyleEntry } = await import('./listingStore')

    // Initial: parent A with one child; parent B with one child
    saveStyle('A', [
      { sku: 'A', parentage: 'Parent', parentSku: 'A' },
      { sku: 'A_C1', parentage: 'Child', parentSku: 'A' },
    ])
    saveStyle('B', [
      { sku: 'B', parentage: 'Parent', parentSku: 'B' },
      { sku: 'B_C1', parentage: 'Child', parentSku: 'B' },
    ])

    // Replace A with new children
    saveStyle('A', [
      { sku: 'A', parentage: 'Parent', parentSku: 'A' },
      { sku: 'A_C2', parentage: 'Child', parentSku: 'A' },
      { sku: 'A_C3', parentage: 'Child', parentSku: 'A' },
    ])

    const all = getAllListings()
    // B unchanged
    expect(all.filter((l) => l.parentSku === 'B').map((l) => l.sku).sort()).toEqual([
      'B',
      'B_C1',
    ])
    // A now has parent + two new children only
    expect(getStyle('A').map((l) => l.sku).sort()).toEqual(['A', 'A_C2', 'A_C3'])

    const entry = getStyleEntry('A')
    expect(entry).toEqual({ parentSku: 'A', variants: ['A_C2', 'A_C3'] })
    expect(getStyleEntry('missing-parent')).toBeNull()
  })

  // U12: readJsonSafe tolerates missing + corrupt files
  it('U12: read APIs return [] when files are missing or corrupt', async () => {
    const { getAllListings, getAllStyles } = await import('./listingStore')
    // Missing: nothing in tmpRoot yet
    expect(getAllListings()).toEqual([])
    expect(getAllStyles()).toEqual([])

    // Corrupt JSON
    fs.writeFileSync(path.join(tmpRoot, 'listings.json'), '{not json', 'utf-8')
    fs.writeFileSync(path.join(tmpRoot, 'styles.json'), '<html>oops', 'utf-8')
    expect(getAllListings()).toEqual([])
    expect(getAllStyles()).toEqual([])
  })

  // U13: generateListingsFromStyle produces parent row + one child per color×strength
  it('U13: generateListingsFromStyle emits 1+N*M rows with template substitution', async () => {
    const { generateListingsFromStyle } = await import('./listingStore')
    const rows = generateListingsFromStyle({
      parentSku: 'R140',
      brand: 'TT',
      itemNameTemplate: 'Reading {color} {strength} for {parentSku}',
      price: '9.99',
      quantity: '10',
      variationTheme: 'color_name/magnification_strength',
      colors: [
        {
          color: 'Black',
          colorCode: 'BK',
          colorMap: 'Black',
          mainImage: 'https://x.com/a.jpg',
        },
        {
          color: 'Red',
          colorCode: 'RD',
          colorMap: 'Red',
          mainImage: 'https://x.com/b.jpg',
        },
      ],
      strengths: [1.5, 2.0],
      dimensions: { lensWidth: '50', itemWeight: '25g' },
      bullet1: 'b1',
      keywords: 'k',
    })
    // 1 parent + 2*2 children
    expect(rows).toHaveLength(5)
    const parent = rows[0]
    expect(parent.parentage).toBe('Parent')
    expect(parent.sku).toBe('R140')
    expect(parent.price).toBeUndefined()
    expect(parent.quantity).toBeUndefined()
    expect(parent.lensWidth).toBe('50')

    const children = rows.slice(1)
    expect(children.every((r) => r.parentage === 'Child')).toBe(true)
    expect(children.map((r) => r.sku).sort()).toEqual([
      'R140_BK_150',
      'R140_BK_200',
      'R140_RD_150',
      'R140_RD_200',
    ])
    const black15 = children.find((r) => r.sku === 'R140_BK_150')!
    expect(black15.itemName).toBe('Reading Black +1.5 for R140')
    expect(black15.mainImage).toBe('https://x.com/a.jpg')
    expect(black15.price).toBe('9.99')
    expect(black15.quantity).toBe('10')
    expect(black15.bullet1).toBe('b1')
    expect(black15.keywords).toBe('k')
  })
})
