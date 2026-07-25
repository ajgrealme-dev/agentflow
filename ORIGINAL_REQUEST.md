# Original User Request

## Initial Request — 2026-07-13T19:49:40+07:00

Melakukan audit, pengujian (testing) mendetail, dan perbaikan bug (bug fixing) pada seluruh backend API Next.js dan sistem bot Telegram dari aplikasi SaaS ERP untuk memastikan tidak ada error yang tersisa dan siap untuk level produksi.

Working directory: C:\Users\L15 RYZEN\Desktop\agentflow

Integrity mode: benchmark

## Requirements

### R1. Pembuatan Automated API Test Suite
Agen harus membuat sekumpulan script pengujian otomatis (automated test suite) untuk memvalidasi seluruh endpoint API backend Next.js (`/api/finance`, `/api/attendance`, `/api/reports`, `/api/scraper`, `/api/command`).

### R2. Audit Kode & Perbaikan Edge Cases
Agen wajib melakukan analisis mendalam terhadap file API dan `bot.js`, lalu memperbaiki potensi bug, unhandled promise rejections, serta menangani error saat menerima payload yang tidak wajar (invalid inputs).

### R3. Pengujian Ketahanan Telegram Bot
Agen harus merancang sebuah metode untuk memverifikasi fungsionalitas `bot.js` (Telegram Bot) untuk memastikan bot tidak crash saat menerima pesan spam, format file yang salah, atau akses dari chat ID yang tidak memiliki izin (unauthorized).

## Acceptance Criteria

### API Reliability
- [ ] Tersedia sebuah script `test_api.js` (atau menggunakan framework test seperti Jest) yang dapat dijalankan via terminal.
- [ ] Script pengujian menguji endpoint dengan data valid (harus sukses) maupun data invalid/kosong (harus merespons dengan HTTP status code yang tepat seperti 400/500, tanpa membuat server Next.js crash).
- [ ] Eksekusi script testing mengeluarkan laporan hasil di terminal dengan status 100% Passed.

## Follow-up Request — 2026-07-14T08:43:23+07:00

Melakukan perombakan ulang (redesign) UI/UX pada seluruh halaman dashboard SaaS ERP Next.js untuk mencapai standar kualitas premium kelas dunia. Desain harus menggabungkan estetika minimalis (Vercel/Stripe), mode gelap glassmorphism, navigasi sidebar yang dapat dilipat, tipografi *tech-analytic*, serta animasi interaktif 3D saat elemen di-hover.

Working directory: C:\Users\L15 RYZEN\Desktop\agentflow

Integrity mode: benchmark

## Requirements

### R1. Implementasi Sistem Desain Premium
Terapkan sistem desain visual berikut pada seluruh komponen utama:
*   Warna & Tema: Mode Terang putih bersih. Mode Gelap hitam pekat dengan aksen putih mengkilap (glassmorphism).
*   Navigasi: Buat Collapsible Left Sidebar yang menghemat ruang.
*   Kartu (Cards): Terapkan Borderless Glassmorphism (latar transparan blur, border putih tipis).
*   Tipografi: Gunakan Space Grotesk (judul) dan JetBrains Mono (angka/data).
*   Interaksi: Tambahkan efek Hover Glow (sinar mengikuti kursor) dipadukan dengan efek Interactive Floating (melayang).

### R2. Refaktor Keseluruhan Halaman
Penerapan desain ini tidak hanya pada layout utama, melainkan wajib diintegrasikan ke seluruh halaman fitur secara konsisten: /finance, /attendance, /reports, dan /scraper.

## Acceptance Criteria

### UI Quality & Build Stability
- [ ] Tersedia file konfigurasi CSS/Tailwind dan layout Next.js yang memuat sistem glassmorphism dan typography (Space Grotesk & JetBrains Mono) secara terpusat.
- [ ] Skrip animasi (Framer Motion atau CSS Transitions) untuk Magnetic Hover & Floating 3D berhasil diimplementasikan pada kartu.
- [ ] Proyek Next.js berhasil di-build (npm run build) tanpa pesan error akibat benturan class CSS.
- [ ] Tersedia sebuah script verifikasi (Playwright/Cheerio) atau agen tester yang mengeluarkan laporan (Log) memastikan bahwa class-class tema terang dan gelap merender warna bar/sidebar secara sempurna tanpa ada bug warna asimetris.

### Bot Resilience
- [ ] Terdapat mekanisme pengujian (misal: script pemanggilan fungsi internal atau mock webhook) untuk memastikan `bot.js` menangani error handling dengan baik pada modul OCR/Dokumen dan Command.
- [ ] Tidak ada proses Node.js yang berhenti (exit) secara paksa saat pengujian dijalankan.

## Follow-up — 2026-07-16T13:42:52Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Teamwork subagent is now executing the implementation plan.

Execute the full backend evolution for the AgentFlow Enterprise project as detailed in the `implementation_plan.md` artifact. This includes migrating the database, seeding data, and scaffolding the core API routes for the Finance, HR, and Purchasing modules.

Working directory: `C:\Users\L15 RYZEN\Desktop\agentflow`
Integrity mode: development

## Requirements

### R1. Database Migration & Environment
Start the local Prisma development database (if not running) using `npx prisma dev` (in the background). Run the necessary Prisma commands (`npx prisma db push` or `npx prisma migrate dev`) to apply the schema changes in `prisma/schema.prisma` to the local PostgreSQL database.

### R2. Mock Data Seeding
Create a robust seed script (`prisma/seed.ts` or `seed.js`) to populate the database with mock data. It must seed:
- `Company` with `officeLatitude`, `officeLongitude`, and `officeRadius`.
- `User` records with `phone`, `contractStart`, and `contractEnd`.
- Mock `Invoice` records (both AP and AR).
- Mock `SalesOrder` and `PurchaseRequisition` records.
Ensure the `package.json` seed command points to this script, and run it to populate the DB.

### R3. API Endpoints Scaffolding
Create the Next.js App Router API route handlers (`app/api/`) for the 3 main admin modules:
- **Finance (`/api/finance/invoice`)**: Endpoint to fetch invoices and trigger WA reminders.
- **HR (`/api/hr/attendance`)**: Endpoint to record GPS attendance and calculate distance against company geofencing (use the `geolib` library for accurate distance calculation).
- **Purchasing (`/api/purchasing/requisition`)**: Endpoint to convert a `SalesOrder` to a `PurchaseRequisition`.

*Do NOT focus on frontend UI in this task; focus entirely on the backend schema, seeding, and API logic.*

## Acceptance Criteria

### Verification
- [ ] `npx prisma db push` completes successfully without data loss warnings or schema errors.
- [ ] `npm run build` completes without TypeScript errors in the new API routes.
- [ ] The seed script executes successfully and data is verifiable via database queries.
- [ ] The HR API route imports and correctly utilizes a reliable geocoding/distance library (e.g. `geolib`) to calculate geofenced distances.

