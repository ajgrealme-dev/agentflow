# 🧪 SKENARIO UJI COBA OPERASIONAL: DIVISI KEUANGAN MVP
*(Gunakan panduan ini untuk menguji keandalan AI Agent secara langsung di komputer Anda)*

---

## 📅 UJI COBA 1: PENGOLAHAN DOKUMEN DAN VALIDASI DATA (OCR AI)

### 📌 Persiapan Bahan Mentah:
Buka file `bon_pembelian_mentah.txt` di folder ini. Teks ini mensimulasikan hasil pemindaian (scan) bon pembelian ATK kantor dari toko fisik yang belum terkomputerisasi.

### 📌 Langkah Eksekusi Pengujian:
1. Jalankan aplikasi lokal Anda (`npm run dev`) lalu masuk ke **Dashboard**.
2. Masuk ke halaman **Workbench** (atau ke menu divisi **Finance**).
3. Di bagian **Sandbox / Alat Input Tagihan**, salin (copy) seluruh teks nota penjualan dari `bon_pembelian_mentah.txt` dan tempelkan (paste) ke kolom input teks yang disediakan.
4. Klik tombol **"Ekstrak dengan AI"** atau **"Jalankan Analisis"**.

### 📌 Kriteria Keberhasilan (Apa yang Harus Diverifikasi):
- [ ] AI berhasil membaca total nominal akhir secara tepat: **Rp 496.725**.
- [ ] AI secara mandiri mendeteksi nama vendor/toko: **Toko Utama Elektronik & ATK**.
- [ ] AI mengisi tanggal jatuh tempo pembayaran secara otomatis: **5 Agustus 2026**.
- [ ] AI mengidentifikasi item pembelanjaan dengan benar (Kertas HVS, Ballpoint, Tinta Printer).

---

## 🔒 UJI COBA 2: ALUR PERSETUJUAN KEUANGAN (ESKALASI KEPUTUSAN)

### 📌 Langkah Eksekusi Pengujian:
1. Setelah data tagihan di atas berhasil diekstrak oleh AI, klik tombol **"Kirim ke Sistem Keuangan"** atau **"Proses Pembayaran"**.
2. Karena nominal tagihan di atas cukup besar (atau membutuhkan persetujuan sesuai limit kebijakan demo), masuk ke menu **Antrean Tugas / Tasks** atau tab **Waiting Approval**.
3. Verifikasi apakah tugas pembayaran untuk `Toko Utama Elektronik & ATK` muncul dengan status **"WAITING_APPROVAL"** atau membutuhkan verifikasi supervisor manusia.
4. Klik **"Approve" (Setujui)** secara manual.

### 📌 Kriteria Keberhasilan:
- [ ] Status tugas di antrean berubah menjadi **"APPROVED"** atau **"DONE"**.
- [ ] Di konsol terminal kanan layar (log otonom simulator), muncul log cetak transaksi pembayaran yang berhasil diproses ke rekening vendor.

---

## 📈 UJI COBA 3: PEMUTAKHIRAN DASHBOARD EKSEKUTIF REAL-TIME

### 📌 Langkah Eksekusi Pengujian:
1. Kembali ke halaman **Dashboard Utama** (Rute `/`).
2. Perhatikan grafik pengeluaran bulanan atau tabel transaksi terbaru di bagian bawah halaman.

### 📌 Kriteria Keberhasilan:
- [ ] Nominal **Rp 496.725** telah masuk ke dalam rekapitulasi pengeluaran divisi keuangan bulan ini.
- [ ] Metrik **"Waktu Dihemat"** bertambah (misalnya bertambah 15-30 menit karena data entry dilakukan otomatis oleh AI).
- [ ] Jumlah total transaksi keuangan di tabel riwayat bertambah 1 transaksi.
