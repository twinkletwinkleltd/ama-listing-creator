'use client'

import { useState, useRef, useEffect } from 'react'

// Types
interface Listing {
  sku: string
  parentSku: string
  color: string
  mainImage: string
  image2: string
  image3: string
  [key: string]: string
}

interface Props {
  listings: Listing[]
}

interface DimData {
  lensWidth: string
  lensHeight: string
  bridgeWidth: string
  armLength: string
  totalWidth: string
  totalHeight: string
  weight: string
}

const PRESETS: Record<string, DimData> = {
  RX224: { lensWidth: '52', lensHeight: '40', bridgeWidth: '16', armLength: '140', totalWidth: '138', totalHeight: '44', weight: '28' },
  TK223: { lensWidth: '50', lensHeight: '38', bridgeWidth: '18', armLength: '138', totalWidth: '135', totalHeight: '42', weight: '26' },
  '2PR75': { lensWidth: '54', lensHeight: '42', bridgeWidth: '14', armLength: '142', totalWidth: '140', totalHeight: '46', weight: '30' },
}

const SLOT_LABELS = ['Main', 'Side', '3/4', 'Detail', 'On-model', 'Infographic', 'Lifestyle']

const SLOT_REQUIREMENTS: Record<number, string[]> = {
  0: ['1600×1600 px', '背景抠白', 'JPEG or PNG', 'Product fills 85%+'],
}
const DEFAULT_REQUIREMENTS = ['Min 1200×1200 px', 'JPEG or PNG']

