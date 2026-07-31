# 📄 PRODUCT REQUIREMENT DOCUMENT (PRD)
## AGENTFLOW B2B AUTOMATED BROKERAGE ENGINE
## Versi: 1.0.0 | Status: APPROVED

---

## 🎯 1. VISI & TUJUAN PRODUK (PRODUCT VISION)
* **Visi Produk:** Membangun **AgentFlow** menjadi **"Mesin Pencetak Uang Otonom 24/7"** yang beroperasi sebagai agen perantara (brokerage) pengadaan barang industri skala pabrikan di Indonesia.
* **Misi Produk:** Menghilangkan 90% pekerjaan manual dalam pengadaan barang B2B (riset supplier, kalkulasi margin, prospeksi pembeli, dan generasi surat penawaran harga) melalui **Closed-Loop Engineering Architecture**.
* **Identitas Usaha:** **AZIZ - Independent Industrial Sourcing Specialist (Perorangan)**.
* **Strategi Profitabilitas:** **Margin Tipis (5% – 8%) x Volume Kuantitas Tinggi** (Harga Penawaran Termurah di Banten & Indonesia).

---

## 👤 2. TARGET USER & PERSONA
* **Primary User (Solo Founder):** **AZIZ** (Mahasiswa / Pengusaha Solo).
  * *Peran:* Pengambil Keputusan Utama, Pengawas Dashboard, dan Penerima Pelunasan Bank.
* **Artificial Intelligence Partner:** **AgentFlow AI Agent Engine**.
  * *Peran:* Tim Operasional 24 Jam (Scraper, Sourcing Matrix, Auto-Pricing, Auto-Quotation PDF Generator, dan Background Loop Engine).
* **Target Audience (Pembeli):** Tim *Purchasing / Procurement / General Affairs (GA)* pabrik di Kawasan Industri Banten (Cikande, Nikomas, Cilegon) & Ekspansi Nasional (Cikarang, Karawang, Surabaya).

---

## 🚀 3. FITUR KUNCI PRODUK (CORE FEATURES)

### F1. Multi-Touch Deep Scraper Engine (Otonom)
* Scraper yang menyisir Google Maps kawasan industri, mengekstrak domain web resmi pabrik, menyisir LinkedIn/JobStreet untuk nama Manager Purchasing, serta mengunci kontak WhatsApp/Email aktif.

### F2. Sourcing Matrix & Margin Engine (Margin Tipis 8%)
* Katalog barang industri (50+ items) dengan kalkulasi otomatis:
  $$\text{Harga Penawaran} = \text{Modal HPP Supplier} \times (1 + 8\%)$$

### F3. Skema Keamanan Modal Rp 0 (DP 50% Guarantee)
* Generasi klausa penawaran: **DP 50% saat PO diterbitkan + Pelunasan 50% Cash Against Delivery (CAD)**.
* Rekening Tujuan Pembayaran: **Bank Mandiri (Livin' Gold) a.n. AZIZ**.

### F4. B2B Auto-Quotation PDF Generator (AZIZ Branding)
* Generator PDF Surat Penawaran Harga resmi satu-klik berformat perorangan AZIZ yang siap di-print/dikirimkan ke pabrik.

### F5. Closed-Loop Engineering Engine (PM2 24/7 Daemon)
* Backend daemon (`scripts/brokerage-engine.js`) yang berputar dalam siklus:
  $$\text{Perceive (Scraper)} \longrightarrow \text{Reason (Pricing 8\%)} \longrightarrow \text{Act (Quotation/Outreach)} \longrightarrow \text{Evaluate (Memory)}$$

---

## 🔄 4. ALUR PENGGUNA & FLOW PRODUK (PRODUCT FLOW)

```
[AZIZ Buka Dashboard] ──> [Auto-Populate 50+ Barang] ──> [Klik Picu Loop Engine] ──> [AI Eksekusi Penawaran]
                                                                                            │
[Uang Masuk ke Mandiri AZIZ] <── [Pabrik Kirim PO & DP 50%] <── [Pabrik Terima PDF Penawaran] ┘
```
