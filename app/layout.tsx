import type { Metadata } from 'next'
import './globals.css'
import AppToolbar from './components/AppToolbar'

export const metadata: Metadata = {
  title: 'Amazon Listing Creator',
  description: 'Manage and edit Amazon product listings',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" style={{ background: '#008080' }}>
      <body style={{ background: '#008080', margin: 0, padding: '12px', minHeight: '100vh', boxSizing: 'border-box' }}>
        <div className="window app-window" style={{ background: '#d4d0c8' }}>
          {/* Title bar */}
          <div className="title-bar" style={{ background: 'linear-gradient(to right, #000080, #1084d0)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 4px', flexShrink: 0 }}>
            <div className="title-bar-text" style={{ color: '#fff', fontWeight: 'bold', fontSize: '11px' }}>📦 Amazon Listing Creator</div>
            <div className="title-bar-controls" style={{ display: 'flex' }}>
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>

          {/* Toolbar (client component for usePathname) */}
          <AppToolbar />

          {/* Page content */}
          <div className="win98-content">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
