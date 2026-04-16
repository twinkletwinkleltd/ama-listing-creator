/**
 * Shared Amazon flat file (fptcustom) template definitions.
 * Used by CSV export (exportCsv.ts) and XLSX export (api/listings/export).
 *
 * Keeping the column map in one place ensures the two exporters stay in sync.
 */

export const TOTAL_COLS = 249

export const TEMPLATE_METADATA = {
  templateType: 'TemplateType=fptcustom',
  version: 'Version=2023.1116',
  signature: 'TemplateSignature=Q09SUkVDVElWRUVZRUdMQVNTRVM=',
  hideHeaders: 'HideTemplateHeaders=n',
}

export interface AmazonColumn {
  idx: number
  label: string
  field: string
  req?: boolean
}

export const CSV_COLS: AmazonColumn[] = [
  { idx: 0,   label: 'Seller SKU',                  field: 'contribution_sku',            req: true },
  { idx: 1,   label: 'Listing Action',              field: 'record_action',               req: true },
  { idx: 2,   label: 'Product Type',                field: 'item_type_keyword',           req: true },
  { idx: 3,   label: 'Item Name',                   field: 'item_name',                   req: true },
  { idx: 4,   label: 'Brand Name',                  field: 'brand_name',                  req: true },
  { idx: 18,  label: 'Item Condition',              field: 'condition_type',              req: true },
  { idx: 44,  label: 'Quantity',                    field: 'quantity' },
  { idx: 48,  label: 'Price',                       field: 'standard_price',              req: true },
  { idx: 75,  label: 'Bullet Point 1',              field: 'bullet_point1' },
  { idx: 76,  label: 'Bullet Point 2',              field: 'bullet_point2' },
  { idx: 77,  label: 'Bullet Point 3',              field: 'bullet_point3' },
  { idx: 78,  label: 'Bullet Point 4',              field: 'bullet_point4' },
  { idx: 79,  label: 'Bullet Point 5',              field: 'bullet_point5' },
  { idx: 80,  label: 'Generic Keywords',            field: 'generic_keywords' },
  { idx: 91,  label: 'Color Map',                   field: 'color_map' },
  { idx: 92,  label: 'Colour',                      field: 'color_name' },
  { idx: 116, label: 'Magnification Strength',      field: 'magnification_strength' },
  { idx: 117, label: 'Magnification Strength Unit', field: 'magnification_strength_unit' },
  // Physical dimensions
  { idx: 125, label: 'Lens Width',                  field: 'lens_width' },
  { idx: 126, label: 'Lens Height',                 field: 'lens_height' },
  { idx: 127, label: 'Bridge Width',                field: 'bridge_width' },
  { idx: 128, label: 'Temple Length',               field: 'arm_length' },
  { idx: 129, label: 'Frame Width',                 field: 'frame_width' },
  { idx: 130, label: 'Item Weight',                 field: 'item_weight' },
  { idx: 131, label: 'Frame Material',              field: 'frame_material_type' },
  { idx: 132, label: 'Frame Shape',                 field: 'frame_shape' },
  // Parentage / variation
  { idx: 160, label: 'Parentage Level',             field: 'parentage_level' },
  { idx: 161, label: 'Parent SKU',                  field: 'parent_sku' },
  { idx: 162, label: 'Variation Theme',             field: 'variation_theme' },
  // Images
  { idx: 241, label: 'Main Image URL',              field: 'main_image_url',              req: true },
  { idx: 242, label: 'Image URL 2',                 field: 'other_image_url1' },
  { idx: 243, label: 'Image URL 3',                 field: 'other_image_url2' },
  { idx: 244, label: 'Image URL 4',                 field: 'other_image_url3' },
  { idx: 245, label: 'Image URL 5',                 field: 'other_image_url4' },
  { idx: 246, label: 'Image URL 6',                 field: 'other_image_url5' },
  { idx: 247, label: 'Image URL 7',                 field: 'other_image_url6' },
  { idx: 248, label: 'Image URL 8',                 field: 'other_image_url7' },
]

/**
 * Build the 5 header rows Amazon expects before data rows:
 *   Row 0: template metadata (TemplateType=..., Version=..., ...)
 *   Row 1: blank
 *   Row 2: human-readable labels
 *   Row 3: field names (column IDs Amazon uses internally)
 *   Row 4: Required / Optional per column
 *
 * Returns a 2-D matrix of strings, each row length TOTAL_COLS.
 */
export function buildHeaderMatrix(): string[][] {
  const blank = () => new Array<string>(TOTAL_COLS).fill('')

  const metaRow = blank()
  metaRow[0] = TEMPLATE_METADATA.templateType
  metaRow[1] = TEMPLATE_METADATA.version
  metaRow[2] = TEMPLATE_METADATA.signature
  metaRow[3] = TEMPLATE_METADATA.hideHeaders

  const emptyRow = blank()
  const labelRow = blank()
  const fieldRow = blank()
  const reqRow = blank()

  for (const c of CSV_COLS) {
    labelRow[c.idx] = c.label
    fieldRow[c.idx] = c.field
    reqRow[c.idx] = c.req ? 'Required' : 'Optional'
  }

  return [metaRow, emptyRow, labelRow, fieldRow, reqRow]
}

/** Build a single data row (matrix form) from {idx: value} entries. */
export function buildDataRow(entries: Record<number, string>): string[] {
  const row = new Array<string>(TOTAL_COLS).fill('')
  for (const [k, v] of Object.entries(entries)) {
    row[Number(k)] = v ?? ''
  }
  return row
}
