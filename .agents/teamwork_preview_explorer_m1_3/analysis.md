# Feature Design and Scraper Integration Analysis

## 1. Executive Summary
This report analyzes the design architecture, card components, layouts, spacing, colors, and scraper integration across target feature pages in **AgentFlow ERP**:
- **Dashboard (`src/app/page.tsx`)**
- **Finance Monitor (`src/app/finance/page.tsx`)**
- **Attendance Monitor (`src/app/attendance/page.tsx`)**
- **Reports Center (`src/app/reports/page.tsx`)**
- **B2B Client Prospector (`src/app/leads/page.tsx`)**

Key Findings:
1. There is no separate frontend page for `/scraper`. Instead, scraping is triggered via chat command in the **Command Center (`/command`)** which hits the `/api/scraper` endpoint, and results are persisted and displayed in the **B2B Client Prospector (`/leads`)** dashboard.
2. The UI exhibits strong consistency, using shared design systems such as `.glass-premium` cards, custom stat card layouts, and responsive grids (`grid grid-cols-2 lg:grid-cols-4 gap-4`).
3. Theme-switching between light and dark modes is deeply integrated using Tailwind's `dark:` classes and CSS custom properties (variables) defined in `globals.css`.

---

## 2. Analysis of Card Designs

### 2.1. `StatsCard` Component (`src/components/StatsCard.tsx`)
`StatsCard` is a reusable component used to highlight key metrics.
- **Card Container**:
  ```tailwind
  relative overflow-hidden rounded-2xl ${c.bg} border ${c.border} p-5 hover:scale-[1.02] transition-transform duration-200
  ```
- **Icon Container**:
  ```tailwind
  w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0
  ```
- **Typography & Details**:
  - Value: `text-3xl font-extrabold tracking-tight ${c.value}`
  - Title: `text-primary font-semibold text-sm mt-1`
  - Subtitle: `text-secondary text-xs mt-0.5`
  - Trend: `flex items-center gap-1 mt-2 text-xs font-semibold ${trend.positive ? 'text-emerald-600 ...' : 'text-red-600 ...'}`
- **Decorative Glow**:
  - Rendered at the bottom-right: `absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 ${c.icon} blur-xl`
- **Dynamic Colors Map**:
  | Color Key | Background (`bg`) | Border (`border`) | Icon Wrapper (`icon`) | Value (`value`) |
  | :--- | :--- | :--- | :--- | :--- |
  | **violet** | `bg-indigo-50/50 dark:bg-indigo-950/20` | `border-indigo-100 dark:border-indigo-900/30` | `bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400` | `text-indigo-600 dark:text-indigo-400` |
  | **emerald**| `bg-emerald-50/50 dark:bg-emerald-950/20`| `border-emerald-100 dark:border-emerald-900/30`| `bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400`| `text-emerald-600 dark:text-emerald-400`|
  | **amber**  | `bg-amber-50/50 dark:bg-amber-950/20` | `border-amber-100 dark:border-amber-900/30` | `bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400` | `text-amber-600 dark:text-amber-400` |
  | **blue**   | `bg-blue-50/50 dark:bg-blue-950/20`  | `border-blue-100 dark:border-blue-900/30`  | `bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`  | `text-blue-600 dark:text-blue-400`  |
  | **red**    | `bg-red-50/50 dark:bg-red-950/20`   | `border-red-100 dark:border-red-900/30`   | `bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400`   | `text-red-600 dark:text-red-400`   |

### 2.2. `AgentCard` Component (`src/components/AgentCard.tsx`)
`AgentCard` displays status information for individual AI agents.
- **Card Container**:
  ```tailwind
  bg-card border border-light rounded-2xl p-5 hover:scale-[1.02] transition-all duration-200 shadow-sm
  ```
- **Header Structure**:
  - Contains Agent icon (text-2xl) and meta (`text-primary font-bold text-sm`, `text-secondary text-xs`).
  - Status badge utilizes a `statusConfig` lookup table for tailwind styling depending on running/idle/error/paused status.
