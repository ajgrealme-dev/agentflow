# AgentFlow Codebase Analysis & Mapping Report
**Milestone 1: Exploration & Navigation Mapping**  
**Date**: 2026-07-22  
**Target Repository**: `c:\Users\L15 RYZEN\Desktop\agentflow`  
**Explorer Agent**: `teamwork_preview_explorer_m1_1`

---

## Executive Summary
This report provides a comprehensive, read-only architectural analysis of the AgentFlow platform. It documents the structure and navigation of all 8 chief division pages in `src/app/`, the Sidebar sub-menu configuration, tab and URL query parameter handling (`?tab=...&tool=...`), tool card containers, visual glow/highlight animations, terminal console execution streaming, and Next.js `<Suspense>` boundary wrapping for `useSearchParams()`.

---

## 1. Division Pages Mapping (`src/app/`)

AgentFlow features 8 chief division pages. Below is the mapping of their route paths, page component files, and internal tab/feature structures:

| Division Name | Route Path | Component File | Default Tab | All Tab Names | Sub-Components & Key Actions |
|---|---|---|---|---|---|
| **Keuangan AI** | `/finance` | `src/app/finance/page.tsx` | `invoices` | `invoices`, `scanner`, `receipts` | Invoices AR/AP Table, `DropZone` Vision OCR (`/api/ocr`), Cash Flow Receipts Table, `sendWhatsAppReminder` |
| **SDM AI** | `/attendance` | `src/app/attendance/page.tsx` | `contractors` | `contractors`, `payroll`, `performance`, `ai_agents` | Contractor Geofence Attendance Table, Payroll & BPJS, L&D OKR Cards, HR AI Agents grid, Payroll Dispatcher log |
| **Pengadaan AI** | `/purchasing` | `src/app/purchasing/page.tsx` | `requisitions` | `requisitions` (from `pr`), `leads` (from `rfq`), `inventory` | Purchase Requisitions Table, B2B Prospector Leads Table (`selectedLead` modal), Warehouse SKU Inventory, Warehouse Auditor log |
| **Teknologi AI** | `/tech` | `src/app/tech/page.tsx` | `cloud` | `cloud`, `security`, `cicd` | Cloud Cost & RAM Optimizer Card, Vulnerability SOC Scanner Card, Real-time Server AI log |
| **Hukum AI** | `/legal` | `src/app/legal/page.tsx` | `contracts` | `contracts`, `aml`, `opinions` | Contract Risk Analyzer (`riskIssues` list), AML & PEP Sanction Screening (`amlResult`), AI Legal Counsel log |
| **Pemasaran AI** | `/marketing` | `src/app/marketing/page.tsx` | `ads` | `ads`, `social`, `creative` | Ads Campaign Table, Copywriting Generator (Instagram/TikTok/LinkedIn), Creative Asset Production cards, AI Optimizer log |
| **Layanan Pelanggan AI** | `/customer` | `src/app/customer/page.tsx` | `bot` | `bot`, `sentiment`, `tickets` | Live CS Chatbot Simulator (`chatMessages`), Sentiment & CSAT Cards, Complaint Tickets Table (`runTicketResolution`), Support Dispatcher log |
| **Strategi & Risiko AI** | `/strategy` | `src/app/strategy/page.tsx` | `scenario` | `scenario`, `erm`, `kpi` | Monte Carlo Business Scenario Planner (`simResult`), 5x5 ERM Risk Matrix Grid, Executive KPI Gauges, Strategy Officer log |

