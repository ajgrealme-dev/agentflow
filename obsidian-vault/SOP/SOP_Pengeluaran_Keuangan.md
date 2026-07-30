# 📜 SOP Pengeluaran Keuangan & Dana Taktis Operasional

---

## 🏛️ 1. Batas Nominal & Alur Persetujuan (Approval Flow)
Setiap pengeluaran kas atau pengajuan reimburse/pembayaran tagihan diatur berdasarkan nominal limit transaksi berikut:

* **Di bawah Rp 150.000 (Kas Kecil):**
  * Disetujui otomatis oleh AI Agent (Finance AI) jika bon belanja valid.
  * Masuk kategori pengeluaran operasional rutin (ATK kecil, konsumsi harian).
* **Rp 150.000 s/d Rp 1.000.000:**
  * Membutuhkan persetujuan (approval) dari **Supervisor Cash Management** atau **Accounting Manager**.
  * Status transaksi akan berstatus `WAITING_APPROVAL` di Dashboard.
* **Di atas Rp 1.000.000:**
  * Membutuhkan persetujuan wajib dari **CFO (Chief Financial Officer)**.

---

## 📝 2. Prosedur Input Tagihan Manual
Karyawan wajib mengunggah/menginput bon belanja melalui sistem AgentFlow dengan ketentuan:
1. Menyertakan detail item pembelian yang jelas.
2. Nama toko/vendor harus terbaca dengan jelas.
3. Metode pembayaran transfer harus mencantumkan nomor rekening dan nama bank tujuan transfer.
4. Tanggal jatuh tempo nota/invoice minimal adalah **5 hari kerja** dari tanggal penginputan di sistem.

---

## 💼 3. Kontak Darurat Divisi Keuangan
Untuk pertanyaan atau eskalasi mendesak di luar sistem otonom:
* **Email Resmi:** finance@agentflow.id
* **Penanggung Jawab:** Supervisor Cash Management
