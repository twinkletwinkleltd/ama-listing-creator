# ADR-007 — Pin `outputFileTracingRoot` to the project directory

## Date

2026-02-08

## Status

Accepted

## Context

When `output: 'standalone'` is set (see ADR-001), Next.js walks upward
from the project root looking for a **workspace root** marker
(`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, or a `workspaces`
field) to decide where the standalone bundle's filesystem-tracing root
should sit.

In our layout, `apps/ama-listing-creator/` is a git submodule inside the
monorepo-ish `portal-system/` checkout. At various times during
development a `package-lock.json` has existed above the submodule (for
example in the parent repo's tooling). When that happens, Next's
autodetect decides the workspace root is several directories up and:

- The standalone bundle ends up nested under
  `.next/standalone/<relative/path/to/project>/server.js` instead of
  `.next/standalone/server.js`.
- The deploy script (and systemd unit) assume `server.js` at the bundle
  root and break.

Symptoms: `node .next/standalone/server.js` fails with "Cannot find
module", or `ama-listing.service` fails at startup because
`WorkingDirectory=.../.next/standalone` has no `server.js`.

## Decision

Explicitly pin the tracing root to the project directory in
`next.config.ts`:

```ts
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname_esm = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/apps/listing',
  assetPrefix: '/apps/listing',
  outputFileTracingRoot: __dirname_esm,
}
```

The ESM-style `__dirname` reconstruction is necessary because
`next.config.ts` loads as an ES module (no CommonJS `__dirname`).

## Consequences

**Positive:**

- Standalone bundle is guaranteed to put `server.js` at
  `.next/standalone/server.js`, matching the systemd `WorkingDirectory`.
- Deploy layout is deterministic and independent of what exists in
  parent directories.
- Build-time warnings about workspace root detection go away.

**Negative:**

- If we ever genuinely want to hoist this app into a workspace, we have
  to remove this override. Low cost to do later.
- One more config line for new developers to understand; the comment in
  `next.config.ts` explains why.

## Alternatives rejected

- **Remove all lockfiles above the project** — fragile; breaks whenever
  someone runs `npm install` in the parent tree.
- **Change the deploy script to find `server.js` by glob** — hides the
  problem; any wrapper around the path can drift.
- **Leave autodetect on and deal with the path nesting** — every deploy
  would need to hardcode the nested path, which changes if the submodule
  is ever moved. Brittle.
