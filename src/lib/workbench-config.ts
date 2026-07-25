import type { AdminRole, RoleConfig, WorkbenchTool } from './types';

// ── Role Visual Configurations ───────────────────────────────
export const ROLE_CONFIGS: Record<AdminRole, RoleConfig> = {
  owner: {
    role: 'owner',
    label: 'Owner / Super Admin',
    divisi: 'Manajemen',
    accentColor: '#4f46e5',
    accentGlow: 'rgba(79, 70, 229, 0.18)',
    gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
  },
  admin: {
    role: 'admin',
    label: 'Administrator',
    divisi: 'Manajemen',
    accentColor: '#4f46e5',
    accentGlow: 'rgba(79, 70, 229, 0.18)',
    gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
  },
  finance: {
    role: 'finance',
    label: 'Admin Keuangan',
    divisi: 'Finance & Accounting',
    accentColor: '#10b981',
    accentGlow: 'rgba(16, 185, 129, 0.18)',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  hr: {
    role: 'hr',
    label: 'Admin SDM',
    divisi: 'Human Resources',
    accentColor: '#8b5cf6',
    accentGlow: 'rgba(139, 92, 246, 0.18)',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  },
  purchasing: {
    role: 'purchasing',
    label: 'Admin Pengadaan',
    divisi: 'Purchasing & Gudang',
    accentColor: '#f59e0b',
    accentGlow: 'rgba(245, 158, 11, 0.18)',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
};

// ── All Workbench Tools ──────────────────────────────────────
export const ALL_TOOLS: WorkbenchTool[] = [
  // ── FINANCE TOOLS ──────────────────────────────────────────
  {
    id: 'finance-invoice-list',
    title: 'Rekap Invoice AR/AP',
    description: 'Pantau semua tagihan masuk (piutang) dan tagihan keluar (hutang) secara real-time.',
    icon: '📊',
    href: '/finance',
    status: 'available',
    category: 'Keuangan',
    roles: ['finance', 'owner', 'admin'],
  },
  {
    id: 'finance-reminder',
    title: 'Reminder Utang/Piutang',
    description: 'Kirim pesan pengingat otomatis ke klien atau vendor yang memiliki tagihan jatuh tempo via WhatsApp.',
    icon: '⏰',
    href: '/finance',
    action: 'send-reminder',
    status: 'available',
    category: 'Keuangan',
    roles: ['finance', 'owner', 'admin'],
  },
  {
    id: 'finance-create-invoice',
    title: 'Buat Invoice Baru',
    description: 'Buat invoice baru dengan nomor otomatis. Mendukung template standar perusahaan.',
    icon: '🧾',
    href: '/finance',
    action: 'create-invoice',
    status: 'available',
    category: 'Keuangan',
    roles: ['finance', 'owner', 'admin'],
  },
  {
    id: 'finance-ocr',
    title: 'Scan & OCR Dokumen',
    description: 'Upload gambar/PDF invoice dan biarkan AI mengekstrak data secara otomatis (nomor, jumlah, jatuh tempo).',
    icon: '🔍',
    href: '/demo',
    status: 'available',
    category: 'Keuangan',
    roles: ['finance', 'owner', 'admin'],
  },
  {
    id: 'finance-cashflow',
    title: 'Laporan Arus Kas',
    description: 'Visualisasi cash flow mingguan dan bulanan. Identifikasi tren dan anomali secara cepat.',
    icon: '📈',
    href: '/reports',
    status: 'available',
    category: 'Keuangan',
    roles: ['finance', 'owner', 'admin'],
  },
  {
    id: 'finance-reconciliation',
    title: 'Rekonsiliasi Bank',
    description: 'Bandingkan data mutasi rekening bank dengan transaksi di sistem secara otomatis.',
    icon: '🔄',
    href: '/finance',
    action: 'reconcile',
    status: 'beta',
    category: 'Keuangan',
    roles: ['finance', 'owner', 'admin'],
  },
  {
    id: 'finance-export',
    title: 'Ekspor Laporan',
    description: 'Ekspor laporan keuangan ke format Excel atau PDF dengan satu klik.',
    icon: '📤',
    href: '/reports',
    status: 'available',
    category: 'Keuangan',
    roles: ['finance', 'owner', 'admin'],
  },

  // ── HR TOOLS ───────────────────────────────────────────────
  {
    id: 'hr-attendance',
    title: 'Absensi Real-Time',
    description: 'Pantau kehadiran seluruh karyawan hari ini. Lihat siapa yang hadir, terlambat, atau belum absen.',
    icon: '👥',
    href: '/attendance',
    status: 'available',
    category: 'SDM',
    roles: ['hr', 'owner', 'admin'],
  },
  {
    id: 'hr-geofence',
    title: 'Verifikasi Geofence',
    description: 'Cek lokasi GPS karyawan saat check-in dan pastikan mereka berada dalam radius kantor.',
    icon: '📍',
    href: '/attendance',
    action: 'geofence',
    status: 'available',
    category: 'SDM',
    roles: ['hr', 'owner', 'admin'],
  },
  {
    id: 'hr-leave',
    title: 'Kelola Pengajuan Cuti',
    description: 'Approve atau tolak pengajuan cuti karyawan. Lihat sisa jatah cuti dan histori pengajuan.',
    icon: '📅',
    href: '/queue',
    status: 'available',
    category: 'SDM',
    roles: ['hr', 'owner', 'admin'],
  },
  {
    id: 'hr-contract',
    title: 'Kontrak PKWT',
    description: 'Lihat dan kelola kontrak kerja karyawan. Notifikasi otomatis 30 hari sebelum kontrak berakhir.',
    icon: '📝',
    href: '/attendance',
    action: 'contracts',
    status: 'beta',
    category: 'SDM',
    roles: ['hr', 'owner', 'admin'],
  },
  {
    id: 'hr-payslip',
    title: 'Generate Slip Gaji',
    description: 'Generate dan kirim slip gaji bulanan ke seluruh karyawan via Telegram atau WhatsApp.',
    icon: '💰',
    action: 'payslip',
    status: 'beta',
    category: 'SDM',
    roles: ['hr', 'owner', 'admin'],
  },
  {
    id: 'hr-violation',
    title: 'Pelanggaran & Sanksi',
    description: 'Catat pelanggaran disiplin karyawan dan kelola surat peringatan (SP1/SP2/SP3).',
    icon: '⚠️',
    action: 'violation',
    status: 'soon',
    category: 'SDM',
    roles: ['hr', 'owner', 'admin'],
  },
  {
    id: 'hr-report',
    title: 'Laporan SDM Bulanan',
    description: 'Rekap otomatis: ringkasan absensi, tingkat kehadiran, kinerja divisi bulan ini.',
    icon: '📊',
    href: '/reports',
    status: 'available',
    category: 'SDM',
    roles: ['hr', 'owner', 'admin'],
  },

  // ── PURCHASING / GUDANG TOOLS ──────────────────────────────
  {
    id: 'purchasing-pr',
    title: 'Purchase Requisition',
    description: 'Buat dan kelola permintaan pembelian (PR). Lacak status dari draft hingga persetujuan.',
    icon: '📦',
    action: 'purchasing-pr',
    status: 'available',
    category: 'Pengadaan',
    roles: ['purchasing', 'owner', 'admin'],
  },
  {
    id: 'purchasing-so',
    title: 'Sales Order',
    description: 'Lihat dan proses pesanan penjualan masuk. Hubungkan SO dengan PR pengadaan.',
    icon: '📋',
    action: 'purchasing-so',
    status: 'available',
    category: 'Pengadaan',
    roles: ['purchasing', 'owner', 'admin'],
  },
  {
    id: 'purchasing-supplier',
    title: 'Kelola Supplier',
    description: 'Database supplier: kontak, rating, histori transaksi, dan status kontrak.',
    icon: '🏪',
    action: 'purchasing-supplier',
    status: 'soon',
    category: 'Pengadaan',
    roles: ['purchasing', 'owner', 'admin'],
  },
  {
    id: 'purchasing-rfq',
    title: 'Request for Quotation',
    description: 'Kirim RFQ ke beberapa supplier sekaligus dan bandingkan penawaran harga yang masuk.',
    icon: '💲',
    action: 'purchasing-rfq',
    status: 'beta',
    category: 'Pengadaan',
    roles: ['purchasing', 'owner', 'admin'],
  },
  {
    id: 'purchasing-delivery',
    title: 'Tracking Pengiriman',
    description: 'Monitor status pengiriman barang dari supplier secara real-time.',
    icon: '🚚',
    action: 'purchasing-delivery',
    status: 'soon',
    category: 'Pengadaan',
    roles: ['purchasing', 'owner', 'admin'],
  },
  {
    id: 'purchasing-stock',
    title: 'Stok Gudang',
    description: 'Pantau level inventori barang dan dapatkan alert otomatis ketika stok mendekati minimum.',
    icon: '🏭',
    action: 'purchasing-stock',
    status: 'beta',
    category: 'Pengadaan',
    roles: ['purchasing', 'owner', 'admin'],
  },
  {
    id: 'purchasing-report',
    title: 'Laporan Pengadaan',
    description: 'Rekap pembelian bulanan: total pengeluaran, supplier terbanyak, barang paling sering dibeli.',
    icon: '📊',
    href: '/reports',
    status: 'available',
    category: 'Pengadaan',
    roles: ['purchasing', 'owner', 'admin'],
  },

  // ── OWNER / SUPER ADMIN EXCLUSIVE TOOLS ───────────────────
  {
    id: 'owner-kpi',
    title: 'KPI Dashboard',
    description: 'Overview kinerja seluruh divisi dalam satu layar: finance, SDM, dan pengadaan.',
    icon: '🧩',
    href: '/analytics',
    status: 'available',
    category: 'Manajemen',
    roles: ['owner', 'admin'],
  },
  {
    id: 'owner-company',
    title: 'Konfigurasi Perusahaan',
    description: 'Ubah data perusahaan: nama, API key, koordinat kantor, dan radius geofence.',
    icon: '⚙️',
    href: '/settings',
    status: 'available',
    category: 'Manajemen',
    roles: ['owner', 'admin'],
  },
  {
    id: 'owner-users',
    title: 'Manajemen User',
    description: 'Buat, edit, dan nonaktifkan akun admin. Atur peran dan divisi setiap user.',
    icon: '👤',
    href: '/settings',
    action: 'users',
    status: 'beta',
    category: 'Manajemen',
    roles: ['owner', 'admin'],
  },
  {
    id: 'owner-ai-agents',
    title: 'AI Agents Manager',
    description: 'Monitor dan kendalikan semua agen AI yang sedang berjalan di sistem.',
    icon: '🤖',
    href: '/agents',
    status: 'available',
    category: 'Manajemen',
    roles: ['owner', 'admin'],
  },
];

/**
 * Get tools for a specific role, filtered from ALL_TOOLS.
 */
export function getToolsForRole(role: AdminRole): WorkbenchTool[] {
  return ALL_TOOLS.filter((tool) => tool.roles.includes(role));
}

/**
 * Get tools grouped by category for a given role.
 */
export function getToolsByCategory(role: AdminRole): Record<string, WorkbenchTool[]> {
  const tools = getToolsForRole(role);
  return tools.reduce<Record<string, WorkbenchTool[]>>((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {});
}

/**
 * Get role config with fallback to 'admin'.
 */
export function getRoleConfig(role: string): RoleConfig {
  return ROLE_CONFIGS[role as AdminRole] ?? ROLE_CONFIGS.admin;
}
