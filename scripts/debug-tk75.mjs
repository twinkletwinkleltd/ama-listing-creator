import XLSXDefault from 'xlsx'
const XLSX = XLSXDefault.default ?? XLSXDefault

const FILE = 'H:/claude code-AM-LIS-参考/新版/TKTK-TK75MIX-Jiuban-1.3.xlsm'

const workbook = XLSX.readFile(FILE, { type: 'file', cellText: true, raw: false })

const sheetName = workbook.SheetNames.find(n => n === 'Template') ?? workbook.SheetNames[0]
console.log(`Using sheet: "${sheetName}"\n`)

const sheet = workbook.Sheets[sheetName]
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

// Rows 6-8 in Excel = index 5,6,7
for (let i = 5; i <= 7; i++) {
  const row = rows[i]
  if (!row) { console.log(`=== Row ${i + 1} (empty) ===\n`); continue }

  console.log(`=== Row ${i + 1} (Excel row ${i + 1}) ===`)
  // Find last non-empty column
  let lastCol = 0
  for (let c = row.length - 1; c >= 0; c--) {
    if (row[c] !== '' && row[c] !== null && row[c] !== undefined) { lastCol = c; break }
  }
  for (let c = 0; c <= lastCol; c++) {
    const val = row[c]
    if (val !== '' && val !== null && val !== undefined) {
      console.log(`  Col ${c}: ${val}`)
    }
  }
  console.log()
}
