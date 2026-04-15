'use client'

import { useState, useRef, useEffect } from 'react'

interface SpecsTabProps {
  listing: any | null
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
  RX224:  { lensWidth: '52', lensHeight: '40', bridgeWidth: '16', armLength: '140', totalWidth: '138', totalHeight: '44', weight: '28' },
  TK223:  { lensWidth: '50', lensHeight: '38', bridgeWidth: '18', armLength: '138', totalWidth: '135', totalHeight: '42', weight: '26' },
  '2PR75': { lensWidth: '54', lensHeight: '42', bridgeWidth: '14', armLength: '142', totalWidth: '140', totalHeight: '46', weight: '30' },
}

const DIM_FIELDS: { key: keyof DimData; label: string; unit: string }[] = [
  { key: 'lensWidth',   label: 'Lens Width 镜片宽度',       unit: 'mm' },
  { key: 'lensHeight',  label: 'Lens Height 镜片高度',      unit: 'mm' },
  { key: 'bridgeWidth', label: 'Bridge Width 鼻梁宽度',     unit: 'mm' },
  { key: 'armLength',   label: 'Arm Length 镜臂长度',       unit: 'mm' },
  { key: 'totalWidth',  label: 'Total Width 整体宽度',      unit: 'mm' },
  { key: 'totalHeight', label: 'Total Height 整体高度',     unit: 'mm' },
  { key: 'weight',      label: 'Weight 重量',               unit: 'g'  },
]

const TEMPLATES = {
  white:  { bg: '#ffffff', lineColor: '#1a2332', textColor: '#1a2332', labelBg: '#ffffff', labelText: '#1a2332' },
  dark:   { bg: '#2d3f52', lineColor: '#0078d4', textColor: '#ffffff', labelBg: '#1e2a3a', labelText: '#ffffff' },
  amazon: { bg: '#ffffff', lineColor: '#ff9900', textColor: '#000000', labelBg: '#ffffff', labelText: '#000000' },
}

