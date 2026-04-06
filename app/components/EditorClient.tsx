'use client'

import { useState, useEffect } from 'react'
import KeywordSuggestions from '@/components/KeywordSuggestions'

// ─── Types ───────────────────────────────────────────────────────────
interface FormData {
  // Tab 1 – Basic Info
  itemName: string
  brand: string
  listingAction: string
  price: string
  quantity: string
  parentage: string
  parentSku: string
  variationTheme: string
  // Tab 2 – Content
  bullet1: string; bullet2: string; bullet3: string; bullet4: string; bullet5: string
  description: string
  keywords: string
  style: string
  department: string
  targetGender: string
  // Tab 3 – Specs & Images
  colorMap: string
  color: string
  strength: string
  frameMaterial: string
  frameType: string
  itemShape: string
  numberOfItems: string
  packageQuantity: string
  armLength: string
  bridgeWidth: string
  itemWeight: string
  weightUnit: string
  mainImage: string
  image2: string; image3: string; image4: string
  image5: string; image6: string; image7: string; image8: string
}

interface Listing {
  sku: string
  itemName: string
  price: string
  quantity: string
  color: string
  colorMap: string
  strength: string
  parentage: string
  parentSku: string
  variationTheme: string
  mainImage: string
  image2: string
  image3: string
  source: string
}

interface Props {
  initialListing: Listing | null
  sku: string
}

const EMPTY_FORM: FormData = {
  itemName: '', brand: 'TWINKLE TWINKLE', listingAction: 'Create new listing',
  price: '', quantity: '', parentage: '', parentSku: '', variationTheme: '',
  bullet1: '', bullet2: '', bullet3: '', bullet4: '', bullet5: '',
  description: '', keywords: '', style: '', department: 'Unisex Adults', targetGender: 'Unisex',
  colorMap: '', color: '', strength: '', frameMaterial: '', frameType: '',
  itemShape: '', numberOfItems: '', packageQuantity: '', armLength: '', bridgeWidth: '',
  itemWeight: '', weightUnit: 'g',
  mainImage: '', image2: '', image3: '', image4: '', image5: '', image6: '', image7: '', image8: '',
}

const REQUIRED_KEYS: (keyof FormData)[] = ['itemName', 'price', 'quantity', 'mainImage']
const SUGGESTED_KEYS: (keyof FormData)[] = [
  'bullet1', 'bullet2', 'bullet3', 'bullet4', 'bullet5',
  'description', 'keywords', 'color', 'strength',
]

// ─── CSV generation ───────────────────────────────────────────────────
const CSV_COLS: Array<{ idx: number; label: string; field: string; req?: boolean }> = [
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
  { idx: 160, label: 'Parentage Level',             field: 'parentage_level' },
  { idx: 161, label: 'Parent SKU',                  field: 'parent_sku' },
  { idx: 162, label: 'Variation Theme',             field: 'variation_theme' },
  { idx: 241, label: 'Main Image URL',              field: 'main_image_url',              req: true },
  { idx: 242, label: 'Image URL 2',                 field: 'other_image_url1' },
  { idx: 243, label: 'Image URL 3',                 field: 'other_image_url2' },
  { idx: 244, label: 'Image URL 4',                 field: 'other_image_url3' },
  { idx: 245, label: 'Image URL 5',                 field: 'other_image_url4' },
  { idx: 246, label: 'Image URL 6',                 field: 'other_image_url5' },
  { idx: 247, label: 'Image URL 7',                 field: 'other_image_url6' },
  { idx: 248, label: 'Image URL 8',                 field: 'other_image_url7' },
]

function generateCsv(form: FormData, sku: string): string {
  const TOTAL = 249
  const esc = (s: string) =>
    s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s

  const makeRow = (entries: Record<number, string>) => {
    const row = new Array(TOTAL).fill('')
    for (const [k, v] of Object.entries(entries)) row[Number(k)] = v
    return row.map(esc).join(',')
  }

  const labels: Record<number, string> = {}
  const fields: Record<number, string> = {}
  const reqs:   Record<number, string> = {}
  for (const c of CSV_COLS) {
    labels[c.idx] = c.label
    fields[c.idx] = c.field
    reqs[c.idx]   = c.req ? 'Required' : 'Optional'
  }

  const data: Record<number, string> = {
    0: sku || 'new-listing',
    1: form.listingAction,
    2: 'corrective_eyeglasses',
    3: form.itemName,
    4: form.brand,
    18: 'New',
    44: form.quantity,
    48: form.price,
    75: form.bullet1,  76: form.bullet2,  77: form.bullet3,
    78: form.bullet4,  79: form.bullet5,
    80: form.keywords,
    91: form.colorMap, 92: form.color,
    116: form.strength, 117: 'diopters',
    160: form.parentage, 161: form.parentSku, 162: form.variationTheme,
    241: form.mainImage, 242: form.image2, 243: form.image3, 244: form.image4,
    245: form.image5,    246: form.image6, 247: form.image7, 248: form.image8,
  }

  return [
    makeRow({ 0: 'TemplateType=fptcustom', 1: 'Version=2023.1116', 2: 'TemplateSignature=Q09SUkVDVElWRUVZRUdMQVNTRVM=', 3: 'HideTemplateHeaders=n' }),
    makeRow({}),
    makeRow(labels),
    makeRow(fields),
    makeRow(reqs),
    makeRow(data),
  ].join('\n')
}

