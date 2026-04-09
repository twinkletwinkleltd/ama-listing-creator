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

// ─── Helpers ───────────────────────────────────────────────────────────────

function readDraft(sku: string): DraftData | null {
  try {
    const s = localStorage.getItem(`draft:${sku}`)
    return s ? JSON.parse(s) : null
  } catch { return null }
}

function ReadinessBadge({ result }: { result: ReadinessResult }) {
  if (result.missingRequired.length > 0) {
    return (
      <span title={`缺少必填：${result.missingRequired.join(', ')}`}
        style={{ color: '#cc0000', fontSize: '10px', cursor: 'help' }}>
        ⚠ 缺{result.missingRequired.length}项
      </span>
    )
  }
  if (result.missingSuggested.length > 0) {
    return (
      <span title={`建议填写：${result.missingSuggested.join(', ')}`}
        style={{ color: '#b37a00', fontSize: '10px', cursor: 'help' }}>
        ○ {result.missingSuggested.length}项建议
      </span>
    )
  }
  return <span style={{ color: '#008000', fontSize: '10px' }}>✓ 就绪</span>
}

// ─── Export modal ──────────────────────────────────────────────────────────

function ExportReadinessModal({
  modal,
  onConfirm,
  onClose,
}: {
  modal: ExportModal
  onConfirm: () => void
  onClose: () => void
}) {
  const readyCount    = modal.results.filter((r) => r.ready).length
  const missingCount  = modal.results.filter((r) => r.missingRequired.length > 0).length
  const partialCount  = modal.results.filter((r) => r.ready && r.missingSuggested.length > 0).length

  return (
    /* Overlay */
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Window */}
      <div style={{
        background: '#d4d0c8',
        borderTop: '2px solid #ffffff',
        borderLeft: '2px solid #ffffff',
        borderRight: '2px solid #404040',
        borderBottom: '2px solid #404040',
        width: '520px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 4px 8px rgba(0,0,0,0.4)',
      }}>

        {/* Title bar */}
        <div style={{
          background: 'linear-gradient(to right, #000080, #1084d0)',
          color: '#ffffff',
          padding: '3px 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontWeight: 'bold',
        }}>
          <span>📦 导出前检查 — {modal.parentSku} ({modal.listings.length} 个变体)</span>
          <button
            onClick={onClose}
            style={{
              background: '#d4d0c8',
              border: '1px solid #808080',
              cursor: 'pointer',
              fontSize: '10px',
              lineHeight: 1,
              padding: '1px 4px',
              fontWeight: 'bold',
            }}
          >✕</button>
        </div>

        {/* Summary bar */}
        <div style={{
          padding: '6px 8px',
          borderBottom: '1px solid #808080',
          display: 'flex',
          gap: '16px',
          fontSize: '11px',
        }}>
          <span style={{ color: '#008000' }}>✓ 完整就绪: {readyCount - partialCount}</span>
          <span style={{ color: '#b37a00' }}>○ 内容缺失: {partialCount}</span>
          <span style={{ color: '#cc0000' }}>⚠ 缺必填: {missingCount}</span>
        </div>

        {/* Variant list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#808080', color: '#fff' }}>
                <th style={{ padding: '3px 6px', textAlign: 'left', fontWeight: 'normal' }}>SKU</th>
                <th style={{ padding: '3px 6px', textAlign: 'left', fontWeight: 'normal' }}>颜色</th>
                <th style={{ padding: '3px 6px', textAlign: 'left', fontWeight: 'normal' }}>度数</th>
                <th style={{ padding: '3px 6px', textAlign: 'left', fontWeight: 'normal' }}>必填</th>
                <th style={{ padding: '3px 6px', textAlign: 'left', fontWeight: 'normal' }}>内容</th>
              </tr>
            </thead>
            <tbody>
              {modal.results.map((r, i) => {
                const listing = modal.listings.find((l) => l.sku === r.sku)
                const rowBg = r.missingRequired.length > 0
                  ? '#fff0f0'
                  : r.missingSuggested.length > 0
                  ? '#fffbe0'
                  : '#f0fff0'
                return (
                  <tr key={r.sku} style={{ background: i % 2 === 0 ? rowBg : `${rowBg}cc` }}>
                    <td style={{ padding: '2px 6px', fontFamily: 'Courier New,monospace', fontSize: '10px' }}>
                      {r.sku}
                    </td>
                    <td style={{ padding: '2px 6px' }}>{listing?.color || '—'}</td>
                    <td style={{ padding: '2px 6px' }}>{listing?.strength || '—'}</td>
                    <td style={{ padding: '2px 6px' }}>
                      {r.missingRequired.length > 0
                        ? <span style={{ color: '#cc0000' }}>⚠ {r.missingRequired.join(', ')}</span>
                        : <span style={{ color: '#008000' }}>✓</span>
                      }
                    </td>
                    <td style={{ padding: '2px 6px' }}>
                      {r.missingSuggested.length > 0
                        ? <span style={{ color: '#b37a00' }}>○ {r.missingSuggested.join(', ')}</span>
                        : <span style={{ color: '#008000' }}>✓</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px',
          borderTop: '1px solid #808080',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
        }}>
          <span style={{ color: '#444', fontSize: '10px' }}>
            CSV 将包含全部 {modal.listings.length} 个变体（就绪或未就绪）
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={onConfirm} style={{ fontSize: '11px', minWidth: '120px' }}>
              ⬆ 下载 CSV
            </button>
            <button onClick={onClose} style={{ fontSize: '11px' }}>
              取消
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export default function ListingsClient({ listings, styles }: Props) {
  const [selected, setSelected]           = useState<Listing | null>(null)
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)
  const [search, setSearch]               = useState('')
  const [activeStyle, setActiveStyle]     = useState('All')
  const [exportModal, setExportModal]     = useState<ExportModal | null>(null)

  // Load draft preview when a row is selected
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

  // Toolbar "export all" handler
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

  // Open export modal for a parent SKU
  const openExportModal = (parentSku: string) => {
    const parentListings = listings.filter((l) => l.parentSku === parentSku)
    const results = parentListings.map((l) => checkReadiness(l, readDraft(l.sku)))
    setExportModal({ parentSku, listings: parentListings, results })
  }

  // Confirm export: generate + download batch CSV
  const confirmExport = () => {
    if (!exportModal) return
    const csv = generateBatchCsv(
      exportModal.parentSku,
      exportModal.listings,
      (sku) => readDraft(sku),
    )
    downloadCsv(csv, `${exportModal.parentSku}-amazon-upload.csv`)
    setExportModal(null)
  }

  return (
    <>
      {/* Export modal */}
      {exportModal && (
        <ExportReadinessModal
          modal={exportModal}
          onConfirm={confirmExport}
          onClose={() => setExportModal(null)}
        />
      )}

      <div style={{ display: 'flex', flex: 1, gap: '6px', minWidth: 0, overflow: 'hidden' }}>

        {/* ─── Left: listview ─── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>

          {/* Style filter buttons + per-style export */}
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setActiveStyle('All')}
              className={activeStyle === 'All' ? 'active' : ''}
            >
              All ({listings.length})
            </button>
            {styles.map((s) => (
              <span key={s.parentSku} style={{ display: 'inline-flex', gap: '1px' }}>
                <button
                  onClick={() => setActiveStyle(s.parentSku)}
                  className={activeStyle === s.parentSku ? 'active' : ''}
                >
                  {s.parentSku} ({s.variants.length})
                </button>
                <button
                  onClick={() => openExportModal(s.parentSku)}
                  title={`导出 ${s.parentSku} 全部变体为 Amazon CSV`}
                  style={{ fontSize: '10px', padding: '0 4px' }}
                >
                  ⬆
                </button>
              </span>
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
                  <th>状态</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((listing) => {
                  const readiness = checkReadiness(listing, readDraft(listing.sku))
                  return (
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
                        <ReadinessBadge result={readiness} />
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
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: '12px', textAlign: 'center', color: '#808080' }}>
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
                ['SKU',  selected.sku],
                ['款式', selected.parentSku],
                ['颜色', selected.color    || '—'],
                ['度数', selected.strength || '—'],
                ['价格', selected.price    ? `£${selected.price}` : '—'],
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
                <button
                  onClick={() => openExportModal(selected.parentSku)}
                  style={{ width: '100%', fontSize: '11px' }}
                  title={`导出 ${selected.parentSku} 全部变体`}
                >
                  ⬆ 导出本款
                </button>
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
    </>
  )
}
