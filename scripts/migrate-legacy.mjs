import XLSXDefault from 'xlsx'
const XLSX = XLSXDefault.default ?? XLSXDefault
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 旧版列映射（和新版不同）
const LEGACY_COL = {
  productType:    0,
  sku:            1,   // 旧版 SKU 在 Col 1
  listingAction:  3,
  itemName:       6,
  price:          22,
  quantity:       23,
  mainImage:      26,
  image2:         27,
  image3:         28,
  parentage:      42,
  parentSku:      43,
  variationTheme: 45,
  strength:       49,
  colorMap:       76,
  color:          77,
}

const FILES = [
  { path: 'H:/claude code-AM-LIS-参考/旧版/旧版AmazonTK53.xlsm',   source: 'legacy-TK53'  },
  { path: 'H:/claude code-AM-LIS-参考/旧版/旧版AmazonTK101.xlsm',  source: 'legacy-TK101' },
  { path: 'H:/claude code-AM-LIS-参考/旧版/旧版RR01416_0.xlsm',    source: 'legacy-RR014' },
  { path: 'H:/claude code-AM-LIS-参考/旧版/旧版RR01406_0.xlsm',    source: 'legacy-RR014b'},
  { path: 'H:/claude code-AM-LIS-参考/旧版/旧版AmazonTK401.xlsm',  source: 'legacy-TK401' },
]

function str(val) { return String(val ?? '').trim() }

function readLegacySheet(filePath, source) {
  const workbook = XLSX.readFile(filePath, { type: 'file', cellText: true, raw: false })
  const sheetName = workbook.SheetNames.find(n => n === 'Template') ?? workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  // Data starts at row index 5 (Excel row 6)
  const childRows = rows.slice(5).filter(row => {
    const sku = str(row[LEGACY_COL.sku])
    if (!sku) return false
    if (sku === 'ABC123') return false
    if (sku.toLowerCase().includes('example')) return false
    const parentage = str(row[LEGACY_COL.parentage]).toLowerCase()
    if (parentage === 'parent') return false
    return true
  })

  return childRows.map(row => ({
    sku:            str(row[LEGACY_COL.sku]),
    itemName:       str(row[LEGACY_COL.itemName]),
    price:          str(row[LEGACY_COL.price]),
    quantity:       str(row[LEGACY_COL.quantity]),
    color:          str(row[LEGACY_COL.color]),
    colorMap:       str(row[LEGACY_COL.colorMap]),
    strength:       str(row[LEGACY_COL.strength]),
    parentage:      str(row[LEGACY_COL.parentage]),
    parentSku:      str(row[LEGACY_COL.parentSku]),
    variationTheme: str(row[LEGACY_COL.variationTheme]),
    mainImage:      str(row[LEGACY_COL.mainImage]),
    image2:         str(row[LEGACY_COL.image2]),
    image3:         str(row[LEGACY_COL.image3]),
    source,
  }))
}

// Load existing data
const dataDir = join(__dirname, '..', 'data')
mkdirSync(dataDir, { recursive: true })

const listingsPath = join(dataDir, 'listings.json')
const stylesPath   = join(dataDir, 'styles.json')

const existingListings = existsSync(listingsPath)
  ? JSON.parse(readFileSync(listingsPath, 'utf-8'))
  : []

const existingSkus = new Set(existingListings.map(l => l.sku))

// Process legacy files
const newRecords = []
const counts = {}

for (const { path, source } of FILES) {
  if (!existsSync(path)) {
    console.warn(`⚠ 文件不存在，跳过: ${path}`)
    counts[source] = 0
    continue
  }
  try {
    const records = readLegacySheet(path, source)
    // Deduplicate: skip SKUs already in listings.json
    const fresh = records.filter(r => !existingSkus.has(r.sku))
    counts[source] = fresh.length
    newRecords.push(...fresh)
    fresh.forEach(r => existingSkus.add(r.sku))
    console.log(`  ${source}: ${records.length} rows read, ${fresh.length} new (${records.length - fresh.length} duplicate skipped)`)
  } catch (err) {
    console.error(`  ERROR reading ${source}: ${err.message}`)
    counts[source] = 0
  }
}

// Merge and save listings.json
const allListings = [...existingListings, ...newRecords]
writeFileSync(listingsPath, JSON.stringify(allListings, null, 2), 'utf-8')

// Rebuild styles.json
const styleMap = new Map()
for (const r of allListings) {
  const p = r.parentSku
  if (!p) continue
  if (!styleMap.has(p)) styleMap.set(p, [])
  styleMap.get(p).push(r.sku)
}
const styles = Array.from(styleMap.entries()).map(([parentSku, variants]) => ({ parentSku, variants }))
writeFileSync(stylesPath, JSON.stringify(styles, null, 2), 'utf-8')

// Summary
const totalNew = Object.values(counts).reduce((a, b) => a + b, 0)
console.log('\n=== Migration summary ===')
for (const [src, cnt] of Object.entries(counts)) {
  console.log(`  ${src}: ${cnt} new records`)
}
console.log(`  Total new: ${totalNew}`)
console.log(`  Total after merge: ${allListings.length}`)
console.log(`  Total styles: ${styles.length}`)
console.log(`\nSaved: data/listings.json (${allListings.length} records)`)
console.log(`Saved: data/styles.json (${styles.length} styles)`)
