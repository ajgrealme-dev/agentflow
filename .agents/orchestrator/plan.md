# AgentFlow Sub-menu Navigation & Interactive Simulator Synchronization Execution Plan

## Objective
Synchronize Sidebar dropdown sub-menu query parameters (`?tab=...&tool=...`) across all 8 division pages, ensure target tools are highlighted with visual glow effects when specified via URL query params, trigger interactive execution logs in terminal console when run buttons are clicked, and verify Next.js production build (`npm run build`) with proper Suspense wrapping for `useSearchParams()`.

## Decomposition & Milestones

### Milestone 1: Exploration & Navigation Mapping
- **Goal**: Read-only investigation of the codebase to map the 8 division pages, Sidebar dropdown sub-menus, tab state management, tool container components, terminal console log trigger mechanisms, and Suspense boundary usage.
- **Agent Directory**: `.agents/teamwork_preview_explorer_m1_1`
- **Output**: Comprehensive mapping of all 8 division pages (`/attendance`, `/purchasing`, etc.), Sidebar links, tab/tool structures, terminal console event/state mechanism, and build/Suspense status.

### Milestone 2: Sidebar Dropdown Sub-menu Link Synchronization
- **Goal**: Update and synchronize all sub-menu links in `src/components/Sidebar.tsx` (and related navigation components) so each sub-menu item links to its corresponding division page with valid query parameters (`?tab=<tab_id>&tool=<tool_id>`).
- **Agent Directory**: `.agents/teamwork_preview_worker_m2`
- **Output**: Sidebar sub-menus point to proper division routes with `?tab=...&tool=...`.

### Milestone 3: Division Page Query Param Detection & Visual Glow Effect
- **Goal**: Update all 8 division pages (and shared tab/tool components) to read `?tool=...` and `?tab=...` using `useSearchParams()`, auto-activate the matching tab, and apply visual glow effects (`animate-pulse` and ring/glow border) to the target tool container element.
- **Agent Directory**: `.agents/teamwork_preview_worker_m3`
- **Output**: All 8 division pages detect `tool` query param, select correct tab, and apply glow styling to target tool containers.

### Milestone 4: Interactive Simulator & Terminal Console Execution Log Synchronization
- **Goal**: Ensure that clicking the run action button on any highlighted/selected tool triggers realistic autonomous execution simulation logs in the division terminal console matching the tool's task description.
- **Agent Directory**: `.agents/teamwork_preview_worker_m4`
- **Output**: Clicking run buttons streams/appends autonomous log entries to the terminal console simulator.

### Milestone 5: Production Build Verification & Suspense Boundary Compliance
- **Goal**: Verify that `npm run build` succeeds without compilation errors or `useSearchParams()` runtime deoptimization warnings by ensuring proper `<Suspense>` boundaries around all page components using `useSearchParams()`. Run full verification cycle (Reviewers, Challenger, Forensic Auditor).
- **Agent Directory**: `.agents/teamwork_preview_worker_m5`, `.agents/teamwork_preview_reviewer_m5_1`, `.agents/teamwork_preview_reviewer_m5_2`, `.agents/teamwork_preview_auditor_m5`
- **Output**: Verified clean build, 100% route Suspense wrapping, passing reviewer & auditor verdicts.
