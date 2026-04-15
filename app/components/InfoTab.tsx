'use client'

import { useState, lazy, Suspense } from 'react'

// KeywordSuggestions loaded lazily — won't crash if missing
const KeywordSuggestions = lazy(() =>
  import('../../components/KeywordSuggestions').catch(() => ({
    default: () => null as any,
  }))
)

interface InfoTabProps {
  form: Record<string, string>
  onChange: (field: string, value: string) => void
}

// ── Field definitions ──────────────────────────────────────────────────────

const GROUP1_FIELDS: Array<{ key: string; en: string; zh: string }> = [
  { key: 'itemName',       en: 'Item Name',       zh: '商品名称' },
  { key: 'brand',          en: 'Brand',            zh: '品牌' },
  { key: 'price',          en: 'Price',            zh: '价格' },
  { key: 'quantity',       en: 'Quantity',         zh: '库存' },
  { key: 'listingAction',  en: 'Listing Action',   zh: '操作类型' },
  { key: 'parentage',      en: 'Parentage',        zh: '层级' },
  { key: 'parentSku',      en: 'Parent SKU',       zh: '父SKU' },
  { key: 'variationTheme', en: 'Variation Theme',  zh: '变体主题' },
]

const GROUP2_FIELDS: Array<{ key: string; en: string; zh: string; textarea?: boolean }> = [
  { key: 'bullet1',     en: 'Bullet Point 1', zh: '卖点1' },
  { key: 'bullet2',     en: 'Bullet Point 2', zh: '卖点2' },
  { key: 'bullet3',     en: 'Bullet Point 3', zh: '卖点3' },
  { key: 'bullet4',     en: 'Bullet Point 4', zh: '卖点4' },
  { key: 'bullet5',     en: 'Bullet Point 5', zh: '卖点5' },
  { key: 'description', en: 'Description',    zh: '商品详情描述', textarea: true },
]

const GROUP3_FIELDS: Array<{ key: string; en: string; zh: string }> = [
  { key: 'keywords', en: 'Search Terms', zh: '搜索词' },
]

const GROUP4_FIELDS: Array<{ key: string; en: string; zh: string }> = [
  { key: 'colorMap',        en: 'Color Map',         zh: '色号映射' },
  { key: 'color',           en: 'Color',              zh: '颜色' },
  { key: 'strength',        en: 'Strength',           zh: '度数' },
  { key: 'frameMaterial',   en: 'Frame Material',     zh: '镜框材质' },
  { key: 'frameType',       en: 'Frame Type',         zh: '镜框类型' },
  { key: 'itemShape',       en: 'Lens Shape',         zh: '镜片形状' },
  { key: 'numberOfItems',   en: 'Number of Items',    zh: '件数' },
  { key: 'packageQuantity', en: 'Package Quantity',   zh: '包装数量' },
  { key: 'armLength',       en: 'Arm Length (mm)',    zh: '镜腿长度(mm)' },
  { key: 'bridgeWidth',     en: 'Bridge Width (mm)',  zh: '鼻梁宽度(mm)' },
  { key: 'itemWeight',      en: 'Item Weight',        zh: '重量' },
  { key: 'weightUnit',      en: 'Weight Unit',        zh: '重量单位' },
]

// ── Helper ─────────────────────────────────────────────────────────────────

function countFilled(fields: Array<{ key: string }>, form: Record<string, string>): number {
  return fields.filter(f => (form[f.key] ?? '').trim() !== '').length
}

function progressClass(filled: number, total: number): string {
  if (filled === 0) return 'pg-empty'
  if (filled === total) return 'pg-done'
  return 'pg-partial'
}

