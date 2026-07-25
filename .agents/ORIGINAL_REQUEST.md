# Original User Request

## 2026-07-22T15:56:48Z

Proyek ini bertujuan untuk mensinkronisasikan navigasi sub-menu alat kerja di Sidebar dengan antarmuka dinamis pada 8 halaman divisi AgentFlow. Setiap navigasi sub-menu akan menyorot tool terkait secara visual (glow effect) dan siap untuk dipicu simulatornya secara manual.

Working directory: c:\Users\L15 RYZEN\Desktop\agentflow
Integrity mode: benchmark

## Requirements

### R1. Sinkronisasi Query Parameter `?tool=...` pada Halaman Divisi
Setiap halaman divisi harus mendeteksi parameter query `?tool=...` dari URL (seperti `?tab=payroll&tool=bpjs`). Ketika dideteksi, halaman harus mengaktifkan tab yang sesuai, dan menambahkan kelas efek visual menyala/glow (`animate-pulse` atau ring border) pada elemen penampung tool tersebut agar pengguna tahu tool mana yang dimaksud.

### R2. Sinkronisasi Rute pada Dropdown Sidebar
Perbarui atau verifikasi seluruh submenu pada bilah samping (`src/components/Sidebar.tsx`) agar tautannya terarah secara konsisten dengan format query parameter, misalnya `/attendance?tab=payroll&tool=bpjs` atau `/purchasing?tab=inventory&tool=audit`.

### R3. Simulasi Interaktif & Log Terminal Divisi
Ketika pengguna mengeklik tombol aksi jalankan pada tool yang sedang disorot, simulator di kanan layar harus menampilkan log alur eksekusi otonom yang sesuai dengan deskripsi tugas tool tersebut.

## Acceptance Criteria

### Integrasi UI & Navigasi
- [ ] Mengeklik sub-menu di Sidebar mengarahkan ke halaman divisi dengan parameter `?tab=...&tool=...` yang valid.
- [ ] Halaman divisi tujuan mendeteksi parameter `tool` tersebut, menyorot elemen tool terkait dengan border bersinar/glow.
- [ ] Menekan tombol jalankan pada tool terpilih memicu pencetakan log simulasi kerja otonom yang relevan di konsol terminal kanan.

### Kualitas & Keandalan Kode
- [ ] Aplikasi Next.js dapat dibangun secara produksi (`npm run build`) dengan sukses tanpa error kompilasi atau peringatan deoptimasi runtime.
- [ ] Semua rute terbungkus dalam Suspense boundary di LayoutShell untuk menjamin kelancaran pembacaan useSearchParams().
