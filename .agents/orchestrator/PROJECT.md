# Project: AgentFlow Sub-menu Navigation & Interactive Simulator Synchronization

## Architecture
- Next.js App Router application (`src/app/`)
- Sidebar Navigation Component (`src/components/Sidebar.tsx`)
- 8 Division Pages (`/finance`, `/attendance`, `/purchasing`, `/tech`, `/legal`, `/marketing`, `/customer`, `/strategy`)
- Division layout / shared UI components (`LayoutShell`, terminal console log, tool card containers)

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Mapping | Inspect all 8 division pages, Sidebar, query params, tool components | none | DONE |
| 2 | Sidebar Link Sync | Update `Sidebar.tsx` dropdown links to include `?tab=...&tool=...` | M1 | DONE |
| 3 | Query Param & Glow Effect | Update 8 division pages to detect `?tool=...`, activate tab, and apply glow styling | M1, M2 | DONE |
| 4 | Simulator & Log Execution | Wire run action buttons to stream autonomous simulation logs in terminal console | M3 | DONE |
| 5 | Build & Suspense Verification | Ensure `npm run build` succeeds cleanly with Suspense boundaries around `useSearchParams()`. Verification & Audit. | M4 | DONE |

## Interface Contracts
- Query parameter standard: `?tab=<tab_id>&tool=<tool_id>`
- Visual glow effect classes: `ring-2 ring-primary border-primary animate-pulse shadow-lg shadow-primary/20 transition-all duration-300` on target tool container
- Terminal console state/callback: tool execution triggers log messages in terminal simulator
