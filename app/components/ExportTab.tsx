'use client'

import { generateSingleCsv, generateBatchCsv, downloadCsv } from '../../lib/exportCsv'

interface ExportTabProps {
  listing: any | null
  form: Record<string, string>
  listings: any[]
}

// Fields to check for readiness
const REQUIRED_FIELDS: { field: string; label: string }[] = [
  { field: 'itemName',   label: 'Item Name 商品名称' },
  { field: 'price',      label: 'Price 价格' },
  { field: 'quantity',   label: 'Quantity 数量' },
  { field: 'mainImage',  label: 'Main Image 主图' },
]

const SUGGESTED_FIELDS: { field: string; label: string }[] = [
  { field: 'bullet1',     label: 'Bullet Point 1' },
  { field: 'bullet2',     label: 'Bullet Point 2' },
  { field: 'bullet3',     label: 'Bullet Point 3' },
  { field: 'bullet4',     label: 'Bullet Point 4' },
  { field: 'bullet5',     label: 'Bullet Point 5' },
  { field: 'description', label: 'Description 描述' },
  { field: 'keywords',    label: 'Keywords 关键词' },
  { field: 'color',       label: 'Color 颜色' },
  { field: 'strength',    label: 'Strength 度数' },
]

function StatusIcon({ ok }: { ok: boolean }) {
  return (
    <span style={{ fontWeight: 700, fontSize: 14, color: ok ? '#5cb85c' : '#e85050' }}>
      {ok ? '✓' : '✗'}
    </span>
  )
}

export default function ExportTab({ listing, form, listings }: ExportTabProps) {
  if (!listing) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 32 }}>📋</div>
        <div>No listing selected<br /><span style={{ fontSize: 13 }}>请先从左侧选择一个 SKU</span></div>
      </div>
    )
  }

  const handleSingleExport = () => {
    const csv = generateSingleCsv(form as any, listing.sku)
    downloadCsv(csv, `${listing.sku}-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const handleBatchExport = () => {
    const parentSku = listing.parentSku || listing.sku
    const siblings = listings.filter((l: any) => l.parentSku === parentSku)

    const getDraft = (sku: string) => {
      try {
        const raw = localStorage.getItem(`draft:${sku}`)
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    }

    const csv = generateBatchCsv(parentSku, siblings as any, getDraft)
    downloadCsv(csv, `${parentSku}-batch-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const requiredReady  = REQUIRED_FIELDS.every(f  => Boolean(form[f.field]))
  const suggestedCount = SUGGESTED_FIELDS.filter(f => Boolean(form[f.field])).length

  return (
    <div>
      {/* Header */}
      <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0', marginBottom: 16 }}>
        Export <span style={{ fontSize: 12, fontWeight: 400, color: '#666' }}>导出</span>
      </div>

      {/* Readiness Check */}
      <div className="field-group" style={{ marginBottom: 16 }}>
        <div className="group-toggle" style={{ cursor: 'default' }}>
          <span className="title">
            Readiness Check <span className="zh">就绪检查</span>
          </span>
          <span
            className={`group-toggle progress ${requiredReady ? 'pg-done' : 'pg-partial'}`}
          >
            {requiredReady ? 'Ready' : 'Not Ready'}
          </span>
        </div>
        <div className="group-body">
          <table className="readiness-table">
            <thead>
              <tr>
                <th>Field 字段</th>
                <th style={{ width: 60, textAlign: 'center' }}>Status 状态</th>
                <th style={{ width: 80 }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {REQUIRED_FIELDS.map(f => (
                <tr key={f.field}>
                  <td>{f.label}</td>
                  <td style={{ textAlign: 'center' }}>
                    <StatusIcon ok={Boolean(form[f.field])} />
                  </td>
                  <td style={{ fontSize: 11, color: '#e85050', fontWeight: 600 }}>Required</td>
                </tr>
              ))}
              {SUGGESTED_FIELDS.map(f => (
                <tr key={f.field}>
                  <td>{f.label}</td>
                  <td style={{ textAlign: 'center' }}>
                    <StatusIcon ok={Boolean(form[f.field])} />
                  </td>
                  <td style={{ fontSize: 11, color: '#888' }}>Suggested</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
            {REQUIRED_FIELDS.filter(f => Boolean(form[f.field])).length}/{REQUIRED_FIELDS.length} required &nbsp;·&nbsp;
            {suggestedCount}/{SUGGESTED_FIELDS.length} suggested
          </div>
        </div>
      </div>

      {/* Single SKU Export */}
      <div className="field-group" style={{ marginBottom: 12 }}>
        <div className="group-toggle" style={{ cursor: 'default' }}>
          <span className="title">
            Single SKU Export <span className="zh">单品导出</span>
          </span>
        </div>
        <div className="group-body">
          <p style={{ fontSize: 13, color: '#888', marginTop: 0, marginBottom: 12 }}>
            Export this SKU (<span style={{ fontFamily: 'monospace', color: '#e8e8e8' }}>{listing.sku}</span>) as a standalone Amazon flat file CSV.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleSingleExport}
            disabled={!requiredReady}
            title={!requiredReady ? 'Fill in all required fields first' : undefined}
          >
            ↓ Single SKU Export 单品导出
          </button>
          {!requiredReady && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#e85050' }}>
              Fill in required fields first / 请先填写必填字段
            </div>
          )}
        </div>
      </div>

      {/* Batch Export */}
      <div className="field-group" style={{ marginBottom: 12 }}>
        <div className="group-toggle" style={{ cursor: 'default' }}>
          <span className="title">
            Batch Export <span className="zh">批量导出</span>
          </span>
        </div>
        <div className="group-body">
          {(() => {
            const parentSku = listing.parentSku || listing.sku
            const siblings  = listings.filter((l: any) => l.parentSku === parentSku)
            return (
              <>
                <p style={{ fontSize: 13, color: '#888', marginTop: 0, marginBottom: 12 }}>
                  Export all {siblings.length} variant{siblings.length !== 1 ? 's' : ''} under{' '}
                  <span style={{ fontFamily: 'monospace', color: '#e8e8e8' }}>{parentSku}</span>{' '}
                  with a parent row.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleBatchExport}
                  disabled={!requiredReady}
                  title={!requiredReady ? 'Fill in all required fields first' : undefined}
                >
                  ↓ Batch Export 批量导出 ({siblings.length} SKUs)
                </button>
                {!requiredReady && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#e85050' }}>
                    Fill in required fields first / 请先填写必填字段
                  </div>
                )}
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
