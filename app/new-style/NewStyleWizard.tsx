'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

// ─────────── Types ────────────────────────────────────────────────────────

interface ColorRow {
  color: string
  colorCode: string
  colorMap: string
  mainImage: string
  image2: string
  image3: string
  image4: string
  image5: string
  image6: string
  image7: string
  image8: string
}

const DEFAULT_STRENGTHS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]

const EMPTY_COLOR = (): ColorRow => ({
  color: '',
  colorCode: '',
  colorMap: '',
  mainImage: '',
  image2: '',
  image3: '',
  image4: '',
  image5: '',
  image6: '',
  image7: '',
  image8: '',
})

// ─────────── Helpers ──────────────────────────────────────────────────────

function suggestColorCode(name: string): string {
  const clean = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!clean) return ''
  // Short colors → keep full; long → first 3 chars
  return clean.length <= 4 ? clean : clean.slice(0, 3)
}

function strengthCode(n: number): string {
  const v = Math.max(0, Math.floor(n * 100))
  return v.toString().padStart(3, '0')
}

function formatStrength(n: number): string {
  return n.toFixed(1)
}

// ─────────── Component ────────────────────────────────────────────────────

export default function NewStyleWizard() {
  const router = useRouter()

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Step 1
  const [parentSku, setParentSku] = useState('')
  const [brand, setBrand] = useState('TWINKLE TWINKLE')
  const [itemNameTemplate, setItemNameTemplate] = useState(
    'TWINKLE TWINKLE Reading Glasses — {parentSku} — {color} {strength}',
  )
  const [price, setPrice] = useState('5.69')
  const [quantity, setQuantity] = useState('99')
  const [variationTheme, setVariationTheme] = useState('COLOR/MAGNIFICATION_STRENGTH')

  // Step 2
  const [colors, setColors] = useState<ColorRow[]>([EMPTY_COLOR()])

  // Step 3
  const [strengths, setStrengths] = useState<number[]>([...DEFAULT_STRENGTHS])
  const [newStrength, setNewStrength] = useState('')

  // Step 4
  const [lensWidth, setLensWidth] = useState('')
  const [lensHeight, setLensHeight] = useState('')
  const [bridgeWidth, setBridgeWidth] = useState('')
  const [templeLength, setTempleLength] = useState('')
  const [frameWidth, setFrameWidth] = useState('')
  const [itemWeight, setItemWeight] = useState('')
  const [frameMaterial, setFrameMaterial] = useState('')
  const [frameShape, setFrameShape] = useState('')

  // ─── Preview rows (memoized) ──────────────────────────────────────────
  const previewRows = useMemo(() => {
    const rows: Array<{
      sku: string
      parentage: 'Parent' | 'Child'
      color: string
      strength: string
      price: string
      quantity: string
      mainImage: string
    }> = []

    rows.push({
      sku: parentSku || '(empty parentSku)',
      parentage: 'Parent',
      color: '',
      strength: '',
      price: '',
      quantity: '',
      mainImage: '',
    })

    for (const c of colors) {
      for (const s of strengths) {
        rows.push({
          sku: `${parentSku}_${c.colorCode}_${strengthCode(s)}`,
          parentage: 'Child',
          color: c.color,
          strength: formatStrength(s),
          price,
          quantity,
          mainImage: c.mainImage,
        })
      }
    }

    return rows
  }, [parentSku, colors, strengths, price, quantity])

  // ─── Validations per step ─────────────────────────────────────────────
  const step1Valid =
    parentSku.trim() !== '' &&
    /^[A-Za-z0-9_-]+$/.test(parentSku.trim()) &&
    brand.trim() !== '' &&
    itemNameTemplate.trim() !== '' &&
    price.trim() !== '' &&
    quantity.trim() !== '' &&
    variationTheme.trim() !== ''

  const step2Valid =
    colors.length > 0 &&
    colors.every(
      (c) =>
        c.color.trim() !== '' &&
        c.colorCode.trim() !== '' &&
        c.mainImage.trim() !== '' &&
        /^https?:\/\//i.test(c.mainImage.trim()),
    ) &&
    new Set(colors.map((c) => c.colorCode.trim())).size === colors.length

  const step3Valid = strengths.length > 0

  // ─── Handlers for colors ─────────────────────────────────────────────
  function updateColor(i: number, patch: Partial<ColorRow>) {
    setColors((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], ...patch }
      // Auto-suggest colorCode when color name typed and code is still empty
      if (patch.color !== undefined && !next[i].colorCode) {
        next[i].colorCode = suggestColorCode(patch.color)
      }
      // Default colorMap = color name if empty
      if (patch.color !== undefined && !next[i].colorMap) {
        next[i].colorMap = patch.color
      }
      return next
    })
  }

  function addColor() {
    setColors((prev) => [...prev, EMPTY_COLOR()])
  }
  function removeColor(i: number) {
    setColors((prev) => prev.filter((_, idx) => idx !== i))
  }

  function addStrength() {
    const parsed = parseFloat(newStrength)
    if (!isFinite(parsed) || parsed <= 0) {
      setErrorMsg('Strength must be a positive number')
      return
    }
    if (strengths.includes(parsed)) {
      setErrorMsg(`Strength ${parsed} already added`)
      return
    }
    setStrengths((prev) => [...prev, parsed].sort((a, b) => a - b))
    setNewStrength('')
    setErrorMsg(null)
  }
  function removeStrength(s: number) {
    setStrengths((prev) => prev.filter((x) => x !== s))
  }

  // ─── Save ────────────────────────────────────────────────────────────
  async function handleSave() {
    setErrorMsg(null)
    setSaving(true)
    try {
      const payload = {
        parentSku: parentSku.trim(),
        brand: brand.trim(),
        itemNameTemplate: itemNameTemplate.trim(),
        price: price.trim(),
        quantity: quantity.trim(),
        variationTheme: variationTheme.trim(),
        colors: colors.map((c) => ({
          color: c.color.trim(),
          colorCode: c.colorCode.trim(),
          colorMap: (c.colorMap || c.color).trim(),
          mainImage: c.mainImage.trim(),
          image2: c.image2.trim() || undefined,
          image3: c.image3.trim() || undefined,
          image4: c.image4.trim() || undefined,
          image5: c.image5.trim() || undefined,
          image6: c.image6.trim() || undefined,
          image7: c.image7.trim() || undefined,
          image8: c.image8.trim() || undefined,
        })),
        strengths,
        dimensions: {
          lensWidth: lensWidth.trim() || undefined,
          lensHeight: lensHeight.trim() || undefined,
          bridgeWidth: bridgeWidth.trim() || undefined,
          templeLength: templeLength.trim() || undefined,
          frameWidth: frameWidth.trim() || undefined,
          itemWeight: itemWeight.trim() || undefined,
          frameMaterial: frameMaterial.trim() || undefined,
          frameShape: frameShape.trim() || undefined,
        },
      }

      const res = await fetch('/apps/listing/api/listings/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        const details = Array.isArray(err.details)
          ? err.details.map((d: { field: string; message: string }) => `• ${d.message}`).join('\n')
          : ''
        setErrorMsg((err.error || 'Save failed') + (details ? '\n' + details : ''))
        setSaving(false)
        return
      }

      // Trigger Excel download
      const dl = document.createElement('a')
      dl.href = `/apps/listing/api/listings/export?parentSku=${encodeURIComponent(parentSku.trim())}`
      dl.click()

      // Small delay so the download can start before we navigate away
      setTimeout(() => router.push('/'), 500)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setSaving(false)
    }
  }

  // ─── UI ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button
          className="btn btn-outline"
          onClick={() => router.push('/')}
          style={{ padding: '6px 12px' }}
        >
          ← Back 返回
        </button>
        <h1 style={{ margin: 0, fontSize: 20, color: '#f0f0f0' }}>
          New Style Wizard <span style={{ fontSize: 13, color: '#888', fontWeight: 400 }}>新建款式向导</span>
        </h1>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: step === n ? '#3a7ad6' : step > n ? '#2c5ba3' : '#2e2e2e',
              color: step >= n ? '#fff' : '#888',
              border: '1px solid #3c3c3c',
              borderRadius: 4,
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            Step {n}
            <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>
              {n === 1 && 'Basics 基本信息'}
              {n === 2 && 'Colors 颜色'}
              {n === 3 && 'Strengths 度数'}
              {n === 4 && 'Dimensions 尺寸'}
              {n === 5 && 'Preview 预览'}
            </div>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            background: '#4a1f1f',
            border: '1px solid #e85050',
            borderRadius: 4,
            color: '#f5b5b5',
            whiteSpace: 'pre-wrap',
            fontSize: 13,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* ── Step 1 ─────────────────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ display: 'grid', gap: 12 }}>
          <FieldRow label="Parent SKU" hint="字母、数字、下划线、连字符">
            <input
              className="text-input"
              value={parentSku}
              onChange={(e) => setParentSku(e.target.value)}
              placeholder="RX224"
            />
          </FieldRow>
          <FieldRow label="Brand 品牌">
            <input
              className="text-input"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </FieldRow>
          <FieldRow
            label="Item Name Template 标题模板"
            hint="Use {parentSku}, {color}, {strength} as placeholders"
          >
            <input
              className="text-input"
              value={itemNameTemplate}
              onChange={(e) => setItemNameTemplate(e.target.value)}
            />
          </FieldRow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FieldRow label="Price 价格 (£)">
              <input
                className="text-input"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </FieldRow>
            <FieldRow label="Quantity 数量">
              <input
                className="text-input"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </FieldRow>
          </div>
          <FieldRow label="Variation Theme">
            <input
              className="text-input"
              value={variationTheme}
              onChange={(e) => setVariationTheme(e.target.value)}
            />
          </FieldRow>
        </div>
      )}

      {/* ── Step 2 ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          {colors.map((c, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                marginBottom: 12,
                background: '#2e2e2e',
                border: '1px solid #3c3c3c',
                borderRadius: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong style={{ color: '#f0f0f0' }}>Color #{i + 1}</strong>
                {colors.length > 1 && (
                  <button
                    className="btn btn-outline"
                    onClick={() => removeColor(i)}
                    style={{ padding: '4px 10px', fontSize: 12 }}
                  >
                    Remove 删除
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <FieldRow label="Color 颜色">
                  <input
                    className="text-input"
                    value={c.color}
                    onChange={(e) => updateColor(i, { color: e.target.value })}
                    placeholder="Black"
                  />
                </FieldRow>
                <FieldRow label="Color Code 代码">
                  <input
                    className="text-input"
                    value={c.colorCode}
                    onChange={(e) => updateColor(i, { colorCode: e.target.value })}
                    placeholder="BK"
                  />
                </FieldRow>
                <FieldRow label="Color Map">
                  <input
                    className="text-input"
                    value={c.colorMap}
                    onChange={(e) => updateColor(i, { colorMap: e.target.value })}
                    placeholder="Black"
                  />
                </FieldRow>
              </div>
              <FieldRow label="Main Image URL 主图 (http/https required)">
                <input
                  className="text-input"
                  value={c.mainImage}
                  onChange={(e) => updateColor(i, { mainImage: e.target.value })}
                  placeholder="https://..."
                />
              </FieldRow>
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: 'pointer', color: '#888', fontSize: 13 }}>
                  Additional images 2–8 (optional)
                </summary>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  {(['image2', 'image3', 'image4', 'image5', 'image6', 'image7', 'image8'] as const).map((k) => (
                    <FieldRow key={k} label={k}>
                      <input
                        className="text-input"
                        value={c[k]}
                        onChange={(e) => updateColor(i, { [k]: e.target.value } as Partial<ColorRow>)}
                      />
                    </FieldRow>
                  ))}
                </div>
              </details>
            </div>
          ))}
          <button className="btn btn-outline" onClick={addColor}>
            + Add Color 添加颜色
          </button>
        </div>
      )}

      {/* ── Step 3 ─────────────────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>
              Default strengths pre-filled. Add or remove as needed.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {strengths.map((s) => (
                <span
                  key={s}
                  style={{
                    padding: '6px 10px',
                    background: '#3a7ad6',
                    color: '#fff',
                    borderRadius: 4,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  +{formatStrength(s)} ({strengthCode(s)})
                  <button
                    onClick={() => removeStrength(s)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: 14,
                    }}
                    aria-label={`Remove strength ${s}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="text-input"
              type="number"
              step="0.25"
              value={newStrength}
              onChange={(e) => setNewStrength(e.target.value)}
              placeholder="e.g. 4.5"
              style={{ maxWidth: 160 }}
            />
            <button className="btn btn-outline" onClick={addStrength}>
              + Add Strength 添加度数
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4 ─────────────────────────────────────────────────── */}
      {step === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FieldRow label="Lens Width 镜片宽 (mm)">
            <input className="text-input" value={lensWidth} onChange={(e) => setLensWidth(e.target.value)} />
          </FieldRow>
          <FieldRow label="Lens Height 镜片高 (mm)">
            <input className="text-input" value={lensHeight} onChange={(e) => setLensHeight(e.target.value)} />
          </FieldRow>
          <FieldRow label="Bridge Width 鼻梁 (mm)">
            <input className="text-input" value={bridgeWidth} onChange={(e) => setBridgeWidth(e.target.value)} />
          </FieldRow>
          <FieldRow label="Temple Length 镜腿 (mm)">
            <input className="text-input" value={templeLength} onChange={(e) => setTempleLength(e.target.value)} />
          </FieldRow>
          <FieldRow label="Frame Width 框架宽 (mm)">
            <input className="text-input" value={frameWidth} onChange={(e) => setFrameWidth(e.target.value)} />
          </FieldRow>
          <FieldRow label="Item Weight 重量 (g)">
            <input className="text-input" value={itemWeight} onChange={(e) => setItemWeight(e.target.value)} />
          </FieldRow>
          <FieldRow label="Frame Material 材质">
            <input className="text-input" value={frameMaterial} onChange={(e) => setFrameMaterial(e.target.value)} />
          </FieldRow>
          <FieldRow label="Frame Shape 款型">
            <input className="text-input" value={frameShape} onChange={(e) => setFrameShape(e.target.value)} />
          </FieldRow>
        </div>
      )}

      {/* ── Step 5 ─────────────────────────────────────────────────── */}
      {step === 5 && (
        <div>
          <div style={{ marginBottom: 10, color: '#888', fontSize: 13 }}>
            Will generate {previewRows.length} rows — 1 parent + {previewRows.length - 1} children.
          </div>
          <div style={{ maxHeight: 420, overflow: 'auto', border: '1px solid #3c3c3c', borderRadius: 4 }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead style={{ background: '#2e2e2e', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={thStyle}>SKU</th>
                  <th style={thStyle}>Parentage</th>
                  <th style={thStyle}>Color</th>
                  <th style={thStyle}>Strength</th>
                  <th style={thStyle}>Price</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Main Image</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr
                    key={i}
                    style={{
                      background: r.parentage === 'Parent' ? '#2c3c54' : 'transparent',
                      borderBottom: '1px solid #333',
                    }}
                  >
                    <td style={tdStyle}><code>{r.sku}</code></td>
                    <td style={tdStyle}>{r.parentage}</td>
                    <td style={tdStyle}>{r.color}</td>
                    <td style={tdStyle}>{r.strength}</td>
                    <td style={tdStyle}>{r.price}</td>
                    <td style={tdStyle}>{r.quantity}</td>
                    <td style={{ ...tdStyle, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.mainImage}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Nav bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button
          className="btn btn-outline"
          onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4 | 5) : s))}
          disabled={step === 1}
        >
          ← Previous 上一步
        </button>
        {step < 5 ? (
          <button
            className="btn btn-primary"
            onClick={() => {
              if (step === 1 && !step1Valid) {
                setErrorMsg('Fill in all Step 1 fields (parentSku must match A-Z, 0-9, _, -)')
                return
              }
              if (step === 2 && !step2Valid) {
                setErrorMsg('Each color needs color, colorCode, and http/https mainImage. Color codes must be unique.')
                return
              }
              if (step === 3 && !step3Valid) {
                setErrorMsg('At least one strength is required')
                return
              }
              setErrorMsg(null)
              setStep((s) => (s + 1) as 1 | 2 | 3 | 4 | 5)
            }}
          >
            Next 下一步 →
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save & Export Excel 保存并导出'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────── Styles helpers ───────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#f0f0f0',
  borderBottom: '1px solid #3c3c3c',
  fontSize: 12,
}
const tdStyle: React.CSSProperties = {
  padding: '6px 10px',
  color: '#ccc',
  fontSize: 12,
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 13, color: '#ccc', marginBottom: 4 }}>
        {label}
        {hint && (
          <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>— {hint}</span>
        )}
      </div>
      {children}
    </label>
  )
}
