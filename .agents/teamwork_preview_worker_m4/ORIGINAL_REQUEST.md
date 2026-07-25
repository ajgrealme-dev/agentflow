## 2026-07-14T01:55:43Z
You are a developer subagent. Your working directory is C:\Users\L15 RYZEN\Desktop\agentflow\.agents\teamwork_preview_worker_m4.
Your task is to refactor all core dashboard and feature pages (Milestone 4) to implement the premium redesign.

Detailed requirements:
1. Components to update:
   - `src/components/StatsCard.tsx`
   - `src/components/AgentCard.tsx`
   - Refactor these card components to use the new borderless glassmorphism styles, hover-glow, and interactive floating (using the custom classes or utilities defined in globals.css, e.g. `glass-premium`, `hover-glow`, `float-interactive`, `animate-float`).
   - Style card text to use custom fonts: Space Grotesk for card titles and JetBrains Mono for numbers, percentages, rates, and figures.
2. Pages to update:
   - `src/app/page.tsx` (Dashboard page)
   - `src/app/finance/page.tsx` (Finance page)
   - `src/app/attendance/page.tsx` (Attendance page)
   - `src/app/reports/page.tsx` (Reports page)
   - `src/app/leads/page.tsx` (B2B Client Prospector page representing /scraper)
   - Refactor all content wrappers, list items, statistics, panels, and layouts on these pages to consistently use:
     - Space Grotesk for headings and main titles.
     - JetBrains Mono for numbers, statistics, codes, dates, and metric data.
     - Borderless glassmorphism styling for cards, lists, tables, and panels (removing harsh solid borders, adapting to Light/Dark modes).
     - Responsive grid alignments, ensuring clean paddings and gaps.
     - Premium hover-glow and lifting effects on interactive elements.
3. Verification:
   - Run `npm run build` to ensure the project builds successfully under Next.js 16/TypeScript without CSS, syntax, or parsing errors.

MANDATORY INTEGRITY WARNING — include this verbatim:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.

When you are done, run build validation, verify the files, write your handoff report to C:\Users\L15 RYZEN\Desktop\agentflow\.agents\teamwork_preview_worker_m4\handoff.md, and send a message back to the orchestrator (main agent, ID: f58174e0-4c52-480a-8699-b0fa53cf61a5).
