'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import KeywordSuggestions from '@/components/KeywordSuggestions'
import { generateSingleCsv, downloadCsv } from '@/lib/exportCsv'

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  itemName: string; brand: string; listingAction: string; price: string; quantity: string
  parentage: string; parentSku: string; variationTheme: string
  bullet1: string; bullet2: string; bullet3: string; bullet4: string; bullet5: string
  description: string; keywords: string; style: string; department: string; targetGender: string
  colorMap: string; color: string; strength: string; frameMaterial: string; frameType: string
  itemShape: string; numberOfItems: string; packageQuantity: string; armLength: string
  bridgeWidth: string; itemWeight: string; weightUnit: string
  mainImage: string; image2: string; image3: string; image4: string
  image5: string; image6: string; image7: string; image8: string
}

interface Listing {
  sku: string; itemName: string; price: string; quantity: string; color: string
  colorMap: string; strength: string; parentage: string; parentSku: string
  variationTheme: string; mainImage: string; image2: string; image3: string; source: string
}

interface Props { initialListing: Listing | null; sku: string; allSkus: string[] }

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

const REQUIRED_KEYS: (keyof FormData)[]  = ['itemName', 'price', 'quantity', 'mainImage']
const SUGGESTED_KEYS: (keyof FormData)[] = ['bullet1', 'bullet2', 'bullet3', 'bullet4', 'bullet5', 'description', 'keywords', 'color', 'strength']

// ─── Small helpers ─────────────────────────────────────────────────────────────

function CharCount({ value, max }: { value: string; max: number }) {
  const cls = value.length > max ? 'over' : value.length > max * 0.9 ? 'warn' : 'ok'
  return <span className={`field-char ${cls}`}>{value.length}/{max}</span>
}

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:6 }}>
      <label style={{ fontSize:11, color: required ? '#dc2626' : '#666', whiteSpace:'nowrap', flexShrink:0, minWidth:90, textAlign:'right', paddingTop:7 }}>
        {required ? '* ' : ''}{label}
      </label>
      {children}
    </div>
  )
}

// ─── Main EditorClient ─────────────────────────────────────────────────────────