### Non-Division Routes
- `/` (`src/app/page.tsx`): Main Executive Dashboard.
- `/workbench` (`src/app/workbench/page.tsx`): Interactive 142 AI Agent Pyramid Canvas, Real Human Approval Queue (`/api/tasks`), Real Multi-Agent Rapat Sessions (`/api/agents/session`), Tools Sandbox Tester (`/api/agents/test-tool`).
- `/agents` (`src/app/agents/page.tsx`): AI Agent directory & listing.
- `/command` (`src/app/command/page.tsx`): Command Chatbot interface.
- `/analytics` (`src/app/analytics/page.tsx`): Analytics reporting.
- `/reports` (`src/app/reports/page.tsx`): Financial & Operational reports.
- `/tasks` (`src/app/tasks/page.tsx`): Task management queue.
- `/settings` (`src/app/settings/page.tsx`): System & role settings.
- `/queue` (`src/app/queue/page.tsx`): Real-time queue inspection.
- `/demo` (`src/app/demo/page.tsx`): Interactive demo mode.
- `/leads` (`src/app/leads/page.tsx`): B2B Lead prospecting view.
- `/login` (`src/app/login/page.tsx`): Role authentication gate.

---

## 2. Sidebar Navigation & Dropdown Link Configuration (`src/components/Sidebar.tsx`)

### Structure & Mechanics
- **File**: `src/components/Sidebar.tsx`
- **State Management**:
  - `expandedMenus`: Record of expanded dropdown states per division route (e.g. `{ '/finance': true }`).
  - Auto-expansion: `useEffect` monitors `pathname` and auto-expands the sub-menu if `pathname.startsWith(item.href)`.
  - Manual expansion: Chevron button (`ChevronDown`) triggers `toggleSubMenu(href, e)` with `e.preventDefault()` and `e.stopPropagation()`.
  - Parent Link: Clicking the main nav item directly navigates to `href` (e.g. `/finance`).

### Detailed Sub-Menu Links List
Each division in `Sidebar.tsx` contains 6 to 7 sub-menu items combining `?tab=...` and `?tool=...`:

1. **Keuangan AI (`/finance`)**:
   - `/finance?tab=invoices` — 🧾 Rekap Invoice AR/AP
   - `/finance?tab=scanner` — ✨ Scan & OCR Dokumen
   - `/finance?tab=receipts` — 💵 Rekap Bon Cash (Arus Kas)
   - `/finance?tool=reminder` — ⏰ Reminder Utang/Piutang
   - `/finance?tool=create` — 📝 Buat Invoice Baru
   - `/finance?tool=reconcile` — 🔄 Rekonsiliasi Bank
   - `/finance?tool=export` — 📤 Ekspor Laporan PDF/Excel

2. **SDM AI (`/attendance`)**:
   - `/attendance?tab=attendance` — ⏱️ Absensi & Geofence (Note: Page expects `contractors`)
   - `/attendance?tab=payroll` — 📋 Penggajian (Payroll) & BPJS
   - `/attendance?tab=performance` — 🎓 Evaluasi Kinerja (L&D)
   - `/attendance?tool=leave` — 📅 Kelola Pengajuan Cuti
   - `/attendance?tool=contract` — 📝 Kontrak PKWT & Perpanjangan
   - `/attendance?tool=violation` — ⚠️ Surat Peringatan (SP)
   - `/attendance?tool=report` — 📊 Laporan SDM Bulanan

3. **Pengadaan AI (`/purchasing`)**:
   - `/purchasing?tab=pr` — 🛒 Draf Requisition (PR) (Page maps to `requisitions`)
   - `/purchasing?tab=rfq` — 🏬 Analisis Vendor & RFQ (Page maps to `leads`)
   - `/purchasing?tab=inventory` — 📦 Manajemen Stok Gudang
   - `/purchasing?tool=so` — 📋 Sales Order Matching
   - `/purchasing?tool=supplier` — 🏪 Database & Rating Supplier
   - `/purchasing?tool=delivery` — 🚚 Tracking Pengiriman
   - `/purchasing?tool=report` — 📊 Laporan Pengadaan

