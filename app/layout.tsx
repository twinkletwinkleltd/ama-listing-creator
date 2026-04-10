import type { Metadata } from 'next'
import './globals.css'
import AppSidebar from './components/AppSidebar'

export const metadata: Metadata = {
  title: 'Amazon Listing Creator',
  description: 'Manage and edit Amazon product listings',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <div className="app-header">
            <span>📦</span>
            Amazon Listing Creator
            <span className="app-header-badge">v1.0.0</span>
          </div>
          <div className="app-body">
            <AppSidebar />
            <div className="app-main">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
