# 📋 SOFTWARE REQUIREMENT SPECIFICATION (SRS)
## AGENTFLOW B2B AUTOMATED BROKERAGE ENGINE
## Versi: 2.0.0 | Status: APPROVED (SECOND BRAIN & SCHEDULE INTEGRATED)

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

### BR5. Aturan Second Brain & Long-Context Memory (Machine Learning)
* **Aturan:** AI wajib merekam histori interaksi, tingkat konversi penawaran, dan reputasi supplier ke database *AgentMemoryLog*.
* **Tujuan:** Seiring berjalannya waktu, AI mampu menyesuaikan strategi penawaran dan menambah katalog barang industri baru secara otonom tanpa klik tombol manual.

---

## ⚙️ 2. PERSYARATAN FUNGSIONAL (FUNCTIONAL REQUIREMENTS)

| ID Req | Modul | Deskripsi Persyaratan Fungsional |
| :--- | :--- | :--- |
| **FR-01** | Second Brain | Sistem harus menyediakan memori jangka panjang (RAG / Knowledge Graph) untuk mencatat pola kebiasaan pembeli & supplier. |
| **FR-02** | Schedule Engine | Sistem harus berjalan otomatis 24/7 menggunakan timer jadwal (*Schedule / Cron*) tanpa tergantung klik tombol UI. |
| **FR-03** | Quotation PDF | Sistem harus mampu menghasilkan Surat Penawaran Resmi berformat PDF (Printable) atas nama AZIZ. |
| **FR-04** | Loop Engine | Sistem background daemon (`scripts/brokerage-engine.js`) harus berputar 24/7 di bawah pengawasan PM2. |
| **FR-05** | Deep Scraper | Sistem harus mendukung ekstraksi kontak pabrik multi-touch (Maps → Web → LinkedIn/WA). |

---

## ⚡ 3. PERSYARATAN NON-FUNGSIONAL (NON-FUNCTIONAL REQUIREMENTS)

* **NFR-01 (Kinerja):** Waktu pengambilan ingatan dari Second Brain RAG harus di bawah **500 ms**.
* **NFR-02 (Keandalan):** Schedule & Loop Engine harus memiliki fitur `autorestart: true` di PM2 agar otomatis pulih saat server reboot.
* **NFR-03 (Skalabilitas):** Knowledge Graph Second Brain harus mampu menampung ingatan pola transaksi dari ribuan pabrik di Indonesia.
