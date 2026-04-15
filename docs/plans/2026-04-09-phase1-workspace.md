# AMA Listing Creator — Phase 1 Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade from "local draft + CSV downloader" to a shared listing workspace where content is server-persisted, workflow states are tracked (Draft → Ready → Exported → Uploaded → Needs Fix), and style templates enable content reuse across variants.

**Architecture:** Two new mutable JSON files (`data/workspace.json`, `data/templates.json`) live alongside the read-only `listings.json`. Next.js API routes (app/api/) provide CRUD. EditorClient reads/writes to server instead of localStorage. A new Template editor page applies shared content to all variants of a style.

**Tech Stack:** Next.js 16.2.1 app-dir, React 19, TypeScript, Node.js `fs` for JSON file I/O, Win98 CSS theme (98.css)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/workspace.ts` | Create | Read/write `workspace.json`; types for WorkspaceEntry, status |
| `lib/templates.ts` | Create | Read/write `templates.json`; types for StyleTemplate |
| `data/workspace.json` | Create | Empty `{}` seed file |
| `data/templates.json` | Create | Empty `{}` seed file |
| `app/api/workspace/route.ts` | Create | GET all / GET ?sku= / POST upsert |
| `app/api/workspace/status/route.ts` | Create | PATCH status only |
| `app/api/workspace/export/route.ts` | Create | POST record export event |
| `app/api/workspace/upload/route.ts` | Create | POST record upload event |
| `app/api/templates/route.ts` | Modify (replace) | GET all / GET ?parentSku= / POST upsert |
| `app/components/EditorClient.tsx` | Modify | Load/save via API; status picker; post-export record |
| `app/components/ListingsClient.tsx` | Modify | Load workspace from API; workflow status column + filter |
| `app/template/page.tsx` | Create | Server page shell for template editor |
| `app/components/TemplateEditorClient.tsx` | Create | Template editor UI with apply-to-all-variants |
| `app/components/AppToolbar.tsx` | Modify | Add "模板" nav link |

---

## Task 1: Data helpers — `lib/workspace.ts`

**Files:**
- Create: `apps/ama-listing-creator/lib/workspace.ts`
- Create: `apps/ama-listing-creator/data/workspace.json`

- [ ] **Step 1.1: Create empty workspace.json seed**

```bash
# In apps/ama-listing-creator/
echo '{}' > data/workspace.json
```

- [ ] **Step 1.2: Create lib/workspace.ts**

```typescript
// lib/workspace.ts
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

// DATA_DIR env lets VPS deployment point to the repo data dir
// (standalone CWD is .next/standalone; the actual data lives in the repo tree)
function dataDir(): string {
  return process.env.DATA_DIR ?? join(process.cwd(), 'data')
}

function workspacePath(): string {
  return join(dataDir(), 'workspace.json')
}

// ─── Types ────────────────────────────────────────────────────────────────

export type WorkspaceStatus = 'Draft' | 'Ready' | 'Exported' | 'Uploaded' | 'Needs Fix'

/** All editable fields for one SKU — superset of exportCsv.ts DraftData */
export interface WorkspaceDraft {
  itemName?: string
  brand?: string
  listingAction?: string
  bullet1?: string
  bullet2?: string
  bullet3?: string
  bullet4?: string
  bullet5?: string
  description?: string
  keywords?: string
  style?: string
  department?: string
  targetGender?: string
  frameMaterial?: string
  frameType?: string
  itemShape?: string
  numberOfItems?: string
  packageQuantity?: string
  armLength?: string
  bridgeWidth?: string
  itemWeight?: string
  weightUnit?: string
  image4?: string
  image5?: string
  image6?: string
  image7?: string
  image8?: string
}

export interface ExportRecord {
  at: string       // ISO 8601
  filename: string
}

export interface UploadRecord {
  at: string       // ISO 8601
  note: string
}

export interface WorkspaceEntry {
  sku: string
  status: WorkspaceStatus
  draft: WorkspaceDraft
  exports: ExportRecord[]
  uploads: UploadRecord[]
  updatedAt: string
}

type WorkspaceFile = Record<string, WorkspaceEntry>

// ─── I/O ─────────────────────────────────────────────────────────────────

export function readWorkspace(): WorkspaceFile {
  const p = workspacePath()
  if (!existsSync(p)) return {}
  try {
    return JSON.parse(readFileSync(p, 'utf-8'))
  } catch {
    return {}
  }
}

function writeWorkspace(data: WorkspaceFile): void {
  writeFileSync(workspacePath(), JSON.stringify(data, null, 2), 'utf-8')
}

// ─── Public API ───────────────────────────────────────────────────────────

