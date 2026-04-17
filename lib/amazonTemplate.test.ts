// lib/amazonTemplate.test.ts
import { describe, it, expect } from 'vitest'
import {
  TOTAL_COLS,
  TEMPLATE_METADATA,
  CSV_COLS,
  buildHeaderMatrix,
  buildDataRow,
} from './amazonTemplate'

describe('amazonTemplate', () => {
  // U14: 249-column layout, 5-row header, required markers agree with CSV_COLS
  it('U14: header matrix is 5 rows of TOTAL_COLS with correct metadata + labels', () => {
    expect(TOTAL_COLS).toBe(249)

    const matrix = buildHeaderMatrix()
    expect(matrix).toHaveLength(5)
    matrix.forEach((row) => expect(row).toHaveLength(TOTAL_COLS))

    // Row 0: template metadata in first four cells
    expect(matrix[0][0]).toBe(TEMPLATE_METADATA.templateType)
    expect(matrix[0][1]).toBe(TEMPLATE_METADATA.version)
    expect(matrix[0][2]).toBe(TEMPLATE_METADATA.signature)
    expect(matrix[0][3]).toBe(TEMPLATE_METADATA.hideHeaders)

    // Row 1: blank
    expect(matrix[1].every((c) => c === '')).toBe(true)

    // Rows 2,3,4 have entries at every CSV_COLS index, blanks elsewhere
    for (const col of CSV_COLS) {
      expect(matrix[2][col.idx]).toBe(col.label)
      expect(matrix[3][col.idx]).toBe(col.field)
      expect(matrix[4][col.idx]).toBe(col.req ? 'Required' : 'Optional')
    }

    // Required columns include the well-known SKU/name/price/main-image fields
    const requiredFields = CSV_COLS.filter((c) => c.req).map((c) => c.field)
    expect(requiredFields).toEqual(
      expect.arrayContaining([
        'contribution_sku',
        'record_action',
        'item_type_keyword',
        'item_name',
        'brand_name',
        'condition_type',
        'standard_price',
        'main_image_url',
      ]),
    )

    // Key image column indices match the documented layout
    expect(CSV_COLS.find((c) => c.field === 'main_image_url')?.idx).toBe(241)
    expect(CSV_COLS.find((c) => c.field === 'other_image_url7')?.idx).toBe(248)
  })
})

describe('buildDataRow', () => {
  // U15: buildDataRow fills only supplied indices; defaults blank; handles undefined
  it('U15: data row pads unspecified cells with empty strings and respects null-ish', () => {
    const row = buildDataRow({ 0: 'SKU1', 3: 'Name', 48: '9.99' })
    expect(row).toHaveLength(TOTAL_COLS)
    expect(row[0]).toBe('SKU1')
    expect(row[3]).toBe('Name')
    expect(row[48]).toBe('9.99')
    // All other cells blank
    const nonBlankIndices = row
      .map((v, i) => (v === '' ? -1 : i))
      .filter((i) => i !== -1)
    expect(nonBlankIndices.sort((a, b) => a - b)).toEqual([0, 3, 48])

    // Undefined values fall back to empty string
    const row2 = buildDataRow({ 0: undefined as unknown as string, 5: 'ok' })
    expect(row2[0]).toBe('')
    expect(row2[5]).toBe('ok')
  })
})
