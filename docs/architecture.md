# AMA Listing Creator — Architecture

C4-style views of the system, from outermost context down to sequence and
deployment.

## Level 1 — System Context

```mermaid
C4Context
    title AMA Listing Creator — System Context

    Person(op, "Portal user<br/>(Listing operator)", "Allowlisted portal username<br/>(star000..star003)")
    System(portal, "Portal System<br/>ordercleaner.twinkletwinkle.uk", "Flask main app + nginx + auth layer")
    System(ama, "AMA Listing Creator<br/>Next.js, basePath /apps/listing", "5-step wizard, batch listing generator")
    System_Ext(amazon, "Amazon Seller Central", "Operator uploads the<br/>generated .xlsx here")
    SystemDb(disk, "Data root<br/>AMA_LISTING_DATA_ROOT", "listings.json<br/>styles.json")

    Rel(op, portal, "logs in", "HTTPS cookie")
    Rel(portal, ama, "proxies with X-Portal-User header", "nginx → 127.0.0.1:3002")
    Rel(ama, disk, "read/write atomic")
    Rel(op, amazon, "uploads .xlsx manually")
```

## Level 2 — Containers

```mermaid
C4Container
    title AMA Listing Creator — Containers

    Person(op, "Portal user")
    Container(nginx, "nginx", "reverse proxy + TLS", "Injects X-Portal-User from cookie")
    Container(node, "Next.js standalone server", "node server.js on :3002", "Pages + API routes")

    Container_Boundary(app, "Next.js app") {
        Component(mw, "middleware.ts", "Edge", "Auth guard")
        Component(pages, "App Router pages", "RSC + client", "/, /new-style, /listings, /editor/[sku]")
        Component(api, "API routes", "nodejs runtime", "/api/listings, /api/styles,<br/>/api/listings/batch, /api/listings/export")
    }

    Container_Boundary(lib, "lib/") {
        Component(store, "listingStore.ts", "fs + JSON", "atomic read/write,<br/>SavedStyleData → Listing[]")
        Component(validate, "validateBatch.ts", "pure", "Size caps + rule checks")
        Component(template, "amazonTemplate.ts", "const", "CSV_COLS (249) + header matrix")
        Component(csv, "exportCsv.ts", "string builder", "Single + batch CSV")
    }

    ContainerDb(fs, "Filesystem", "ext4 on VPS", "data/listings.json<br/>data/styles.json")

    Rel(op, nginx, "HTTPS")
    Rel(nginx, mw, "proxy_pass")
    Rel(mw, pages, "next()")
    Rel(mw, api, "next()")
    Rel(pages, api, "fetch")
    Rel(api, validate, "imports")
    Rel(api, store, "imports")
    Rel(api, template, "imports")
    Rel(pages, csv, "imports (client)")
    Rel(store, fs, "read / atomic write")
```

## Level 3 — Component Flow (New Style Wizard)

```mermaid
flowchart TD
    subgraph Browser
        W[NewStyleWizard<br/>5-step flow]
        W --> |Step 5: Save| POST[fetch POST<br/>/apps/listing/api/listings/batch]
    end

    POST --> MW[middleware.ts<br/>check X-Portal-User]
    MW -->|401| Unauth[401 JSON]
    MW -->|ok| RT[app/api/listings/batch/route.ts]

    RT --> V[validateBatch<br/>20/30/500 caps + SKU uniqueness]
    V -->|errors| E400[400 + details array]
    V -->|ok| GEN[generateListingsFromStyle<br/>1 Parent + colors × strengths Children]
    GEN --> SS[saveStyle<br/>atomic write .tmp → rename]
    SS --> FS[(listings.json<br/>styles.json)]
    SS --> R200[200 JSON ok + rows]

    R200 --> W
    W --> |trigger anchor click| DL[GET /api/listings/export<br/>?parentSku=...]
    DL --> MW2[middleware.ts]
    MW2 --> EXP[app/api/listings/export/route.ts]
    EXP --> LS[getAllListings → filter]
    LS --> SORT[sortParentFirst]
    SORT --> HDR[buildHeaderMatrix<br/>5 rows × 249 cols]
    SORT --> ROWS[listingToRow per Listing<br/>buildDataRow 249 cols]
    HDR --> M[matrix]
    ROWS --> M
    M --> XLSX[XLSX.write bookType: xlsx]
    XLSX --> BLOB[attachment .xlsx response]
```

