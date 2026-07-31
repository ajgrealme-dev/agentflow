# 🏗️ DOKUMEN PERANCANGAN SISTEM (SYSTEM DESIGN SPECIFICATION)
## AGENTFLOW B2B AUTONOMOUS BROKERAGE ENGINE
## Versi: 1.0.0 | Status: System Architecture Specification

---

## 📐 1. ARSITEKTUR KELOMPOK KOMPONEN (SYSTEM ARCHITECTURE)

Sistem dibangun dengan arsitektur modular yang terbagi menjadi 6 komponen utama:

```
+-----------------------------------------------------------------------------------+
|                        AGENTFLOW SYSTEM ARCHITECTURE                              |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [1. MULTI-TOUCH DEEP SCRAPER ENGINE]                                             |
|  • Google Maps Scraper (Inisiasi Nama PT di Kawasan Industri Target)              |
|  • Web Official & Directory Scraper (Ekstraksi Email procurement@...)             |
|  • Social & Professional Scraper (LinkedIn/JobStreet -> Nama Manager Purchasing)   |
|                                                                                   |
|  [2. SOURCING MATRIX DATABASE ENGINE (PRISMA ORM)]                                |
|  • Data Supplier Master Stockist (HPP Modal, Lokasi Kota, MOQ)                    |
|  • Katalog Barang Wajib Industri (Packaging, APD, Sparepart, Pelumas)             |
|  • Margin Calculator (Default 8% - Ultra Murah & Kompetitif)                      |
|                                                                                   |
|  [3. AUTONOMOUS REASONING & PRICING ENGINE]                                       |
|  • Formula Keselamatan DP 50% (Menjamin Modal Rp 0)                               |
|  • Sektor Pencocokan Otomatis Kebutuhan Pabrik vs Supplier                        |
|                                                                                   |
|  [4. COMMUNICATIONS & PDF GENERATOR]                                              |
|  • Auto-Quotation PDF Generator (Branding: AZIZ - Independent Sourcing)          |
|  • Rekening Tujuan DP: Bank Mandiri Livin' Gold a.n. AZIZ                         |
|  • Multi-Channel Outreach Engine (Email / Telegram Bot API)                       |
|                                                                                   |
|  [5. BACKEND LOOP ENGINE (PM2 SERVICE)]                                           |
|  • Closed-Loop Engine (Perceive -> Reason -> Act -> Evaluate) 24/7                |
|  • File Runner: `scripts/brokerage-engine.js` (App: `agentflow-broker-engine`)    |
|                                                                                   |
|  [6. ORCHESTRATOR & MONITORING DASHBOARD (NEXT.JS UI)]                            |
|  • Antarmuka Pemantau Sourcing Matrix (`/sourcing-matrix`)                         |
|  • Monitor Real-Time Status Deal & Notifikasi Keuntungan Bersih                   |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 🔄 2. ALUR DATA & MESIN STATUS TRANSAKSI (STATE MACHINE)

Setiap peluang bisnis yang ditangani oleh AgentFlow akan melewati **6 Status Transaksi (BrokerDeal Status)** di database:

```
[DRAFT] ---------> [QUOTED] ---------> [PO_RECEIVED] ---------> [DP_PAID] ---------> [SHIPPED] ---------> [COMPLETED]
(Sinyal          (Surat Penawaran     (Pabrik Kirim        (Pabrik Transfer      (Supplier Kirim      (Pelunasan 50%
 Ditemukan)       Kirim ke Pembeli)    Purchase Order)      DP 50% Mandiri)       Truk Blind Ship)     Lunas -> Profit)
```

### Rincian Transisi Status:
1. **`DRAFT`:** Sinyal pabrik target ditemukan oleh Scraper Engine.
2. **`QUOTED`:** AgentFlow otomatis menerbitkan & mengirim Surat Penawaran PDF (Format AZIZ) dengan syarat DP 50%.
3. **`PO_RECEIVED`:** Pabrik Pembeli menyetujui penawaran dan menyertakan dokumen PO resmi.
4. **`DP_PAID`:** Pembeli mentransfer DP 50% ke **Bank Mandiri Livin' Gold a.n. AZIZ**. Uang DP dipakai melunasi 100% modal ke Supplier.
5. **`SHIPPED`:** Supplier meluncurkan armada truk pengiriman menggunakan **Surat Jalan Polos (Blind Shipping)**.
6. **`COMPLETED`:** Barang sampai di lokasi pabrik, Berita Acara Serah Terima (BAST) ditandatangani, dan sisa pelunasan 50% ditransfer. Profit bersih terkunci 100%.

---

## 🔌 3. SPESIFIKASI INTERFACE & SPESIFIKASI API (API CONTRACTS)

Sistem menyediakan 4 Endpoint API Utama untuk komunikasi data:

### 1. `GET /api/sourcing-matrix`
* **Fungsi:** Mengambil data katalog supplier, barang industri, dan daftar deal transaksi aktif.
* **Output:** JSON berisi `suppliers[]` dan `deals[]`.

### 2. `POST /api/sourcing-matrix`
* **Fungsi:** Menambah supplier baru, barang baru, atau mengeksekusi action `AUTO_POPULATE_50` (Import 50+ barang otonom).

### 3. `POST /api/brokerage/run-loop`
* **Fungsi:** Memicu jalannya siklus *Loop Engineering* secara otonom (Perceive → Reason → Act → Evaluate).
* **Response:** JSON konfirmasi jumlah deal B2B yang berhasil dieksekusi.

### 4. `POST /api/quotation/generate`
* **Fungsi:** Menerbitkan draf Surat Penawaran Resmi PDF berformat **AZIZ (Independent Sourcing)** dengan kalkulasi DP 50%.

---

## 📊 4. DASHBOARD KONTROL & STRATEGI MONITORING

Untuk memastikan AZIZ dapat memantau jalannya mesin otonom ini dari rumah:

1. **Dashboard Sourcing Matrix (`/sourcing-matrix`):**
   * Menampilkan daftar 50+ barang industri, modal HPP, harga penawaran murah (margin 8%), dan estimasi profit per transaksi.
   * Dilengkapi tombol pemicu manual `⚡ Picu Loop Engine Otonom` dan `🤖 Auto-Sourcing (50+ Barang)`.
2. **Notifikasi Telegram Live Alert:**
   * AgentFlow mengirim pesan instan ke Telegram AZIZ setiap kali ada DP 50% masuk atau penawaran baru terkirim.
3. **Modus Cetak Printable:**
   * Surat Penawaran PDF dapat langsung diprint/didownload satu klik dari antarmuka web.

---

## 🛠️ 5. SPESIFIKASI TEKNIS & LINGKUNGAN DEPLOYMENT

* **Framework Web:** Next.js 16.2.9 (App Router / Turbopack).
* **Database & ORM:** PostgreSQL / PgLite via Prisma ORM v7.8.0.
* **Iconography & Styling:** Lucide React & Tailwind CSS.
* **Process Manager (24/7 Background Loop):** PM2 Service (`agentflow-broker-engine`).
* **Environment File (`.env`):**
  * `DATABASE_URL`
  * `GEMINI_API_KEY`
  * `TELEGRAM_BOT_TOKEN`
  * `ADMIN_CHAT_ID`

---
*Dokumen Perancangan Sistem ini merupakan spesifikasi teknis resmi untuk pengembangan & eksekusi AgentFlow B2B Brokerage Engine.*
