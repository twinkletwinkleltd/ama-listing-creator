'use client'

import { useState } from 'react'

interface ImagesTabProps {
  form: Record<string, string>
  onChange: (field: string, value: string) => void
}

const SLOT_LABELS = ['Main 主图', 'Side 侧面', '3/4', 'Detail 细节', 'On-model 模特', 'Infographic 信息图', 'Lifestyle 场景']

const FIELD_NAMES = ['mainImage', 'image2', 'image3', 'image4', 'image5', 'image6', 'image7']

const SLOT_REQUIREMENTS: Record<number, string> = {
  0: '1600×1600 px, white background / 白色背景',
}
const DEFAULT_REQUIREMENT = '1600×1600 px recommended / 建议'

export default function ImagesTab({ form, onChange }: ImagesTabProps) {
  const [selectedSlot, setSelectedSlot] = useState<number>(0)

  const selected = selectedSlot
  const fieldName = FIELD_NAMES[selected]
  const currentUrl = form[fieldName] || ''

  return (
    <div>
      {/* Slot grid */}
      <div className="slot-grid" style={{ marginBottom: 20 }}>
        {SLOT_LABELS.map((label, idx) => {
          const field = FIELD_NAMES[idx]
          const url = form[field] || ''
          const isFilled = Boolean(url)
          const isSelected = selected === idx

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                className={`slot-box${isFilled ? ' filled' : ''}${isSelected ? ' selected' : ''}`}
                onClick={() => setSelectedSlot(idx)}
              >
                {isFilled ? (
                  <img
                    src={url}
                    alt={label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 5 }}
                  />
                ) : (
                  <span style={{ fontSize: 13, color: '#555' }}>{idx + 1}</span>
                )}
              </div>
              <div className="slot-label">{label}</div>
            </div>
          )
        })}
      </div>

      {/* Selected slot editor */}
      <div style={{ background: '#2e2e2e', border: '1px solid #3c3c3c', borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 12 }}>
          Slot {selected + 1} — {SLOT_LABELS[selected]}
        </div>

        {/* Preview */}
        {currentUrl && (
          <div style={{
            width: 120, height: 120, background: '#353535', border: '1px solid #3c3c3c',
            borderRadius: 6, overflow: 'hidden', marginBottom: 12, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <img src={currentUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        )}

        {/* URL input */}
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Image URL <span className="zh">图片链接</span></label>
          <input
            type="text"
            value={currentUrl}
            placeholder="https://…"
            onChange={e => onChange(fieldName, e.target.value)}
          />
        </div>

        {/* Requirements */}
        <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
          {SLOT_REQUIREMENTS[selected] ?? DEFAULT_REQUIREMENT}
        </div>

        {/* Remove button */}
        {currentUrl && (
          <button
            className="btn btn-danger"
            onClick={() => onChange(fieldName, '')}
          >
            ✕ Remove Image 移除图片
          </button>
        )}
      </div>
    </div>
  )
}
