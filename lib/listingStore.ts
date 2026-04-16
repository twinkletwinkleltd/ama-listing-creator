/**
 * Persistent storage for listings and styles.
 *
 * Data root resolution order:
 *   1. process.env.AMA_LISTING_DATA_ROOT
 *   2. <cwd>/data
 *
 * Files:
 *   <dataRoot>/listings.json — flat array of listing rows (parent + child)
 *   <dataRoot>/styles.json  — [{ parentSku, variants: string[] }]
 *
 * Writes are crash-safe: write to <file>.tmp, then rename.
 */

import fs from 'fs'
import path from 'path'

// ───────────────────────── Types ────────────────────────────────────────────

export interface Listing {
  sku: string
  itemName?: string
  brand?: string
  price?: string
  quantity?: string
  color?: string
  colorMap?: string
  strength?: string
  parentage: 'Parent' | 'Child'
  parentSku: string
  variationTheme?: string
  mainImage?: string
  image2?: string
  image3?: string
  image4?: string
  image5?: string
  image6?: string
  image7?: string
  image8?: string
  source?: string
  // Optional: physical dimensions, stored on parent or child
  lensWidth?: string
  lensHeight?: string
  bridgeWidth?: string
  templeLength?: string
  frameWidth?: string
  itemWeight?: string
  frameMaterial?: string
  frameShape?: string
  // Optional listing copy (mirrors draft fields)
  listingAction?: string
  bullet1?: string
  bullet2?: string
  bullet3?: string
  bullet4?: string
  bullet5?: string
  description?: string
  keywords?: string
  [key: string]: string | undefined
}

export interface StyleEntry {
  parentSku: string
  variants: string[]
}

export interface SavedStyleData {
  // Step 1
  parentSku: string
  brand: string
  itemNameTemplate: string
  price: string
  quantity: string
  variationTheme: string
  // Step 2
  colors: Array<{
    color: string
    colorCode: string
    colorMap: string
    mainImage: string
    image2?: string
    image3?: string
    image4?: string
    image5?: string
    image6?: string
    image7?: string
    image8?: string
  }>
  // Step 3
  strengths: number[]
  // Step 4
  dimensions: {
    lensWidth?: string
    lensHeight?: string
    bridgeWidth?: string
    templeLength?: string
    frameWidth?: string
    itemWeight?: string
    frameMaterial?: string
    frameShape?: string
  }
  // Optional listing copy shared across variants
  listingAction?: string
  bullet1?: string
  bullet2?: string
  bullet3?: string
  bullet4?: string
  bullet5?: string
  description?: string
  keywords?: string
}

// ───────────────────────── Paths ────────────────────────────────────────────

export function getDataRoot(): string {
  const envRoot = process.env.AMA_LISTING_DATA_ROOT
  if (envRoot && envRoot.trim()) return envRoot
  return path.join(process.cwd(), 'data')
}

function listingsPath(): string {
  return path.join(getDataRoot(), 'listings.json')
}

function stylesPath(): string {
  return path.join(getDataRoot(), 'styles.json')
}

// ───────────────────────── I/O helpers ──────────────────────────────────────

function ensureDataRoot() {
  const root = getDataRoot()
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  }
}

function readJsonSafe<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback
    const raw = fs.readFileSync(file, 'utf-8')
    return JSON.parse(raw) as T
  } catch (err) {
    console.error(`[listingStore] Failed to read ${file}:`, err)
    return fallback
  }
}

function writeJsonAtomic(file: string, data: unknown): void {
  ensureDataRoot()
  const tmp = file + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
  fs.renameSync(tmp, file)
}

// ───────────────────────── Public API ───────────────────────────────────────

// ───────────────────────── Generation ───────────────────────────────────────

/** Format a strength number for display: 1.5 → "1.5", 2 → "2.0". */
export function formatStrength(n: number): string {
  if (!isFinite(n)) return ''
  // Prefer one decimal place for canonical display
  return n.toFixed(1)
}

/** Convert 1.5 → "150", 2.0 → "200", 0.75 → "075". */
export function strengthCode(n: number): string {
  const v = Math.max(0, Math.floor(n * 100))
  return v.toString().padStart(3, '0')
}

/**
 * Generate parent + all child rows from validated batch style data.
 * Parent row has no price/quantity/strength (Amazon requires this for parents).
 */