// ─── Small helpers ────────────────────────────────────────────────────
function FieldLabel({ text, type = 'optional' }: { text: string; type?: 'required' | 'suggested' | 'optional' }) {
  const color = type === 'required' ? '#cc0000' : type === 'suggested' ? '#b37a00' : '#000000'
  return (
    <label style={{ width: '110px', textAlign: 'right', flexShrink: 0, paddingTop: '3px', fontSize: '11px', color, display: 'block' }}>
      {type === 'required' ? '* ' : ''}{text}
    </label>
  )
}

function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max
  return (
    <span style={{ fontSize: '10px', color: over ? '#cc0000' : '#808080', whiteSpace: 'nowrap', marginLeft: '4px', paddingTop: '3px' }}>
      {value.length}/{max}
    </span>
  )
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="win98-field-row">
      <FieldLabel text={label} />
      <div style={{ flex: 1, fontSize: '11px', color: '#808080', padding: '2px 4px', border: '2px inset #d4d0c8', background: '#d4d0c8', minHeight: '21px' }}>
        {value || '—'}
      </div>
    </div>
  )
}

function ImageInput({
  label, value, onChange, required,
}: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  const [testStatus, setTestStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')

  const handleTest = async () => {
    if (!value.trim()) return
    setTestStatus('checking')
    try {
      await fetch(value, { method: 'HEAD', mode: 'no-cors' })
      setTestStatus('ok')
    } catch {
      setTestStatus('error')
    }
  }

  const statusIcon = testStatus === 'checking' ? '⏳' : testStatus === 'ok' ? '✅' : testStatus === 'error' ? '❌' : null

  const inp = 'border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1'
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel text={label} type={required ? 'required' : 'optional'} />
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setTestStatus('idle') }}
          placeholder="https://..."
          className={inp}
        />
        {value && (
          <button
            type="button"
            onClick={handleTest}
            className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            {statusIcon ?? '测试'}
          </button>
        )}
        {value ? (
          <a href={value} target="_blank" rel="noopener noreferrer">
            <img
              src={value}
              alt=""
              className="w-12 h-12 rounded object-cover border border-gray-200 bg-gray-100 flex-shrink-0"
              onError={(e) => { ;(e.target as HTMLImageElement).src = '' }}
            />
          </a>
        ) : (
          <div className="w-12 h-12 rounded border border-dashed border-gray-200 bg-gray-50 flex-shrink-0" />
        )}
      </div>
    </div>
  )
}

