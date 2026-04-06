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
    <html lang="en">
      <body>
        <div className="window app-window">
          {/* Title bar */}
          <div className="title-bar">
            <div className="title-bar-text">📦 Amazon Listing Creator</div>
            <div className="title-bar-controls">
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