4. **Teknologi AI (`/tech`)**:
   - `/tech?tab=cloud` — 🌐 Audit Cloud & Cost Optimizer
   - `/tech?tab=security` — 🛡️ Pemindaian SOC Security
   - `/tech?tab=cicd` — 🚀 Auto-Deploy Pipeline CI/CD
   - `/tech?tool=uptime` — 🖥️ Monitoring Uptime Server
   - `/tech?tool=iam` — 🔒 Audit Akses IAM & Enkripsi
   - `/tech?tool=backup` — ⚡ Disaster Recovery & Backup

5. **Hukum AI (`/legal`)**:
   - `/legal?tab=contracts` — ⚖️ Review Kontrak & PKS
   - `/legal?tab=aml` — 📜 Audit Kepatuhan AML/KYC
   - `/legal?tab=opinions` — 📌 Draf Legal Opinion
   - `/legal?tool=permit` — 🏢 Audit NIB & Izin Usaha
   - `/legal?tool=nda` — 📑 NDA & Hak Kekayaan Intelektual
   - `/legal?tool=litigation` — 🔍 Risk Assessment Somasi

6. **Pemasaran AI (`/marketing`)**:
   - `/marketing?tab=ads` — 📣 Optimizer Campaign Ads
   - `/marketing?tab=social` — 📱 Generator Medsos
   - `/marketing?tab=creative` — 🎨 Produksi Banner & Aset
   - `/marketing?tool=roas` — 📈 Analisis ROAS & Konversi
   - `/marketing?tool=email` — 💌 Email Marketing Automation
   - `/marketing?tool=seo` — 🔍 Keyword & SEO Tracking

7. **Layanan Pelanggan AI (`/customer`)**:
   - `/customer?tab=bot` — 🎧 Chatbot CS 24/7
   - `/customer?tab=sentiment` — 📊 Analisis Sentiment Klien
   - `/customer?tab=tickets` — 🚨 Eskalasi Tiket Komplain
   - `/customer?tool=review` — ⭐ Auto-Reply Rating Toko
   - `/customer?tool=voice` — 📞 Voice Bot Call Center
   - `/customer?tool=csat` — 🎯 Customer Index (CSAT)

8. **Strategi & Risiko AI (`/strategy`)**:
   - `/strategy?tab=scenario` — 🎯 Simulasi Skenario Bisnis
   - `/strategy?tab=erm` — ⚠️ Risk Assessment (ERM)
   - `/strategy?tab=kpi` — 📊 Dashboard KPI Eksekutif
   - `/strategy?tool=cashflow` — 💸 Peramalan Flow Bunga
   - `/strategy?tool=expansion` — 🌐 Evaluator Ekspansi Bisnis
   - `/strategy?tool=radar` — 🔍 Market Intelligence Radar

---

## 3. Tab, Query Parameter, Tool Cards, and Glow Effects Inspection

### Query Parameter Discrepancy (Critical Finding)
- **Observed Behavior**: All 8 division pages use `useSearchParams()` from `next/navigation` inside a `useEffect` hook to synchronize `activeTab`.
- **Query Parameter Handling**:
  - `finance/page.tsx`: Reads `searchParams.get('tab')` (`invoices`, `scanner`, `receipts`).
  - `attendance/page.tsx`: Reads `searchParams.get('tab')` (`contractors`, `payroll`, `performance`, `ai_agents`).
  - `purchasing/page.tsx`: Reads `searchParams.get('tab')` (`requisitions`, `leads`, `inventory`, `pr`, `rfq`).
  - `tech/page.tsx`: Reads `searchParams.get('tab')` (`cloud`, `security`, `cicd`).
  - `legal/page.tsx`: Reads `searchParams.get('tab')` (`contracts`, `aml`, `opinions`).
  - `marketing/page.tsx`: Reads `searchParams.get('tab')` (`ads`, `social`, `creative`).
  - `customer/page.tsx`: Reads `searchParams.get('tab')` (`bot`, `sentiment`, `tickets`).
  - `strategy/page.tsx`: Reads `searchParams.get('tab')` (`scenario`, `erm`, `kpi`).
