# 🎨 UI/UX FLOW & WIREFRAME SPECIFICATION
## AGENTFLOW B2B AUTOMATED BROKERAGE ENGINE
## Versi: 1.0.0 | Status: APPROVED

---

## 🖥️ 1. PETA NAVIGASI & HIERARKI LAYAR (SCREEN HIERARCHY)

```
[Main Navigation Sidebar]
 ├── 📊 Dashboard Utama (Overview Performance)
 ├── 🤖 Meja Kerja / Workbench (Agent Monitoring)
 ├── 💬 Chatbot Command (/command)
 └── 💼 Makelar B2B - Sourcing Matrix (/sourcing-matrix) [HIGHLIGHT HIJAU]
      ├── ⚡ Tombol "Picu Loop Engine Otonom"
      ├── 🤖 Tombol "Auto-Sourcing (50+ Barang)"
      ├── 📝 Form Tambah Barang Sourcing Manual
      ├── 📋 Tabel Katalog Sourcing Matrix & Margin Rahasia
      └── 📄 Modal Preview & Cetak PDF Surat Penawaran (AZIZ Branding)
```

---

## 🎨 2. SPESIFIKASI WIREFRAME & ELEMEN DESAIN

### A. Color Palette & Badges:
* **Primary Theme:** Dark Mode Premium (Slate 950 / Emerald 900 / Teal 900).
* **Badge Status Keuangan:**
  * `Margin Tipis 5-8% (Volume Murah)` -> Badge Emerald.
  * `Modal Rp 0 (Skema DP 50%)` -> Badge Blue.
  * `Format Perorangan (AZIZ)` -> Badge Amber.

### B. Layout Halaman `/sourcing-matrix`:
1. **Header Banner:** Judul besar, deskripsi sistem, dan 3 tombol aksi (Picu Loop Engine, Auto-Sourcing 50+, Refresh).
2. **Kolom Kiri (Form Input):** Input Nama Supplier, Nama Barang Industri, Kategori, Modal HPP, Margin %, dan Live Profit Preview.
3. **Kolom Kanan (Tabel Sourcing):** Tabel responsif yang menampilkan Nama Barang, Supplier, Modal HPP, Harga Penawaran, Profit Bersih, dan Tombol **`Cetak Penawaran`**.
4. **Modal Preview Quotation (Printable PDF):** Tampilan surat resmi penawaran perorangan atas nama **AZIZ** lengkap dengan rincian barang, klausa DP 50%, dan **Bank Mandiri Livin' Gold a.n. AZIZ**.