- **Status Configuration styles**:
  - `running`: `bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400` with pulse dot (`bg-emerald-500 animate-pulse`).
  - `idle`: `bg-slate-50 dark:bg-zinc-800/40 border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400` with solid gray dot (`bg-gray-500`).
  - `error`: `bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400` with pulse red dot (`bg-red-500 animate-pulse`).
  - `paused`: `bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400` with solid amber dot (`bg-amber-500`).
- **Current Task Box**:
  - Inner card: `bg-elevated border border-light rounded-xl p-3 mb-4`.
- **Uptime/Error Stats Grid**:
  - 3-column split: `grid grid-cols-3 gap-3` with `text-center`. The middle column has `border-x border-light` to create borders between columns.
- **Footer**:
  - `mt-3 pt-3 border-t border-light flex items-center gap-1.5`.

### 2.3. Page Content Cards (`glass-premium` vs `bg-card`)
The layout container for cards varies across pages.
1. **Dashboard & Leads Pages**: Rely on `.glass-premium` style cards.
   - Light Mode: `background: rgba(255, 255, 255, 0.65)`, `backdrop-filter: blur(24px)`, `border: 1px solid rgba(0, 0, 0, 0.05)`, and `box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.03)`.
   - Dark Mode: `background: rgba(22, 27, 34, 0.65)`, `border: 1px solid rgba(255, 255, 255, 0.06)`, and `box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4)`.
   - Hover Action: `transform: translateY(-2px)`, border turns light indigo (`rgba(79, 70, 229, 0.25)`) or light blue (`rgba(88, 166, 255, 0.25)`) with a matching glow shadow.
2. **Finance, Attendance & Reports Pages**: Rely on traditional `bg-card` cards.
   - Style: `bg-card border border-light rounded-2xl shadow-sm`.
   - Header inside content card is typically separated by `border-b border-light` and padded with `px-6 py-4` or `p-5`.

---

## 3. Layout Grids, Spacing, and Colors

### 3.1. Grid Layouts & Spacing
- **Stats Row Layout**: All five pages share the identical top-level stats responsive grid structure:
  ```tailwind
  grid grid-cols-2 lg:grid-cols-4 gap-4
  ```
  This renders 2 columns on mobile/tablet and 4 columns on desktop.
- **Main Section layouts**:
  - **Dashboard**: `grid grid-cols-1 xl:grid-cols-3 gap-6`. The left column spans 2 columns (`xl:col-span-2 space-y-6`), while the right column spans 1 (`space-y-6`).
  - **Finance & Attendance**: Linear stacked layout with `space-y-6`.
  - **Reports**: `grid grid-cols-1 xl:grid-cols-2 gap-6` for detail sections, creating a 50/50 split on desktop.
  - **Leads**: `grid grid-cols-1 lg:grid-cols-3 gap-6`. The left column lists leads (`lg:col-span-2 space-y-3`), while the right column contains sticky details (`lg:col-span-1`).
- **Toolbar Layout**: In Finance, Attendance, and Reports pages:
  - Toolbar container: `bg-card border border-light rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3`.
  - Search input: `relative flex-1 min-w-0` with input padding: `pl-9 pr-3 py-2`.

### 3.2. Color Palettes
The application styles are driven by custom design tokens mapped in `globals.css` to light and dark theme variables:
- **`--bg-base`**: `#ffffff` (light) / `#0d1117` (dark)
- **`--bg-card`**: `#f8fafc` (light) / `#161b22` (dark)
- **`--bg-elevated`**: `#f1f5f9` (light) / `#21262d` (dark)
- **`--bg-hover`**: `#e2e8f0` (light) / `#30363d` (dark)
- **`--border`**: `#e2e8f0` (light) / `#30363d` (dark)
- **`--border-light`**: `#cbd5e1` (light) / `#8b949e` (dark)
- **`--text-primary`**: `#0f172a` (light) / `#c9d1d9` (dark)
- **`--text-secondary`**: `#475569` (light) / `#8b949e` (dark)
- **`--text-muted`**: `#94a3b8` (light) / `#484f58` (dark)

