# Cetak Biru Divisi Operasional (COO Path)

Divisi Operasional dipimpin oleh **COO — Chief Operating Officer** dan membawahi rantai pasokan fisik, logistik, manufaktur, dan pengadaan barang:

## 📦 Departemen Utama
1. **Pengadaan Barang (Procurement):**
   * Mengotomatiskan pembuatan draf RFQ (Request for Proposal) ke vendor saat stok gudang menipis.
   * Menilai proposal penawaran harga vendor secara otomatis berdasarkan kriteria efisiensi biaya.
2. **Logistik & Pergudangan (Warehouse):**
   * Mengawasi tingkat persediaan (SKU) secara real-time.
   * Memprediksi waktu re-stock barang agar tidak terjadi kekosongan persediaan (stockout).
3. **Manufaktur & Produksi:**
   * Sinkronisasi draf *Sales Order* (pesanan pembeli) menjadi draf pengajuan bahan baku produksi (*Purchase Requisition*) secara asinkron.
   * QC (Quality Control) otomatisasi pelaporan cacat produksi.

## ⚙️ Integrasi Alur Kerja Next.js
*   Modul `/purchasing` di dalam AgentFlow terhubung langsung ke database untuk mempermudah konversi transaksi dari pesanan pembeli (SO) menjadi dokumen pengadaan (PR) secara instan.

---
*Kembali ke [[00-Developer-Hub]]*