export default function EditorClient({ initialListing, sku, allSkus }: Props) {
  const router = useRouter()
  const currentIdx = allSkus.indexOf(sku)
  const prevSku = currentIdx > 0 ? allSkus[currentIdx - 1] : null
  const nextSku = currentIdx >= 0 && currentIdx < allSkus.length - 1 ? allSkus[currentIdx + 1] : null
  const buildInitialForm = (): FormData => {
    if (!initialListing) return EMPTY_FORM
    return {
      ...EMPTY_FORM,
      itemName: initialListing.itemName ?? '', price: initialListing.price ?? '',
      quantity: initialListing.quantity ?? '', color: initialListing.color ?? '',
      colorMap: initialListing.colorMap ?? '', strength: initialListing.strength ?? '',
      parentage: initialListing.parentage ?? '', parentSku: initialListing.parentSku ?? '',
      variationTheme: initialListing.variationTheme ?? '',
      mainImage: initialListing.mainImage ?? '', image2: initialListing.image2 ?? '',
      image3: initialListing.image3 ?? '',
    }
  }

  const [form, setForm] = useState<FormData>(buildInitialForm)

  useEffect(() => {
    if (!sku) return
    try {
      const saved = localStorage.getItem(`draft:${sku}`)
      if (saved) setForm((prev) => ({ ...prev, ...JSON.parse(saved) as Partial<FormData> }))
    } catch { /* ignore */ }
  }, [sku])

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSaveDraft = () => {
    localStorage.setItem(`draft:${sku || 'new'}`, JSON.stringify(form))
    alert(`草稿已保存 (${sku || 'new'})`)
  }

  const handleExportCsv = () => {
    downloadCsv(generateSingleCsv(form, sku), `${sku || 'new-listing'}-listing.csv`)
  }

  // Completeness
  const reqFilled = REQUIRED_KEYS.filter((k) => !!form[k]).length
  const sugFilled = SUGGESTED_KEYS.filter((k) => !!form[k]).length
  const pct = Math.round(((reqFilled + sugFilled) / (REQUIRED_KEYS.length + SUGGESTED_KEYS.length)) * 100)

  const inp = 'field-input-inline'

  return (
    <>
      {/* Toolbar */}
      <div className="page-toolbar">
        <span className="page-title">Editor</span>
        {sku && <span className="sku-mono" style={{ background:'#e8f0fb', padding:'2px 10px', borderRadius:10 }}>{sku}</span>}
        {allSkus.length > 0 && currentIdx >= 0 && (
          <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#666' }}>
            <button className="btn-secondary" style={{ padding:'2px 8px' }} disabled={!prevSku} onClick={() => prevSku && router.push(`/editor?sku=${prevSku}`)}>◀</button>
            {currentIdx + 1} / {allSkus.length}
            <button className="btn-secondary" style={{ padding:'2px 8px' }} disabled={!nextSku} onClick={() => nextSku && router.push(`/editor?sku=${nextSku}`)}>▶</button>
          </span>
        )}
        <div className="toolbar-spacer" />
        <button className="btn-secondary" onClick={handleSaveDraft}>💾 保存草稿</button>
        <button className="btn-primary" onClick={handleExportCsv}>⬆ 导出 CSV</button>
        <button className="btn-secondary" onClick={() => setForm(EMPTY_FORM)}>✕ 重置</button>
      </div>

      {/* Content */}
      <div className="content-area">

        {/* Form (left, scrollable) */}
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10 }}>

          {/* Card 1: Required — Basic Info */}
          <div className="field-card">
            <div className="field-card-label">* 必填 — 基本信息</div>
            <FieldRow label="Item Name" required>
              <input className={inp} type="text" value={form.itemName} onChange={set('itemName')} style={{ flex:1 }} />
              <CharCount value={form.itemName} max={200} />
            </FieldRow>
            <FieldRow label="Brand Name" required>
              <input className={inp} type="text" value={form.brand} onChange={set('brand')} style={{ width:160 }} />
            </FieldRow>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:6 }}>
              <FieldRow label="Price (£)" required><input className={inp} type="text" value={form.price} onChange={set('price')} style={{ width:80 }} /></FieldRow>
              <FieldRow label="Quantity" required><input className={inp} type="text" value={form.quantity} onChange={set('quantity')} style={{ width:60 }} /></FieldRow>
              <FieldRow label="Action">
                <select className={inp} value={form.listingAction} onChange={set('listingAction')}>
                  <option>Create new listing</option><option>Update</option><option>Delete</option>
                </select>
              </FieldRow>
              <FieldRow label="Parentage">
                <select className={inp} value={form.parentage} onChange={set('parentage')}>
                  <option value="">—</option><option value="parent">Parent</option><option value="child">Child</option>
                </select>
              </FieldRow>
            </div>
            <FieldRow label="Parent SKU">
              <input className={inp} type="text" value={form.parentSku} onChange={set('parentSku')} style={{ width:280 }} />
            </FieldRow>
            <FieldRow label="Variation Theme">
              <input className={inp} type="text" value={form.variationTheme} onChange={set('variationTheme')} style={{ width:280 }} />
            </FieldRow>
          </div>

          {/* Card 2: Suggested — Content */}
          <div className="field-card">
            <div className="field-card-label">建议 — 卖点内容</div>
            {(['bullet1','bullet2','bullet3','bullet4','bullet5'] as const).map((k, i) => (
              <FieldRow key={k} label={`Bullet ${i + 1}`}>
                <textarea className="field-input" value={form[k]} onChange={set(k)} rows={2} />
                <CharCount value={form[k]} max={200} />
              </FieldRow>
            ))}
            <FieldRow label="Description">
              <textarea className="field-input" value={form.description} onChange={set('description')} rows={3} />
              <CharCount value={form.description} max={2000} />
            </FieldRow>
            <FieldRow label="Keywords">
              <input className={inp} type="text" value={form.keywords} onChange={set('keywords')} style={{ flex:1 }} />
              <CharCount value={form.keywords} max={250} />
            </FieldRow>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <FieldRow label="Style"><input className={inp} type="text" value={form.style} onChange={set('style')} style={{ width:100 }} /></FieldRow>
              <FieldRow label="Department">
                <select className={inp} value={form.department} onChange={set('department')}>
                  <option>Unisex Adults</option><option>Men</option><option>Women</option>
                </select>
              </FieldRow>
              <FieldRow label="Gender">
                <select className={inp} value={form.targetGender} onChange={set('targetGender')}>
                  <option>Unisex</option><option>Male</option><option>Female</option>
                </select>
              </FieldRow>
            </div>
          </div>

          {/* Card 3: Specs + Images */}
          <div className="field-card">
            <div className="field-card-label">规格 + 图片</div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:8 }}>
              {([
                ['colorMap','Color Map'],['color','Color'],['strength','Strength'],
                ['frameMaterial','Frame Mat.'],['frameType','Frame Type'],['itemShape','Item Shape'],
                ['numberOfItems','No. Items'],['packageQuantity','Pkg Qty'],['armLength','Arm Length'],
                ['bridgeWidth','Bridge Width'],['itemWeight','Item Weight'],
              ] as [keyof FormData, string][]).map(([k, label]) => (
                <FieldRow key={k} label={label}>
                  <input className={inp} type="text" value={form[k] as string} onChange={set(k)} style={{ width:110 }} />
                </FieldRow>
              ))}
            </div>
            {([
              ['mainImage','主图 (1600×1600)',true],
              ['image2','图 2'],['image3','图 3'],['image4','图 4'],
              ['image5','图 5'],['image6','图 6'],['image7','图 7'],
            ] as [keyof FormData, string, boolean?][]).map(([k, label, req]) => (
              <FieldRow key={k} label={label} required={req}>
                <input className={inp} type="text" value={form[k] as string} onChange={set(k)} placeholder="https://…" style={{ flex:1 }} />
              </FieldRow>
            ))}
          </div>

        </div>

        {/* Right panel */}
        <div className="side-panel">

          {/* Completeness */}
          <div>
            <div className="panel-label" style={{ marginBottom:8 }}>完整度</div>
            <div style={{ fontSize:22, fontWeight:800, color: pct >= 80 ? '#22c55e' : '#f59e0b', textAlign:'center', marginBottom:2 }}>{pct}%</div>
            <div style={{ fontSize:10, color:'#aaa', textAlign:'center', marginBottom:10 }}>{pct >= 80 ? 'Almost ready' : 'In progress'}</div>
            {[
              { label:'必填', filled:reqFilled, total:REQUIRED_KEYS.length },
              { label:'建议', filled:sugFilled, total:SUGGESTED_KEYS.length },
            ].map(({ label, filled, total }) => (
              <div key={label} className="meter-row" style={{ marginBottom:5 }}>
                <div className={`meter-dot ${filled === total ? 'meter-dot-green' : 'meter-dot-amber'}`} />
                <span style={{ flex:1 }}>{label} {filled}/{total}</span>
                <div className="meter-bar">
                  <div className={`meter-fill ${filled === total ? 'meter-fill-green' : 'meter-fill-amber'}`} style={{ width:`${(filled/total)*100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="panel-divider" />

          {/* Keywords */}
          <div>
            <div className="panel-label" style={{ marginBottom:6 }}>关键词建议</div>
            <KeywordSuggestions value={form.keywords} onChange={(v) => setForm((f) => ({ ...f, keywords: v }))} />
          </div>

          {/* Title preview */}
          {form.itemName && (
            <>
              <div className="panel-divider" />
              <div>
                <div className="panel-label" style={{ marginBottom:6 }}>标题预览</div>
                <div style={{ fontSize:11, color:'#1a3a6b', lineHeight:1.5, wordBreak:'break-word' }}>{form.itemName}</div>
              </div>
            </>
          )}

        </div>

      </div>
    </>
  )
}
