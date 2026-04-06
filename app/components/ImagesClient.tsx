'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

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

const NAV_ITEMS = [
  { id: 'photos', icon: '📸', label: '产品图片' },
  { id: 'dimensions', icon: '📐', label: '尺寸图生成器' },
  { id: 'video', icon: '🎬', label: '视频' },
  { id: 'specs', icon: '📋', label: '图片规范' },
]

// Style constants
const CARD: React.CSSProperties = {
  background: '#d4d0c8',
  borderTop: '2px solid #ffffff',
  borderLeft: '2px solid #ffffff',
  borderRight: '2px solid #808080',
  borderBottom: '2px solid #808080',
  padding: '8px',
  marginBottom: '6px',
}
const PRIMARY_BTN: React.CSSProperties = {
  fontSize: '11px',
  cursor: 'pointer',
  fontFamily: "'Pixelated MS Sans Serif', 'MS Sans Serif', Tahoma, sans-serif",
}
const SECONDARY_BTN: React.CSSProperties = {
  fontSize: '11px',
  cursor: 'pointer',
  fontFamily: "'Pixelated MS Sans Serif', 'MS Sans Serif', Tahoma, sans-serif",
}
const INPUT: React.CSSProperties = {
  fontSize: '11px',
  fontFamily: "'Pixelated MS Sans Serif', 'MS Sans Serif', Tahoma, sans-serif",
  width: '100%',
}

// ── Image URL Row ──
function ImageRow({ label, url, onChange, isMain }: { label: string; url: string; onChange: (v: string) => void; isMain: boolean }) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'warn'>('idle')
  const [dims, setDims] = useState<string>('')

  const checkImage = () => {
    if (!url) return
    setStatus('checking')
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight
      setDims(`${w}×${h}`)
      const minW = isMain ? 1600 : 1200
      setStatus(w >= minW && h >= minW ? 'ok' : 'warn')
    }
    img.onerror = () => setStatus('warn')
    img.src = url
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', borderBottom: '1px solid #f6f8fa' }}>
      <span style={{ fontSize: '11px', color: '#6b7a8d', width: '60px', flexShrink: 0 }}>{label}</span>
      <input
        type="text" value={url} onChange={e => onChange(e.target.value)}
        placeholder="https://..."
        style={{ ...INPUT, flex: 1 }}
      />
      {url && (
        <>
          <button onClick={checkImage} style={{ ...SECONDARY_BTN, padding: '2px 8px', fontSize: '11px', flexShrink: 0 }}>
            {status === 'checking' ? '⏳' : status === 'ok' ? '✅' : status === 'warn' ? '🟡' : '测试'}
          </button>
          {dims && <span style={{ fontSize: '10px', color: '#6b7a8d', flexShrink: 0 }}>{dims}</span>}
          <a href={url} target="_blank" rel="noopener noreferrer">
            <img src={url} alt="" style={{ width: '24px', height: '24px', objectFit: 'cover', border: '1px solid #d0d7de', borderRadius: '2px', flexShrink: 0 }} />
          </a>
        </>
      )}
    </div>
  )
}