Active primary actions utilize `var(--primary)` which maps to indigo `#4f46e5` (light) and blue `#58a6ff` (dark).

---

## 4. Scraper Route & UI Mapping Analysis

### 4.1. Mapping of /scraper
There is **no separate frontend page under `/scraper`** in the application. Any attempts to access `/scraper` directly in the browser will result in a 404 (or default fallback routing), since there is no `scraper/page.tsx` file inside `src/app`.
Instead, the scraper integration is divided into three parts:
1. **Trigger Engine**: Command Center (`src/app/command/page.tsx`)
2. **Execution Endpoint**: API Route (`src/app/api/scraper/route.ts`)
3. **Data Monitor**: Leads Page (`src/app/leads/page.tsx` - B2B Client Prospector)

### 4.2. Scraper Element Usage in the Leads Page
The **Leads page** (`src/app/leads/page.tsx`) acts as the user interface for monitoring and qualifying results gathered from the scraper. It utilizes the following scraper elements:

1. **Scraping Status & Source Badges**:
   - Leads listed on the left display a specific badge showing their source (e.g. `UPWORK`, `LINKEDIN`, `JOBSTREET`).
   - The card footer explicitly lists `"Dipindai otonom oleh bot scraper"`.
2. **Search and Source Filters**:
   - The filters toolbar includes a **Source Filter** (`Sumber`) with options for `Upwork`, `LinkedIn`, and `Jobstreet`, matching the search targets of the job scraper bot.
   - The **Status Filter** lets users filter by `New`, `Pitched`, or `Disqualified`, aligning with the automation state of the scraper.
3. **AI Match Score**:
   - The `aiScore` property calculated by the scraper's heuristic/AI algorithms is displayed as `AI Match: X%` on each list item. High match scores ($\ge 85\%$) are highlighted in teal.
4. **Integration Notice Banner**:
   - Shows a notification box when `companyId` is loaded:
     > *"Menghubungkan scraping otonom Anda: Gunakan ID Perusahaan Anda [ID] di dalam file .env scraper bot Anda sebagai COMPANY_ID untuk menyinkronkan data secara otonom!"*
     
     This demonstrates that the scraper bot (`job-scraper-bot`) can run independently (e.g., as a scheduled cron job or daemon on a machine) and sync leads to the Next.js database using the `/api/leads` API endpoint with the company's identifier.

### 4.3. Execution Flow Detail (Chat to DB Sync)
1. **Triggering**: A user types a search request in Command Center (e.g. *"cari klien logistik di Serang"*).
2. **Intent Parsing**: The `api/command` endpoint matches this to the `cari_klien` action and parses parameters (`industry = Logistik`, `location = Serang`, etc.).
3. **Execution**: The Command Center page sends a POST request to `/api/scraper` containing parameters.
4. **Python Spawn**: The endpoint `/api/scraper/route.ts` runs the python script `scraper_runner.py` inside the `job-scraper-bot` project via `child_process.spawn`.
5. **Bing Search Scraping**: `scraper_runner.py` executes Bing search dorks across LinkedIn, Loker.id, SerangID, and company sites. It extracts names, urls, descriptions, and contacts (emails), assigns an AI score, and prints the result as a JSON string to stdout.
6. **Result Display & CRM Save**: The Command Center reads stdout, displays found leads in the chat feed, and recommends saving them to CRM. Typing `"simpan ke CRM"` (or posting data to `/api/leads` POST route) persists them to the PostgreSQL database via Prisma under the matching `companyId`.
7. **CRM Monitoring**: Saved leads instantly display in B2B Client Prospector (`src/app/leads/page.tsx`) for status tracking.
