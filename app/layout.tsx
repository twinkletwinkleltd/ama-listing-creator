import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amazon Listing Creator",
  description: "Manage and edit Amazon product listings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", background: '#f0f2f5', color: '#1a2332' }}>
        <nav style={{ background: '#1e2a3a', borderBottom: '1px solid #0d1a28' }} className="px-4 py-2 flex items-center gap-0">
          {/* Back button */}
          <button
            onClick={undefined}
            id="nav-back-btn"
            style={{ color: '#6b8099', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '3px' }}
            title="返回上一层"
          >
            ↑
          </button>
          <script dangerouslySetInnerHTML={{ __html: `
            document.getElementById('nav-back-btn').addEventListener('click', function() {
              if (window.history.length > 1) { window.history.back(); }
              else { window.location.href = 'https://ordercleaner.twinkletwinkle.uk'; }
            });
          `}} />

          <div style={{ width: '1px', height: '16px', background: '#2d3f52', margin: '0 8px' }} />

          {/* Title - non-clickable */}
          <span style={{ color: '#c8d4e0', fontSize: '13px', fontWeight: 600, marginRight: '16px' }}>
            Amazon Listing Creator
          </span>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <Link href="/" style={{ color: '#8fa8c0', fontSize: '13px', padding: '4px 12px', borderRadius: '3px', textDecoration: 'none' }}
              className="nav-link">Listings</Link>
            <Link href="/editor" style={{ color: '#8fa8c0', fontSize: '13px', padding: '4px 12px', borderRadius: '3px', textDecoration: 'none' }}
              className="nav-link">Editor</Link>
            <Link href="/images" style={{ color: '#8fa8c0', fontSize: '13px', padding: '4px 12px', borderRadius: '3px', textDecoration: 'none' }}
              className="nav-link">Images</Link>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Version */}
          <span style={{ color: '#4a6278', fontSize: '11px' }}>v0.1-beta</span>
        </nav>
        {children}
      </body>
    </html>
  );
}
