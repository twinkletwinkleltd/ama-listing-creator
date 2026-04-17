import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM equivalent of __dirname so we can pin the standalone output tracing
// root to this project. Without this, Next.js walks upward looking for a
// workspace lockfile; if it finds one (e.g. in a dev monorepo layout), the
// standalone bundle ends up nested under `.next/standalone/<long/path>/` and
// `server.js` is not at `.next/standalone/server.js` where the deploy script
// expects it.
const __dirname_esm = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/apps/listing',
  assetPrefix: '/apps/listing',
  outputFileTracingRoot: __dirname_esm,
}

export default nextConfig
