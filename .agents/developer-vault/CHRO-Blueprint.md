# Cetak Biru Divisi Sumber Daya Manusia (CHRO Path)

Divisi SDM dipimpin oleh **CHRO — Chief Human Resources Officer** dan bertanggung jawab atas manajemen kehadiran, payroll, rekrutmen, dan budaya kerja:

## 👥 Departemen Utama
1. **Rekrutmen & Talent Acquisition:**
   * Skrining CV pelamar otomatis menggunakan kecerdasan buatan untuk mencocokkan kualifikasi pekerjaan.
   * Penjadwalan wawancara dan pengiriman email penawaran kerja otomatis.
2. **Operasional HR & Payroll:**
   * Validasi kehadiran absensi GPS karyawan terhadap geofencing kantor.
   * Penghitungan penggajian bulanan berdasarkan potongan cuti dan ketidakhadiran.
3. **Training & L&D (Learning & Development):**
   * Rekomendasi materi pelatihan dan pelacakan kelulusan sertifikasi kompetensi staf.

## 📌 Validasi Absensi Geofencing (SOP)
Platform Next.js AgentFlow memvalidasi koordinat GPS absensi karyawan secara ketat menggunakan formula jarak geospasial:
- **Pusat Koordinat Kantor:** `-6.1175` (Latitude), `106.1502` (Longitude).
- **Radius Aman:** Maksimal `100 meter`.
- **Eksekusi:** Karyawan di luar radius 100m akan secara otomatis ditolak status absensinya oleh sistem dan dicatat sebagai "Tidak Hadir".

---
*Kembali ke [[00-Developer-Hub]]*