// ── Section 1: Photos ──
function PhotosSection({ listings }: { listings: Listing[] }) {
  const [selectedSku, setSelectedSku] = useState<string | null>(null)

  const [urls, setUrls] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {}
    for (const l of listings) {
      init[l.sku] = [l.mainImage || '', l.image2 || '', l.image3 || '', '', '', '', '', '']
    }
    return init
  })

  const setUrl = (sku: string, idx: number, v: string) => {
    setUrls(prev => ({ ...prev, [sku]: prev[sku].map((u, i) => i === idx ? v : u) }))
  }

  const selected = listings.find(l => l.sku === selectedSku)

  // ── Detail view ──
  if (selectedSku && selected) {
    const filled = (urls[selected.sku] || []).filter(Boolean).length
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <button onClick={() => setSelectedSku(null)} style={{ fontSize: '11px' }}>← 返回列表</button>
          <span className="sku-mono" style={{ fontSize: '11px' }}>{selected.sku}</span>
          <span style={{ fontSize: '11px', color: '#444' }}>— {selected.color || selected.parentSku}</span>
          <span style={{ fontSize: '10px', color: filled === 8 ? '#006400' : '#808080', marginLeft: 'auto' }}>
            {filled}/8 张已填
          </span>
        </div>
        <fieldset>
          <legend>图片 URL</legend>
          <div style={{ fontSize: '10px', color: '#808080', marginBottom: '6px' }}>
            主图：建议 1600×1600px 纯白底 &nbsp;|&nbsp; 副图：建议 1200×1200px+
          </div>
          {(urls[selected.sku] || []).map((url, i) => (
            <ImageRow
              key={i}
              label={i === 0 ? '主图' : `图 ${i + 1}`}
              url={url}
              onChange={v => setUrl(selected.sku, i, v)}
              isMain={i === 0}
            />
          ))}
        </fieldset>
      </div>
    )
  }

  // ── Master list view ──
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#444', marginBottom: '4px' }}>
        共 {listings.length} 条 — 点击行进入编辑图片
      </div>
      <div style={{ border: '2px inset #d4d0c8', background: '#ffffff', overflow: 'auto' }}>
        <table className="win98-listview" style={{ border: 'none', width: '100%' }}>
          <thead>
            <tr>
              <th>SKU</th>
              <th>款式</th>
              <th>颜色</th>
              <th style={{ textAlign: 'center' }}>图片</th>
            </tr>
          </thead>
          <tbody>
            {listings.map(l => {
              const filled = (urls[l.sku] || []).filter(Boolean).length
              return (
                <tr key={l.sku} onClick={() => setSelectedSku(l.sku)} style={{ cursor: 'pointer' }}>
                  <td className="sku-mono">{l.sku}</td>
                  <td>{l.parentSku}</td>
                  <td>{l.color || '—'}</td>
                  <td style={{ textAlign: 'center', color: filled === 0 ? '#cc0000' : filled === 8 ? '#006400' : '#444' }}>
                    {filled}/8
                  </td>
                </tr>
              )
            })}
            {listings.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#808080' }}>暂无数据</td></tr>
            )}
          </tbody>
        </table>
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
    const ctx = canvas.getContext('2d')!
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
    <div>
      <h3 style={{ marginBottom: '8px' }}>尺寸图生成器</h3>

      <div style={CARD}>
        <h4 style={{ marginBottom: '6px' }}>Step 1：上传图片</h4>
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

      <div style={CARD}>
        <h4 style={{ marginBottom: '6px' }}>Step 2：输入尺寸数据</h4>
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
                    style={{ ...INPUT, width: '80px' }}
                  />
                </td>
                <td style={{ padding: '5px 8px', border: '1px solid #d0d7de', color: '#6b7a8d' }}>{f.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={CARD}>
        <h4 style={{ marginBottom: '6px' }}>Step 3：选择标注风格</h4>
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
                flex: 1, border: `2px solid ${template === t.id ? '#0078d4' : '#d0d7de'}`,
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

      <div style={CARD}>
        <h4 style={{ marginBottom: '6px' }}>Step 4：生成预览</h4>
        <button onClick={generateCanvas} style={{ ...PRIMARY_BTN, marginBottom: '10px' }}>
          生成尺寸图
        </button>
        <canvas
          ref={canvasRef}
          style={{ maxWidth: '100%', border: '1px solid #d0d7de', borderRadius: '4px', display: 'block' }}
        />
      </div>

      {generated && (
        <div style={CARD}>
          <h4 style={{ marginBottom: '6px' }}>Step 5：下载</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => download('png')} style={PRIMARY_BTN}>下载尺寸图 PNG</button>
            <button onClick={() => download('jpeg')} style={SECONDARY_BTN}>下载尺寸图 JPG</button>
            <button onClick={saveDims} style={{ ...SECONDARY_BTN, marginLeft: 'auto' }}>💾 保存尺寸数据</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section 3: Video ──
function VideoSection() {
  const [url, setUrl] = useState('')
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const items = [
    '产品从包装盒取出展示', '正面/侧面/45度角展示', '弹簧铰链开合展示',
    '佩戴效果展示', '多色款展示', '尺寸对比展示（放在手掌上等）',
    '使用场景（阅读/手机/电脑）'
  ]

  return (
    <div>
      <h3 style={{ marginBottom: '8px' }}>视频</h3>
      <div style={{ ...CARD, background: '#e8f4fd', border: '1px solid #b3d9f5' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#0078d4', marginBottom: '4px' }}>Amazon视频规范</div>
        <div style={{ fontSize: '11px', color: '#1a2332', lineHeight: '1.6' }}>
          格式：MP4, MOV &nbsp;|&nbsp; 最大时长：45秒 &nbsp;|&nbsp; 文件大小：&lt;5GB<br />
          分辨率：1920×1080（16:9）或 3840×2160（4K）<br />
          建议内容：产品展示、使用场景、功能演示
        </div>
      </div>

      <div style={CARD}>
        <div style={{ fontSize: '12px', color: '#6b7a8d', marginBottom: '8px', lineHeight: '1.5' }}>
          Amazon视频需在 Seller Central {'>'} A+ Content {'>'} Video 上传<br />
          上传后将视频URL填入下方
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="text" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="视频URL..."
            style={{ ...INPUT, flex: 1 }}
          />
          <span style={{ fontSize: '11px', background: '#fff8e1', border: '1px solid #f7a800', borderRadius: '3px', padding: '2px 6px', color: '#b37a00', flexShrink: 0 }}>
            🟡 建议
          </span>
        </div>
      </div>

      <div style={CARD}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a2332', marginBottom: '8px' }}>视频内容建议清单</div>
        {items.map(item => (
          <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '13px', color: '#1a2332', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!checks[item]}
              onChange={e => setChecks(prev => ({ ...prev, [item]: e.target.checked }))}
            />
            {item}
          </label>
        ))}
        <div style={{ fontSize: '11px', color: '#6b7a8d', marginTop: '8px' }}>建议时长：30-45秒</div>
      </div>
    </div>
  )
}

// ── Section 4: Specs ──
function SpecsSection() {
  return (
    <div>
      <h3 style={{ marginBottom: '8px' }}>图片规范</h3>

      <div style={CARD}>
        <h4 style={{ marginBottom: '6px' }}>🔴 主图规范（严格要求）</h4>
        <ul style={{ fontSize: '12px', color: '#1a2332', lineHeight: '1.8', paddingLeft: '16px' }}>
          <li>纯白背景（RGB 255,255,255）</li>
          <li>产品占图片 85% 以上</li>
          <li>最小尺寸：500×500px</li>
          <li>建议尺寸：<strong>1600×1600px</strong>（可缩放）</li>
          <li>格式：JPG（首选）、PNG、GIF（非动图）</li>
          <li style={{ color: '#d13438' }}>禁止：水印、Logo覆盖、边框、文字覆盖</li>
        </ul>
      </div>

      <div style={CARD}>
        <h4 style={{ marginBottom: '6px' }}>🟡 副图规范（建议）</h4>
        <ul style={{ fontSize: '12px', color: '#1a2332', lineHeight: '1.8', paddingLeft: '16px' }}>
          <li>最小：1000×1000px</li>
          <li>建议：1200-2000px</li>
          <li>可以有生活场景、文字标注、对比图</li>
        </ul>
      </div>

      <div style={CARD}>
        <h4 style={{ marginBottom: '6px' }}>📸 7张图最佳实践</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <tbody>
            {[
              ['图1 主图', '纯白底正面图（必须）', '#d13438'],
              ['图2 副图', '纯白底侧面图', '#6b7a8d'],
              ['图3 副图', '纯白底45度图', '#6b7a8d'],
              ['图4 尺寸图', '标注镜片宽/臂长/鼻梁（程序生成）', '#0078d4'],
              ['图5 细节图', '弹簧铰链/镜片特写', '#6b7a8d'],
              ['图6 场景图', '书桌阅读/户外场景（AI生成）', '#6b7a8d'],
              ['图7 多色图', '所有颜色并排展示', '#6b7a8d'],
            ].map(([label, desc, color], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#f6f8fa' : '#fff' }}>
                <td style={{ padding: '6px 8px', border: '1px solid #d0d7de', fontWeight: 600, color: color as string, width: '100px' }}>{label}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #d0d7de', color: '#1a2332' }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={CARD}>
        <h4 style={{ marginBottom: '6px' }}>💡 ChatGPT生图提示词</h4>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0078d4', marginBottom: '4px' }}>书桌场景：</div>
          <pre style={{ fontSize: '11px', color: '#1a2332', background: '#f6f8fa', border: '1px solid #d0d7de', borderRadius: '3px', padding: '8px', whiteSpace: 'pre-wrap', margin: 0 }}>
{`Professional product photography of reading glasses placed on a clean wooden desk next to an open book and a cup of coffee, soft natural window light, warm cozy atmosphere, photorealistic, high resolution, no text, white background optional`}
          </pre>
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0078d4', marginBottom: '4px' }}>模特佩戴：</div>
          <pre style={{ fontSize: '11px', color: '#1a2332', background: '#f6f8fa', border: '1px solid #d0d7de', borderRadius: '3px', padding: '8px', whiteSpace: 'pre-wrap', margin: 0 }}>
{`Middle-aged person wearing stylish reading glasses, natural smile, reading a book indoors, soft lighting, lifestyle photography, professional commercial photo, realistic`}
          </pre>
        </div>
      </div>
    </div>
  )
}

// ── Main ImagesClient ──
export default function ImagesClient({ listings }: { listings: Listing[] }) {
  const [section, setSection] = useState('photos')

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

      {/* Internal sidebar */}
      <div className="win98-img-sidebar">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setSection(item.id)}
            className={section === item.id ? 'active' : ''}
          >
            <span>{item.icon}</span>
            <span style={{ fontSize: '10px' }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="win98-img-content" style={{ padding: '6px' }}>
        {section === 'photos' && <PhotosSection listings={listings} />}
        {section === 'dimensions' && <DimensionsSection />}
        {section === 'video' && <VideoSection />}
        {section === 'specs' && <SpecsSection />}
      </div>

    </div>
  )
}
