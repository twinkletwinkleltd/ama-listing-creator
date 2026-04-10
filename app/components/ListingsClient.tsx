'use client'

import { useState, useEffect } from 'react'
import {
  checkReadiness, generateBatchCsv, downloadCsv,
  type ListingData, type DraftData, type ReadinessResult,
} from '@/lib/exportCsv'

interface Listing extends ListingData {
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

interface ExportModal {
  parentSku: string
  listings: Listing[]
  results: ReadinessResult[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function readDraft(sku: string): DraftData | null {
  try {
    const s = localStorage.getItem(`draft:${sku}`)
    return s ? JSON.parse(s) : null
  } catch { return null }
}

function ReadinessBadge({ result }: { result: ReadinessResult }) {
  if (result.missingRequired.length > 0)
    return <span className="tag tag-red" title={`缺少必填：${result.missingRequired.join(', ')}`}>⚠ 缺{result.missingRequired.length}项</span>
  if (result.missingSuggested.length > 0)
    return <span className="tag tag-amber" title={`建议填写：${result.missingSuggested.join(', ')}`}>○ {result.missingSuggested.length}项建议</span>
  return <span className="tag tag-green">✓ 就绪</span>
}

// ─── Export modal ────────────────────────────────────────────────────────────

function ExportReadinessModal({
  modal, onConfirm, onClose,
}: { modal: ExportModal; onConfirm: () => void; onClose: () => void }) {
  const readyCount   = modal.results.filter((r) => r.ready).length
  const missingCount = modal.results.filter((r) => r.missingRequired.length > 0).length
  const partialCount = modal.results.filter((r) => r.ready && r.missingSuggested.length > 0).length

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="card" style={{ width:520, maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #f0f2f5', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontWeight:700, fontSize:14, color:'#1a3a6b' }}>
            📦 导出前检查 — {modal.parentSku} ({modal.listings.length} 个变体)
          </span>
          <button className="btn-secondary" style={{ padding:'3px 10px' }} onClick={onClose}>✕</button>
        </div>

        {/* Summary */}
        <div style={{ padding:'8px 18px', borderBottom:'1px solid #f0f2f5', display:'flex', gap:16, fontSize:12 }}>
          <span className="tag tag-green">✓ 完整就绪: {readyCount - partialCount}</span>
          <span className="tag tag-amber">○ 内容缺失: {partialCount}</span>
          <span className="tag tag-red">⚠ 缺必填: {missingCount}</span>
        </div>

        {/* Table */}
        <div style={{ overflowY:'auto', flex:1 }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th>SKU</th><th>颜色</th><th>度数</th><th>必填</th><th>建议内容</th>
              </tr>
            </thead>
            <tbody>
              {modal.results.map((r, i) => {
                const listing = modal.listings.find((l) => l.sku === r.sku)
                return (
                  <tr key={r.sku} style={{ background: i % 2 === 0 ? undefined : '#fafbfc' }}>
                    <td className="sku-mono">{r.sku}</td>
                    <td>{listing?.color || '—'}</td>
                    <td>{listing?.strength || '—'}</td>
                    <td>{r.missingRequired.length > 0
                      ? <span className="tag tag-red">⚠ {r.missingRequired.join(', ')}</span>
                      : <span className="tag tag-green">✓</span>}
                    </td>
                    <td>{r.missingSuggested.length > 0
                      ? <span className="tag tag-amber">○ {r.missingSuggested.join(', ')}</span>
                      : <span className="tag tag-green">✓</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 18px', borderTop:'1px solid #f0f2f5', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:11, color:'#aaa' }}>CSV 将包含全部 {modal.listings.length} 个变体</span>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-primary" onClick={onConfirm}>⬆ 下载 CSV</button>
            <button className="btn-secondary" onClick={onClose}>取消</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ListingsClient({ listings, styles }: Props) {
  const [selected, setSelected]           = useState<Listing | null>(null)
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)
  const [search, setSearch]               = useState('')
  const [activeStyle, setActiveStyle]     = useState('All')
  const [exportModal, setExportModal]     = useState<ExportModal | null>(null)

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
    const matchesSearch = !q || l.sku.toLowerCase().includes(q) || l.itemName.toLowerCase().includes(q) || l.color.toLowerCase().includes(q)
    return matchesStyle && matchesSearch
  })

  useEffect(() => {
    const handler = () => {
      const header = 'SKU,款式,颜色,度数,价格,库存,主图'
      const csv = [header, ...filtered.map((l) =>
        [l.sku, l.parentSku, l.color, l.strength, l.price, l.quantity, l.mainImage]
          .map((v) => `"${(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )].join('\r\n')
      downloadCsv(csv, `listings-export-${Date.now()}.csv`)
    }
    window.addEventListener('toolbar-export-all', handler)
    return () => window.removeEventListener('toolbar-export-all', handler)
  }, [filtered])

  const openExportModal = (parentSku: string) => {
    const parentListings = listings.filter((l) => l.parentSku === parentSku)
    const results = parentListings.map((l) => checkReadiness(l, readDraft(l.sku)))
    setExportModal({ parentSku, listings: parentListings, results })
  }

  const confirmExport = () => {
    if (!exportModal) return
    const csv = generateBatchCsv(exportModal.parentSku, exportModal.listings, (sku) => readDraft(sku))
    downloadCsv(csv, `${exportModal.parentSku}-amazon-upload.csv`)
    setExportModal(null)
  }

  return (
    <>
      {exportModal && (
        <ExportReadinessModal modal={exportModal} onConfirm={confirmExport} onClose={() => setExportModal(null)} />
      )}

      {/* Toolbar */}
      <div className="page-toolbar">
        <span className="page-title">Listings</span>
        <button className={`filter-pill${activeStyle === 'All' ? ' active' : ''}`} onClick={() => setActiveStyle('All')}>
          All ({listings.length})
        </button>
        {styles.map((s) => (
          <span key={s.parentSku} style={{ display:'inline-flex', gap:4 }}>
            <button className={`filter-pill${activeStyle === s.parentSku ? ' active' : ''}`} onClick={() => setActiveStyle(s.parentSku)}>
              {s.parentSku} ({s.variants.length})
            </button>
            <button className="btn-secondary" style={{ padding:'3px 8px', fontSize:11 }} onClick={() => openExportModal(s.parentSku)} title={`导出 ${s.parentSku}`}>
              ⬆
            </button>
          </span>
        ))}
        <div className="toolbar-spacer" />
        <input className="search-box" type="text" placeholder="Search SKU, color…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width:160 }} />
        <button className="btn-primary" onClick={() => window.dispatchEvent(new CustomEvent('toolbar-export-all'))}>⬆ Export All</button>
      </div>

      {/* Content */}
      <div className="content-area">

        {/* Table card */}
        <div className="card" style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ flex:1, overflowY:'auto' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>SKU</th><th>款式</th><th>颜色</th><th>度数</th>
                  <th>价格</th><th>库存</th><th>图片</th><th>状态</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((listing) => {
                  const readiness = checkReadiness(listing, readDraft(listing.sku))
                  return (
                    <tr key={listing.sku} className={selected?.sku === listing.sku ? 'row-selected' : ''} onClick={() => setSelected(listing)}>
                      <td className="sku-mono">{listing.sku}</td>
                      <td>{listing.parentSku}</td>
                      <td>{listing.color || '—'}</td>
                      <td className="sku-mono">{listing.strength || '—'}</td>
                      <td>{listing.price ? `£${listing.price}` : '—'}</td>
                      <td>{listing.quantity || '—'}</td>
                      <td style={{ color: listing.mainImage ? '#22c55e' : '#d1d5db' }}>
                        {listing.mainImage ? '●' : '○'}
                      </td>
                      <td><ReadinessBadge result={readiness} /></td>
                      <td>
                        <a href={`/editor?sku=${listing.sku}`} onClick={(e) => e.stopPropagation()} style={{ fontSize:11, color:'#1a6bb5' }}>
                          编辑
                        </a>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ padding:20, textAlign:'center', color:'#aaa' }}>No listings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="status-bar">共 {styles.length} 款式 / {listings.length} 条变体{activeStyle !== 'All' && ` / 当前筛选：${filtered.length} 条`}</div>
        </div>

        {/* Detail panel */}
        <div className="side-panel" style={{ width:210 }}>
          {selected ? (
            <>
              <div className="panel-image-box">
                {selected.mainImage ? (
                  <img src={selected.mainImage} alt={selected.sku} style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <span>No image</span>
                )}
              </div>

              {[
                ['SKU',  selected.sku],
                ['款式', selected.parentSku],
                ['颜色', selected.color    || '—'],
                ['度数', selected.strength || '—'],
                ['价格', selected.price    ? `£${selected.price}` : '—'],
                ['库存', selected.quantity || '—'],
              ].map(([label, value]) => (
                <div key={label} className="panel-field">
                  <div className="panel-field-label">{label}</div>
                  <div className="panel-field-val" style={label === 'SKU' ? { fontFamily:'Courier New,monospace', fontSize:10 } : undefined}>{value}</div>
                </div>
              ))}

              {selectedDraft && (selectedDraft.bullet1 || selectedDraft.bullet2) && (
                <div style={{ fontSize:11, color:'#555', borderTop:'1px solid #f0f2f5', paddingTop:8 }}>
                  {[selectedDraft.bullet1, selectedDraft.bullet2].filter(Boolean).map((b, i) => (
                    <div key={i} style={{ marginBottom:2 }}>• {b}</div>
                  ))}
                </div>
              )}

              <div className="panel-divider" />

              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <a href={`/editor?sku=${selected.sku}`}>
                  <button className="btn-primary" style={{ width:'100%' }}>✎ 前往编辑</button>
                </a>
                <button className="btn-secondary" style={{ width:'100%' }} onClick={() => openExportModal(selected.parentSku)}>⬆ 导出本款</button>
                <a href="/images">
                  <button className="btn-secondary" style={{ width:'100%' }}>🖼 查看图片</button>
                </a>
                <button className="btn-secondary" style={{ width:'100%' }} onClick={() => setSelected(null)}>✕ 关闭</button>
              </div>
            </>
          ) : (
            <div style={{ padding:20, textAlign:'center', color:'#aaa', fontSize:12 }}>请从左侧选择一条记录</div>
          )}
        </div>

      </div>
    </>
  )
}
