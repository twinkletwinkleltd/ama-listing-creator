// lib/validateBatch.test.ts
import { describe, it, expect } from 'vitest'
import {
  validateBatch,
  strengthToCode,
  buildChildSku,
  MAX_COLORS,
  MAX_STRENGTHS,
  MAX_CHILD_SKUS,
} from './validateBatch'
import type { SavedStyleData } from './listingStore'

function validData(overrides: Partial<SavedStyleData> = {}): Partial<SavedStyleData> {
  return {
    parentSku: 'R140',
    brand: 'TWINKLE TWINKLE',
    itemNameTemplate: 'Reading Glasses {color} {strength}',
    price: '9.99',
    quantity: '10',
    variationTheme: 'color_name/magnification_strength',
    colors: [
      {
        color: 'Black',
        colorCode: 'BK',
        colorMap: 'Black',
        mainImage: 'https://example.com/a.jpg',
      },
    ],
    strengths: [1.5, 2.0],
    dimensions: {},
    ...overrides,
  }
}

describe('validateBatch helpers', () => {
  // U1: strengthToCode + buildChildSku format correctly
  it('U1: strengthToCode pads to 3 digits; buildChildSku joins with underscores', () => {
    expect(strengthToCode(1.5)).toBe('150')
    expect(strengthToCode(2.0)).toBe('200')
    expect(strengthToCode(0.75)).toBe('075')
    expect(strengthToCode(0)).toBe('000')
    expect(strengthToCode(-1)).toBe('000')
    expect(buildChildSku('R140', 'BK', '150')).toBe('R140_BK_150')
  })
})

describe('validateBatch', () => {
  // U2: happy path returns ok=true with no errors
  it('U2: valid complete payload returns ok with zero errors', () => {
    const result = validateBatch(validData())
    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
  })

  // U3: parent SKU validation (empty + invalid chars)
  it('U3: rejects empty or invalid parentSku characters', () => {
    const emptyResult = validateBatch(validData({ parentSku: '' }))
    expect(emptyResult.ok).toBe(false)
    expect(emptyResult.errors.some((e) => e.field === 'parentSku' && /required/i.test(e.message))).toBe(true)

    const badCharsResult = validateBatch(validData({ parentSku: 'R 140!' }))
    expect(badCharsResult.ok).toBe(false)
    expect(
      badCharsResult.errors.some(
        (e) => e.field === 'parentSku' && /letters, digits, underscore, and hyphen/.test(e.message),
      ),
    ).toBe(true)

    // Valid chars: allowed
    const goodResult = validateBatch(validData({ parentSku: 'R-140_v2' }))
    expect(goodResult.ok).toBe(true)
  })

  // U4: missing required Step 1 fields each flagged
  it('U4: flags every missing Step 1 text field', () => {
    const result = validateBatch(
      validData({
        brand: '',
        itemNameTemplate: '  ',
        price: '',
        quantity: '',
        variationTheme: '',
      }),
    )
    expect(result.ok).toBe(false)
    const fields = result.errors.map((e) => e.field)
    expect(fields).toContain('brand')
    expect(fields).toContain('itemNameTemplate')
    expect(fields).toContain('price')
    expect(fields).toContain('quantity')
    expect(fields).toContain('variationTheme')
  })

  // U5: colors array rules — empty, too many, duplicate codes, missing fields, bad URLs
  it('U5: enforces color rules (empty/too-many/duplicate/missing/non-http URLs)', () => {
    // Empty
    const emptyResult = validateBatch(validData({ colors: [] }))
    expect(emptyResult.errors.some((e) => e.field === 'colors' && /At least one/i.test(e.message))).toBe(true)

    // Too many
    const many = Array.from({ length: MAX_COLORS + 1 }, (_, i) => ({
      color: `C${i}`,
      colorCode: `C${i}`,
      colorMap: 'Black',
      mainImage: 'https://x.com/a.jpg',
    }))
    const tooManyResult = validateBatch(validData({ colors: many }))
    expect(tooManyResult.errors.some((e) => /Too many colors/.test(e.message))).toBe(true)

    // Duplicate color code + missing fields + bad URLs
    const dup = validateBatch(
      validData({
        colors: [
          { color: '', colorCode: 'BK', colorMap: 'Black', mainImage: 'ftp://no.com/a.jpg' },
          { color: 'Red', colorCode: '', colorMap: 'Red', mainImage: '' },
          {
            color: 'Blue',
            colorCode: 'BK',
            colorMap: 'Blue',
            mainImage: 'https://x.com/a.jpg',
            image2: 'not-a-url',
          },
        ],
      }),
    )
    expect(dup.ok).toBe(false)
    const msgs = dup.errors.map((e) => e.message).join('|')
    expect(msgs).toMatch(/color name is required/)
    expect(msgs).toMatch(/color code is required/)
    expect(msgs).toMatch(/main image URL is required/)
    expect(msgs).toMatch(/main image must be an http\/https URL/)
    expect(msgs).toMatch(/duplicated across colors/)
    expect(msgs).toMatch(/image2: must be an http\/https URL/)
  })

  // U6: strengths rules — empty, too many, non-positive, duplicates
  it('U6: enforces strengths rules (empty/too many/non-positive/duplicate)', () => {
    const emptyResult = validateBatch(validData({ strengths: [] }))
    expect(emptyResult.errors.some((e) => e.field === 'strengths')).toBe(true)

    const tooMany = Array.from({ length: MAX_STRENGTHS + 1 }, (_, i) => i + 1)
    const tooManyResult = validateBatch(validData({ strengths: tooMany }))
    expect(tooManyResult.errors.some((e) => /Too many strengths/.test(e.message))).toBe(true)

    const badValues = validateBatch(validData({ strengths: [-1, NaN, 1.5] as number[] }))
    expect(badValues.errors.some((e) => /must be a positive number/.test(e.message))).toBe(true)

    const dup = validateBatch(validData({ strengths: [1.5, 1.5, 2.0] }))
    expect(dup.errors.some((e) => /Duplicate strength value/.test(e.message))).toBe(true)
  })

  // U7: child SKU cap (colors × strengths > MAX_CHILD_SKUS)
  it('U7: caps total child SKUs at MAX_CHILD_SKUS', () => {
    // 20 colors × 30 strengths = 600 > 500
    const colors = Array.from({ length: MAX_COLORS }, (_, i) => ({
      color: `C${i}`,
      colorCode: `C${i}`,
      colorMap: 'Black',
      mainImage: 'https://x.com/a.jpg',
    }))
    const strengths = Array.from({ length: MAX_STRENGTHS }, (_, i) => (i + 1) * 0.25)
    const result = validateBatch(validData({ colors, strengths }))
    expect(result.ok).toBe(false)
    expect(
      result.errors.some((e) => new RegExp(`Too many child SKUs.*${MAX_CHILD_SKUS}`).test(e.message)),
    ).toBe(true)
  })

  // U8: duplicate generated child SKUs from distinct but colliding strengths
  it('U8: flags duplicate generated child SKUs when strengths collapse to same code', () => {
    // 1.5 and 1.505 are distinct numbers but both floor to strength code "150"
    const result = validateBatch(
      validData({
        strengths: [1.5, 1.505],
      }),
    )
    expect(result.ok).toBe(false)
    expect(
      result.errors.some(
        (e) => e.field === 'colors' && /Duplicate generated child SKU/.test(e.message),
      ),
    ).toBe(true)
  })
})
