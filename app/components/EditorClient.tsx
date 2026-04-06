'use client'

import { useState, useEffect, useCallback } from 'react'
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
function dot(type: 'required' | 'suggested' | 'optional') {
  return type === 'required' ? 'bg-red-500' : type === 'suggested' ? 'bg-yellow-400' : 'bg-gray-300'
}

function FieldLabel({ text, type = 'optional' }: { text: string; type?: 'required' | 'suggested' | 'optional' }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot(type)}`} />
      <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">{text}</label>
    </div>
  )
}

function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max
  return (
    <span className={`text-xs ml-auto tabular-nums ${over ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
      {value.length}/{max}
    </span>
  )
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel text={label} />
      <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50">
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

const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full'
const selectCls = inputCls
const textareaCls = `${inputCls} resize-none`

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
  const [activeTab, setActiveTab] = useState(0)

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

  const set = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Completeness
  const reqFilled = REQUIRED_KEYS.filter((k) => form[k].trim() !== '').length
  const sugFilled = SUGGESTED_KEYS.filter((k) => form[k].trim() !== '').length
  const reqPct    = Math.round((reqFilled  / REQUIRED_KEYS.length)  * 100)
  const sugPct    = Math.round((sugFilled  / SUGGESTED_KEYS.length) * 100)
  const totalFilled = reqFilled + sugFilled
  const totalFields = REQUIRED_KEYS.length + SUGGESTED_KEYS.length
  const overallPct  = Math.round((totalFilled / totalFields) * 100)
  const scoreColor  = overallPct >= 80 ? 'text-green-600' : overallPct >= 60 ? 'text-yellow-600' : 'text-red-500'

  const checklist = [
    { label: '标题 Item Name',  done: !!form.itemName.trim() },
    { label: '价格 Price',      done: !!form.price.trim() },
    { label: '库存 Quantity',   done: !!form.quantity.trim() },
    { label: '主图 Main Image', done: !!form.mainImage.trim() },
    { label: 'Bullet 1',        done: !!form.bullet1.trim() },
    { label: 'Bullet 2',        done: !!form.bullet2.trim() },
    { label: 'Bullet 3',        done: !!form.bullet3.trim() },
    { label: 'Bullet 4',        done: !!form.bullet4.trim() },
    { label: 'Bullet 5',        done: !!form.bullet5.trim() },
    { label: '描述 Description',done: !!form.description.trim() },
    { label: '关键词 Keywords', done: !!form.keywords.trim() },
  ]

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

  const TABS = [
    { label: '基本信息', color: 'text-red-500',    dot: 'bg-red-500'    },
    { label: '卖点内容', color: 'text-yellow-600', dot: 'bg-yellow-400' },
    { label: '规格图片', color: 'text-gray-500',   dot: 'bg-gray-300'   },
  ]

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>

      {/* ─── Left: vertical tab sidebar ─── */}
      <div className="w-28 bg-white border-r border-gray-200 flex flex-col pt-4 gap-1 flex-shrink-0">
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`mx-2 px-3 py-3 rounded-xl text-left transition-colors ${
              activeTab === i
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className={`flex items-center gap-1.5 mb-0.5`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tab.dot}`} />
              <span className="text-xs font-semibold">{['必填', '建议', '规格'][i]}</span>
            </div>
            <span className="text-xs text-gray-500 leading-tight">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Center: scrollable form content ─── */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-5 flex flex-col gap-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold text-gray-800">
              {sku ? `Editing: ${sku}` : 'New Listing'}
            </h1>
          </div>

          {/* ── Tab 1: 基本信息 ── */}
          {activeTab === 0 && (
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center">
                    <FieldLabel text="Item Name / 标题" type="required" />
                    <CharCount value={form.itemName} max={200} />
                  </div>
                  <textarea
                    rows={3}
                    value={form.itemName}
                    onChange={(e) => set('itemName', e.target.value)}
                    placeholder="e.g. TWINKLE TWINKLE Reading Glasses - 3 Pack..."
                    className={textareaCls}
                    maxLength={220}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel text="Brand Name" type="required" />
                  <input
                    value={form.brand}
                    onChange={(e) => set('brand', e.target.value)}
                    className={`${inputCls} bg-gray-50 text-gray-500`}
                  />
                </div>

                <div className="flex gap-4">
                  <ReadonlyField label="SKU" value={sku} />
                  <ReadonlyField label="Parent SKU" value={form.parentSku} />
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Price GBP" type="required" />
                    <input
                      type="text"
                      value={form.price}
                      onChange={(e) => set('price', e.target.value)}
                      placeholder="e.g. 5.99"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Quantity" type="required" />
                    <input
                      type="text"
                      value={form.quantity}
                      onChange={(e) => set('quantity', e.target.value)}
                      placeholder="e.g. 99"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Listing Action" type="required" />
                    <select
                      value={form.listingAction}
                      onChange={(e) => set('listingAction', e.target.value)}
                      className={selectCls}
                    >
                      <option>Create new listing</option>
                      <option>Create or Replace (Full Update)</option>
                      <option>Edit (Partial Update)</option>
                      <option>Update</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Item Condition" />
                    <div className={`${inputCls} bg-gray-50 text-gray-400`}>New</div>
                  </div>
                </div>

                <ReadonlyField label="Variation Theme" value={form.variationTheme} />
                <ReadonlyField label="Parentage Level" value={form.parentage} />
              </div>
            </div>
          )}

          {/* ── Tab 2: 卖点内容 ── */}
          {activeTab === 1 && (
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-gray-700">Bullet Points</h2>
                {[1, 2, 3, 4, 5].map((n) => {
                  const key = `bullet${n}` as keyof FormData
                  return (
                    <div key={n} className="flex flex-col gap-1.5">
                      <div className="flex items-center">
                        <FieldLabel text={`Bullet Point ${n}`} type="suggested" />
                        <CharCount value={form[key]} max={500} />
                      </div>
                      <textarea
                        rows={2}
                        value={form[key]}
                        onChange={(e) => set(key, e.target.value)}
                        placeholder={`Bullet point ${n}...`}
                        className={textareaCls}
                        maxLength={520}
                      />
                    </div>
                  )
                })}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center">
                    <FieldLabel text="Product Description" type="suggested" />
                    <CharCount value={form.description} max={2000} />
                  </div>
                  <textarea
                    rows={7}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Full product description..."
                    className={textareaCls}
                    maxLength={2100}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center">
                    <FieldLabel text="Generic Keywords" type="suggested" />
                    <CharCount value={form.keywords} max={249} />
                  </div>
                  <textarea
                    rows={3}
                    value={form.keywords}
                    onChange={(e) => set('keywords', e.target.value)}
                    placeholder="Space-separated keywords..."
                    className={`${textareaCls} font-mono`}
                    maxLength={260}
                  />
                  <KeywordSuggestions
                    value={form.keywords}
                    onChange={(v) => set('keywords', v)}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-gray-700">分类与受众</h2>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Style" type="suggested" />
                    <input
                      value={form.style}
                      onChange={(e) => set('style', e.target.value)}
                      placeholder="e.g. Classic"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Department" type="suggested" />
                    <select
                      value={form.department}
                      onChange={(e) => set('department', e.target.value)}
                      className={selectCls}
                    >
                      <option>Unisex Adults</option>
                      <option>Mens</option>
                      <option>Womens</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Target Gender" type="suggested" />
                    <select
                      value={form.targetGender}
                      onChange={(e) => set('targetGender', e.target.value)}
                      className={selectCls}
                    >
                      <option>Unisex</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 3: 规格图片 ── */}
          {activeTab === 2 && (
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-gray-700">颜色与镜片</h2>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Color Map" type="suggested" />
                    <input value={form.colorMap} onChange={(e) => set('colorMap', e.target.value)} placeholder="e.g. Black" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Colour" type="suggested" />
                    <input value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="e.g. 3 x Black" className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Magnification Strength" type="suggested" />
                    <input value={form.strength} onChange={(e) => set('strength', e.target.value)} placeholder="e.g. 1.5" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Unit" />
                    <div className={`${inputCls} bg-gray-50 text-gray-400`}>diopters</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-gray-700">镜架规格</h2>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Frame Material" type="suggested" />
                    <input value={form.frameMaterial} onChange={(e) => set('frameMaterial', e.target.value)} placeholder="e.g. Plastic" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Frame Type" type="suggested" />
                    <input value={form.frameType} onChange={(e) => set('frameType', e.target.value)} placeholder="e.g. Full Rim" className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Item Shape" type="suggested" />
                    <input value={form.itemShape} onChange={(e) => set('itemShape', e.target.value)} placeholder="e.g. Rectangular" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Number of Items" type="suggested" />
                    <input value={form.numberOfItems} onChange={(e) => set('numberOfItems', e.target.value)} placeholder="e.g. 3" className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Arm Length (mm)" />
                    <input value={form.armLength} onChange={(e) => set('armLength', e.target.value)} placeholder="mm" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Bridge Width (mm)" />
                    <input value={form.bridgeWidth} onChange={(e) => set('bridgeWidth', e.target.value)} placeholder="mm" className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Item Weight" />
                    <input value={form.itemWeight} onChange={(e) => set('itemWeight', e.target.value)} placeholder="e.g. 25" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5 w-28">
                    <FieldLabel text="Unit" />
                    <select value={form.weightUnit} onChange={(e) => set('weightUnit', e.target.value)} className={selectCls}>
                      <option>g</option>
                      <option>kg</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Item Package Qty" />
                    <input value={form.packageQuantity} onChange={(e) => set('packageQuantity', e.target.value)} placeholder="e.g. 3" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <FieldLabel text="Country of Origin" />
                    <div className={`${inputCls} bg-gray-50 text-gray-400`}>CN</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-gray-700">图片 Images</h2>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col gap-1">
                  <p className="text-xs font-semibold text-blue-700">📷 图片上传说明</p>
                  <p className="text-xs text-blue-600 leading-relaxed">
                    请上传3张产品原图（白底正面 / 侧面 / 45度），系统将自动生成尺寸标注图和多色展示图。
                    图片需托管在公网可访问的服务器上，填入URL即可。
                  </p>
                  <a href="/image-guide" target="_blank" className="text-xs text-blue-500 hover:text-blue-700 underline mt-0.5">
                    查看完整图片指南 →
                  </a>
                </div>

                <ImageInput label="Main Image URL" value={form.mainImage} onChange={(v) => set('mainImage', v)} required />
                {(['image2','image3','image4','image5','image6','image7','image8'] as const).map((key, i) => (
                  <ImageInput key={key} label={`Image URL ${i + 2}`} value={form[key]} onChange={(v) => set(key, v)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Right: fixed status panel ─── */}
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="p-4 flex flex-col gap-4 flex-1">

          {/* 标题预览 */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">标题预览</p>
            <p className={`text-xs leading-relaxed ${form.itemName ? 'text-gray-700' : 'text-gray-300 italic'}`}>
              {form.itemName || 'Item name will appear here...'}
            </p>
          </div>

          {/* 完整度 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">完整度</span>
              <span className={`text-2xl font-bold tabular-nums ${scoreColor}`}>{overallPct}%</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>🔴 必填 {reqFilled}/{REQUIRED_KEYS.length}</span>
                <span>{reqPct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-red-400 h-1.5 rounded-full transition-all" style={{ width: `${reqPct}%` }} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>🟡 建议 {sugFilled}/{SUGGESTED_KEYS.length}</span>
                <span>{sugPct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-yellow-400 h-1.5 rounded-full transition-all" style={{ width: `${sugPct}%` }} />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Checklist */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-700">Checklist</span>
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center ${item.done ? 'bg-green-500' : 'border border-gray-200'}`}>
                  {item.done && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs ${item.done ? 'text-gray-700' : 'text-gray-400'}`}>{item.label}</span>
              </div>
            ))}
          </div>

          <hr className="border-gray-100" />

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSaveDraft}
              className="border border-gray-300 text-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              💾 Save Draft
            </button>
            <button
              onClick={handleExportCsv}
              className="bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              📤 Export CSV
            </button>
          </div>

          {sku && (
            <>
              <hr className="border-gray-100" />
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">SKU</span>
                <p className="text-xs font-mono text-gray-600 mt-0.5 break-all">{sku}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