export function getEntry(sku: string): WorkspaceEntry | null {
  return readWorkspace()[sku] ?? null
}

export function upsertEntry(
  sku: string,
  patch: { draft?: Partial<WorkspaceDraft>; status?: WorkspaceStatus },
): WorkspaceEntry {
  const ws = readWorkspace()
  const existing = ws[sku] ?? {
    sku,
    status: 'Draft' as WorkspaceStatus,
    draft: {},
    exports: [],
    uploads: [],
    updatedAt: new Date().toISOString(),
  }
  const updated: WorkspaceEntry = {
    ...existing,
    status: patch.status ?? existing.status,
    draft: patch.draft ? { ...existing.draft, ...patch.draft } : existing.draft,
    updatedAt: new Date().toISOString(),
  }
  ws[sku] = updated
  writeWorkspace(ws)
  return updated
}

export function updateStatus(sku: string, status: WorkspaceStatus): WorkspaceEntry | null {
  const ws = readWorkspace()
  if (!ws[sku]) return null
  ws[sku] = { ...ws[sku], status, updatedAt: new Date().toISOString() }
  writeWorkspace(ws)
  return ws[sku]
}

export function recordExport(sku: string, filename: string): WorkspaceEntry {
  const ws = readWorkspace()
  const existing = ws[sku] ?? {
    sku,
    status: 'Draft' as WorkspaceStatus,
    draft: {},
    exports: [],
    uploads: [],
    updatedAt: new Date().toISOString(),
  }
  const updated: WorkspaceEntry = {
    ...existing,
    status: 'Exported',
    exports: [...existing.exports, { at: new Date().toISOString(), filename }],
    updatedAt: new Date().toISOString(),
  }
  ws[sku] = updated
  writeWorkspace(ws)
  return updated
}

export function recordUpload(sku: string, note: string): WorkspaceEntry {
  const ws = readWorkspace()
  const existing = ws[sku] ?? {
    sku,
    status: 'Draft' as WorkspaceStatus,
    draft: {},
    exports: [],
    uploads: [],
    updatedAt: new Date().toISOString(),
  }
  const updated: WorkspaceEntry = {
    ...existing,
    status: 'Uploaded',
    uploads: [...existing.uploads, { at: new Date().toISOString(), note }],
    updatedAt: new Date().toISOString(),
  }
  ws[sku] = updated
  writeWorkspace(ws)
  return updated
}
```

- [ ] **Step 1.3: Commit**

```bash
git add lib/workspace.ts data/workspace.json
git commit -m "feat(workspace): add server-side workspace data layer"
```

---

## Task 2: Data helpers — `lib/templates.ts`

**Files:**
- Create: `apps/ama-listing-creator/lib/templates.ts`
- Create: `apps/ama-listing-creator/data/templates.json`

- [ ] **Step 2.1: Create empty templates.json seed**

```bash
echo '{}' > data/templates.json
```

- [ ] **Step 2.2: Create lib/templates.ts**

```typescript
// lib/templates.ts
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

function dataDir(): string {
  return process.env.DATA_DIR ?? join(process.cwd(), 'data')
}

function templatesPath(): string {
  return join(dataDir(), 'templates.json')
}

// ─── Types ────────────────────────────────────────────────────────────────

/** Shared content fields that apply to all variants of a parentSku */
export interface StyleTemplate {
  parentSku: string
  itemName: string
  brand: string
  bullet1: string
  bullet2: string
  bullet3: string
  bullet4: string
  bullet5: string
  description: string
  keywords: string
  style: string
  department: string
  targetGender: string
  frameMaterial: string
  frameType: string
  itemShape: string
  numberOfItems: string
  packageQuantity: string
  armLength: string
  bridgeWidth: string
  itemWeight: string
  weightUnit: string
  updatedAt: string
}

type TemplatesFile = Record<string, StyleTemplate>

const EMPTY_TEMPLATE = (parentSku: string): StyleTemplate => ({
  parentSku,
  itemName: '', brand: 'TWINKLE TWINKLE',
  bullet1: '', bullet2: '', bullet3: '', bullet4: '', bullet5: '',
  description: '', keywords: '',
  style: '', department: 'Unisex Adults', targetGender: 'Unisex',
  frameMaterial: '', frameType: '', itemShape: '',
  numberOfItems: '', packageQuantity: '',
  armLength: '', bridgeWidth: '', itemWeight: '', weightUnit: 'g',
  updatedAt: new Date().toISOString(),
})

// ─── I/O ─────────────────────────────────────────────────────────────────

export function readTemplates(): TemplatesFile {
  const p = templatesPath()
  if (!existsSync(p)) return {}
  try {
    return JSON.parse(readFileSync(p, 'utf-8'))
  } catch {
    return {}
  }
}

