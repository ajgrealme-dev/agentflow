# 🎯 TASK BREAKDOWN & EXECUTION ROADMAP
## AGENTFLOW B2B AUTOMATED BROKERAGE ENGINE
## Versi: 1.0.0 | Status: APPROVED

---

## 📌 PHASE 1: DATABASE & BACKEND ENGINE FOUNDATION (COMPLETED)
- [x] **Task 1.1:** Menambahkan model `Supplier`, `SourcingItem`, dan `BrokerDeal` ke `prisma/schema.prisma`.
- [x] **Task 1.2:** Menjalankan `npx prisma generate` dan `npx prisma db push` untuk meng-update database.
- [x] **Task 1.3:** Membuat API Route `/api/sourcing-matrix/route.ts` dengan logika Auto-Populate 50+ Barang Industri (Margin 8%).
- [x] **Task 1.4:** Membuat Backend Loop Service `scripts/brokerage-engine.js` (Closed-Loop 24/7 Engine).
- [x] **Task 1.5:** Mendaftarkan service `agentflow-broker-engine` ke file PM2 `ecosystem.config.js`.

---

## 📌 PHASE 2: UI DASHBOARD & PDF QUOTATION GENERATOR (COMPLETED)
- [x] **Task 2.1:** Membuat halaman `/sourcing-matrix/page.tsx` dengan antarmuka modern Dark Mode.
- [x] **Task 2.2:** Menambahkan Tombol `🤖 Auto-Sourcing (50+ Barang)` dan `⚡ Picu Loop Engine Otonom`.
- [x] **Task 2.3:** Merancang Modal Preview & Printable PDF Surat Penawaran Harga atas nama **AZIZ (Perorangan)**.
- [x] **Task 2.4:** Memasukkan Klausa DP 50% & Rekening **Bank Mandiri (Livin' Gold) a.n. AZIZ**.
- [x] **Task 2.5:** Daftarkan rute `/sourcing-matrix` ke `Sidebar.tsx` dengan highlight menu.

---

## 📌 PHASE 3: MULTI-TOUCH DEEP SCRAPER & AUTOMATED OUTREACH (NEXT STEP)
- [ ] **Task 3.1:** Mengintegrasikan Scraper Google Maps + Website Official untuk ekstraksi kontak email/WA Purchasing pabrik Banten.
- [ ] **Task 3.2:** Mengintegrasikan Telegram Bot Notification untuk Alert Live Deal & Pembayaran DP ke HP AZIZ.
- [ ] **Task 3.3:** Menjalankan pengujian akhir siklus penawaran ke 10 target pabrik Cikande/Cilegon.

---

## 📌 PHASE 4: GO-LIVE & EKSEKUSI TRANSAKSI DUNIA NYATA
- [ ] **Task 4.1:** Meluncurkan mesin di server RDP/PM2 (`pm2 start ecosystem.config.js`).
- [ ] **Task 4.2:** Memantau penerimaan PO dan pencairan DP 50% di Rekening Mandiri AZIZ.
