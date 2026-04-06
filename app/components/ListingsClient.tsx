'use client'

import { useState, useEffect } from 'react'

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

interface Style {
  parentSku: string
  variants: string[]
}

interface Draft {
  bullet1?: string
  bullet2?: string
}

interface Props {
  listings: Listing[]
  styles: Style[]
}

export default function ListingsClient({ listings, styles }: Props) {
  const [selected, setSelected] = useState<Listing | null>(null)
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)
  const [search, setSearch] = useState('')
  const [activeStyle, setActiveStyle] = useState('All')

  // 选中行时从 localStorage 加载草稿预览
  useEffect(() => {
    if (!selected) { setSelectedDraft(null); return }
    try {
      const saved = localStorage.getItem(`draft:${selected.sku}`)
      setSelectedDraft(saved ? JSON.parse(saved) : null)
    } catch { setSelectedDraft(null) }
  }, [selected?.sku])

  const filtered = listings.filter((l) => {
    const matchesStyle = activeStyle === 'All' || l.parentSku === activeStyle
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      l.sku.toLowerCase().includes(q) ||
      l.itemName.toLowerCase().includes(q) ||
      l.color.toLowerCase().includes(q)
    return matchesStyle && matchesSearch
  })

  // 监听工具栏全局导出事件
  useEffect(() => {
    const handler = () => {
      const rows = filtered
      const header = 'SKU,款式,颜色,度数,价格,库存,主图'
      const csv = [header, ...rows.map((l) =>
        [l.sku, l.parentSku, l.color, l.strength, l.price, l.quantity, l.mainImage]
          .map((v) => `"${(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )].join('\r\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `listings-export-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
    window.addEventListener('toolbar-export-all', handler)
    return () => window.removeEventListener('toolbar-export-all', handler)
  }, [filtered])

  return (
    <div style={{ display: 'flex', flex: 1, gap: '6px', minWidth: 0, overflow: 'hidden' }}>

      {/* ─── Left: listview ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveStyle('All')}
            className={activeStyle === 'All' ? 'active' : ''}
          >
            All ({listings.length})
          </button>
          {styles.map((s) => (
            <button
              key={s.parentSku}
              onClick={() => setActiveStyle(s.parentSku)}
              className={activeStyle === s.parentSku ? 'active' : ''}
            >
              {s.parentSku} ({s.variants.length})
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <label style={{ fontSize: '11px' }}>搜索：</label>
          <input
            type="text"
            placeholder="SKU / 颜色 / 款式…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '200px', fontSize: '11px', height: '21px' }}
          />
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', border: '2px inset #d4d0c8' }}>
          <table className="win98-listview" style={{ border: 'none' }}>
            <thead>
              <tr>
                <th style={{ width: '16px' }}></th>
                <th>SKU</th>
                <th>款式</th>
                <th>颜色</th>
                <th>度数</th>
                <th>价格</th>
                <th>库存</th>
                <th>图片</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((listing) => (
                <tr
                  key={listing.sku}
                  className={selected?.sku === listing.sku ? 'selected' : ''}
                  onClick={() => setSelected(listing)}
                >
                  <td style={{ textAlign: 'center' }}>
                    {selected?.sku === listing.sku ? '▶' : ''}
                  </td>
                  <td className="sku-mono">{listing.sku}</td>
                  <td>{listing.parentSku}</td>
                  <td>{listing.color || '—'}</td>
                  <td className="sku-mono">{listing.strength || '—'}</td>
                  <td>{listing.price ? `£${listing.price}` : '—'}</td>
                  <td>{listing.quantity || '—'}</td>
                  <td style={{ textAlign: 'center', color: listing.mainImage ? '#000000' : '#cc0000' }}>
                    {listing.mainImage ? '●' : '○'}
                  </td>
                  <td>
                    <a
                      href={`/editor?sku=${listing.sku}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: '11px', color: 'inherit' }}
                    >
                      编辑
                    </a>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '12px', textAlign: 'center', color: '#808080' }}>
                    No listings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Status line */}
        <div style={{ fontSize: '11px', color: '#444444' }}>
          共 {styles.length} 款式 / {listings.length} 条变体
          {activeStyle !== 'All' && ` / 当前筛选：${filtered.length} 条`}
        </div>
      </div>

      {/* ─── Right: detail panel ─── */}
      <div style={{ width: '200px', flexShrink: 0 }}>
        {selected ? (
          <fieldset style={{ height: '100%', boxSizing: 'border-box' }}>
            <legend>选中详情</legend>

            {/* Image */}
            <div style={{
              width: '100%', height: '100px', background: '#ffffff',
              border: '2px inset #d4d0c8', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: '6px', overflow: 'hidden'
            }}>
              {selected.mainImage ? (
                <img
                  src={selected.mainImage}
                  alt={selected.sku}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <span style={{ color: '#808080', fontSize: '11px' }}>No image</span>
              )}
            </div>

            {/* Fields */}
            {[
              ['SKU', selected.sku],
              ['款式', selected.parentSku],
              ['颜色', selected.color || '—'],
              ['度数', selected.strength || '—'],
              ['价格', selected.price ? `£${selected.price}` : '—'],
              ['库存', selected.quantity || '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                <span style={{ color: '#444444' }}>{label}</span>
                <span style={{
                  fontWeight: label === 'SKU' ? 'normal' : 'bold',
                  fontFamily: label === 'SKU' ? 'Courier New, monospace' : undefined,
                  fontSize: label === 'SKU' ? '9px' : '11px'
                }}>{value}</span>
              </div>
            ))}

            {/* Draft bullets */}
            {selectedDraft && (selectedDraft.bullet1 || selectedDraft.bullet2) && (
              <div style={{ marginTop: '6px', fontSize: '10px', color: '#444444', borderTop: '1px solid #808080', paddingTop: '4px' }}>
                {[selectedDraft.bullet1, selectedDraft.bullet2].filter(Boolean).map((b, i) => (
                  <div key={i} style={{ marginBottom: '2px' }}>• {b}</div>
                ))}
              </div>
            )}

            <hr style={{ margin: '6px 0', borderColor: '#808080' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <a href={`/editor?sku=${selected.sku}`} style={{ display: 'block' }}>
                <button style={{ width: '100%', fontSize: '11px' }}>✎ 前往编辑</button>
              </a>
              <a href="/images" style={{ display: 'block' }}>
                <button style={{ width: '100%', fontSize: '11px' }}>🖼 查看图片</button>
              </a>
              <button
                onClick={() => setSelected(null)}
                style={{ width: '100%', fontSize: '11px' }}
              >
                ✕ 关闭
              </button>
            </div>
          </fieldset>
        ) : (
          <fieldset style={{ height: '100%', boxSizing: 'border-box' }}>
            <legend>选中详情</legend>
            <div style={{ padding: '20px 6px', textAlign: 'center', color: '#808080', fontSize: '11px' }}>
              请从左侧选择一条记录
            </div>
          </fieldset>
        )}
      </div>

    </div>
  )
}