function PhotosSection({ listings }: { listings: Listing[] }) {
  const [activeStyle, setActiveStyle] = useState<string>('all')
  const [selectedSlot, setSelectedSlot] = useState<{ sku: string; idx: number } | null>(null)

  const [urls, setUrls] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {}
    for (const l of listings) {
      init[l.sku] = [
        l.mainImage || '', l.image2 || '', l.image3 || '',
        '', '', '', '',
      ]
    }
    return init
  })

  const setUrl = (sku: string, idx: number, v: string) =>
    setUrls(prev => ({ ...prev, [sku]: prev[sku].map((u, i) => i === idx ? v : u) }))

  const styles = Array.from(new Set(listings.map(l => l.parentSku)))

  const visibleListings = activeStyle === 'all'
    ? listings
    : listings.filter(l => l.parentSku === activeStyle)

  const grouped: Record<string, Listing[]> = {}
  for (const l of visibleListings) {
    const key = l.color || l.parentSku
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(l)
  }

  const selListing = selectedSlot ? listings.find(l => l.sku === selectedSlot.sku) : null
  const selUrls    = selectedSlot ? (urls[selectedSlot.sku] || []) : []
  const selUrl     = selectedSlot ? (selUrls[selectedSlot.idx] || '') : ''

  return (
    <div className="content-area">
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="page-title" style={{ fontSize: 13 }}>图片</span>
          <button className={`filter-pill${activeStyle === 'all' ? ' active' : ''}`} onClick={() => setActiveStyle('all')}>All</button>
          {styles.map(s => (
            <button key={s} className={`filter-pill${activeStyle === s ? ' active' : ''}`} onClick={() => setActiveStyle(s)}>{s}</button>
          ))}
        </div>

        {Object.entries(grouped).map(([colorKey, colorListings]) => {
          const totalSlots = colorListings.length * 7
          const filledSlots = colorListings.reduce((acc, l) => acc + (urls[l.sku] || []).filter(Boolean).length, 0)
          const complete = filledSlots === totalSlots

          return (
            <div key={colorKey} style={{ marginBottom: 20 }}>
              <div className="color-group-header">
                <div className="color-swatch" style={{ background: colorKey.toLowerCase() === 'black' ? '#222' : colorKey.toLowerCase() === 'brown' ? '#7c5230' : colorKey.toLowerCase() === 'gold' ? '#b8860b' : '#888' }} />
                {colorKey}
                <span style={{ fontSize: 11, color: complete ? '#22c55e' : '#f59e0b', fontWeight: 400 }}>
                  {filledSlots}/{totalSlots} &nbsp;·&nbsp; {complete ? '✓ Complete' : '⚠ Missing'}
                </span>
              </div>

              {colorListings.map(l => (
                <div key={l.sku} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
                    <span className="sku-mono">{l.sku}</span>
                  </div>
                  <div className="img-slot-grid">
                    {SLOT_LABELS.map((label, idx) => {
                      const url = (urls[l.sku] || [])[idx] || ''
                      const isSel = selectedSlot?.sku === l.sku && selectedSlot?.idx === idx
                      return (
                        <div key={idx} className="img-slot" onClick={() => setSelectedSlot({ sku: l.sku, idx })}>
                          <div className={`img-slot-box ${url ? 'slot-filled' : 'slot-empty'}${isSel ? ' slot-selected' : ''}`}>
                            <span className="slot-num">{idx + 1}</span>
                            {url ? (
                              <>
                                <img src={url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
                                <span className="slot-check">✓</span>
                              </>
                            ) : (
                              <span style={{ fontSize: 18, color: '#ccc' }}>+</span>
                            )}
                          </div>
                          <div className={`slot-label${!url ? ' missing' : ''}`}>{label}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div className="side-panel">
        {selectedSlot && selListing ? (
          <>
            <div>
              <div className="panel-label">Selected</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginTop: 4 }}>Slot {selectedSlot.idx + 1} — {SLOT_LABELS[selectedSlot.idx]}</div>
              <div className="sku-mono" style={{ marginTop: 2 }}>{selListing.sku}</div>
            </div>

            <div className="panel-image-box">
              {selUrl ? (
                <img src={selUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <span>No image</span>
              )}
            </div>

            <div>
              <div className="panel-label" style={{ marginBottom: 5 }}>Image URL</div>
              <input
                type="text" value={selUrl} placeholder="https://…"
                onChange={e => setUrl(selectedSlot.sku, selectedSlot.idx, e.target.value)}
                style={{ width: '100%', border: '1px solid #e0e7ef', borderRadius: 5, padding: '5px 8px', fontSize: 11, fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <div className="panel-label" style={{ marginBottom: 5 }}>Requirements</div>
              {(SLOT_REQUIREMENTS[selectedSlot.idx] || DEFAULT_REQUIREMENTS).map(r => (
                <div key={r} style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>{r}</div>
              ))}
            </div>

            <div className="panel-divider" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <button className="btn-secondary" onClick={() => setSelectedSlot(null)} style={{ width: '100%' }}>← Back</button>
            </div>
          </>
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: '#aaa', fontSize: 12 }}>点击左侧槽位查看详情</div>
        )}
      </div>
    </div>
  )
}

// ── Section 2: Dimensions Generator ──
function DimensionsSection() {
  const [frontImg, setFrontImg] = useState<string | null>(null)
  const [sideImg, setSideImg] = useState<string | null>(null)
  const [preset, setPreset] = useState('')
  const [dims, setDims] = useState<DimData>({ lensWidth: '', lensHeight: '', bridgeWidth: '', armLength: '', totalWidth: '', totalHeight: '', weight: '' })
  const [template, setTemplate] = useState<'white' | 'dark' | 'amazon'>('white')
  const [generated, setGenerated] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frontInputRef = useRef<HTMLInputElement>(null)
  const sideInputRef = useRef<HTMLInputElement>(null)

  const handlePreset = (p: string) => {
    setPreset(p)
    if (PRESETS[p]) setDims(PRESETS[p])
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setImg: (s: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImg(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const templates = {
    white: { bg: '#ffffff', lineColor: '#1a2332', textColor: '#1a2332', labelBg: '#ffffff', labelText: '#1a2332' },
    dark: { bg: '#2d3f52', lineColor: '#0078d4', textColor: '#ffffff', labelBg: '#1e2a3a', labelText: '#ffffff' },
    amazon: { bg: '#ffffff', lineColor: '#ff9900', textColor: '#000000', labelBg: '#fff', labelText: '#000' },
  }

  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, label: string, cfg: typeof templates.white) => {
    ctx.strokeStyle = cfg.lineColor
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    const isHoriz = Math.abs(y2 - y1) < Math.abs(x2 - x1)
    const tickLen = 8
    if (isHoriz) {
      ctx.beginPath(); ctx.moveTo(x1, y1 - tickLen / 2); ctx.lineTo(x1, y1 + tickLen / 2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x2, y2 - tickLen / 2); ctx.lineTo(x2, y2 + tickLen / 2); ctx.stroke()
    } else {
      ctx.beginPath(); ctx.moveTo(x1 - tickLen / 2, y1); ctx.lineTo(x1 + tickLen / 2, y1); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x2 - tickLen / 2, y2); ctx.lineTo(x2 + tickLen / 2, y2); ctx.stroke()
    }
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
    ctx.font = '14px Segoe UI, Arial'
    const tw = ctx.measureText(label).width
    ctx.fillStyle = cfg.labelBg
    ctx.fillRect(mx - tw / 2 - 4, my - 10, tw + 8, 18)
    ctx.fillStyle = cfg.labelText
    ctx.fillText(label, mx - tw / 2, my + 4)
  }

  const generateCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = 1600; canvas.height = 1600
    const cfg = templates[template]
    ctx.fillStyle = cfg.bg
    ctx.fillRect(0, 0, 1600, 1600)

    const loadAndDraw = (src: string | null, x: number, y: number, w: number, h: number, cb: () => void) => {
      if (!src) { cb(); return }
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(w / img.width, h / img.height)
        const dw = img.width * scale, dh = img.height * scale
        ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
        cb()
      }
      img.onerror = () => cb()
      img.src = src
    }

    loadAndDraw(frontImg, 0, 100, 900, 1200, () => {
      loadAndDraw(sideImg, 900, 100, 700, 700, () => {
        const lw = parseFloat(dims.lensWidth) || 52
        const lh = parseFloat(dims.lensHeight) || 40
        const bw = parseFloat(dims.bridgeWidth) || 16
        const al = parseFloat(dims.armLength) || 140
        const tw = parseFloat(dims.totalWidth) || 138

        const cx = 450
        const imgT = 200, imgB = 1200
        const imgH = imgB - imgT

        drawArrow(ctx, cx - lw * 4, imgT + imgH * 0.35, cx + lw * 4, imgT + imgH * 0.35, `${dims.lensWidth || '?'}mm`, cfg)
        drawArrow(ctx, cx + lw * 4 + 20, imgT + imgH * 0.2, cx + lw * 4 + 20, imgT + imgH * 0.55, `${dims.lensHeight || '?'}mm`, cfg)
        drawArrow(ctx, cx - bw * 2, imgT + imgH * 0.45, cx + bw * 2, imgT + imgH * 0.45, `${dims.bridgeWidth || '?'}mm`, cfg)
        drawArrow(ctx, 50, imgT + imgH * 0.6, 50 + al * 2, imgT + imgH * 0.6, `${dims.armLength || '?'}mm`, cfg)
        drawArrow(ctx, cx - tw * 3, imgB - 60, cx + tw * 3, imgB - 60, `${dims.totalWidth || '?'}mm`, cfg)

        ctx.fillStyle = cfg.textColor
        ctx.font = '13px Segoe UI, Arial'
        const tableY = 1500
        const entries = [
          `镜片宽 ${dims.lensWidth}mm`, `镜片高 ${dims.lensHeight}mm`,
          `鼻梁 ${dims.bridgeWidth}mm`, `镜臂 ${dims.armLength}mm`,
          `整体宽 ${dims.totalWidth}mm`, `重量 ${dims.weight}g`
        ]
        entries.forEach((e, i) => {
          ctx.fillText(e, 80 + i * 250, tableY)
        })

        ctx.font = '11px Segoe UI, Arial'
        ctx.fillStyle = '#6b7a8d'
        ctx.fillText(`TWINKLE TWINKLE  ${preset}`, 1400, 1570)

        setGenerated(true)
      })
    })
  }

  const download = (type: 'png' | 'jpeg') => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL(`image/${type}`, type === 'jpeg' ? 0.95 : undefined)
    const a = document.createElement('a')
    a.href = url
    a.download = `${preset || 'glasses'}-dimensions-${new Date().toISOString().slice(0, 10)}.${type}`
    a.click()
  }

  const saveDims = () => {
    if (!preset) return
    localStorage.setItem(`dimensions-${preset}`, JSON.stringify(dims))
    alert('尺寸数据已保存')
  }

  useEffect(() => {
    if (!preset) return
    const saved = localStorage.getItem(`dimensions-${preset}`)
    if (saved) {
      try { setDims(JSON.parse(saved)) } catch { /* */ }
    }
  }, [preset])

  const dimFields: { key: keyof DimData; label: string; unit: string }[] = [
    { key: 'lensWidth', label: '镜片宽度', unit: 'mm' },
    { key: 'lensHeight', label: '镜片高度', unit: 'mm' },
    { key: 'bridgeWidth', label: '鼻梁宽度', unit: 'mm' },
    { key: 'armLength', label: '镜臂长度', unit: 'mm' },
    { key: 'totalWidth', label: '整体宽度', unit: 'mm' },
    { key: 'totalHeight', label: '整体高度(含架)', unit: 'mm' },
    { key: 'weight', label: '产品重量', unit: 'g' },
  ]

  return (
    <div style={{ overflowY: 'auto', padding: '0 4px' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2332', marginBottom: 12 }}>尺寸图生成器</div>

      <div className="field-card" style={{ marginBottom: 12 }}>
        <div className="field-card-label" style={{ marginBottom: 6 }}>Step 1：上传图片</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#6b7a8d', marginBottom: '4px' }}>正面图</div>
            <div
              onClick={() => frontInputRef.current?.click()}
              style={{
                border: '2px dashed #d0d7de', borderRadius: '4px', padding: '20px',
                textAlign: 'center', cursor: 'pointer', background: frontImg ? '#f0f2f5' : '#fafbfc',
                fontSize: '12px', color: '#6b7a8d'
              }}
            >
              {frontImg ? <img src={frontImg} alt="" style={{ maxHeight: '80px', maxWidth: '100%' }} /> : '拖拽或点击上传'}
            </div>
            <input ref={frontInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, setFrontImg)} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#6b7a8d', marginBottom: '4px' }}>45度图（可选）</div>
            <div
              onClick={() => sideInputRef.current?.click()}
              style={{
                border: '2px dashed #d0d7de', borderRadius: '4px', padding: '20px',
                textAlign: 'center', cursor: 'pointer', background: sideImg ? '#f0f2f5' : '#fafbfc',
                fontSize: '12px', color: '#6b7a8d'
              }}
            >
              {sideImg ? <img src={sideImg} alt="" style={{ maxHeight: '80px', maxWidth: '100%' }} /> : '拖拽或点击上传'}
            </div>
            <input ref={sideInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, setSideImg)} />
          </div>
        </div>
      </div>

      <div className="field-card" style={{ marginBottom: 12 }}>
        <div className="field-card-label" style={{ marginBottom: 6 }}>Step 2：输入尺寸数据</div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', color: '#1a2332', marginRight: '8px' }}>款式预设：</label>
          <select
            value={preset}
            onChange={e => handlePreset(e.target.value)}
            style={{ border: '1px solid #d0d7de', borderRadius: '3px', padding: '3px 8px', fontSize: '12px' }}
          >
            <option value="">-- 选择款式 --</option>
            {Object.keys(PRESETS).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#f6f8fa' }}>
              <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #d0d7de', color: '#6b7a8d' }}>尺寸项目</th>
              <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #d0d7de', color: '#6b7a8d', width: '100px' }}>数值</th>
              <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #d0d7de', color: '#6b7a8d', width: '50px' }}>单位</th>
            </tr>
          </thead>
          <tbody>
            {dimFields.map((f, i) => (
              <tr key={f.key} style={{ background: i % 2 === 0 ? '#ffffff' : '#f6f8fa' }}>
                <td style={{ padding: '5px 8px', border: '1px solid #d0d7de', color: '#1a2332' }}>{f.label}</td>
                <td style={{ padding: '3px 6px', border: '1px solid #d0d7de' }}>
                  <input
                    type="text"
                    value={dims[f.key]}
                    onChange={e => setDims(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ fontSize: '11px', width: '80px' }}
                  />
                </td>
                <td style={{ padding: '5px 8px', border: '1px solid #d0d7de', color: '#6b7a8d' }}>{f.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="field-card" style={{ marginBottom: 12 }}>
        <div className="field-card-label" style={{ marginBottom: 6 }}>Step 3：选择标注风格</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { id: 'white', label: '简洁白底', desc: '白底+黑色标注线' },
            { id: 'dark', label: '深色专业', desc: '深灰底+蓝色标注线' },
            { id: 'amazon', label: '亚马逊风格', desc: '白底+橙色标注线' },
          ].map(t => (
            <div
              key={t.id}
              onClick={() => setTemplate(t.id as 'white' | 'dark' | 'amazon')}
              style={{
                flex: 1, border: `2px solid ${template === t.id ? '#1a6bb5' : '#e0e7ef'}`,
                borderRadius: '4px', padding: '10px', cursor: 'pointer', textAlign: 'center',
                background: template === t.id ? '#e8f4fd' : '#fafbfc'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a2332' }}>{t.label}</div>
              <div style={{ fontSize: '11px', color: '#6b7a8d', marginTop: '2px' }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="field-card" style={{ marginBottom: 12 }}>
        <div className="field-card-label" style={{ marginBottom: 6 }}>Step 4：生成预览</div>
        <button className="btn-primary" onClick={generateCanvas} style={{ marginBottom: '10px' }}>
          生成尺寸图
        </button>
        <canvas
          ref={canvasRef}
          style={{ maxWidth: '100%', border: '1px solid #d0d7de', borderRadius: '4px', display: 'block' }}
        />
      </div>

      {generated && (
        <div className="field-card" style={{ marginBottom: 12 }}>
          <div className="field-card-label" style={{ marginBottom: 6 }}>Step 5：下载</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" onClick={() => download('png')}>下载尺寸图 PNG</button>
            <button className="btn-secondary" onClick={() => download('jpeg')}>下载尺寸图 JPG</button>
            <button className="btn-secondary" onClick={saveDims} style={{ marginLeft: 'auto' }}>💾 保存尺寸数据</button>
          </div>
        </div>
      )}
    </div>
  )
}

const NAV_ITEMS = [
  { id: 'photos',     icon: '📸', label: '产品图片' },
  { id: 'dimensions', icon: '📐', label: '尺寸图生成器' },
]

export default function ImagesClient({ listings }: Props) {
  const [activeSection, setActiveSection] = useState('photos')

  return (
    <>
      <div className="page-toolbar">
        <span className="page-title">Images</span>
        {NAV_ITEMS.map(item => (
          <button key={item.id} className={`filter-pill${activeSection === item.id ? ' active' : ''}`} onClick={() => setActiveSection(item.id)}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {activeSection === 'photos'     && <PhotosSection listings={listings} />}
      {activeSection === 'dimensions' && <DimensionsSection />}
    </>
  )
}