// ─── Main EditorClient ────────────────────────────────────────────────
export default function EditorClient({ initialListing, sku }: Props) {
  const buildInitialForm = (): FormData => {
    if (!initialListing) return EMPTY_FORM
    return {
      ...EMPTY_FORM,
      itemName:       initialListing.itemName       ?? '',
      price:          initialListing.price          ?? '',
      quantity:       initialListing.quantity       ?? '',
      color:          initialListing.color          ?? '',
      colorMap:       initialListing.colorMap       ?? '',
      strength:       initialListing.strength       ?? '',
      parentage:      initialListing.parentage      ?? '',
      parentSku:      initialListing.parentSku      ?? '',
      variationTheme: initialListing.variationTheme ?? '',
      mainImage:      initialListing.mainImage      ?? '',
      image2:         initialListing.image2         ?? '',
      image3:         initialListing.image3         ?? '',
    }
  }

  const [form, setForm] = useState<FormData>(buildInitialForm)

  // Overlay localStorage draft on mount
  useEffect(() => {
    if (!sku) return
    try {
      const saved = localStorage.getItem(`draft:${sku}`)
      if (saved) {
        const draft = JSON.parse(saved) as Partial<FormData>
        setForm((prev) => ({ ...prev, ...draft }))
      }
    } catch { /* ignore */ }
  }, [sku])

  const handleSaveDraft = () => {
    const key = sku || 'new'
    localStorage.setItem(`draft:${key}`, JSON.stringify(form))
    alert(`草稿已保存 (${key})`)
  }

  const handleExportCsv = () => {
    const content = generateCsv(form, sku)
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${sku || 'new-listing'}-listing.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flex: 1, gap: '6px', overflow: 'hidden' }}>

      {/* ─── Left: form fields (scrollable) ─── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>

        {/* Current SKU indicator */}
        <div style={{ fontSize: '11px', color: '#444444' }}>
          {sku ? `编辑：${sku}` : '新建 Listing'}
        </div>

        {/* ── Fieldset 1: Required ── */}
        <fieldset>
          <legend>* 必填 — 基本信息</legend>

          <div className="win98-field-row">
            <FieldLabel text="Item Name" type="required" />
            <input
              type="text"
              value={form.itemName}
              onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
              style={{ flex: 1, fontSize: '11px' }}
            />
            <CharCount value={form.itemName} max={200} />
          </div>

          <div className="win98-field-row">
            <FieldLabel text="Brand Name" type="required" />
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              style={{ flex: 1, fontSize: '11px' }}
            />
          </div>

          <ReadonlyField label="SKU" value={sku} />

          <div className="win98-field-row">
            <FieldLabel text="Price (£)" type="required" />
            <input
              type="text"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              style={{ width: '80px', fontSize: '11px' }}
            />
          </div>

          <div className="win98-field-row">
            <FieldLabel text="Quantity" type="required" />
            <input
              type="text"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              style={{ width: '60px', fontSize: '11px' }}
            />
          </div>

          <div className="win98-field-row">
            <FieldLabel text="Listing Action" type="required" />
            <select
              value={form.listingAction}
              onChange={(e) => setForm((f) => ({ ...f, listingAction: e.target.value }))}
              style={{ fontSize: '11px' }}
            >
              <option>Create new listing</option>
              <option>Update</option>
              <option>Delete</option>
            </select>
          </div>

          <div className="win98-field-row">
            <FieldLabel text="Parentage" />
            <select
              value={form.parentage}
              onChange={(e) => setForm((f) => ({ ...f, parentage: e.target.value }))}
              style={{ fontSize: '11px' }}
            >
              <option value="">—</option>
              <option value="parent">Parent</option>
              <option value="child">Child</option>
            </select>
          </div>

          <div className="win98-field-row">
            <FieldLabel text="Parent SKU" />
            <input
              type="text"
              value={form.parentSku}
              onChange={(e) => setForm((f) => ({ ...f, parentSku: e.target.value }))}
              style={{ flex: 1, fontSize: '11px' }}
            />
          </div>

          <div className="win98-field-row">
            <FieldLabel text="Variation Theme" />
            <input
              type="text"
              value={form.variationTheme}
              onChange={(e) => setForm((f) => ({ ...f, variationTheme: e.target.value }))}
              style={{ flex: 1, fontSize: '11px' }}
            />
          </div>
        </fieldset>

        {/* ── Fieldset 2: Suggested ── */}
        <fieldset>
          <legend>建议 — 卖点内容</legend>

          {[
            { key: 'bullet1' as const, label: 'Bullet 1', max: 200 },
            { key: 'bullet2' as const, label: 'Bullet 2', max: 200 },
            { key: 'bullet3' as const, label: 'Bullet 3', max: 200 },
            { key: 'bullet4' as const, label: 'Bullet 4', max: 200 },
            { key: 'bullet5' as const, label: 'Bullet 5', max: 200 },
          ].map(({ key, label, max }) => (
            <div className="win98-field-row" key={key}>
              <FieldLabel text={label} type="suggested" />
              <textarea
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                style={{ flex: 1, fontSize: '11px', fontFamily: "'Pixelated MS Sans Serif', 'MS Sans Serif', Tahoma, sans-serif", height: '46px', resize: 'vertical' }}
              />
              <CharCount value={form[key]} max={max} />
            </div>
          ))}

          <div className="win98-field-row">
            <FieldLabel text="Description" type="suggested" />
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              style={{ flex: 1, fontSize: '11px', fontFamily: "'Pixelated MS Sans Serif', 'MS Sans Serif', Tahoma, sans-serif", height: '60px', resize: 'vertical' }}
            />
            <CharCount value={form.description} max={2000} />
          </div>

          <div className="win98-field-row">
            <FieldLabel text="Keywords" type="suggested" />
            <input
              type="text"
              value={form.keywords}
              onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
              style={{ flex: 1, fontSize: '11px' }}
            />
            <CharCount value={form.keywords} max={250} />
          </div>

          <div className="win98-field-row">
            <FieldLabel text="Style" type="suggested" />
            <input
              type="text"
              value={form.style}
              onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))}
              style={{ flex: 1, fontSize: '11px' }}
            />
          </div>

          <div className="win98-field-row">
            <FieldLabel text="Department" type="suggested" />
            <select
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              style={{ fontSize: '11px' }}
            >
              <option>Unisex Adults</option>
              <option>Men</option>
              <option>Women</option>
            </select>
          </div>

          <div className="win98-field-row">
            <FieldLabel text="Gender" type="suggested" />
            <select
              value={form.targetGender}
              onChange={(e) => setForm((f) => ({ ...f, targetGender: e.target.value }))}
              style={{ fontSize: '11px' }}
            >
              <option>Unisex</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>
        </fieldset>

        {/* ── Fieldset 3: Specs & Images ── */}
        <fieldset>
          <legend>规格 — 规格图片</legend>

          {[
            { key: 'colorMap' as const, label: 'Color Map' },
            { key: 'color' as const, label: 'Color' },
            { key: 'strength' as const, label: 'Strength' },
            { key: 'frameMaterial' as const, label: 'Frame Material' },
            { key: 'frameType' as const, label: 'Frame Type' },
            { key: 'itemShape' as const, label: 'Item Shape' },
            { key: 'numberOfItems' as const, label: 'No. of Items' },
            { key: 'packageQuantity' as const, label: 'Pkg Quantity' },
            { key: 'armLength' as const, label: 'Arm Length' },
            { key: 'bridgeWidth' as const, label: 'Bridge Width' },
            { key: 'itemWeight' as const, label: 'Item Weight' },
          ].map(({ key, label }) => (
            <div className="win98-field-row" key={key}>
              <FieldLabel text={label} />
              <input
                type="text"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                style={{ flex: 1, fontSize: '11px' }}
              />
            </div>
          ))}

          {[
            { key: 'mainImage' as const, label: 'Main Image', req: true },
            { key: 'image2' as const, label: 'Image 2' },
            { key: 'image3' as const, label: 'Image 3' },
            { key: 'image4' as const, label: 'Image 4' },
            { key: 'image5' as const, label: 'Image 5' },
            { key: 'image6' as const, label: 'Image 6' },
            { key: 'image7' as const, label: 'Image 7' },
            { key: 'image8' as const, label: 'Image 8' },
          ].map(({ key, label, req }) => (
            <div className="win98-field-row" key={key}>
              <FieldLabel text={label} type={req ? 'required' : 'optional'} />
              <input
                type="text"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder="https://…"
                style={{ flex: 1, fontSize: '11px' }}
              />
            </div>
          ))}
        </fieldset>

        {/* ── Action buttons ── */}
        <div style={{ display: 'flex', gap: '4px', paddingBottom: '6px' }}>
          <button onClick={handleSaveDraft} style={{ fontSize: '11px' }}>💾 保存草稿</button>
          <button onClick={handleExportCsv} style={{ fontSize: '11px' }}>⬆ 导出此 SKU CSV</button>
          <button onClick={() => setForm(EMPTY_FORM)} style={{ fontSize: '11px' }}>✕ 重置</button>
        </div>
      </div>

      {/* ─── Right: preview panel ─── */}
      <div style={{ width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>

        {/* Completeness */}
        <fieldset>
          <legend>完整度</legend>
          {(() => {
            const reqFilled = REQUIRED_KEYS.filter((k) => !!form[k]).length
            const sugFilled = SUGGESTED_KEYS.filter((k) => !!form[k]).length
            const pct = Math.round(((reqFilled + sugFilled) / (REQUIRED_KEYS.length + SUGGESTED_KEYS.length)) * 100)
            return (
              <>
                <div style={{ fontSize: '11px', marginBottom: '2px' }}>
                  必填：{reqFilled}/{REQUIRED_KEYS.length} {reqFilled === REQUIRED_KEYS.length ? '✅' : ''}
                </div>
                <div style={{ fontSize: '11px', marginBottom: '4px' }}>
                  建议：{sugFilled}/{SUGGESTED_KEYS.length}
                </div>
                <div className="win98-progress">
                  <div className="win98-progress-fill" style={{ width: `${pct}%` }}>
                    {pct}%
                  </div>
                </div>
              </>
            )
          })()}
        </fieldset>

        {/* Keyword suggestions */}
        <fieldset style={{ flex: 1 }}>
          <legend>关键词建议</legend>
          <KeywordSuggestions
            value={form.keywords}
            onChange={(v) => setForm((f) => ({ ...f, keywords: v }))}
          />
        </fieldset>

        {/* Title preview */}
        {form.itemName && (
          <fieldset>
            <legend>标题预览</legend>
            <div style={{ fontSize: '10px', color: '#000080', lineHeight: '1.4', wordBreak: 'break-word' }}>
              {form.itemName}
            </div>
          </fieldset>
        )}
      </div>

    </div>
  )
}