export default function SpecsTab({ listing }: SpecsTabProps) {
  const [frontImg, setFrontImg]   = useState<string | null>(null)
  const [sideImg,  setSideImg]    = useState<string | null>(null)
  const [preset,   setPreset]     = useState('')
  const [dims,     setDims]       = useState<DimData>({
    lensWidth: '', lensHeight: '', bridgeWidth: '',
    armLength: '', totalWidth: '', totalHeight: '', weight: '',
  })
  const [template,  setTemplate]  = useState<'white' | 'dark' | 'amazon'>('white')
  const [generated, setGenerated] = useState(false)

  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const frontInputRef = useRef<HTMLInputElement>(null)
  const sideInputRef  = useRef<HTMLInputElement>(null)

  // Auto-detect preset from listing sku
  useEffect(() => {
    if (!listing?.sku) return
    const sku = listing.sku as string
    for (const key of Object.keys(PRESETS)) {
      if (sku.includes(key)) {
        handlePreset(key)
        break
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.sku])

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

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    label: string,
    cfg: typeof TEMPLATES.white,
  ) => {
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

    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
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

    canvas.width  = 1600
    canvas.height = 1600

    const cfg = TEMPLATES[template]
    ctx.fillStyle = cfg.bg
    ctx.fillRect(0, 0, 1600, 1600)

    const loadAndDraw = (
      src: string | null,
      x: number, y: number, w: number, h: number,
      cb: () => void,
    ) => {
      if (!src) { cb(); return }
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(w / img.width, h / img.height)
        const dw = img.width * scale
        const dh = img.height * scale
        ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
        cb()
      }
      img.onerror = () => cb()
      img.src = src
    }

    loadAndDraw(frontImg, 0, 100, 900, 1200, () => {
      loadAndDraw(sideImg, 900, 100, 700, 700, () => {
        const lw = parseFloat(dims.lensWidth)   || 52
        const lh = parseFloat(dims.lensHeight)  || 40
        const bw = parseFloat(dims.bridgeWidth) || 16
        const al = parseFloat(dims.armLength)   || 140
        const tw = parseFloat(dims.totalWidth)  || 138

        const cx   = 450
        const imgT = 200
        const imgB = 1200
        const imgH = imgB - imgT

        drawArrow(ctx, cx - lw * 4,      imgT + imgH * 0.35, cx + lw * 4,      imgT + imgH * 0.35, `${dims.lensWidth   || '?'}mm`, cfg)
        drawArrow(ctx, cx + lw * 4 + 20, imgT + imgH * 0.2,  cx + lw * 4 + 20, imgT + imgH * 0.55, `${dims.lensHeight  || '?'}mm`, cfg)
        drawArrow(ctx, cx - bw * 2,      imgT + imgH * 0.45, cx + bw * 2,      imgT + imgH * 0.45, `${dims.bridgeWidth || '?'}mm`, cfg)
        drawArrow(ctx, 50,               imgT + imgH * 0.6,  50 + al * 2,      imgT + imgH * 0.6,  `${dims.armLength   || '?'}mm`, cfg)
        drawArrow(ctx, cx - tw * 3,      imgB - 60,          cx + tw * 3,      imgB - 60,          `${dims.totalWidth  || '?'}mm`, cfg)

        ctx.fillStyle = cfg.textColor
        ctx.font = '13px Segoe UI, Arial'
        const tableY = 1500
        const entries = [
          `镜片宽 ${dims.lensWidth}mm`,
          `镜片高 ${dims.lensHeight}mm`,
          `鼻梁 ${dims.bridgeWidth}mm`,
          `镜臂 ${dims.armLength}mm`,
          `整体宽 ${dims.totalWidth}mm`,
          `重量 ${dims.weight}g`,
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
    alert('尺寸数据已保存 / Dimensions saved')
  }

  useEffect(() => {
    if (!preset) return
    const saved = localStorage.getItem(`dimensions-${preset}`)
    if (saved) {
      try { setDims(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [preset])

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0', marginBottom: 16 }}>
        Dimension Diagram Generator <span style={{ fontSize: 12, fontWeight: 400, color: '#666' }}>尺寸图生成器</span>
      </div>

      {/* Step 1: Image uploads */}
      <div className="field-group" style={{ marginBottom: 12 }}>
        <div className="group-toggle" style={{ cursor: 'default' }}>
          <span className="title">Step 1 — Upload Photos <span className="zh">上传图片</span></span>
        </div>
        <div className="group-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Front image */}
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Front image 正面图</div>
              <div
                onClick={() => frontInputRef.current?.click()}
                style={{
                  border: '2px dashed #3c3c3c', borderRadius: 6, padding: '20px 10px',
                  textAlign: 'center', cursor: 'pointer',
                  background: frontImg ? '#2e2e2e' : '#353535',
                  fontSize: 12, color: '#666', minHeight: 80,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {frontImg
                  ? <img src={frontImg} alt="front" style={{ maxHeight: 80, maxWidth: '100%' }} />
                  : '点击上传 / Click to upload'}
              </div>
              <input
                ref={frontInputRef} type="file" accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleFile(e, setFrontImg)}
              />
            </div>

            {/* Side / 45° image */}
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Side / 45° image（可选）</div>
              <div
                onClick={() => sideInputRef.current?.click()}
                style={{
                  border: '2px dashed #3c3c3c', borderRadius: 6, padding: '20px 10px',
                  textAlign: 'center', cursor: 'pointer',
                  background: sideImg ? '#2e2e2e' : '#353535',
                  fontSize: 12, color: '#666', minHeight: 80,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {sideImg
                  ? <img src={sideImg} alt="side" style={{ maxHeight: 80, maxWidth: '100%' }} />
                  : '点击上传 / Click to upload'}
              </div>
              <input
                ref={sideInputRef} type="file" accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleFile(e, setSideImg)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Dimensions */}
      <div className="field-group" style={{ marginBottom: 12 }}>
        <div className="group-toggle" style={{ cursor: 'default' }}>
          <span className="title">Step 2 — Dimensions <span className="zh">尺寸数据</span></span>
        </div>
        <div className="group-body">
          {/* Preset */}
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Preset <span className="zh">款式预设</span></label>
            <select value={preset} onChange={e => handlePreset(e.target.value)}>
              <option value="">-- Select preset / 选择款式 --</option>
              {Object.keys(PRESETS).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Dimension fields in 2-col grid */}
          <div className="field-grid">
            {DIM_FIELDS.map(f => (
              <div key={f.key} className="field">
                <label>{f.label} ({f.unit})</label>
                <input
                  type="text"
                  value={dims[f.key]}
                  onChange={e => setDims(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={`e.g. ${PRESETS.RX224[f.key]}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3: Template */}
      <div className="field-group" style={{ marginBottom: 12 }}>
        <div className="group-toggle" style={{ cursor: 'default' }}>
          <span className="title">Step 3 — Template Style <span className="zh">标注风格</span></span>
        </div>
        <div className="group-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {([
              { id: 'white',  label: 'White 白色',  desc: 'White bg + black lines' },
              { id: 'dark',   label: 'Dark 深色',   desc: 'Dark bg + blue lines' },
              { id: 'amazon', label: 'Amazon 橙色', desc: 'White bg + orange lines' },
            ] as const).map(t => (
              <div
                key={t.id}
                onClick={() => setTemplate(t.id)}
                style={{
                  border: `2px solid ${template === t.id ? '#e8e8e8' : '#3c3c3c'}`,
                  borderRadius: 6, padding: 12, cursor: 'pointer', textAlign: 'center',
                  background: template === t.id ? '#353535' : '#2e2e2e',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>{t.label}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 4: Generate */}
      <div className="field-group" style={{ marginBottom: 12 }}>
        <div className="group-toggle" style={{ cursor: 'default' }}>
          <span className="title">Step 4 — Generate Preview <span className="zh">生成预览</span></span>
        </div>
        <div className="group-body">
          <button className="btn btn-primary" onClick={generateCanvas} style={{ marginBottom: 12 }}>
            Generate 生成尺寸图
          </button>
          <canvas
            ref={canvasRef}
            style={{ maxWidth: '100%', border: '1px solid #3c3c3c', borderRadius: 4, display: 'block' }}
          />
        </div>
      </div>

      {/* Step 5: Download */}
      {generated && (
        <div className="field-group" style={{ marginBottom: 12 }}>
          <div className="group-toggle" style={{ cursor: 'default' }}>
            <span className="title">Step 5 — Download <span className="zh">下载</span></span>
          </div>
          <div className="group-body">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => download('png')}>Download PNG</button>
              <button className="btn btn-outline" onClick={() => download('jpeg')}>Download JPG</button>
              <button className="btn btn-outline" onClick={saveDims} style={{ marginLeft: 'auto' }}>
                Save Dimensions 保存尺寸
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