function writeTemplates(data: TemplatesFile): void {
  writeFileSync(templatesPath(), JSON.stringify(data, null, 2), 'utf-8')
}

// ─── Public API ───────────────────────────────────────────────────────────

export function getTemplate(parentSku: string): StyleTemplate | null {
  return readTemplates()[parentSku] ?? null
}

export function upsertTemplate(
  parentSku: string,
  fields: Partial<Omit<StyleTemplate, 'parentSku' | 'updatedAt'>>,
): StyleTemplate {
  const tmpl = readTemplates()
  const existing = tmpl[parentSku] ?? EMPTY_TEMPLATE(parentSku)
  const updated: StyleTemplate = {
    ...existing,
    ...fields,
    parentSku,
    updatedAt: new Date().toISOString(),
  }
  tmpl[parentSku] = updated
  writeTemplates(tmpl)
  return updated
}
```

- [ ] **Step 2.3: Commit**

```bash
git add lib/templates.ts data/templates.json
git commit -m "feat(templates): add server-side style template data layer"
```

---

## Task 3: API routes — workspace

**Files:**
- Create: `apps/ama-listing-creator/app/api/workspace/route.ts`
- Create: `apps/ama-listing-creator/app/api/workspace/status/route.ts`
- Create: `apps/ama-listing-creator/app/api/workspace/export/route.ts`
- Create: `apps/ama-listing-creator/app/api/workspace/upload/route.ts`

- [ ] **Step 3.1: Create app/api/workspace/route.ts**

```typescript
// app/api/workspace/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { readWorkspace, upsertEntry } from '@/lib/workspace'
import type { WorkspaceStatus, WorkspaceDraft } from '@/lib/workspace'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sku = searchParams.get('sku')
  const ws = readWorkspace()
  if (sku) {
    return NextResponse.json(ws[sku] ?? null)
  }
  return NextResponse.json(ws)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      sku: string
      draft?: Partial<WorkspaceDraft>
      status?: WorkspaceStatus
    }
    if (!body.sku) {
      return NextResponse.json({ error: 'sku required' }, { status: 400 })
    }
    const entry = upsertEntry(body.sku, {
      draft: body.draft,
      status: body.status,
    })
    return NextResponse.json(entry)
  } catch {
    return NextResponse.json({ error: 'Failed to save workspace entry' }, { status: 500 })
  }
}
```

- [ ] **Step 3.2: Create app/api/workspace/status/route.ts**

```typescript
// app/api/workspace/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { updateStatus } from '@/lib/workspace'
import type { WorkspaceStatus } from '@/lib/workspace'

const VALID_STATUSES: WorkspaceStatus[] = ['Draft', 'Ready', 'Exported', 'Uploaded', 'Needs Fix']

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as { sku: string; status: WorkspaceStatus }
    if (!body.sku || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'sku and valid status required' }, { status: 400 })
    }
    const entry = updateStatus(body.sku, body.status)
    if (!entry) {
      return NextResponse.json({ error: 'SKU not found in workspace' }, { status: 404 })
    }
    return NextResponse.json(entry)
  } catch {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
```

- [ ] **Step 3.3: Create app/api/workspace/export/route.ts**

```typescript
// app/api/workspace/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { recordExport } from '@/lib/workspace'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { sku: string; filename: string }
    if (!body.sku || !body.filename) {
      return NextResponse.json({ error: 'sku and filename required' }, { status: 400 })
    }
    const entry = recordExport(body.sku, body.filename)
    return NextResponse.json(entry)
  } catch {
    return NextResponse.json({ error: 'Failed to record export' }, { status: 500 })
  }
}
```

- [ ] **Step 3.4: Create app/api/workspace/upload/route.ts**

```typescript
// app/api/workspace/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { recordUpload } from '@/lib/workspace'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { sku: string; note?: string }
    if (!body.sku) {
      return NextResponse.json({ error: 'sku required' }, { status: 400 })
    }
    const entry = recordUpload(body.sku, body.note ?? '')
    return NextResponse.json(entry)
  } catch {
    return NextResponse.json({ error: 'Failed to record upload' }, { status: 500 })
  }
}
```

- [ ] **Step 3.5: Commit**

```bash
git add app/api/workspace/
git commit -m "feat(api): add workspace CRUD API routes"
```

---

## Task 4: API routes — templates

**Files:**
- Modify (replace): `apps/ama-listing-creator/app/api/templates/route.ts`

The existing `/api/templates` only does GET. Replace it to support POST (upsert) as well.

- [ ] **Step 4.1: Replace app/api/templates/route.ts**

```typescript
// app/api/templates/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { readTemplates, upsertTemplate } from '@/lib/templates'
import type { StyleTemplate } from '@/lib/templates'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const parentSku = searchParams.get('parentSku')
  const tmpl = readTemplates()
  if (parentSku) {
    return NextResponse.json(tmpl[parentSku] ?? null)
  }
  return NextResponse.json(tmpl)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<StyleTemplate> & { parentSku: string }
    if (!body.parentSku) {
      return NextResponse.json({ error: 'parentSku required' }, { status: 400 })
    }
    const { parentSku, ...fields } = body
    const template = upsertTemplate(parentSku, fields)
    return NextResponse.json(template)
  } catch {
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
  }
}
```

- [ ] **Step 4.2: Commit**

```bash
git add app/api/templates/route.ts
git commit -m "feat(api): add POST to templates route for upsert"
```

---

## Task 5: EditorClient — switch from localStorage to server

**Files:**
- Modify: `apps/ama-listing-creator/app/components/EditorClient.tsx`

Key changes:
1. On mount: fetch `/api/workspace?sku=${sku}`, merge `entry.draft` into form state
2. "保存草稿": POST to `/api/workspace` with draft fields + status
3. Add status picker dropdown (Needs Fix → Draft → Ready → Exported → Uploaded)
4. After export CSV: POST to `/api/workspace/export` with filename
5. Remove localStorage reads/writes

- [ ] **Step 5.1: Add workspace fetch on mount**

Find the `useEffect` that reads localStorage (lines ~211-220 in current EditorClient.tsx):

```typescript
// REMOVE this block:
useEffect(() => {
  if (!sku) return
  try {
    const saved = localStorage.getItem(`draft:${sku}`)
    if (saved) {
      const draft = JSON.parse(saved) as Partial<FormData>
      setForm((prev) => ({ ...prev, ...draft }))
    }
  } catch { /* ignore */ }
}, [sku])
```

Replace with:

```typescript
const [wsStatus, setWsStatus] = useState<string>('Draft')