- **Gaps / Unhandled Parameters**:
  - **`?tool=...` parameters are NOT handled**: None of the 8 division pages read `searchParams.get('tool')`. Clicking a dropdown link with `?tool=...` (e.g. `/finance?tool=reminder` or `/attendance?tool=leave`) navigates to the page but does NOT activate, scroll to, or highlight any corresponding tool card or modal.
  - **`?tab=attendance` mismatch**: `Sidebar.tsx` links to `/attendance?tab=attendance`, but `attendance/page.tsx` expects `tab === 'contractors'`.

### Visual Highlight & Glow Effects
- **Status Badges & Warnings**:
  - `finance/page.tsx` line 355: `inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'`
  - `customer/page.tsx` line 126: `<span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />` (live chat indicator)
  - `attendance/page.tsx` line 442: `<Cpu size={16} className="text-primary animate-pulse" />`
- **Borders & Hover Glows**:
  - Active tab headers: `border-b-2 border-primary text-primary`.
  - Tool cards: `hover:border-primary/50 transition-all`, `border-light`, `bg-card`, `bg-elevated`.

---

## 4. Terminal Console Simulator Inspection

### Architecture & Log Triggering Mechanics
In 7 out of 8 division pages (all except `finance/page.tsx`), a dedicated terminal console panel is embedded to display simulated execution logs when an AI tool action button is clicked.

- **UI Structure**:
  ```tsx
  <div className="bg-card border border-light p-5 rounded-2xl flex flex-col h-[380px]">
    <span className="text-xs font-bold text-primary flex items-center gap-1.5 mb-3 font-mono">
      <Terminal size={14} className="text-primary" /> Log [Division Specific Title]:
    </span>
    <div className="flex-1 bg-black/90 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-y-auto space-y-1.5 border border-white/10">
      {logOutput.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  </div>
  ```
- **Log Streaming / Appending Logic**:
  Execution logs are handled using state arrays (`logOutput` or `simLogs` or `stockLogs`).
  When an action button (e.g. "Kirim Slip", "Mulai Audit Stok", "Jalankan Audit Infrastructure", "Review Resiko Kontrak", "Optimasi Iklan") is clicked:
  1. `setRunning(true)` is set.
  2. Initial log message is appended immediately: `[SYS] Memulai...`.
  3. Subsequent log steps are streamed asynchronously via cascading `setTimeout` delays (e.g. at 500ms, 1200ms, 2000ms).
  4. Final `[SUCCESS]` or `[COMPLETE]` message is appended and `setRunning(false)` is set.

---

## 5. Next.js `<Suspense>` Boundaries & `useSearchParams()` Audit

### Findings
1. **Usage of `useSearchParams()`**:
   - `useSearchParams()` is imported from `next/navigation` in all 8 division pages:
     - `src/app/attendance/page.tsx`
     - `src/app/customer/page.tsx`
     - `src/app/finance/page.tsx`
     - `src/app/legal/page.tsx`
     - `src/app/marketing/page.tsx`
     - `src/app/purchasing/page.tsx`
     - `src/app/strategy/page.tsx`
     - `src/app/tech/page.tsx`
2. **Suspense Boundary Verification**:
   - **Root Layout Shell**: `src/components/LayoutShell.tsx` wraps `{children}` inside a top-level `<Suspense>` boundary:
     ```tsx
     <main ...>
       <Suspense fallback={
         <div className="min-h-screen flex items-center justify-center bg-base text-secondary text-xs">
           <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
           Memuat Halaman...
         </div>
       }>
         {children}
       </Suspense>
     </main>
     ```
   - **Page Level**: None of the 8 division pages contain an internal `<Suspense>` wrapper inside their own `page.tsx` files. Because `LayoutShell.tsx` wraps `{children}`, the client-side `useSearchParams()` hooks fall under the `LayoutShell` Suspense boundary.
