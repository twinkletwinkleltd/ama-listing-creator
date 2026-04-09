import XLSXDefault from 'xlsx'
const XLSX = XLSXDefault.default ?? XLSXDefault
import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Support env override: XLSM_DIR=/path/to/xlsm node scripts/read-listings.mjs
const DATA_DIR = process.env.XLSM_DIR || 'I:/claude code-AM-LIS-参考/新版'

const FILES = [
  { path: `${DATA_DIR}/TKTK-RX224-xinban-1.0.xlsm`,  source: 'RX224' },
  { path: `${DATA_DIR}/TKTK-TK223-xinban-1.4.xlsm`,  source: 'TK223' },
  { path: `${DATA_DIR}/TKTK-2P-R75-xinban-1.1.xlsm`, source: '2PR75' },
]

const COL = {
  sku:            0,
  itemName:       3,
  price:          48,
  quantity:       44,
  colorMap:       91,
  color:          92,
  strength:       116,
  parentage:      160,
  parentSku:      161,
  variationTheme: 162,
  mainImage:      241,
  image2:         242,
  image3:         243,
}

function str(val) {
  return String(val ?? '').trim()
}

function readSheet(filePath, source) {
  const workbook = XLSX.readFile(filePath, { type: 'file', cellText: true, raw: false })
  const sheetName = workbook.SheetNames.find(n => n === 'Template') ?? workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  // Data starts at row index 5 (Excel row 6)
  const childRows = rows.slice(5).filter(row => {
    const sku = str(row[COL.sku])
    if (!sku) return false
    if (sku === 'ABC123') return false
    if (sku.toLowerCase().includes('example')) return false
    const parentage = str(row[COL.parentage]).toLowerCase()
    if (parentage === 'parent') return false
    return true
  })

  return childRows.map(row => ({
    sku:            str(row[COL.sku]),
    itemName:       str(row[COL.itemName]),
    price:          str(row[COL.price]),
    quantity:       str(row[COL.quantity]),
    color:          str(row[COL.color]),
    colorMap:       str(row[COL.colorMap]),
    strength:       str(row[COL.strength]),
    parentage:      str(row[COL.parentage]),
    parentSku:      str(row[COL.parentSku]),
    variationTheme: str(row[COL.variationTheme]),
    mainImage:      str(row[COL.mainImage]),
    image2:         str(row[COL.image2]),
    image3:         str(row[COL.image3]),
    source,
  }))
}

// --- Run ---
const allRecords = []
const counts = {}

for (const { path, source } of FILES) {
  try {
    const records = readSheet(path, source)
    counts[source] = records.length
    allRecords.push(...records)
  } catch (err) {
    console.error(`ERROR reading ${source}: ${err.message}`)
    counts[source] = 0
  }
}

// --- Build styles.json ---
const styleMap = new Map()
for (const r of allRecords) {
  const p = r.parentSku
  if (!p) continue
  if (!styleMap.has(p)) styleMap.set(p, [])
  styleMap.get(p).push(r.sku)
}
const styles = Array.from(styleMap.entries()).map(([parentSku, variants]) => ({
  parentSku,
  variants,
}))

// --- Save ---
const outDir = join(__dirname, '..', 'data')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'listings.json'), JSON.stringify(allRecords, null, 2), 'utf-8')
writeFileSync(join(outDir, 'styles.json'),   JSON.stringify(styles,     null, 2), 'utf-8')

// --- Print summary ---
console.log('\n=== Read summary ===')
for (const [source, count] of Object.entries(counts)) {
  console.log(`  ${source}: ${count} child rows`)
}
console.log(`  Total: ${allRecords.length} records`)
console.log(`  Styles (unique parents): ${styles.length}`)
console.log('\n=== styles.json preview ===')
for (const s of styles) {
  console.log(`  ${s.parentSku}  →  ${s.variants.length} variants: [${s.variants.slice(0, 3).join(', ')}${s.variants.length > 3 ? ', ...' : ''}]`)
}
console.log(`\nSaved: data/listings.json (${allRecords.length} records)`)
console.log(`Saved: data/styles.json (${styles.length} styles)`)