useEffect(() => {
  if (!sku) return
  fetch(`/api/workspace?sku=${encodeURIComponent(sku)}`)
    .then((r) => r.json())
    .then((entry) => {
      if (entry && entry.draft) {
        setForm((prev) => ({ ...prev, ...entry.draft }))
        setWsStatus(entry.status ?? 'Draft')
      }
    })
    .catch(() => { /* no entry yet — start blank */ })
}, [sku])
```

- [ ] **Step 5.2: Replace handleSaveDraft to POST to server**

```typescript
// REMOVE:
const handleSaveDraft = () => {
  const key = sku || 'new'
  localStorage.setItem(`draft:${key}`, JSON.stringify(form))
  alert(`草稿已保存 (${key})`)
}
```

Replace with:

```typescript
const [saving, setSaving] = useState(false)

const handleSaveDraft = async () => {
  const key = sku || 'new'
  setSaving(true)
  try {
    const res = await fetch('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: key, draft: form, status: wsStatus }),
    })
    if (!res.ok) throw new Error('save failed')
    alert(`草稿已保存 (${key})`)
  } catch {
    alert('保存失败，请重试')
  } finally {
    setSaving(false)
  }
}
```

- [ ] **Step 5.3: Update handleExportCsv to record export on server**

```typescript
// REMOVE:
const handleExportCsv = () => {
  const content = generateSingleCsv(form, sku)
  downloadCsv(content, `${sku || 'new-listing'}-listing.csv`)
}
```

Replace with:

```typescript
const handleExportCsv = async () => {
  const filename = `${sku || 'new-listing'}-listing.csv`
  const content = generateSingleCsv(form, sku)
  downloadCsv(content, filename)
  // Record export event (fire-and-forget)
  if (sku) {
    fetch('/api/workspace/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, filename }),
    }).then(() => setWsStatus('Exported')).catch(() => {})
  }
}
```

- [ ] **Step 5.4: Add status picker to action buttons bar**

Find the action buttons div (near the end of EditorClient, contains "💾 保存草稿" etc):

```typescript
// Add before the existing buttons div:
<div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
  <label style={{ fontSize: '11px', color: '#444' }}>状态：</label>
  <select
    value={wsStatus}
    onChange={(e) => {
      const newStatus = e.target.value
      setWsStatus(newStatus)
      if (sku) {
        fetch('/api/workspace/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sku, status: newStatus }),
        }).catch(() => {})
      }
    }}
    style={{ fontSize: '11px' }}
  >
    <option value="Draft">Draft</option>
    <option value="Ready">Ready</option>
    <option value="Exported">Exported</option>
    <option value="Uploaded">Uploaded</option>
    <option value="Needs Fix">Needs Fix</option>
  </select>