function progressText(filled: number, total: number): string {
  if (filled === total) return `${total}/${total} ✓`
  return `${filled}/${total}`
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface ToggleHeaderProps {
  open: boolean
  onToggle: () => void
  titleEn: string
  titleZh: string
  filled: number
  total: number
}

function ToggleHeader({ open, onToggle, titleEn, titleZh, filled, total }: ToggleHeaderProps) {
  const cls = progressClass(filled, total)
  const txt = progressText(filled, total)
  return (
    <div className="group-toggle" onClick={onToggle}>
      <span className="arrow">{open ? '▼' : '▶'}</span>
      <span className="title">
        {titleEn} <span className="zh">{titleZh}</span>
      </span>
      <span className={`progress ${cls}`}>{txt}</span>
    </div>
  )
}

interface FieldRowProps {
  fieldKey: string
  en: string
  zh: string
  value: string
  onChange: (field: string, value: string) => void
  warn?: boolean
  textarea?: boolean
}

function FieldRow({ fieldKey, en, zh, value, onChange, warn, textarea }: FieldRowProps) {
  return (
    <div className="field">
      <label>
        {en} <span className="zh">{zh}</span>
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={e => onChange(fieldKey, e.target.value)}
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(fieldKey, e.target.value)}
          className={warn ? 'warn' : undefined}
        />
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function InfoTab({ form, onChange }: InfoTabProps) {
  const [open, setOpen] = useState<boolean[]>([true, true, false, false])

  function toggle(i: number) {
    setOpen(prev => prev.map((v, idx) => (idx === i ? !v : v)))
  }

  // Group 1
  const g1Filled = countFilled(GROUP1_FIELDS, form)
  // Group 2
  const g2Filled = countFilled(GROUP2_FIELDS, form)
  // Group 3
  const g3Filled = countFilled(GROUP3_FIELDS, form)
  // Group 4
  const g4Filled = countFilled(GROUP4_FIELDS, form)

  return (
    <>
      {/* ── Group 1: Required Fields ── */}
      <div className="field-group">
        <ToggleHeader
          open={open[0]}
          onToggle={() => toggle(0)}
          titleEn="Required Fields"
          titleZh="必填基本信息"
          filled={g1Filled}
          total={GROUP1_FIELDS.length}
        />
        <div className={`group-body${open[0] ? '' : ' collapsed'}`}>
          <div className="field-grid">
            {GROUP1_FIELDS.map(f => (
              <FieldRow
                key={f.key}
                fieldKey={f.key}
                en={f.en}
                zh={f.zh}
                value={form[f.key] ?? ''}
                onChange={onChange}
                warn={(form[f.key] ?? '').trim() === ''}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Group 2: Description ── */}
      <div className="field-group">
        <ToggleHeader
          open={open[1]}
          onToggle={() => toggle(1)}
          titleEn="Description"
          titleZh="商品描述"
          filled={g2Filled}
          total={GROUP2_FIELDS.length}
        />
        <div className={`group-body${open[1] ? '' : ' collapsed'}`}>
          <div className="field-grid single">
            {GROUP2_FIELDS.map(f => (
              <FieldRow
                key={f.key}
                fieldKey={f.key}
                en={f.en}
                zh={f.zh}
                value={form[f.key] ?? ''}
                onChange={onChange}
                textarea={f.textarea}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Group 3: Keywords ── */}
      <div className="field-group">
        <ToggleHeader
          open={open[2]}
          onToggle={() => toggle(2)}
          titleEn="Keywords"
          titleZh="搜索关键词"
          filled={g3Filled}
          total={GROUP3_FIELDS.length}
        />
        <div className={`group-body${open[2] ? '' : ' collapsed'}`}>
          <div className="field-grid single">
            <FieldRow
              fieldKey="keywords"
              en="Search Terms"
              zh="搜索词"
              value={form['keywords'] ?? ''}
              onChange={onChange}
            />
            <Suspense fallback={null}>
              <KeywordSuggestions
                value={form['keywords'] ?? ''}
                onChange={(v: string) => onChange('keywords', v)}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* ── Group 4: Specifications ── */}
      <div className="field-group">
        <ToggleHeader
          open={open[3]}
          onToggle={() => toggle(3)}
          titleEn="Specifications"
          titleZh="规格参数"
          filled={g4Filled}
          total={GROUP4_FIELDS.length}
        />
        <div className={`group-body${open[3] ? '' : ' collapsed'}`}>
          <div className="field-grid">
            {GROUP4_FIELDS.map(f => (
              <FieldRow
                key={f.key}
                fieldKey={f.key}
                en={f.en}
                zh={f.zh}
                value={form[f.key] ?? ''}
                onChange={onChange}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
