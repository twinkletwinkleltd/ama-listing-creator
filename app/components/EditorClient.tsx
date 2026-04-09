'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import KeywordSuggestions from '@/components/KeywordSuggestions'
import { generateSingleCsv, downloadCsv } from '@/lib/exportCsv'

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

// ─── Small helpers ────────────────────────────────────────────────────
function FieldLabel({ text, type = 'optional' }: { text: string; type?: 'required' | 'suggested' | 'optional' }) {
  const color = type === 'required' ? '#cc0000' : type === 'suggested' ? '#b37a00' : '#000000'
  return (
    <label style={{ display: 'block', textAlign: 'right', fontSize: '11px', color, whiteSpace: 'nowrap' }}>
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
  const [sidebarWidth, setSidebarWidth] = useState(180)
  const dragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const delta = dragStartX.current - e.clientX
      setSidebarWidth(Math.max(120, Math.min(420, dragStartWidth.current + delta)))
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

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
    const content = generateSingleCsv(form, sku)
    downloadCsv(content, `${sku || 'new-listing'}-listing.csv`)
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

      {/* ─── Left: form fields (scrollable) ─── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>

        {/* Current SKU indicator */}
        <div style={{ fontSize: '11px', color: '#444444' }}>
          {sku ? `编辑：${sku}` : '新建 Listing'}
        </div>

        {/* ── Fieldset 1: Required ── */}
        {(() => {
          const R: React.CSSProperties = { display:'flex', alignItems:'center', gap:'16px', marginBottom:'4px', flexWrap:'wrap' }
          const C: React.CSSProperties = { display:'flex', alignItems:'center', gap:'4px' }
          const F: React.CSSProperties = { display:'flex', alignItems:'center', gap:'4px', marginBottom:'4px' }
          const lR: React.CSSProperties = { fontSize:'11px', color:'#cc0000', whiteSpace:'nowrap', flexShrink:0 }
          const lO: React.CSSProperties = { fontSize:'11px', color:'#000', whiteSpace:'nowrap', flexShrink:0 }
          return (
          <fieldset>
            <legend>* 必填 — 基本信息</legend>
            <div style={F}>
              <label style={lR}>* Item Name</label>
              <input type="text" value={form.itemName} onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))} style={{ width:'320px', fontSize:'11px' }} />
              <CharCount value={form.itemName} max={200} />
            </div>
            <div style={R}>
              <span style={C}><label style={lR}>* Brand Name</label><input type="text" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} style={{ width:'160px', fontSize:'11px' }} /></span>
              <span style={C}><label style={lO}>SKU</label><span style={{ fontSize:'10px', fontFamily:'Courier New,monospace', color:'#808080', padding:'1px 4px', background:'#d4d0c8', border:'2px inset #d4d0c8' }}>{sku || '—'}</span></span>
            </div>
            <div style={R}>
              <span style={C}><label style={lR}>* Price (£)</label><input type="text" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} style={{ width:'80px', fontSize:'11px' }} /></span>
              <span style={C}><label style={lR}>* Quantity</label><input type="text" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} style={{ width:'60px', fontSize:'11px' }} /></span>
              <span style={C}><label style={lR}>* Listing Action</label>
                <select value={form.listingAction} onChange={(e) => setForm((f) => ({ ...f, listingAction: e.target.value }))} style={{ fontSize:'11px' }}>
                  <option>Create new listing</option><option>Update</option><option>Delete</option>
                </select>
              </span>
              <span style={C}><label style={lO}>Parentage</label>
                <select value={form.parentage} onChange={(e) => setForm((f) => ({ ...f, parentage: e.target.value }))} style={{ fontSize:'11px' }}>
                  <option value="">—</option><option value="parent">Parent</option><option value="child">Child</option>
                </select>
              </span>
            </div>
            <div style={F}><label style={lO}>Parent SKU</label><input type="text" value={form.parentSku} onChange={(e) => setForm((f) => ({ ...f, parentSku: e.target.value }))} style={{ width:'280px', fontSize:'11px' }} /></div>
            <div style={F}><label style={lO}>Variation Theme</label><input type="text" value={form.variationTheme} onChange={(e) => setForm((f) => ({ ...f, variationTheme: e.target.value }))} style={{ width:'280px', fontSize:'11px' }} /></div>
          </fieldset>
          )
        })()}

        {/* ── Fieldset 2: Suggested ── */}
        {(() => {
          const F: React.CSSProperties = { display:'flex', alignItems:'flex-start', gap:'4px', marginBottom:'4px' }
          const lS: React.CSSProperties = { fontSize:'11px', color:'#b37a00', whiteSpace:'nowrap', flexShrink:0, paddingTop:'3px' }
          const lO: React.CSSProperties = { fontSize:'11px', color:'#000', whiteSpace:'nowrap', flexShrink:0, paddingTop:'3px' }
          const TA: React.CSSProperties = { width:'320px', fontSize:'11px', fontFamily:"'Pixelated MS Sans Serif','MS Sans Serif',Tahoma,sans-serif", height:'40px', resize:'vertical' }
          return (
          <fieldset>
            <legend>建议 — 卖点内容</legend>
            {([
              { key:'bullet1' as const, label:'Bullet 1', max:200 },
              { key:'bullet2' as const, label:'Bullet 2', max:200 },
              { key:'bullet3' as const, label:'Bullet 3', max:200 },
              { key:'bullet4' as const, label:'Bullet 4', max:200 },
              { key:'bullet5' as const, label:'Bullet 5', max:200 },
            ]).map(({ key, label, max }) => (
              <div key={key} style={F}>
                <label style={lS}>{label}</label>
                <textarea value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} style={TA} />
                <CharCount value={form[key]} max={max} />
              </div>
            ))}
            <div style={F}><label style={lS}>Description</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ ...TA, height:'56px' }} /><CharCount value={form.description} max={2000} /></div>
            <div style={{ display:'flex', alignItems:'center', gap:'4px', marginBottom:'4px' }}><label style={{ ...lS, paddingTop:0 }}>Keywords</label><input type="text" value={form.keywords} onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))} style={{ width:'320px', fontSize:'11px' }} /><CharCount value={form.keywords} max={250} /></div>
            <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'4px', flexWrap:'wrap' }}>
              <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><label style={{ fontSize:'11px', color:'#b37a00', whiteSpace:'nowrap' }}>Style</label><input type="text" value={form.style} onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))} style={{ width:'100px', fontSize:'11px' }} /></span>
              <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><label style={{ fontSize:'11px', color:'#b37a00', whiteSpace:'nowrap' }}>Department</label><select value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} style={{ fontSize:'11px' }}><option>Unisex Adults</option><option>Men</option><option>Women</option></select></span>
              <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><label style={{ fontSize:'11px', color:'#b37a00', whiteSpace:'nowrap' }}>Gender</label><select value={form.targetGender} onChange={(e) => setForm((f) => ({ ...f, targetGender: e.target.value }))} style={{ fontSize:'11px' }}><option>Unisex</option><option>Male</option><option>Female</option></select></span>
            </div>
          </fieldset>
          )
        })()}

        {/* ── Fieldset 3: Specs & Images ── */}
        {(() => {
          const lO: React.CSSProperties = { fontSize:'11px', color:'#000', whiteSpace:'nowrap', flexShrink:0 }
          const lR: React.CSSProperties = { fontSize:'11px', color:'#cc0000', whiteSpace:'nowrap', flexShrink:0 }
          const specFields: { key: keyof FormData; label: string }[] = [
            { key:'colorMap', label:'Color Map' }, { key:'color', label:'Color' }, { key:'strength', label:'Strength' },
            { key:'frameMaterial', label:'Frame Mat.' }, { key:'frameType', label:'Frame Type' }, { key:'itemShape', label:'Item Shape' },
            { key:'numberOfItems', label:'No. Items' }, { key:'packageQuantity', label:'Pkg Qty' }, { key:'armLength', label:'Arm Length' },
            { key:'bridgeWidth', label:'Bridge Width' }, { key:'itemWeight', label:'Item Weight' },
          ]
          const imgFields: { key: keyof FormData; label: string; req?: boolean }[] = [
            { key:'mainImage', label:'Main Image', req:true }, { key:'image2', label:'Image 2' },
            { key:'image3', label:'Image 3' }, { key:'image4', label:'Image 4' },
            { key:'image5', label:'Image 5' }, { key:'image6', label:'Image 6' },
            { key:'image7', label:'Image 7' }, { key:'image8', label:'Image 8' },
          ]
          return (
          <fieldset>
            <legend>规格 — 规格图片</legend>
            {/* Spec fields: 3 per row */}
            {Array.from({ length: Math.ceil(specFields.length / 3) }, (_, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'4px', flexWrap:'wrap' }}>
                {specFields.slice(i * 3, i * 3 + 3).map(({ key, label }) => (
                  <span key={key} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                    <label style={lO}>{label}</label>
                    <input type="text" value={form[key] as string} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} style={{ width:'110px', fontSize:'11px' }} />
                  </span>
                ))}
              </div>
            ))}
            {/* Image URLs: 2 per row */}
            <div style={{ marginTop:'6px' }}>
              {Array.from({ length: Math.ceil(imgFields.length / 2) }, (_, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'4px' }}>
                  {imgFields.slice(i * 2, i * 2 + 2).map(({ key, label, req }) => (
                    <span key={key} style={{ display:'flex', alignItems:'center', gap:'4px', flex:1 }}>
                      <label style={req ? lR : lO}>{req ? '* ' : ''}{label}</label>
                      <input type="text" value={form[key] as string} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder="https://…" style={{ flex:1, fontSize:'11px' }} />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </fieldset>
          )
        })()}

        {/* ── Action buttons ── */}
        <div style={{ display: 'flex', gap: '4px', paddingBottom: '6px' }}>
          <button onClick={handleSaveDraft} style={{ fontSize: '11px' }}>💾 保存草稿</button>
          <button onClick={handleExportCsv} style={{ fontSize: '11px' }}>⬆ 导出此 SKU CSV</button>
          <button onClick={() => setForm(EMPTY_FORM)} style={{ fontSize: '11px' }}>✕ 重置</button>
        </div>
      </div>

      {/* ─── Resize handle ─── */}
      <div
        onMouseDown={(e) => {
          dragging.current = true
          dragStartX.current = e.clientX
          dragStartWidth.current = sidebarWidth
          e.preventDefault()
        }}
        style={{
          width: '5px',
          flexShrink: 0,
          cursor: 'col-resize',
          background: '#d4d0c8',
          borderLeft: '1px solid #808080',
          borderRight: '1px solid #ffffff',
          margin: '0 2px',
        }}
        title="拖动调整宽度"
      />

      {/* ─── Right: preview panel ─── */}
      <div style={{ width: `${sidebarWidth}px`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>

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