</div>
```

Update the 保存草稿 button to show saving state:

```typescript
<button onClick={handleSaveDraft} disabled={saving} style={{ fontSize: '11px' }}>
  {saving ? '保存中…' : '💾 保存草稿'}
</button>
```

- [ ] **Step 5.5: Commit**

```bash
git add app/components/EditorClient.tsx
git commit -m "feat(editor): switch draft persistence to server workspace API"
```

---

## Task 6: ListingsClient — workspace status column and filter

**Files:**
- Modify: `apps/ama-listing-creator/app/components/ListingsClient.tsx`

Key changes:
1. Fetch all workspace entries on mount from `/api/workspace`
2. Replace localStorage `readDraft(sku)` calls with workspace draft lookup
3. Add workflow status display in the "状态" column
4. Add status filter (All / Draft / Ready / Exported / Uploaded / Needs Fix)
5. After batch export: POST to `/api/workspace/export` for each SKU

- [ ] **Step 6.1: Add workspace state + fetch**

Add after the existing state declarations in `ListingsClient`:

```typescript
import type { WorkspaceEntry } from '@/lib/workspace'

// Inside the component:
const [workspace, setWorkspace] = useState<Record<string, WorkspaceEntry>>({})
const [statusFilter, setStatusFilter] = useState<string>('All')

useEffect(() => {
  fetch('/api/workspace')
    .then((r) => r.json())
    .then((data) => setWorkspace(data ?? {}))
    .catch(() => {})
}, [])

// Replace readDraft function:
function getDraft(sku: string) {
  return workspace[sku]?.draft ?? null
}
```

- [ ] **Step 6.2: Replace localStorage readDraft calls**

Find the `readDraft` function (lines ~36-41) and all calls to `readDraft(sku)`.

Replace:
```typescript
function readDraft(sku: string): DraftData | null {
  try {
    const s = localStorage.getItem(`draft:${sku}`)
    return s ? JSON.parse(s) : null
  } catch { return null }
}
```

With nothing (delete this function). The `getDraft` defined in Step 6.1 replaces it.

Replace every call `readDraft(listing.sku)` → `getDraft(listing.sku)` and
`readDraft(l.sku)` → `getDraft(l.sku)`.

Also remove the `useEffect` that reads `localStorage.getItem('draft:...')` for `selectedDraft` (around lines 221-227). Replace:
```typescript
// REMOVE:
useEffect(() => {
  if (!selected) { setSelectedDraft(null); return }
  try {
    const saved = localStorage.getItem(`draft:${selected.sku}`)
    setSelectedDraft(saved ? JSON.parse(saved) : null)
  } catch { setSelectedDraft(null) }
}, [selected?.sku])
```

With:
```typescript
useEffect(() => {
  if (!selected) { setSelectedDraft(null); return }
  setSelectedDraft(workspace[selected.sku]?.draft ?? null)
}, [selected?.sku, workspace])
```

- [ ] **Step 6.3: Add status filter to filter row**

Find the style filter buttons section. Add a status filter row below it:

```typescript
{/* Status filter */}
<div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', alignItems: 'center' }}>
  <label style={{ fontSize: '10px', color: '#444' }}>状态：</label>
  {['All', 'Draft', 'Ready', 'Exported', 'Uploaded', 'Needs Fix'].map((s) => (
    <button
      key={s}
      onClick={() => setStatusFilter(s)}
      className={statusFilter === s ? 'active' : ''}
      style={{ fontSize: '10px', padding: '1px 5px' }}
    >
      {s}
    </button>
  ))}
</div>
```

Update the `filtered` computation to include status filter:

```typescript
const filtered = listings.filter((l) => {
  const matchesStyle = activeStyle === 'All' || l.parentSku === activeStyle
  const matchesStatus = statusFilter === 'All' || (workspace[l.sku]?.status ?? 'Draft') === statusFilter
  const q = search.toLowerCase()
  const matchesSearch =
    !q ||
    l.sku.toLowerCase().includes(q) ||
    l.itemName.toLowerCase().includes(q) ||
    l.color.toLowerCase().includes(q)
  return matchesStyle && matchesStatus && matchesSearch
})
```

- [ ] **Step 6.4: Update status column to show workflow status**

Replace the `ReadinessBadge` call in the table's status `<td>` with a combined display:

```typescript
// Replace:
<td>
  <ReadinessBadge result={readiness} />
