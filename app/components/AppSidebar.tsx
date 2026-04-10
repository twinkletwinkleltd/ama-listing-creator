'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AppSidebar() {
  const pathname = usePathname()

  const isListings = pathname === '/' || pathname === ''
  const isEditor   = pathname.startsWith('/editor')
  const isImages   = pathname.startsWith('/images')

  return (
    <nav className="app-sidebar">
      <Link href="/" className={`sidebar-nav-item${isListings ? ' active' : ''}`}>
        <span>📋</span> Listings
      </Link>
      <Link href="/editor" className={`sidebar-nav-item${isEditor ? ' active' : ''}`}>
        <span>✎</span> Editor
      </Link>
      <Link href="/images" className={`sidebar-nav-item${isImages ? ' active' : ''}`}>
        <span>🖼</span> Images
      </Link>
      <div className="sidebar-spacer" />
      <a href="https://ordercleaner.twinkletwinkle.uk/apps" className="sidebar-back">← Back to APPs</a>
    </nav>
  )
}
