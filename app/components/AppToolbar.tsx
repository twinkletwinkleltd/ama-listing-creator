'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AppToolbar() {
  const pathname = usePathname()

  const isListings = pathname === '/' || pathname === ''
  const isEditor = pathname.startsWith('/editor')
  const isImages = pathname.startsWith('/images')

  return (
    <div className="win98-toolbar">
      {/* Navigation buttons */}
      <Link href="/">
        <button className={isListings ? 'active' : ''} style={{ fontWeight: isListings ? 'bold' : 'normal' }}>
          📋 Listings
        </button>
      </Link>
      <Link href="/editor">
        <button className={isEditor ? 'active' : ''} style={{ fontWeight: isEditor ? 'bold' : 'normal' }}>
          ✎ Editor
        </button>
      </Link>
      <Link href="/images">
        <button className={isImages ? 'active' : ''} style={{ fontWeight: isImages ? 'bold' : 'normal' }}>
          🖼 Images
        </button>
      </Link>

      <div className="sep" />

      {/* Quick actions */}
      <Link href="/editor">
        <button>＋ 新建</button>
      </Link>
      <button onClick={() => window.dispatchEvent(new CustomEvent('toolbar-export-all'))}>
        ⬆ 导出 CSV
      </button>

      <div className="sep" />

      {/* Version badge */}
      <span style={{ marginLeft: 'auto', color: '#808080', fontSize: '10px', fontFamily: "'Pixelated MS Sans Serif', 'MS Sans Serif', Tahoma, sans-serif" }}>
        v1.0.0
      </span>
    </div>
  )
}