</td>
```

With:

```typescript
<td>
  {(() => {
    const wsEntry = workspace[listing.sku]
    const status = wsEntry?.status ?? 'Draft'
    const statusColor: Record<string, string> = {
      'Draft':    '#808080',
      'Ready':    '#008000',
      'Exported': '#000080',
      'Uploaded': '#4a0080',
      'Needs Fix':'#cc0000',
    }
    return (
      <span style={{ fontSize: '10px', color: statusColor[status] ?? '#808080' }}>
        {status}
      </span>
    )
  })()}
</td>
```

- [ ] **Step 6.5: Record export events for batch export**

Find the `confirmExport` function and update it:

```typescript
const confirmExport = async () => {
  if (!exportModal) return
  const filename = `${exportModal.parentSku}-amazon-upload.csv`
  const csv = generateBatchCsv(
    exportModal.parentSku,
    exportModal.listings,
    (sku) => getDraft(sku),
  )
  downloadCsv(csv, filename)

  // Record export for each variant (fire-and-forget)
  const updates = exportModal.listings.map((l) =>
    fetch('/api/workspace/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: l.sku, filename }),
    })
  )
  Promise.all(updates)
    .then(() => fetch('/api/workspace').then((r) => r.json()).then((d) => setWorkspace(d ?? {})))
    .catch(() => {})

  setExportModal(null)
}
```

- [ ] **Step 6.6: Commit**

```bash
git add app/components/ListingsClient.tsx
git commit -m "feat(listings): show workflow status, add status filter, record batch exports"
```

---

## Task 7: Template editor page

**Files:**
- Create: `apps/ama-listing-creator/app/template/page.tsx`
- Create: `apps/ama-listing-creator/app/components/TemplateEditorClient.tsx`
- Modify: `apps/ama-listing-creator/app/components/AppToolbar.tsx`

- [ ] **Step 7.1: Read AppToolbar.tsx first**

Read `app/components/AppToolbar.tsx` to understand nav link format before editing.

- [ ] **Step 7.2: Create app/template/page.tsx**

```typescript
// app/template/page.tsx
import TemplateEditorClient from '../components/TemplateEditorClient'
import { readFileSync } from 'fs'
import { join } from 'path'

export default function TemplatePage() {
  const dataDir = process.env.DATA_DIR ?? join(process.cwd(), 'data')

  let styles: { parentSku: string; variants: string[] }[] = []
  try {
    styles = JSON.parse(readFileSync(join(dataDir, 'styles.json'), 'utf-8'))
  } catch { /* no styles */ }

  return <TemplateEditorClient styles={styles} />
}
```

- [ ] **Step 7.3: Create app/components/TemplateEditorClient.tsx**

```typescript
'use client'

import { useState, useEffect } from 'react'
import type { StyleTemplate } from '@/lib/templates'

interface Style {
  parentSku: string
  variants: string[]
}

interface Props {
  styles: Style[]
}

const EMPTY_TEMPLATE = (parentSku: string): StyleTemplate => ({
  parentSku,
  itemName: '', brand: 'TWINKLE TWINKLE',
  bullet1: '', bullet2: '', bullet3: '', bullet4: '', bullet5: '',
  description: '', keywords: '',
  style: '', department: 'Unisex Adults', targetGender: 'Unisex',
  frameMaterial: '', frameType: '', itemShape: '',
  numberOfItems: '', packageQuantity: '',
  armLength: '', bridgeWidth: '', itemWeight: '', weightUnit: 'g',
  updatedAt: '',
})