## Sequence — Wizard submit to .xlsx download

```mermaid
sequenceDiagram
    autonumber
    participant U as Operator
    participant W as NewStyleWizard (browser)
    participant NG as nginx
    participant MW as middleware.ts
    participant B as POST /api/listings/batch
    participant V as validateBatch
    participant G as generateListingsFromStyle
    participant S as saveStyle (atomic)
    participant FS as data/*.json
    participant E as GET /api/listings/export
    participant X as XLSX.write

    U->>W: Fill steps 1–4, click "Save & Export"
    W->>NG: POST /apps/listing/api/listings/batch + JSON payload
    NG->>MW: proxy + inject X-Portal-User
    MW->>MW: check allowlist
    alt header missing or not in allowlist
        MW-->>W: 401 JSON { error: unauthenticated }
    end
    MW->>B: forward
    B->>V: validateBatch(body)
    alt validation fails
        V-->>B: {ok:false, errors:[]}
        B-->>W: 400 {error, details}
    else ok
        V-->>B: {ok:true}
        B->>G: generateListingsFromStyle(data)
        G-->>B: Listing[] (1 Parent + N Children)
        B->>S: saveStyle(parentSku, rows)
        S->>FS: write listings.json.tmp → rename
        S->>FS: write styles.json.tmp → rename
        S-->>B: saved rows
        B-->>W: 200 {ok, parentSku, count, listings}
    end
    W->>W: document.createElement('a').click()
    W->>NG: GET /apps/listing/api/listings/export?parentSku=...
    NG->>MW: proxy + inject header
    MW->>E: forward
    E->>FS: getAllListings() → filter parentSku
    E->>E: sortParentFirst + listingToRow × N
    E->>X: XLSX.write(matrix)
    X-->>E: Buffer
    E-->>W: 200 attachment amazon-listing-{parentSku}-{YYYYMMDD}.xlsx
    W->>U: file downloaded
    U->>U: upload .xlsx to Amazon Seller Central
```

## Data Model

### `SavedStyleData` (wizard input / batch POST body)

```ts
{
  parentSku: string           // /^[A-Za-z0-9_-]+$/
  brand: string
  itemNameTemplate: string    // supports {parentSku} {color} {strength} tokens
  price: string               // Parent row leaves this blank
  quantity: string            // Parent row leaves this blank
  variationTheme: string      // default "COLOR/MAGNIFICATION_STRENGTH"
  colors: Array<{
    color: string
    colorCode: string         // used in child SKU, must be unique across colors
    colorMap: string          // Amazon colour_map
    mainImage: string         // http/https
    image2..image8?: string
  }>
  strengths: number[]         // e.g. [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]
  dimensions: {
    lensWidth? lensHeight? bridgeWidth? templeLength?
    frameWidth? itemWeight? frameMaterial? frameShape?
  }
  // Optional listing copy propagated to every row
  listingAction? bullet1..bullet5? description? keywords?
}
```

### `Listing` (persisted flat row)

```ts
{
  sku: string
  parentage: 'Parent' | 'Child'
  parentSku: string
  itemName? brand? variationTheme?
  // Child-only
  price? quantity? color? colorMap? strength?
  mainImage? image2..image8?
  // Shared copy
  listingAction? bullet1..bullet5? description? keywords?
  // Dimensions (stored on both Parent and Child)
  lensWidth? lensHeight? bridgeWidth? templeLength?
  frameWidth? itemWeight? frameMaterial? frameShape?
  source?: string            // style tag, typically = parentSku
}
```