export function generateListingsFromStyle(data: SavedStyleData): Listing[] {
  const {
    parentSku, brand, itemNameTemplate, price, quantity, variationTheme,
    colors, strengths, dimensions,
    listingAction, bullet1, bullet2, bullet3, bullet4, bullet5,
    description, keywords,
  } = data

  const rows: Listing[] = []

  // Parent row — shared style info only, no price/quantity/strength
  rows.push({
    sku: parentSku,
    parentage: 'Parent',
    parentSku,
    itemName: itemNameTemplate,
    brand,
    variationTheme,
    listingAction: listingAction ?? 'Create new listing',
    bullet1, bullet2, bullet3, bullet4, bullet5,
    description,
    keywords,
    lensWidth: dimensions?.lensWidth,
    lensHeight: dimensions?.lensHeight,
    bridgeWidth: dimensions?.bridgeWidth,
    templeLength: dimensions?.templeLength,
    frameWidth: dimensions?.frameWidth,
    itemWeight: dimensions?.itemWeight,
    frameMaterial: dimensions?.frameMaterial,
    frameShape: dimensions?.frameShape,
    source: parentSku,
  })

  // Child rows — one per (color × strength)
  for (const c of colors) {
    for (const s of strengths) {
      const code = strengthCode(s)
      const sku = `${parentSku}_${c.colorCode}_${code}`
      const strengthDisplay = formatStrength(s)

      // Simple template substitution — replace {color}, {strength} if present
      const itemName = itemNameTemplate
        .replace(/\{color\}/gi, c.color)
        .replace(/\{strength\}/gi, `+${strengthDisplay}`)
        .replace(/\{parentSku\}/gi, parentSku)

      rows.push({
        sku,
        parentage: 'Child',
        parentSku,
        itemName,
        brand,
        price,
        quantity,
        color: c.color,
        colorMap: c.colorMap || c.color,
        strength: strengthDisplay,
        variationTheme,
        mainImage: c.mainImage,
        image2: c.image2,
        image3: c.image3,
        image4: c.image4,
        image5: c.image5,
        image6: c.image6,
        image7: c.image7,
        image8: c.image8,
        listingAction: listingAction ?? 'Create new listing',
        bullet1, bullet2, bullet3, bullet4, bullet5,
        description,
        keywords,
        lensWidth: dimensions?.lensWidth,
        lensHeight: dimensions?.lensHeight,
        bridgeWidth: dimensions?.bridgeWidth,
        templeLength: dimensions?.templeLength,
        frameWidth: dimensions?.frameWidth,
        itemWeight: dimensions?.itemWeight,
        frameMaterial: dimensions?.frameMaterial,
        frameShape: dimensions?.frameShape,
        source: parentSku,
      })
    }
  }

  return rows
}

// ───────────────────────── Public read API ──────────────────────────────────

export function getAllListings(): Listing[] {
  return readJsonSafe<Listing[]>(listingsPath(), [])
}

export function getAllStyles(): StyleEntry[] {
  return readJsonSafe<StyleEntry[]>(stylesPath(), [])
}

export function getStyle(parentSku: string): Listing[] {
  return getAllListings().filter((l) => l.parentSku === parentSku)
}

export function getStyleEntry(parentSku: string): StyleEntry | null {
  const styles = getAllStyles()
  return styles.find((s) => s.parentSku === parentSku) ?? null
}

/**
 * Replace all rows with the given parentSku, keep all other rows untouched.
 * Also updates styles.json so the parent is registered with its variant list.
 *
 * @param parentSku  The style's parent SKU
 * @param newRows    Parent + all child rows for this style (already generated)
 */
export function saveStyle(parentSku: string, newRows: Listing[]): Listing[] {
  // 1) Update listings.json — filter out any rows under this parent, append new
  const current = getAllListings()
  const kept = current.filter((l) => l.parentSku !== parentSku)
  const next = [...kept, ...newRows]
  writeJsonAtomic(listingsPath(), next)

  // 2) Update styles.json — child SKUs only (parent row has sku === parentSku)
  const childSkus = newRows
    .filter((r) => r.parentage === 'Child')
    .map((r) => r.sku)

  const styles = getAllStyles()
  const idx = styles.findIndex((s) => s.parentSku === parentSku)
  const entry: StyleEntry = { parentSku, variants: childSkus }
  if (idx === -1) styles.push(entry)
  else styles[idx] = entry
  writeJsonAtomic(stylesPath(), styles)

  return newRows
}