export default function TemplateEditorClient({ styles }: Props) {
  const [activeStyle, setActiveStyle] = useState<string>(styles[0]?.parentSku ?? '')
  const [form, setForm] = useState<StyleTemplate>(EMPTY_TEMPLATE(activeStyle))
  const [saving, setSaving] = useState(false)
  const [applying, setApplying] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Load template when style changes
  useEffect(() => {
    if (!activeStyle) return
    fetch(`/api/templates?parentSku=${encodeURIComponent(activeStyle)}`)
      .then((r) => r.json())
      .then((tmpl) => {
        if (tmpl) setForm({ ...EMPTY_TEMPLATE(activeStyle), ...tmpl })
        else setForm(EMPTY_TEMPLATE(activeStyle))
      })
      .catch(() => setForm(EMPTY_TEMPLATE(activeStyle)))
  }, [activeStyle])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('save failed')
      setMessage('模板已保存')
    } catch {
      setMessage('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleApplyToAll = async () => {
    const style = styles.find((s) => s.parentSku === activeStyle)
    if (!style) return
    setApplying(true)
    setMessage(null)
    // For each variant, upsert the template fields as draft (only overwrite empty fields)
    const { parentSku, updatedAt, ...draftFields } = form
    try {
      await Promise.all(
        style.variants.map((sku) =>
          fetch('/api/workspace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sku, draft: draftFields }),
          })
        )
      )
      setMessage(`已将模板应用到 ${style.variants.length} 个变体`)
    } catch {
      setMessage('部分应用失败，请重试')
    } finally {
      setApplying(false)
    }
  }

  const F: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '4px' }
  const lS: React.CSSProperties = { fontSize: '11px', color: '#b37a00', whiteSpace: 'nowrap', flexShrink: 0, paddingTop: '3px', minWidth: '90px', textAlign: 'right' }
  const lO: React.CSSProperties = { fontSize: '11px', color: '#000', whiteSpace: 'nowrap', flexShrink: 0, paddingTop: '3px', minWidth: '90px', textAlign: 'right' }
  const TA: React.CSSProperties = { width: '340px', fontSize: '11px', height: '40px', resize: 'vertical', fontFamily: "'Pixelated MS Sans Serif','MS Sans Serif',Tahoma,sans-serif" }

  return (
    <div style={{ display: 'flex', flex: 1, gap: '6px', minWidth: 0, overflow: 'hidden' }}>

      {/* ─── Left: style selector ─── */}
      <div style={{ width: '140px', flexShrink: 0 }}>
        <fieldset>
          <legend>款式</legend>
          {styles.map((s) => (
            <div key={s.parentSku} style={{ marginBottom: '2px' }}>
              <button
                onClick={() => setActiveStyle(s.parentSku)}
                className={activeStyle === s.parentSku ? 'active' : ''}
                style={{ width: '100%', fontSize: '11px', textAlign: 'left' }}
              >
                {s.parentSku} ({s.variants.length})
              </button>
            </div>
          ))}
        </fieldset>
      </div>

      {/* ─── Center: template form ─── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '11px', color: '#444' }}>款式模板：{activeStyle || '（未选择）'}</div>

        <fieldset>
          <legend>基本信息</legend>
          <div style={F}><label style={lO}>Item Name</label><input type="text" value={form.itemName} onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))} style={{ width: '340px', fontSize: '11px' }} /></div>
          <div style={F}><label style={lO}>Brand</label><input type="text" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} style={{ width: '200px', fontSize: '11px' }} /></div>
        </fieldset>

        <fieldset>
          <legend>卖点内容</legend>
          {(['bullet1', 'bullet2', 'bullet3', 'bullet4', 'bullet5'] as const).map((k, i) => (
            <div key={k} style={F}>
              <label style={lS}>Bullet {i + 1}</label>
              <textarea value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} style={TA} />
            </div>
          ))}
          <div style={F}><label style={lS}>Description</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ ...TA, height: '60px' }} /></div>
          <div style={F}><label style={lS}>Keywords</label><input type="text" value={form.keywords} onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))} style={{ width: '340px', fontSize: '11px' }} /></div>
        </fieldset>

        <fieldset>
          <legend>分类 &amp; 规格</legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginBottom: '4px' }}>
            {([
              { k: 'style' as const, label: 'Style' },
              { k: 'department' as const, label: 'Department' },
              { k: 'targetGender' as const, label: 'Gender' },
              { k: 'frameMaterial' as const, label: 'Frame Mat.' },
              { k: 'frameType' as const, label: 'Frame Type' },
              { k: 'itemShape' as const, label: 'Item Shape' },
              { k: 'numberOfItems' as const, label: 'No. Items' },
              { k: 'packageQuantity' as const, label: 'Pkg Qty' },
              { k: 'armLength' as const, label: 'Arm Length' },
              { k: 'bridgeWidth' as const, label: 'Bridge Width' },
              { k: 'itemWeight' as const, label: 'Item Weight' },
            ]).map(({ k, label }) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{label}</label>
                <input type="text" value={form[k] as string} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} style={{ width: '110px', fontSize: '11px' }} />
              </span>
            ))}
          </div>
        </fieldset>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '4px', paddingBottom: '6px', alignItems: 'center' }}>
          <button onClick={handleSave} disabled={saving || !activeStyle} style={{ fontSize: '11px' }}>
            {saving ? '保存中…' : '💾 保存模板'}
          </button>
          <button onClick={handleApplyToAll} disabled={applying || !activeStyle} style={{ fontSize: '11px' }}>
            {applying ? '应用中…' : '⬆ 应用到所有变体'}
          </button>
          {message && (
            <span style={{ fontSize: '11px', color: message.includes('失败') ? '#cc0000' : '#008000' }}>
              {message}
            </span>
          )}
        </div>
      </div>

    </div>
  )
}
```

- [ ] **Step 7.4: Add "模板" nav link to AppToolbar**

Read `app/components/AppToolbar.tsx`, then add a link to `/template` alongside the existing nav links. Follow the same pattern as existing links (e.g., the Images link).

Example — find the nav links section and add:
```typescript
<a href="/template" className={/* active check */ ''} style={{ fontSize: '11px' }}>
  模板
</a>
```
(Exact markup depends on current AppToolbar content — read the file first.)

- [ ] **Step 7.5: Commit**

```bash
git add app/template/ app/components/TemplateEditorClient.tsx app/components/AppToolbar.tsx
git commit -m "feat(template): add style template editor page with apply-to-all-variants"
```

---

## Task 8: Data files — add to .gitignore exception and VPS DATA_DIR

**Files:**
- Modify: `apps/ama-listing-creator/.gitignore` (ensure workspace.json and templates.json are NOT ignored)
- Modify: `apps/ama-listing-creator/deploy/ama-listing.service` (add DATA_DIR env var)

- [ ] **Step 8.1: Verify .gitignore does not exclude new data files**

The new `data/workspace.json` and `data/templates.json` must be committed (they're mutable but the initial seed needs to be in the repo).

Check `.gitignore` for any `data/` patterns and ensure workspace.json + templates.json are committed:

```bash
# In apps/ama-listing-creator/
git status data/workspace.json data/templates.json
# Both should show as untracked or staged, not ignored
```

If they're ignored, add exceptions to .gitignore:
```
# at end of .gitignore:
!data/workspace.json
!data/templates.json
```

- [ ] **Step 8.2: Add DATA_DIR to the systemd service**

In `deploy/ama-listing.service`, add:

```ini
Environment=DATA_DIR=/opt/portal-system/apps/ama-listing-creator/data
```

This ensures the standalone server (CWD = `.next/standalone`) writes to the actual repo data dir where the JSON files live persistently.

- [ ] **Step 8.3: Commit**

```bash
git add .gitignore deploy/ama-listing.service data/workspace.json data/templates.json
git commit -m "chore(deploy): add DATA_DIR env for standalone data persistence"
```

---

## Task 9: VPS build & deploy

- [ ] **Step 9.1: Build locally to verify no TypeScript errors**

```bash
cd apps/ama-listing-creator
npm run build
# Expected: exit 0, "Route (app)" table shows new routes:
# /api/workspace, /api/workspace/status, /api/workspace/export, /api/workspace/upload
# /api/templates
# /template
```

- [ ] **Step 9.2: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 9.3: Deploy to VPS**

SSH to `boyechen@149.210.243.20` (pw: `Cby123`) and run:

```bash
cd /opt/portal-system/apps/ama-listing-creator
sudo git pull origin main
npm ci
npm run build
sudo cp -r .next/standalone/.next /opt/portal-system/apps/ama-listing-creator/.next/standalone/.next
sudo cp -r public /opt/portal-system/apps/ama-listing-creator/.next/standalone/public 2>/dev/null || true
sudo systemctl restart ama-listing
sudo systemctl is-active ama-listing
```

Alternative: use the paramiko Python SSH pattern from previous session to automate this.

- [ ] **Step 9.4: Smoke test**

- Open `https://ordercleaner.twinkletwinkle.uk/apps/listing` → listings page loads
- Click 编辑 on any SKU → editor loads with blank form (no workspace entry yet)
- Fill a few fields → 保存草稿 → verify `data/workspace.json` on VPS has the entry
- Go back to listings → SKU shows "Draft" in status column
- Change status to "Ready" from editor → status updates in listings page
- Open `/apps/listing/template` → template editor shows 3 styles
- Save a template for RX224 → verify `data/templates.json` has the entry
- Click "应用到所有变体" → open any RX224 editor → bullets pre-filled from template

---

## Self-Review Against Spec

| Spec Requirement | Covered By |
|-----------------|-----------|
| Server-persisted JSON data | Task 1-4 (workspace.json + templates.json + API routes) |
| Workflow states Draft→Ready→Exported→Uploaded→Needs Fix | Task 1 (WorkspaceStatus type), Task 5 (status picker), Task 6 (status column + filter) |
| Style template editor | Task 7 (TemplateEditorClient) |
| Apply template to all variants | Task 7 (handleApplyToAll) |
| Export records | Task 3 (`/api/workspace/export`), Task 5 & 6 (post-export record) |
| Upload records | Task 3 (`/api/workspace/upload`) — manual mark only (no auto-detection) |
| localStorage demoted | Task 5 (EditorClient no longer reads/writes localStorage) |
| Enhanced validation (blocking vs warning) | ReadinessBadge in ListingsClient already does required vs suggested — no additional blocking gate added; spec doesn't require a new validation step, just clarity |
| Listings status-based filter | Task 6 (status filter row) |
| VPS DATA_DIR for standalone | Task 8 |
