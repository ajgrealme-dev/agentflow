'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import TaskItem from '@/components/TaskItem';
import { 
  CheckCircle2, AlertCircle, Zap, Timer, TrendingUp, 
  Briefcase, FileText, Bell, Users, Cpu, Activity, RefreshCw, Package, Wallet
} from 'lucide-react';
import type { Task, TaskStatus, TaskType, Priority } from '@/lib/types';

interface DashboardStats {
  leadsCount: number;
  receiptsCount: number;
  receiptsTotalAmount: number;
  approvalsCount: number;
  companyName: string;
  
  // New role metrics
  requisitionsCount: number;
  salesOrdersCount: number;
  attendanceCount: number;
  totalEmployees: number;

  // AI Metrics
  totalAgentCount: number;
  activeAgentCount: number;
  totalTasksCompleted: number;
  totalTasksFailed: number;
  totalTokenCostUSD: number;
  hoursSaved: number;
}

export default function DashboardPage() {
  const router = useRouter();
  
  // Client state for role-based customization
  const [role, setRole] = useState<string>('admin');
  const [userName, setUserName] = useState<string>('Supervisor');

  const [stats, setStats] = useState<DashboardStats>({
    leadsCount: 0,
    receiptsCount: 0,
    receiptsTotalAmount: 0,
    approvalsCount: 0,
    companyName: 'Memuat Organisasi...',
    requisitionsCount: 0,
    salesOrdersCount: 0,
    attendanceCount: 0,
    totalEmployees: 0,
    totalAgentCount: 0,
    activeAgentCount: 0,
    totalTasksCompleted: 0,
    totalTasksFailed: 0,
    totalTokenCostUSD: 0.0,
    hoursSaved: 0
  });
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync role configuration from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem('user_role') || 'admin';
    const savedName = localStorage.getItem('user_name') || 'Supervisor';
    setRole(savedRole);
    setUserName(savedName);
  }, []);

  // Fetch stats and tasks from real database APIs
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsRes = await fetch('/api/dashboard-stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats);
        }
      }

      // Fetch recent tasks
      const tasksRes = await fetch('/api/tasks');
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        if (tasksData.success && tasksData.tasks) {
          // Format real database AIAgentTasks to match frontend Task props
          const formattedTasks: Task[] = tasksData.tasks.map((t: any) => {
            let status: TaskStatus = 'pending';
            if (t.status === 'COMPLETED') status = 'completed';
            else if (t.status === 'RUNNING') status = 'processing';
            else if (t.status === 'WAITING_APPROVAL') status = 'waiting_approval';
            else if (t.status === 'FAILED') status = 'failed';

            let type: TaskType = 'data_entry';
            if (t.title.toLowerCase().includes('ocr') || t.title.toLowerCase().includes('invoice')) {
              type = 'invoice_ocr';
            } else if (t.title.toLowerCase().includes('absensi') || t.title.toLowerCase().includes('geofence')) {
              type = 'email_parse';
            } else if (t.title.toLowerCase().includes('match') || t.title.toLowerCase().includes('verify') || t.title.toLowerCase().includes('matching')) {
              type = 'reconciliation';
            }

            const stateData = JSON.parse(t.currentState || '{}');

            return {
              id: t.id,
              title: t.title,
              type,
              status,
              agentId: t.agentId,
              agentName: t.agent?.name || 'Karyawan AI',
              priority: (t.status === 'WAITING_APPROVAL' ? 'high' : 'medium') as Priority,
              startedAt: new Date(t.createdAt).toLocaleTimeString('id-ID'),
              source: stateData.file || stateData.source || 'Sistem Internal',
              destination: stateData.detectedVendor || stateData.destination || 'Database',
              confidence: stateData.confidence || (status === 'completed' ? 95 : 75),
              errorMessage: t.status === 'FAILED' ? 'Gagal memproses tugas asinkron' : undefined
            };
          });
          setTasks(formattedTasks);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter Tasks by logged in department role
  const filteredTasksByRole = tasks.filter(task => {
    if (role === 'owner' || role === 'admin') return true;
    if (role === 'finance') {
      return task.type === 'invoice_ocr' || task.type === 'reconciliation' || task.title.toLowerCase().includes('match') || task.title.toLowerCase().includes('ocr');
    }
    if (role === 'hr') {
      return task.type === 'email_parse' || task.title.toLowerCase().includes('absensi') || task.title.toLowerCase().includes('geofence') || task.title.toLowerCase().includes('cuti');
    }
    if (role === 'purchasing') {
      return task.type === 'data_entry' || task.title.toLowerCase().includes('requisition') || task.title.toLowerCase().includes('sales') || task.title.toLowerCase().includes('prospect');
    }
    return true;
  });

  // Limit to first 5 items
  const displayedTasks = filteredTasksByRole.slice(0, 5);

  // Dynamic Header configuration
  let headerTitle = "Executive Boardroom Dashboard";
  let headerSubtitle = `Organisasi: ${stats.companyName} · Pengawasan Keuangan, SDM, dan Operasional Perusahaan`;

  if (role === 'finance') {
    headerTitle = "Finance AI Control Panel";
    headerSubtitle = `Organisasi: ${stats.companyName} · Pemantauan Kas, OCR Bon, & Verifikasi Invoice`;
  } else if (role === 'hr') {
    headerTitle = "HR AI Operations Desk";
    headerSubtitle = `Organisasi: ${stats.companyName} · Pemantauan Karyawan AI & Absensi Geofence Lapangan`;
  } else if (role === 'purchasing') {
    headerTitle = "Purchasing AI Command Center";
    headerSubtitle = `Organisasi: ${stats.companyName} · Pemantauan Requisitions, Sales Orders, & Prospek Klien`;
  }

  return (
    <div className="min-h-screen relative font-sans">
      <Header
        title={headerTitle}
        subtitle={headerSubtitle}
      />

      <div className="p-8 space-y-8 fade-in relative z-10 max-w-7xl mx-auto">
        
        {/* Render stats cards dynamically by Role */}
        
        {/* ── CASE 1: OWNER / ADMIN (CEO VIEW ALL) ──────────────────── */}
        {(role === 'owner' || role === 'admin') && (
          <>
            {/* Section 1: AI Health & Efficiency Metrics */}
            <div data-tour="dashboard-stats">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
                <Cpu size={15} className="text-primary" />
                Kinerja &amp; Efisiensi Karyawan AI
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Biaya API Token (USD)"
                  value={loading ? '...' : `$${stats.totalTokenCostUSD.toFixed(2)}`}
                  subtitle="Total pengeluaran biaya token"
                  icon={Zap}
                  color="violet"
                />
                <StatsCard
                  title="Tugas AI Berhasil"
                  value={loading ? '...' : stats.totalTasksCompleted}
                  subtitle="Otomasi selesai sukses"
                  icon={CheckCircle2}
                  color="emerald"
                />
                <StatsCard
                  title="Tugas AI Gagal"
                  value={loading ? '...' : stats.totalTasksFailed}
                  subtitle="Tugas gagal diproses"
                  icon={AlertCircle}
                  color="red"
                  pulse={stats.totalTasksFailed > 0}
                />
                <StatsCard
                  title="Jam Kerja Dihemat"
                  value={loading ? '...' : `${stats.hoursSaved} Jam`}
                  subtitle="ROI efisiensi operasional"
                  icon={Timer}
                  color="blue"
                />
              </div>
            </div>

            {/* Section 2: Business Metrics & Financial Summary */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-500" />
                Operasional Bisnis &amp; Rekap Buku Besar
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Klien Prospek B2B"
                  value={loading ? '...' : stats.leadsCount}
                  subtitle="Pencarian prospek aktif"
                  icon={Briefcase}
                  color="emerald"
                  pulse={!loading && stats.leadsCount > 0}
                />
                <StatsCard
                  title="Invoice / Bon Diproses"
                  value={loading ? '...' : stats.receiptsCount}
                  subtitle="Dokumen terintegrasi OCR"
                  icon={FileText}
                  color="violet"
                />
                <StatsCard
                  title="Total Pengeluaran Bon"
                  value={loading ? '...' : `Rp ${stats.receiptsTotalAmount.toLocaleString('id-ID')}`}
                  subtitle="Rekapitulasi arus kas harian"
                  icon={Timer}
                  color="blue"
                />
                <StatsCard
                  title="Eskalasi Butuh Review"
                  value={loading ? '...' : stats.approvalsCount}
                  subtitle="Persetujuan pending di CEO desk"
                  icon={AlertCircle}
                  color="amber"
                  pulse={stats.approvalsCount > 0}
                />
              </div>
            </div>
          </>
        )}

        {/* ── CASE 2: FINANCE ROLE (CFO VIEW) ────────────────────────── */}
        {role === 'finance' && (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
              <TrendingUp size={15} className="text-violet-500" />
              Metrik Keuangan &amp; Akurasi Arus Kas
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Pengeluaran Bon"
                value={loading ? '...' : `Rp ${stats.receiptsTotalAmount.toLocaleString('id-ID')}`}
                subtitle="Rekap Buku Besar Arus Kas"
                icon={Wallet}
                color="blue"
              />
              <StatsCard
                title="Dokumen Diproses (OCR)"
                value={loading ? '...' : stats.receiptsCount}
                subtitle="Akurasi Ekstraksi AI 95%+"
                icon={FileText}
                color="violet"
              />
              <StatsCard
                title="Verifikasi Invoice Pending"
                value={loading ? '...' : stats.approvalsCount}
                subtitle="Menunggu persetujuan lunas"
                icon={AlertCircle}
                color="amber"
                pulse={stats.approvalsCount > 0}
              />
              <StatsCard
                title="Biaya Token AI (Finance)"
                value={loading ? '...' : `$${(stats.totalTokenCostUSD * 0.4).toFixed(2)}`}
                subtitle="Estimasi porsi API departemen"
                icon={Zap}
                color="violet"
              />
            </div>
          </div>
        )}

        {/* ── CASE 3: HR ROLE (CHRO VIEW) ────────────────────────────── */}
        {role === 'hr' && (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
              <Users size={15} className="text-emerald-500" />
              Kehadiran &amp; Kinerja Karyawan Lapangan
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Kontraktor Hadir (GPS)"
                value={loading ? '...' : stats.attendanceCount}
                subtitle="Verifikasi geofence otonom"
                icon={Users}
                color="emerald"
              />
              <StatsCard
                title="Total Pekerja Lapangan"
                value={loading ? '...' : stats.totalEmployees}
                subtitle="Kontrak PKWT aktif"
                icon={Briefcase}
                color="blue"
              />
              <StatsCard
                title="Tingkat Kehadiran (%)"
                value={loading ? '...' : (stats.totalEmployees > 0 ? `${Math.round((stats.attendanceCount / stats.totalEmployees) * 100)}%` : '100%')}
                subtitle="Persentase kehadiran hari ini"
                icon={TrendingUp}
                color="blue"
              />
              <StatsCard
                title="Uptime HR Agents"
                value="99.8%"
                subtitle="Status operasional asisten AI"
                icon={CheckCircle2}
                color="emerald"
              />
            </div>
          </div>
        )}

        {/* ── CASE 4: PURCHASING ROLE (COO VIEW) ──────────────────────── */}
        {role === 'purchasing' && (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
              <Package size={15} className="text-blue-500" />
              Metrik Pengadaan Barang &amp; CRM Prospek
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Klien Prospek B2B"
                value={loading ? '...' : stats.leadsCount}
                subtitle="Prospek pembeli di CRM"
                icon={Briefcase}
                color="emerald"
                pulse={stats.leadsCount > 0}
              />
              <StatsCard
                title="Purchase Requisitions"
                value={loading ? '...' : stats.requisitionsCount}
                subtitle="Permintaan bahan baku terbuat"
                icon={Package}
                color="blue"
              />
              <StatsCard
                title="Sales Orders (SO)"
                value={loading ? '...' : stats.salesOrdersCount}
                subtitle="Pesanan masuk terverifikasi"
                icon={FileText}
                color="blue"
              />
              <StatsCard
                title="Biaya Token AI (Purchasing)"
                value={loading ? '...' : `$${(stats.totalTokenCostUSD * 0.3).toFixed(2)}`}
                subtitle="Estimasi porsi API departemen"
                icon={Zap}
                color="violet"
              />
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left: Activity Feed + Tasks */}
          <div className="xl:col-span-2 space-y-6">
            <div className="glass-premium hover-glow float-interactive">
              <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-primary font-heading font-bold">
                    Aktivitas Terbaru {role === 'finance' ? 'Keuangan AI' : role === 'hr' ? 'SDM AI' : role === 'purchasing' ? 'Pengadaan AI' : 'Karyawan AI'}
                  </h3>
                  <p className="text-secondary text-xs mt-0.5">Log eksekusi otonom terstruktur dari database</p>
                </div>
                <button 
                  onClick={fetchDashboardData}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-elevated border border-light text-secondary text-xs rounded-lg hover:text-primary transition-all cursor-pointer"
                >
                  <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
              <div className="p-4 space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : displayedTasks.length > 0 ? (
                  displayedTasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-10 text-xs text-secondary">
                    Belum ada log tugas yang relevan dengan departemen Anda di database.
                  </div>
                )}
              </div>
              <div className="p-4 pt-0">
                <button 
                  onClick={() => router.push('/workbench')}
                  className="block w-full text-center py-2.5 rounded-xl border border-black/5 dark:border-white/5 text-secondary text-sm hover:text-primary hover:bg-hover transition-all font-heading font-medium cursor-pointer"
                >
                  Buka Mission Control Room →
                </button>
              </div>
            </div>
          </div>

          {/* Right: Quick stats summary & System Health */}
          <div className="space-y-6">
            <div className="glass-premium hover-glow float-interactive p-5 space-y-4">
              <h3 className="text-primary font-heading font-bold text-sm flex items-center gap-2 border-b border-light pb-2">
                <Activity size={15} className="text-indigo-500" />
                Kesehatan Sistem Otomasi
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-secondary">Uptime Core OS</span>
                  <span className="text-emerald-500 font-bold font-stats">99.98%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">AI Deployment</span>
                  <span className="text-primary font-bold font-stats">{stats.totalAgentCount} Agents</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Tugas/Menit</span>
                  <span className="text-primary font-bold font-stats">~3.2 Tugas</span>
                </div>
              </div>
            </div>

            <div className="glass-premium hover-glow float-interactive p-5">
              <h3 className="text-primary font-heading font-bold text-sm mb-4 flex items-center gap-2">
                <TrendingUp size={15} className="text-indigo-500" />
                Ringkasan Bulan Ini
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Total Invoice / Bon', value: loading ? '...' : stats.receiptsCount, icon: '📄', change: 'Live' },
                  { label: 'Prospek CRM AI', value: loading ? '...' : stats.leadsCount, icon: '🎯', change: 'Live' },
                  { label: 'Estimasi Penghematan', value: loading ? '...' : `Rp ${(stats.totalTasksCompleted * 20000).toLocaleString('id-ID')}`, icon: '💰', change: 'Est.' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-secondary text-xs">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-primary font-stats font-bold text-sm">{item.value}</div>
                      <div className="text-emerald-500 dark:text-emerald-400 text-xs font-stats">{item.change}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
