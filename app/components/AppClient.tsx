'use client'

import { useState, useEffect } from 'react'
import ProductList from './ProductList'
import InfoTab from './InfoTab'
import ImagesTab from './ImagesTab'
import SpecsTab from './SpecsTab'
import ExportTab from './ExportTab'

interface AppClientProps {
  listings: any[]
  styles: any[]
}

// Fields extracted from a listing object into the form
const LISTING_FIELDS = [
  'sku', 'itemName', 'brand', 'price', 'quantity',
  'color', 'colorMap', 'strength',
  'parentage', 'parentSku', 'variationTheme',
  'mainImage', 'image2', 'image3', 'image4',
  'image5', 'image6', 'image7', 'image8',
]

function getReadinessBadge(form: Record<string, string>): 'green' | 'amber' | 'red' {
  const hasName = !!(form.itemName && form.itemName.trim())
  if (!hasName) return 'red'
  const hasAll =
    !!(form.price && String(form.price).trim()) &&
    !!(form.quantity !== undefined && String(form.quantity).trim()) &&
    !!(form.mainImage && form.mainImage.trim())
  return hasAll ? 'green' : 'amber'
}

function hasImagesGap(form: Record<string, string>): boolean {
  // Amber badge on Images tab if any of image2–image7 is empty
  return ['image2', 'image3', 'image4', 'image5', 'image6', 'image7'].some(
    f => !(form[f] && form[f].trim())
  )
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function AppClient({ listings, styles }: AppClientProps) {
  const [selectedSku, setSelectedSku] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'images' | 'specs' | 'export'>('info')
  const [form, setForm] = useState<Record<string, string>>({})
  const [lastSaved, setLastSaved] = useState<string>('')

  // When selectedSku changes, load listing defaults then overlay localStorage draft
  useEffect(() => {
    if (!selectedSku) {
      setForm({})
      setLastSaved('')
      return
    }

    const listing = listings.find((l: any) => l.sku === selectedSku)
    if (!listing) return

    // Build base from listing fields
    const base: Record<string, string> = {}
    for (const field of LISTING_FIELDS) {
      base[field] = listing[field] !== undefined && listing[field] !== null
        ? String(listing[field])
        : ''
    }

    // Overlay draft from localStorage (draft takes priority)
    try {
      const raw = localStorage.getItem('draft:' + selectedSku)
      if (raw) {
        const draft = JSON.parse(raw)
        Object.assign(base, draft)
      }
    } catch {
      // ignore parse errors
    }

    setForm(base)
    setLastSaved('')
  }, [selectedSku, listings])

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (!selectedSku) return
    localStorage.setItem('draft:' + selectedSku, JSON.stringify(form))
    setLastSaved(formatTime(new Date()))
  }

  const handleReset = () => {
    if (!selectedSku) return
    localStorage.removeItem('draft:' + selectedSku)
    // Reload from listing defaults only
    const listing = listings.find((l: any) => l.sku === selectedSku)
    if (!listing) return
    const base: Record<string, string> = {}
    for (const field of LISTING_FIELDS) {
      base[field] = listing[field] !== undefined && listing[field] !== null
        ? String(listing[field])
        : ''
    }
    setForm(base)
    setLastSaved('')
  }

  const listing = selectedSku ? listings.find((l: any) => l.sku === selectedSku) ?? null : null
  const badge = getReadinessBadge(form)
  const imagesGap = hasImagesGap(form)

  return (
    <div className="app">
      <ProductList
        listings={listings}
        styles={styles}
        selectedSku={selectedSku}
        onSelect={setSelectedSku}
      />

      <div className="right-panel">
        {/* Tab bar */}
        <div className="tab-bar">
          <button
            className={`tab${activeTab === 'info' ? ' active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Info <span className="zh">基本信息</span>
          </button>
          <button
            className={`tab${activeTab === 'images' ? ' active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            Images <span className="zh">图片</span>
            {selectedSku && imagesGap && (
              <span className="badge-amber" style={{ marginLeft: 6 }}>!</span>
            )}
          </button>
          <button
            className={`tab${activeTab === 'specs' ? ' active' : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            Specs <span className="zh">尺寸规格</span>
          </button>
          <button
            className={`tab${activeTab === 'export' ? ' active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export <span className="zh">导出</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="tab-content">
          {selectedSku && listing ? (
            <>
              {/* Product header */}
              <div className="prod-header">
                {form.mainImage && (
                  <img
                    className="prod-thumb"
                    src={form.mainImage}
                    alt={form.itemName || listing.sku}
                  />
                )}
                <div className="prod-meta">
                  <div className="prod-title">
                    {listing.parentSku ?? listing.sku}
                    {listing.color ? ` — ${listing.color}` : ''}
                  </div>
                  <div className="prod-detail">
                    <span>SKU: <code>{listing.sku}</code></span>
                    {form.price && <span> · £{form.price}</span>}
                    {listing.parentSku && listing.parentSku !== listing.sku && (
                      <span> · Parent: <code>{listing.parentSku}</code></span>
                    )}
                  </div>
                </div>
                <span className={`readiness-badge rb-${badge}`}>
                  {badge === 'green' ? 'Ready' : badge === 'amber' ? 'Partial' : 'Incomplete'}
                </span>
              </div>

              {/* Active tab */}
              {activeTab === 'info' && (
                <InfoTab form={form} onChange={handleChange} />
              )}
              {activeTab === 'images' && (
                <ImagesTab form={form} onChange={handleChange} />
              )}
              {activeTab === 'specs' && (
                <SpecsTab listing={listing} />
              )}
              {activeTab === 'export' && (
                <ExportTab listing={listing} form={form} listings={listings} />
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="icon">📦</div>
              <p>
                Select a product from the left panel
                <br />
                <span style={{ color: '#666' }}>从左侧面板选择一个产品</span>
              </p>
            </div>
          )}
        </div>

        {/* Action bar */}
        {selectedSku && (
          <div className="action-bar">
            <span className="save-hint">
              {lastSaved ? `Auto-saved / 已自动保存 · ${lastSaved}` : ''}
            </span>
            <div className="action-spacer" />
            <button className="btn btn-outline" onClick={handleReset}>
              Reset 重置
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save 保存
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
