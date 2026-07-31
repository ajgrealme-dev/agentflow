# 📋 SOFTWARE REQUIREMENT SPECIFICATION (SRS)
## AGENTFLOW B2B AUTOMATED BROKERAGE ENGINE
## Versi: 1.0.0 | Status: APPROVED

---

## 🔒 1. ATURAN BISNIS & VALIDASI SISTEM (BUSINESS RULES & VALIDATION)

### BR1. Validasi Keuangan Modal Rp 0 (Rumus DP 50%)
* **Aturan:** Sistem **DILARANG** menerbitkan Surat Penawaran dengan DP kurang dari batas minimal keselamatan:
  $$\text{DP Min \%} = \left( \frac{\text{Harga Modal HPP}}{\text{Harga Penawaran}} \right) \times 100\% + 5\%$$
* **Validasi:** DP minimal diatur **50%**. Nominal DP 50% dari pembeli **WAJIB SELALU LEBIH BESAR** daripada 100% Modal HPP Supplier.

### BR2. Aturan Batas Margin Keuntungan (Competitive Margin Bounds)
* **Aturan:** Persentase margin keuntungan diatur dalam rentang **5.0% hingga 10.0%** (Default: **8.0%**).
* **Tujuan:** Menjaga harga penawaran tetap menjadi yang termurah di Banten & Indonesia untuk mengejar volume transaksi grosir.

### BR3. Aturan Pembatalan Skema Tempo (Zero Debt Rule)
* **Aturan:** Skema Tempo 30 Hari **DIHAPUS TOTAL** dari pilihan default untuk pabrik baru.
* **Syarat Pembayaran:** HANYA mengizinkan **DP 50% di Awal + 50% Cash Against Delivery (CAD)**.

### BR4. Aturan Branding & Identitas Legal
* **Aturan:** Dokumen penawaran dan pesan outreach **WAJIB** mencantumkan nama perorangan: **AZIZ (Independent Industrial Sourcing Specialist)**.
* **Rekening Pembayaran:** **Bank Mandiri (Livin' Gold) a.n. AZIZ**.

---

## ⚙️ 2. PERSYARATAN FUNGSIONAL (FUNCTIONAL REQUIREMENTS)

| ID Req | Modul | Deskripsi Persyaratan Fungsional |
| :--- | :--- | :--- |
| **FR-01** | Sourcing Matrix | Sistem harus menyediakan API & UI untuk menyimpan data `Supplier`, `SourcingItem`, dan `BrokerDeal`. |
| **FR-02** | Auto-Populate | Sistem harus mampu mengimpor 50+ barang industri realistis dengan margin 8% dalam 1 klik. |
| **FR-03** | Quotation PDF | Sistem harus mampu menghasilkan Surat Penawaran Resmi berformat PDF (Printable) atas nama AZIZ. |
| **FR-04** | Loop Engine | Sistem background daemon (`scripts/brokerage-engine.js`) harus berputar 24/7 di bawah pengawasan PM2. |
| **FR-05** | Deep Scraper | Sistem harus mendukung ekstraksi kontak pabrik multi-touch (Maps → Web → LinkedIn/WA). |

---

## ⚡ 3. PERSYARATAN NON-FUNGSIONAL (NON-FUNCTIONAL REQUIREMENTS)

* **NFR-01 (Kinerja):** Waktu kompilasi dan pembuatan draf Quotation PDF harus di bawah **2 detik**.
* **NFR-02 (Keandalan):** Daemon Loop Engineering harus memiliki fitur `autorestart: true` di PM2 agar otomatis pulih saat server reboot.
* **NFR-03 (Skalabilitas):** Database Sourcing Matrix harus mampu menampung hingga **10.000+ data barang** dari seluruh kawasan industri Indonesia.
