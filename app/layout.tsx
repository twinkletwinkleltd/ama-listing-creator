import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
          <a
            href="https://ordercleaner.twinkletwinkle.uk"
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            &larr; Portal
          </a>
          <span className="text-gray-200">|</span>
          <span className="text-sm font-semibold text-gray-800">Amazon Listing Creator</span>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            Listings
          </Link>
          <Link href="/editor" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            Editor
          </Link>
          <Link href="/image-guide" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            📷 图片指南
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
