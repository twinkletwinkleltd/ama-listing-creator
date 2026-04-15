import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Listing Creator 商品上架工具',
  description: 'Manage and edit Amazon product listings',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="header">
          <div className="logo">
            Listing Creator
            <span className="zh">商品上架工具</span>
          </div>
          <div className="spacer" />
          <a
            href="https://ordercleaner.twinkletwinkle.uk/apps"
            className="back-link"
          >
            ← Back to Apps 返回
          </a>
        </div>
        {children}
      </body>
    </html>
  )
}
