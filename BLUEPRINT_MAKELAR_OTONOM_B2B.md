# 🏆 MASTER BLUEPRINT: AGENTFLOW B2B AUTOMATED BROKERAGE ENGINE
## System Architecture & Operations Manual for Autonomous Cash-Generating Machine

---

## 📌 1. VISI KUNCI & IDENTITAS BISNIS
* **Tujuan Utama:** Menjadikan AgentFlow sebagai **"Mesin Pencetak Uang Otonom 24/7"** milik pribadi.
* **Pelaku Usaha (Solo Founder):** **AZIZ** (Independent Industrial Sourcing Specialist).
* **Mitra Operasional:** **AgentFlow AI Agent** (Sistem AI Otonom).
* **Status Legalitas:** **Perorangan** (Memakai Rekening Bank Pribadi AZIZ). Tidak menggunakan klaim palsu PT/CV.
* **Wilayah Target Utama:** Kawasan Industri Modern Cikande, Nikomas Gemilang, KIEC Cilegon, dan Serang (Provinsi Banten).

---

## 💰 2. STRATEGI BISNIS & MEKANISME KEUANGAN MODAL RP 0

### A. Strategi Penentuan Harga (Pricing Strategy)
* **Strategi:** **High Volume x Margin Tipis (5% – 8%)**.
* **Posisi Pasar:** Penawaran termurah dan tercepat di Banten untuk menarik volume transaksi partai besar (grosir) dari pabrik.

### B. Mekanisme Keuangan Modal Rp 0 (DP 50% Guarantee)
* **Klausa Pembayaran:** **DP 50% saat PO diterbitkan + 50% Pelunasan saat barang sampai di lokasi (Cash Against Delivery / CAD)**.
* **Prinsip Matematika Modal Rp 0:**
  $$\text{Uang DP 50\% dari Pembeli} \ge \text{100\% Modal HPP ke Master Stockist}$$
* **Sirkulasi Uang:** Pembeli mentransfer DP 50% ke Rekening Bank Pribadi AZIZ. Uang DP tersebut digunakan untuk melunasi 100% modal awal ke Supplier Grosir. AZIZ memegang sisa profit bersih sejak hari pertama tanpa mengeluarkan modal pribadi sepeser pun.

---

## 🛡️ 3. PERISAI PERLINDUNGAN RISIKO (RISK GUARD & BAST)

1. **Anti-Bypass (Blind Shipping):** Supplier Grosir diwajibkan mengirim barang menggunakan **Surat Jalan Polos atas nama AZIZ**, tanpa mencantumkan identitas/invoice supplier asal.
2. **Anti-Retur (Garansi Retur 1:1 & BAST):** Penyerahan barang menggunakan Berita Acara Serah Terima (BAST). Supplier diwajibkan memberi garansi ganti baru 1:1 jika barang ditolak QC pabrik.
3. **Penetrasi Pasar (Backup Vendor Strategy):** Memposisikan diri sebagai **"Mitra Supplier Cadangan Resmi"** (bukan mengusir supplier lama pabrik), sehingga pabrik dengan senang hati menerima penawaran pembanding.
4. **Pencarian Bertingkat (Cascade Sourcing):** Jika harga distributor lokal mahal, AI melompat mencari pabrik produsen tangan pertama / Master Stockist terbesar di Jabodetabek.

---

## 🔄 4. ARSITEKTUR LOOP ENGINEERING (CLOSED-LOOP AUTONOMOUS SYSTEM)

Sistem berputar 24 jam non-stop di background (dikendalikan PM2 `agentflow-broker-engine`) melalui 4 Tahap Loop:

```
+-----------------------------------------------------------------------+
|                       CLOSED-LOOP ENGINEERING 24/7                    |
+-----------------------------------------------------------------------+
|  [STAGE 1: PERCEIVE]                                                  |
|  • Scraper menyisir sinyal kebutuhan pabrik di Banten 24/7            |
|                                                                       |
|  [STAGE 2: REASONING & MATCHMAKING]                                   |
|  • Otak Sourcing Matrix menghitung Modal HPP + Margin Tipis 8%        |
|  • Mengunci klausa DP 50% ke Rekening Pribadi AZIZ                    |
|                                                                       |
|  [STAGE 3: ACTION & EXECUTION]                                        |
|  • Generasi Surat Penawaran Harga PDF Otonom (AZIZ)                   |
|  • Outreach via Email/WA Bot + Notifikasi Laporan Telegram            |
|                                                                       |
|  [STAGE 4: EVALUATE & RAG MEMORY]                                     |
|  • Mencatat riwayat respon pabrik & memperbarui memori database        |
+-----------------------------------------------------------------------+
```

---

## 💻 5. DEPLOYMENT & STRUKTUR TEKNIS KODE

### A. Skema Database Prisma (`prisma/schema.prisma`)
* `Supplier`: Menampung data Master Stockist Tangerang/Cikarang/Jakarta.
* `SourcingItem`: Katalog barang industri (50+ items) dengan margin 8%.
* `BrokerDeal`: Pelacak status transaksi, nominal DP 50%, dan profit bersih.

### B. File Kunci Sistem:
1. **Background Engine Loop:** `scripts/brokerage-engine.js` (PM2 App: `agentflow-broker-engine`).
2. **API Endpoint Loop:** `src/app/api/brokerage/run-loop/route.ts`.
3. **API Sourcing Matrix:** `src/app/api/sourcing-matrix/route.ts`.
4. **UI Dashboard & PDF Generator:** `src/app/sourcing-matrix/page.tsx`.

---

## 🚀 6. TATA CARA MENJALANKAN DI DUNIA NYATA

1. **Jalankan Aplikasi:**
   ```cmd
   npm run dev
   ```
2. **Buka Dashboard Sourcing:**
   Buka `http://localhost:3000/sourcing-matrix`
3. **Auto-Populate 50+ Barang:**
   Klik tombol **`🤖 Auto-Sourcing (50+ Barang)`** untuk mengisi katalog otonom.
4. **Jalankan Engine Otonom:**
   Klik tombol **`⚡ Picu Loop Engine Otonom`** (atau biarkan PM2 mengeksekusi `scripts/brokerage-engine.js` di background 24 jam).
5. **Eksekusi Penawaran:**
   Cetak Surat Penawaran PDF (Format Perorangan AZIZ) dan kirimkan ke tim Purchasing pabrik target.

---
*Dokumen ini merupakan panduan master permanen untuk AgentFlow B2B Brokerage Engine.*
