# 📊 Status Proyek: AgentFlow Enterprise

Dokumen ini menyajikan ringkasan detail mengenai fitur-fitur yang telah selesai dikembangkan (*Completed Features*) serta daftar rencana pengembangan fitur berikutnya (*Planned Next Features*).

---

## 🚀 Fitur yang Telah Selesai (Completed Features)

### 1. Multi-Agent Coordination Engine (Session Runtime)
*   **Hierarchical Router (AI Moderator):** Loop asinkron yang memandu giliran bicara Agen AI berdasarkan transkrip obrolan rapat dan sasaran kerja.
*   **Skema Database PostgreSQL (Prisma):** Migrasi database lokal yang mendukung data relasional `Company`, `User`, `AIAgent`, `AgentSession`, `AgentMessage`, dan `AgentParticipant`.
*   **Penyuntikan SOP Dinamis:** Runtime memuat SOP resmi karyawan dari database secara *real-time* sebelum agen model dipanggil.

### 2. Peta Alur Kerja Visual (Interactive Org Chart Viewport)
*   **Viewport Kanvas Raksasa (`9000px × 1400px`):** Kanvas interaktif yang merender seluruh 142 Karyawan AI dari database secara dinamis.
*   **Pemosisian Otomatis:** Pembagian horizontal untuk 8 divisi (Finance, Purchasing, Marketing, HR, Tech, Legal, Customer, Strategy) dan pembagian vertikal untuk 6 level jabatan (Chief hingga Intern).
*   **Kurva SVG Bezier:** Garis lengkung berpenanda warna divisi yang menggambarkan pelaporan dari bawahan ke atasan berdasarkan SOP.
*   **Auto-Center Viewport Search:** Panning viewport otomatis yang memfokuskan kamera tepat di tengah karyawan yang dicari.
*   **Panel Detail Karyawan:** Menampilkan sasaran kerja (*goal*) dan isi dokumen SOP markdown secara lengkap jika node diklik.

### 3. CEO Executive Directive Panel
*   **Banner Direktif CEO:** Kartu panel lengket (*sticky*) berwarna emas neon di atas area chat yang menayangkan direktif eksekutif terakhir Anda.
*   **Kolom Input Direktif:** Input interaksi manusia eksklusif yang memandu pengiriman instruksi kerja formal ketika rapat dijeda (`PAUSED_FOR_HUMAN`).
*   **Injeksi Keras Sistem Rapat:** Menginjeksi direktif CEO sebagai peringatan prioritas tinggi di instruksi sistem agen AI.

### 4. Obsidian Vault (Second Brain) Integration
*   **Folder Vault Lokal (`obsidian-vault/`):** Ekspor otonom profil 142 karyawan AI beserta SOP mereka ke file markdown terpisah.
*   **00-Index.md Dashboard:** Indeks terstruktur yang memetakan seluruh divisi dan tersambung dengan *wiki-links* (`[[Nama Karyawan]]`).
*   **Sinkronisasi Rapat & Keputusan:** Ekspor transkrip diskusi rapat koordinasi (`Meetings/`) dan keputusan audit (`Decisions/`) secara langsung.
*   **Pencegahan Directory Traversal:** Validasi jalur file secara ketat agar penulisan berkas aman di dalam root vault.

### 5. Model Context Protocol (MCP) Client Manager & Dashboard
*   **Stdio Client Wrapper:** Backend client yang menghubungkan Next.js ke server MCP luar (Filesystem & Fetch) melalui stdio JSON-RPC.
*   **Visual MCP Monitor (`/settings`):** Panel pemantau visual status server MCP (Connected/Offline), CLI command, serta deskripsi skema alat kerja (*tools explorer*).

### 6. Otak Kedua & Perkakas Developer (Antigravity Setup)
*   **Developer Vault (`.agents/developer-vault/`):** Jurnal pair-programming otonom saya untuk mendokumentasikan sistem desain.
*   **Assistant MCP Setup:** Mengonfigurasikan server Puppeteer dan Fetch di file konfigurasi MCP asisten (`mcp_config.json`).

---

## 🔮 Rencana Fitur Berikutnya (Planned Next Features)

### 1. Pembuatan Alat Kerja Spesifik Divisi (Next.js Tools Scaffolding)
*   Menulis perkakas nyata di direktori `src/lib/agents/tools/` untuk pilar divisi non-teknis:
    *   **Purchasing Tool:** Auto-generator RFQ ke PDF dan pemilah otomatis penawaran harga vendor.
    *   **Marketing Tool:** Pembuat draf caption medsos dan scraper tren kata kunci iklan Meta/Google.
    *   **HR Tool:** Parser resume PDF dan integrasi penjadwal kalender wawancara.

### 2. Integrasi Notifikasi Telegram & WhatsApp Real-Time
*   Menghubungkan event rapat yang terjeda (`PAUSED_FOR_HUMAN`) agar menembakkan pesan notifikasi interaktif ke Telegram Bot atau WhatsApp API milik supervisor/manajer manusia.
*   Memungkinkan manusia membalas langsung notifikasi tersebut untuk mengirimkan direktif baru tanpa membuka web dashboard.

### 3. Simulasi Kasus Uji Coba Multi-Agen (Simulation Sandbox)
*   Fitur di Workbench untuk meluncurkan rapat koordinasi tiruan secara instan guna memvalidasi kemampuan kolaborasi multi-agen di berbagai skenario operasional (misal: simulasi krisis stockout logistik).

---
*Status per: 19 Juli 2026*
