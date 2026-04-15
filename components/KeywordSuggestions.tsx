'use client'

interface Props {
  value: string
  onChange: (v: string) => void
}

const CATEGORIES = [
  {
    emoji: '📦',
    label: '包装数量',
    keywords: ['3 pack', '5 pack', '6 pack', 'multipack', 'multi pack', 'value pack'],
  },
  {
    emoji: '🔩',
    label: '功能特点',
    keywords: ['spring hinge', 'lightweight', 'scratch resistant', 'blue light blocking', 'UV protection', 'anti glare', 'flexible'],
  },
  {
    emoji: '👥',
    label: '目标人群',
    keywords: ['unisex', 'men women', 'readers', 'ladies', 'mens', 'womens'],
  },
  {
    emoji: '🔍',
    label: '长尾搜索',
    keywords: ['reading glasses uk', 'presbyopia', 'magnifying glasses', 'cheaters', 'computer glasses', 'reading spectacles'],
  },
  {
    emoji: '💙',
    label: '蓝光相关',
    keywords: ['blue light blocking readers', 'anti blue light', 'computer reading glasses', 'digital eye strain'],
  },
]

export default function KeywordSuggestions({ value, onChange }: Props) {
  const isAdded = (kw: string) => value.toLowerCase().includes(kw.toLowerCase())

  const toggle = (kw: string) => {
    if (isAdded(kw)) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const removed = value
        .replace(new RegExp(`,?\\s*${escaped}\\s*,?`, 'gi'), ' ')
        .replace(/\s+/g, ' ')
        .trim()
      onChange(removed)
    } else {
      const sep = value.trim() ? ' ' : ''
      onChange(value.trim() + sep + kw)
    }
  }

  const charColor = value.length > 249 ? 'text-red-500 font-medium' : 'text-gray-400'

  return (
    <div className="flex flex-col gap-2 p-3 bg-neutral-800 rounded-lg border border-neutral-700">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-400">关键词建议 — 点击添加</span>
        <span className={`text-xs ${charColor}`}>{value.length}/249</span>
      </div>
      {CATEGORIES.map((cat) => (
        <div key={cat.label} className="flex items-start gap-2">
          <span className="text-xs text-neutral-400 pt-0.5 w-20 flex-shrink-0 leading-5">
            {cat.emoji} {cat.label}
          </span>
          <div className="flex flex-wrap gap-1">
            {cat.keywords.map((kw) => {
              const added = isAdded(kw)
              return (
                <button
                  key={kw}
                  type="button"
                  onClick={() => toggle(kw)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    added
                      ? 'bg-blue-900 border-blue-600 text-blue-300'
                      : 'border-neutral-600 text-neutral-300 hover:border-blue-600 hover:text-blue-300 hover:bg-blue-900'
                  }`}
                >
                  {kw}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
