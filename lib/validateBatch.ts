/**
 * Validation for batch style creation payload.
 *
 * Rules:
 *  - parentSku: only letters, digits, `_`, `-` (no spaces, no punctuation)
 *  - At least one color, at least one strength
 *  - Each color needs: color name, colorCode, mainImage
 *  - All image URLs must be http/https
 *  - Generated child SKUs must be unique within the style
 *  - parentSku must differ from every generated child SKU
 */

import type { SavedStyleData } from './listingStore'

const PARENT_SKU_RE = /^[A-Za-z0-9_-]+$/
const HTTP_URL_RE = /^https?:\/\//i

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  ok: boolean
  errors: ValidationError[]
}

/** Convert a strength like 1.5 → "150", 2.0 → "200", 0.75 → "075". */
export function strengthToCode(value: number): string {
  const n = Math.max(0, Math.floor(value * 100))
  return n.toString().padStart(3, '0')
}

export function buildChildSku(
  parentSku: string,
  colorCode: string,
  strengthCode: string,
): string {
  return `${parentSku}_${colorCode}_${strengthCode}`
}

export function validateBatch(data: Partial<SavedStyleData>): ValidationResult {
  const errors: ValidationError[] = []

  // ── Step 1 fields ──────────────────────────────────────────────────
  const parentSku = (data.parentSku ?? '').trim()
  if (!parentSku) {
    errors.push({ field: 'parentSku', message: 'Parent SKU is required' })
  } else if (!PARENT_SKU_RE.test(parentSku)) {
    errors.push({
      field: 'parentSku',
      message: 'Parent SKU may only contain letters, digits, underscore, and hyphen',
    })
  }

  if (!data.brand || !data.brand.trim()) {
    errors.push({ field: 'brand', message: 'Brand is required' })
  }
  if (!data.itemNameTemplate || !data.itemNameTemplate.trim()) {
    errors.push({ field: 'itemNameTemplate', message: 'Item name template is required' })
  }
  if (!data.price || !data.price.trim()) {
    errors.push({ field: 'price', message: 'Price is required' })
  }
  if (!data.quantity || !data.quantity.trim()) {
    errors.push({ field: 'quantity', message: 'Quantity is required' })
  }
  if (!data.variationTheme || !data.variationTheme.trim()) {
    errors.push({ field: 'variationTheme', message: 'Variation theme is required' })
  }

  // ── Step 2 colors ──────────────────────────────────────────────────
  const colors = Array.isArray(data.colors) ? data.colors : []
  if (colors.length === 0) {
    errors.push({ field: 'colors', message: 'At least one color is required' })
  }

  const seenColorCodes = new Set<string>()
  colors.forEach((c, i) => {
    const tag = `colors[${i}]`
    if (!c.color || !c.color.trim()) {
      errors.push({ field: `${tag}.color`, message: `Color #${i + 1}: color name is required` })
    }
    if (!c.colorCode || !c.colorCode.trim()) {
      errors.push({ field: `${tag}.colorCode`, message: `Color #${i + 1}: color code is required` })
    } else {
      const code = c.colorCode.trim()
      if (seenColorCodes.has(code)) {
        errors.push({
          field: `${tag}.colorCode`,
          message: `Color code "${code}" is duplicated across colors`,
        })
      }
      seenColorCodes.add(code)
    }
    if (!c.mainImage || !c.mainImage.trim()) {
      errors.push({ field: `${tag}.mainImage`, message: `Color #${i + 1}: main image URL is required` })
    } else if (!HTTP_URL_RE.test(c.mainImage.trim())) {
      errors.push({
        field: `${tag}.mainImage`,
        message: `Color #${i + 1}: main image must be an http/https URL`,
      })
    }

    const extraImages = [
      ['image2', c.image2],
      ['image3', c.image3],
      ['image4', c.image4],
      ['image5', c.image5],
      ['image6', c.image6],
      ['image7', c.image7],
      ['image8', c.image8],
    ] as const
    for (const [key, val] of extraImages) {
      if (val && val.trim() && !HTTP_URL_RE.test(val.trim())) {
        errors.push({
          field: `${tag}.${key}`,
          message: `Color #${i + 1} ${key}: must be an http/https URL`,
        })
      }
    }
  })

  // ── Step 3 strengths ───────────────────────────────────────────────
  const strengths = Array.isArray(data.strengths) ? data.strengths : []
  if (strengths.length === 0) {
    errors.push({ field: 'strengths', message: 'At least one strength is required' })
  } else {
    strengths.forEach((s, i) => {
      if (typeof s !== 'number' || !isFinite(s) || s < 0) {
        errors.push({ field: `strengths[${i}]`, message: `Strength #${i + 1} must be a positive number` })
      }
    })
    const seen = new Set<number>()
    for (const s of strengths) {
      if (seen.has(s)) {
        errors.push({ field: 'strengths', message: `Duplicate strength value: ${s}` })
        break
      }
      seen.add(s)
    }
  }

  // ── SKU uniqueness (only if we can build them) ─────────────────────
  if (parentSku && colors.length > 0 && strengths.length > 0 && errors.length === 0) {
    const seenSkus = new Set<string>()
    for (const c of colors) {
      for (const s of strengths) {
        const childSku = buildChildSku(parentSku, c.colorCode.trim(), strengthToCode(s))
        if (childSku === parentSku) {
          errors.push({
            field: 'parentSku',
            message: `Parent SKU must differ from generated child SKU ${childSku}`,
          })
        }
        if (seenSkus.has(childSku)) {
          errors.push({
            field: 'colors',
            message: `Duplicate generated child SKU: ${childSku}`,
          })
        }
        seenSkus.add(childSku)
      }
    }
  }

  return { ok: errors.length === 0, errors }
}
