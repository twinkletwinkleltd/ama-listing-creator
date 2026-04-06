'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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

  return (
    <div className="flex flex-1 bg-gray-50 min-h-screen">
      {/* ─── Left: table ─── */}
      <div className="flex-1 p-6 flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">Product Listings</h1>
          <Link
            href="/editor"
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Listing
          </Link>
        </div>

        {/* Style filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveStyle('All')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeStyle === 'All'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            All ({listings.length})
          </button>
          {styles.map((s) => (
            <button
              key={s.parentSku}
              onClick={() => setActiveStyle(s.parentSku)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeStyle === s.parentSku
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s.parentSku} ({s.variants.length})
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search SKU, product or color..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full max-w-sm"
        />

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-3 py-3 w-10"></th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">款式</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">颜色</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">度数</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">价格</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">库存</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">图片</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((listing) => (
                <tr
                  key={listing.sku}
                  className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selected?.sku === listing.sku ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelected(listing)}
                >
                  {/* 缩略图 */}
                  <td className="px-3 py-2">
                    {listing.mainImage ? (
                      <img
                        src={listing.mainImage}
                        alt=""
                        className="w-8 h-8 rounded object-cover bg-gray-100"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement
                          el.style.display = 'none'
                          el.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 rounded bg-gray-100 ${listing.mainImage ? 'hidden' : ''}`} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{listing.sku}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{listing.parentSku}</td>
                  <td className="px-4 py-3 text-gray-800">{listing.color || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{listing.strength || '—'}</td>
                  <td className="px-4 py-3 text-gray-800">{listing.price ? `£${listing.price}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{listing.quantity || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span title={listing.mainImage ? listing.mainImage : '无主图'}>
                      {listing.mainImage ? '🟢' : '🔴'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/editor?sku=${listing.sku}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No listings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 底部状态栏 */}
        <div className="text-xs text-gray-400 flex items-center gap-3">
          <span>共 {styles.length} 款式</span>
          <span>/</span>
          <span>{listings.length} 条变体</span>
          {activeStyle !== 'All' && (
            <>
              <span>/</span>
              <span>当前筛选：{filtered.length} 条</span>
            </>
          )}
        </div>
      </div>

      {/* ─── Right: detail panel ─── */}
      <div className="w-80 border-l border-gray-200 bg-white p-6 flex flex-col gap-4 flex-shrink-0">
        {selected ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Listing Detail</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xs transition-colors"
              >
                &times;
              </button>
            </div>

            {/* 主图 */}
            {selected.mainImage ? (
              <img
                src={selected.mainImage}
                alt={selected.sku}
                className="w-full rounded-lg object-contain bg-gray-50 h-40"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <div className="w-full rounded-lg bg-gray-100 h-40 flex items-center justify-center">
                <span className="text-xs text-gray-400">No image</span>
              </div>
            )}

            {/* 图片链接 */}
            {selected.mainImage && (
              <a
                href={selected.mainImage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-700 truncate block"
              >
                {selected.mainImage}
              </a>
            )}

            <div className="flex flex-col gap-3">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">SKU</span>
                <p className="text-sm font-mono text-gray-800 mt-0.5">{selected.sku}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">款式</span>
                <p className="text-sm text-gray-800 mt-0.5">{selected.parentSku}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">颜色</span>
                  <p className="text-sm text-gray-800 mt-0.5">{selected.color || '—'}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">度数</span>
                  <p className="text-sm font-mono text-gray-800 mt-0.5">{selected.strength || '—'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">价格</span>
                  <p className="text-sm text-gray-800 mt-0.5">
                    {selected.price ? `£${selected.price}` : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">库存</span>
                  <p className="text-sm text-gray-800 mt-0.5">{selected.quantity || '—'}</p>
                </div>
              </div>

              {/* Bullet 预览（来自 localStorage 草稿） */}
              {selectedDraft && (selectedDraft.bullet1 || selectedDraft.bullet2) && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bullet Points</span>
                  <div className="mt-1 flex flex-col gap-1">
                    {[selectedDraft.bullet1, selectedDraft.bullet2]
                      .filter(Boolean)
                      .map((b, i) => (
                        <p key={i} className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                          • {b}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <hr className="border-gray-100" />

            <div className="flex flex-col gap-2">
              <Link
                href={`/editor?sku=${selected.sku}`}
                className="text-white rounded py-2 text-sm font-medium text-center block transition-colors"
                style={{ backgroundColor: '#0078d4', border: '1px solid #005a9e' }}
              >
                前往编辑
              </Link>
              <Link
                href="/images"
                className="rounded py-2 text-sm font-medium text-center block transition-colors border border-gray-200 hover:bg-gray-50"
                style={{ color: '#1a2332' }}
              >
                查看图片
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center">
            <p className="text-sm text-gray-400">Select a listing to see details</p>
          </div>
        )}
      </div>
    </div>
  )
}