### `StyleEntry` (index row in `styles.json`)

```ts
{
  parentSku: string
  variants: string[]    // child SKUs only
}
```

### Storage layout

```
<AMA_LISTING_DATA_ROOT>/
├── listings.json   # flat array of Listing rows (Parent + Children for all styles)
└── styles.json     # [{ parentSku, variants: [childSku, ...] }]
```

Writes are crash-safe: `writeJsonAtomic` writes to `<file>.tmp` then
`fs.renameSync` onto the real path (POSIX atomic rename).

## Deployment Topology

```mermaid
flowchart LR
    subgraph Internet
        C[Browser]
    end

    subgraph VPS
        N[nginx :443<br/>ordercleaner.twinkletwinkle.uk]
        subgraph portal_system[/opt/portal-system]
            F[Flask gunicorn sock]
            subgraph ama[apps/ama-listing-creator]
                S[.next/standalone/server.js<br/>node :3002 127.0.0.1]
                subgraph data[data/ persistent]
                    L[listings.json]
                    Y[styles.json]
                end
            end
        end
        SD[systemd: ama-listing.service<br/>User=portal-system]
    end

    C -->|HTTPS| N
    N -->|/apps/listing/*| S
    N -->|everything else| F
    SD -.manages.-> S
    S -->|AMA_LISTING_DATA_ROOT<br/>=/opt/portal-system/apps/ama-listing-creator/data| data
```

**Deploy pipeline** (`.github/workflows/deploy.yml`):

1. `git push origin main` in the `ama-listing-creator` submodule triggers
   GitHub Actions.
2. Actions SSHes to the VPS and, as `portal-system` user:
   - `git fetch origin && git reset --hard origin/main`
   - backup current `.next/standalone` → `/opt/deploy-backups/ama-listing-creator/<sha>` (keep last 5)
   - `npm install --no-audit --no-fund`
   - `npm run build` (produces `.next/standalone/` + `.next/static/`)
   - **`cp -r .next/static .next/standalone/.next/static`** — without this
     `/_next/static/*` returns 404 and the page renders unstyled. See
     ADR-001.
   - `cp -r public .next/standalone/public` if `public/` exists
   - `sudo cp deploy/ama-listing.service /etc/systemd/system/...`
   - `systemctl daemon-reload && systemctl restart ama-listing.service`
3. Post-deploy checks:
   - `systemctl is-active` on the unit
   - `curl http://127.0.0.1:3002/apps/listing` → expect 200/302/307
   - scrape HTML for `_next/static/*.(css|js)`, fetch one → expect 200
     (guards against the "HTML OK but assets missing" failure mode).

**systemd unit** (`deploy/ama-listing.service`):

- `User=portal-system`
- `WorkingDirectory=/opt/portal-system/apps/ama-listing-creator/.next/standalone`
- `ExecStart=/usr/bin/node server.js`
- `Environment=PORT=3002 HOSTNAME=127.0.0.1`
- `Environment=AMA_LISTING_DATA_ROOT=/opt/portal-system/apps/ama-listing-creator/data`
  (outside the standalone bundle, so deploys never clobber live data)

**Next.js config** (`next.config.ts`):

- `output: 'standalone'` — single node process, minimal deps copied
- `basePath: '/apps/listing'` + `assetPrefix: '/apps/listing'`
- `outputFileTracingRoot: __dirname_esm` — pinned to this project so the
  standalone bundle's `server.js` lands at `.next/standalone/server.js`
  instead of being nested under a long workspace path (see ADR-007).

## Runtime & Dependencies

| Piece                 | Version   | Notes                                     |
|-----------------------|-----------|-------------------------------------------|
| Next.js               | 16.2.1    | App Router, standalone output             |
| React / React DOM     | 19.2.4    | Server + client components                |
| xlsx                  | ^0.18.5   | Only external runtime dep for workbook    |
| Node                  | (system)  | systemd unit runs `/usr/bin/node`         |
| Data store            | JSON files on disk (see ADR-002)                      |
