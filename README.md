# Teknik Frontend — Greenpark Engineering Control Dashboard

A single-page, war-room style dashboard built with **React 18 + TypeScript +
Vite** that consumes the [Teknik backend API](../../backend/teknik) and renders
projects, contractors, quality/defects, complaints, site & handover readiness,
AI insights, KPIs and early-warning triggers.

The canvas is designed at 1920×1080 and auto-scales to fit any screen.

## Tech stack

- **React 18** + **TypeScript** (strict mode)
- **Vite** dev server / bundler
- No UI framework — a small hand-rolled component set + a single CSS theme

## Structure

```
index.html              Vite entry HTML (mounts #canvas)
vite.config.ts          Vite + React plugin config
tsconfig.json           strict TypeScript config
src/
  main.tsx              React entry point
  App.tsx               app shell: data fetch, loading/error, tabs, filter, modal
  types.ts              domain types mirroring the Go backend JSON contract
  styles.css            executive light theme (design tokens + components)
  api/
    client.ts           typed fetch client: token, auth, generic CRUD, 401 handling
  auth/
    AuthContext.tsx     auth provider + useAuth() (login / logout / session check)
  lib/
    status.ts           status/tone helpers + meta-array → lookup-map
  hooks/
    useDashboard.ts     fetch + enrich dashboard (loading/ready/error state)
    useScale.ts         scale the 1920×1080 canvas to the viewport
    useLogo.ts          drag-and-drop logo persisted in localStorage
  components/
    Login.tsx           login screen
    Icon.tsx            inline SVG icon set
    ui.tsx              Panel, Kpi, Stat, Bar, Pill, StatusPill
    Clock.tsx           live clock
    ProgressChart.tsx   plan-vs-actual SVG line chart
    panels.tsx          overview war-room panels
    focus.tsx           full-tab / modal detail views + FOCUS_META registry
  master/
    schema.ts           declarative field/column schema per editable resource
    ResourceManager.tsx generic table + create/edit form + delete (one resource)
    MasterData.tsx      master-data workspace (resource nav + manager)
```

## Authentication & master data

The app is gated by a login screen. Sign in with a seeded demo account
(`admin / admin123` or `spv / spv12345`); the bearer token is stored in
`localStorage` and attached to every request. A `401` clears the session and
returns you to the login screen. Log out from the user chip in the header.

The **Master Data** tab is a schema-driven CRUD workspace covering every entity
shown on the dashboard — projects, contractors, complaints, site & handover
readiness, AI insights, decisions, KPIs and triggers. Adding a new editable
resource is just another entry in `src/master/schema.ts`.

The TypeScript types in `src/types.ts` are the exact counterpart of the Go
structs in `backend/teknik/internal/domain` — keep them in sync.

## Develop

```bash
cd frontend/teknik
npm install

# Start the backend first (see backend/teknik/README.md) — it serves :8083
npm run dev          # Vite dev server on a dynamic free port (printed on startup)
```

### Dev/preview port (via `.env`)

The port lives in [`.env`](.env) (copy from [`.env.example`](.env.example)):

```dotenv
VITE_PORT=5174                     # kosongkan untuk port dinamis (otomatis bebas)
VITE_API_BASE=http://localhost:8083
```

Resolution priority (highest first):

1. shell env — `PORT` / `VITE_PORT` (e.g. `PORT=4321 npm run dev`)
2. `.env` file — `VITE_PORT`
3. fallback — a free ephemeral port chosen at startup (printed on the console)

`strictPort` is on, so an explicitly requested port that is already in use fails
loudly instead of silently moving to another port.

## Build & preview

```bash
npm run build        # type-check (tsc) + production bundle into dist/
npm run preview      # serve the built bundle
npm run typecheck    # type-check only
```

## Configuration

All configuration lives in [`.env`](.env):

| Variable        | Default                  | Description                                   |
| --------------- | ------------------------ | --------------------------------------------- |
| `VITE_PORT`     | `5174`                   | Dev/preview port (empty → dynamic free port)  |
| `VITE_API_BASE` | `http://localhost:8083`  | Backend API base URL                          |

Shell environment variables take precedence over `.env`. Use `.env.local` for
machine-specific overrides (git-ignored).

## Notes

- If the API is unreachable the dashboard shows an error screen with a **retry** button.
- Drag & drop an image onto the header logo box to set the Greenpark logo (stored locally).
- Click any project row to open its deep-dive; use the tabs for full-screen detail views.
