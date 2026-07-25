'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import {
  Users, UserCheck, UserX, MapPin, Clock,
  Search, Download, RefreshCw, Filter, Calendar,
  Building2, TrendingUp, Cpu, BookOpen, AlertCircle,
  Coins, Award, CheckCircle, Shield, PhoneCall, Send, Terminal
} from 'lucide-react';

type TabName = 'contractors' | 'payroll' | 'performance' | 'ai_agents';
type Period = 'today' | 'week' | 'month';

interface AbsensiRecord {
  id: string;
  latitude: number;
  longitude: number;
  statusKehadiran: string;
  createdAt: string;
  user: { name: string; divisi: string | null; role: string };
}

interface Stats {
  totalHadir: number;
  totalDitolak: number;
  totalEmployees: number;
  attendanceRate: number;
  period: string;
}

interface AIAgent {
  id: string;
  name: string;
  type: string;
  status: string;
  tasksCompleted: number;
  tasksToday: number;
  errorRate: number;
  uptime: string;
  lastActivity: string;
  goal: string;
  sopMarkdown: string;
  icon: string;
}

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hari Ini',
  week: '7 Hari Terakhir',
  month: 'Bulan Ini',
};

function formatRp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function formatCoord(lat: number, lng: number) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabName>('contractors');
  const [period, setPeriod] = useState<Period>('today');
  const [search, setSearch] = useState('');
  
  // Data States
  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulation Logs
  const [runningSim, setRunningSim] = useState(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const tool = searchParams.get('tool');
    if (tool) {
      setActiveTool(tool);
    } else {
      setActiveTool(null);
    }

    if (tab && (tab === 'contractors' || tab === 'payroll' || tab === 'performance' || tab === 'ai_agents')) {
      setActiveTab(tab as TabName);
    } else if (tool) {
      if (['attendance', 'contractors', 'report'].includes(tool)) {
        setActiveTab('contractors');
      } else if (['payroll', 'leave', 'contract'].includes(tool)) {
        setActiveTab('payroll');
      } else if (['performance', 'violation'].includes(tool)) {
        setActiveTab('performance');
      } else if (tool === 'ai_agents') {
        setActiveTab('ai_agents');
      }
    }
  }, [searchParams]);

  const getToolGlow = (toolKey: string) => {
    return activeTool === toolKey
      ? 'ring-2 ring-primary border-primary animate-pulse shadow-lg shadow-primary/20 transition-all duration-300'
      : '';
  };

  const runHrToolSimulation = (toolName: string, steps: string[]) => {
    setRunningSim(true);
    setSimLogs([`[SYS] Memulai eksekusi perkakas SDM: ${toolName}...`]);
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setSimLogs(prev => [...prev, step]);
        if (idx === steps.length - 1) setRunningSim(false);
      }, (idx + 1) * 600);
    });
  };

  // Fetch Contractor Attendance Records
  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Contractor GPS logs
      const res = await fetch(`/api/attendance?period=${period}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records);
        setStats(data.stats);
      }

      // 2. Fetch AI Agents (filter for HR division)
      const agentsRes = await fetch('/api/agents');
      const agentsData = await agentsRes.json();
      if (agentsData.success) {
        const hrAgents = agentsData.agents.filter((a: any) => a.type.includes('HR'));
        setAiAgents(hrAgents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const filteredRecords = records.filter(r =>
    !search ||
    r.user.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.user.divisi ?? '').toLowerCase().includes(search.toLowerCase())
  );

  function exportCSV() {
    const header = 'Nama,Divisi,Status,Koordinat GPS,Waktu\n';
    const rows = filteredRecords.map(r =>
      [r.user.name, r.user.divisi ?? '', r.statusKehadiran, formatCoord(r.latitude, r.longitude), formatDateTime(r.createdAt)].join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `absensi_${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const handleKirimSlipGaji = (name: string, salary: number) => {
    setRunningSim(true);
    setSimLogs([`[SYS] Memulai generator slip gaji otonom untuk: ${name}...`]);

    setTimeout(() => {
      setSimLogs(prev => [...prev, `[BPJS] Verifikasi status keaktifan BPJS Ketenagakerjaan & Kesehatan...`]);
    }, 600);

    setTimeout(() => {
      setSimLogs(prev => [...prev, `[AI] Menyusun rincian potongan absensi & kalkulasi bonus lembur...`]);
    }, 1200);

    setTimeout(() => {
      setSimLogs(prev => [
        ...prev,
        `[SUCCESS] Slip Gaji Berhasil Dikirim!`,
        `✓ Penerima: ${name}`,
        `✓ Nominal: ${formatRp(salary)}`,
        `✓ PDF slip terkirim otomatis ke kontak Telegram/WA karyawan.`
      ]);
      setRunningSim(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen relative font-sans">
      <Header 
        title="Divisi SDM (HR AI)" 
        subtitle="Otomatisasi payroll, BPJS, audit kinerja karyawan, &amp; absensi geofencing lapangan" 
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-light pb-0.5 gap-2">
          <button
            onClick={() => { setActiveTab('contractors'); setSearch(''); }}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'contractors' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            👥 Absensi Lapangan / Kontraktor
          </button>
          <button
            onClick={() => { setActiveTab('payroll'); setSearch(''); }}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'payroll' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            💰 Penggajian (Payroll) &amp; BPJS
          </button>
          <button
            onClick={() => { setActiveTab('performance'); setSearch(''); }}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'performance' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            🎓 Evaluasi Kinerja (L&amp;D)
          </button>
          <button
            onClick={() => { setActiveTab('ai_agents'); setSearch(''); }}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'ai_agents' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            🤖 Keaktifan Karyawan AI (Uptime &amp; Logs)
          </button>
        </div>

        {/* Content & Terminal Log Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* ── TAB 1: CONTRACTORS ATTENDANCE ──────────────────────── */}
            {activeTab === 'contractors' && (
              <div className="space-y-6 fade-in">
                {/* Tool Card: Monthly SDM Report */}
                <div className={`bg-card border border-light p-4 rounded-xl flex items-center justify-between gap-4 ${getToolGlow('report')}`}>
                  <div>
                    <span className="font-bold text-xs text-primary block">📊 Laporan SDM Bulanan</span>
                    <p className="text-[11px] text-muted mt-0.5">Rekapitulasi tingkat kehadiran & produktivitas karyawan lapangan.</p>
                  </div>
                  <button
                    disabled={runningSim}
                    onClick={() => runHrToolSimulation('Laporan SDM Bulanan', [
                      '[SDM] Memilah data absensi & produktivitas...',
                      '[AI] Menyusun executive summary bulan berjalan...',
                      '[SUCCESS] Laporan_SDM_Juli_2026.pdf terbit.'
                    ])}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    Generate Laporan SDM
                  </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Hadir', value: stats?.totalHadir ?? 0, icon: UserCheck, color: 'emerald' },
                    { label: 'Ditolak (GPS Jauh)', value: stats?.totalDitolak ?? 0, icon: UserX, color: 'red' },
                    { label: 'Total Lapangan', value: stats?.totalEmployees ?? 0, icon: Users, color: 'indigo' },
                    { label: 'Tingkat Kehadiran', value: `${stats?.attendanceRate ?? 0}%`, icon: TrendingUp, color: 'blue' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1">
                      <span className="text-muted text-[10px] uppercase font-bold tracking-wider">{label}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-stats font-extrabold text-lg">{loading ? '...' : value}</span>
                        <Icon size={16} className={`text-${color}-500`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-light p-4 rounded-xl">
                  <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        placeholder="Cari nama karyawan lapangan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-elevated border border-light rounded-lg text-xs text-primary focus:outline-none"
                      />
                    </div>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value as Period)}
                      className="px-3 py-2 bg-elevated border border-light rounded-lg text-xs text-primary cursor-pointer focus:outline-none"
                    >
                      <option value="today">Hari Ini</option>
                      <option value="week">7 Hari Terakhir</option>
                      <option value="month">Bulan Ini</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportCSV}
                      className="flex items-center gap-1.5 px-4 py-2 bg-elevated border border-light text-secondary text-xs rounded-lg hover:text-primary transition-all cursor-pointer font-bold"
                    >
                      <Download size={12} />
                      Ekspor CSV
                    </button>
                  </div>
                </div>

                {/* Table Attendance */}
                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredRecords.length > 0 ? (
                  <div className={`bg-card border border-light rounded-2xl overflow-hidden shadow-sm ${getToolGlow('attendance')}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-elevated border-b border-light text-secondary font-bold">
                          <th className="p-4">Nama Karyawan</th>
                          <th className="p-4">Divisi</th>
                          <th className="p-4">Waktu Check-in</th>
                          <th className="p-4">Status Lokasi</th>
                          <th className="p-4">Koordinat GPS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light text-primary">
                        {filteredRecords.map((r) => (
                          <tr key={r.id} className="hover:bg-hover/20 transition-colors">
                            <td className="p-4 font-bold">{r.user.name}</td>
                            <td className="p-4">{r.user.divisi || 'Lapangan'}</td>
                            <td className="p-4 font-stats">{formatDateTime(r.createdAt)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.statusKehadiran === 'Hadir' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {r.statusKehadiran}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-muted">{formatCoord(r.latitude, r.longitude)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-card border border-light border-dashed rounded-2xl">
                    <span className="text-secondary text-xs">Belum ada log absensi lapangan terekam.</span>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: PAYROLL & BPJS ──────────────────────────────── */}
            {activeTab === 'payroll' && (
              <div className="space-y-6 fade-in">
                {/* Additional Payroll Tool Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`bg-card border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('leave')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">📅 Kelola Pengajuan Cuti</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Verifikasi sisa kuota cuti tahunan & persetujuan otomatis.</p>
                    <button
                      disabled={runningSim}
                      onClick={() => runHrToolSimulation('Pengajuan Cuti', [
                        '[CUTI] Memeriksa saldo sisa cuti tahunan...',
                        '[AI] Memverifikasi persetujuan atasan langsung...',
                        '[SUCCESS] Cuti 3 hari disetujui otonom.'
                      ])}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      Proses Pengajuan Cuti
                    </button>
                  </div>

                  <div className={`bg-card border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('contract')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">📝 Kontrak PKWT & Perpanjangan</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Audit jadwal kedaluwarsa kontrak karyawan & perpanjangan otomatis.</p>
                    <button
                      disabled={runningSim}
                      onClick={() => runHrToolSimulation('Kontrak PKWT', [
                        '[PKWT] Memindai masa berlaku kontrak kerja...',
                        '[AI] 2 karyawan mendekati masa akhir 30 hari...',
                        '[SUCCESS] Draf perpanjangan disiapkan.'
                      ])}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      Audit Kontrak PKWT
                    </button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Total Anggaran Gaji</span>
                    <span className="text-primary font-stats font-extrabold text-base">{formatRp(248500000)}</span>
                  </div>
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">BPJS Aktif</span>
                    <span className="text-emerald-500 font-stats font-extrabold text-base">142 Anggota</span>
                  </div>
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Bulan Pembayaran</span>
                    <span className="text-primary font-stats font-extrabold text-base">Juli 2026</span>
                  </div>
                </div>

                {/* Employee Salary List */}
                <div className={`bg-card border border-light rounded-2xl overflow-hidden shadow-sm ${getToolGlow('payroll')}`}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-elevated border-b border-light text-secondary font-bold">
                        <th className="p-4">Nama Karyawan</th>
                        <th className="p-4">Jabatan</th>
                        <th className="p-4">BPJS</th>
                        <th className="p-4">Gaji Pokok</th>
                        <th className="p-4">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light text-primary">
                      {[
                        { name: 'Budi Santoso', role: 'Compensation & Benefits Lead', salary: 14500000, bpjs: 'Aktif' },
                        { name: 'Diana Rahmat', role: 'HR Operation Manager', salary: 18000000, bpjs: 'Aktif' },
                        { name: 'Arief Wijaya', role: 'Recruitment Officer', salary: 8500000, bpjs: 'Aktif' },
                        { name: 'Siti Aminah', role: 'L&D Supervisor', salary: 11000000, bpjs: 'Aktif' },
                      ].map(emp => (
                        <tr key={emp.name} className="hover:bg-hover/20 transition-colors">
                          <td className="p-4 font-bold">{emp.name}</td>
                          <td className="p-4 font-semibold">{emp.role}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold">
                              {emp.bpjs}
                            </span>
                          </td>
                          <td className="p-4 font-stats font-bold">{formatRp(emp.salary)}</td>
                          <td className="p-4">
                            <button
                              onClick={() => handleKirimSlipGaji(emp.name, emp.salary)}
                              disabled={runningSim}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                            >
                              <Send size={10} />
                              Kirim Slip
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 3: PERFORMANCE & EVALUATION ────────────────────── */}
            {activeTab === 'performance' && (
              <div className="space-y-6 fade-in">
                <div className={`bg-card border border-light p-6 rounded-2xl space-y-4 ${getToolGlow('performance')}`}>
                  <h3 className="font-bold text-primary text-base flex items-center gap-2">
                    <Award className="text-primary" size={18} />
                    Tools Evaluasi Kinerja, OKR, &amp; L&amp;D (Learning &amp; Development)
                  </h3>
                  <p className="text-xs text-secondary leading-relaxed">
                    Pantau progres kompetensi karyawan, tingkat penyelesaian OKR, dan keaktifan sertifikasi korporat.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-elevated border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-primary">L&amp;D Training Audit</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                      </div>
                      <p className="text-[11px] text-muted">Secara otonom memindai modul pembelajaran LMS yang belum diselesaikan karyawan.</p>
                      <button
                        onClick={() => runHrToolSimulation('Audit LMS', [
                          '[SYS] Memulai Audit LMS otonom...',
                          '[L&D] Memindai data keikutsertaan di LMS...',
                          '[SUCCESS] 4 karyawan dikirimi reminder otomatis via email.'
                        ])}
                        className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer"
                      >
                        Jalankan Audit LMS
                      </button>
                    </div>

                    <div className="bg-elevated border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-primary">OKR Tracker &amp; Review</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                      </div>
                      <p className="text-[11px] text-muted">Kumpulkan pencapaian key results secara real-time dari Jira &amp; GitHub.</p>
                      <button
                        onClick={() => runHrToolSimulation('Sinkronisasi OKR', [
                          '[SYS] Memulai sinkronisasi OKR...',
                          '[OKR] Menarik data dari Jira & GitHub API...',
                          '[SUCCESS] Skor ketercapaian divisi SDM diperbarui ke 92%.'
                        ])}
                        className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer"
                      >
                        Mulai Sinkronisasi OKR
                      </button>
                    </div>

                    <div className={`bg-elevated border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('violation')}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-primary">Surat Peringatan (SP)</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                      </div>
                      <p className="text-[11px] text-muted">Deteksi pelanggaran tata tertib & penerbitan SP otomatis.</p>
                      <button
                        onClick={() => runHrToolSimulation('Surat Peringatan (SP)', [
                          '[SP] Memindai log kedisiplinan & absensi...',
                          '[AI] Terdeteksi 1 keterlambatan berulang...',
                          '[SUCCESS] Draf SP1 terbit otonom.'
                        ])}
                        className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer"
                      >
                        Terbitkan SP Otonom
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 4: AI AGENTS WORKFORCE MONITORING ───────────────── */}
            {activeTab === 'ai_agents' && (
              <div className={`space-y-6 fade-in ${getToolGlow('ai_agents')}`}>
                <div className="bg-card border border-light p-4 rounded-xl text-xs text-secondary flex items-center gap-2">
                  <Cpu size={16} className="text-primary animate-pulse" />
                  <span>Status keaktifan otonom HR AI Agents yang diawasi oleh CHRO.</span>
                </div>

                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : aiAgents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {aiAgents.map(agent => (
                      <div key={agent.id} className="bg-card border border-light rounded-2xl p-5 shadow-sm space-y-4 hover:border-primary/30 transition-all">
                        <div className="flex items-center justify-between border-b border-light pb-3">
                          <div>
                            <h4 className="font-bold text-white text-sm">{agent.name}</h4>
                            <span className="text-[10px] text-muted font-bold uppercase tracking-wider">{agent.type}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            agent.status === 'running' || agent.status === 'idle' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {agent.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-muted block text-[10px] font-bold uppercase tracking-wider">Goal utama:</span>
                            <p className="text-secondary leading-relaxed mt-0.5">{agent.goal}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-light">
                            <div className="bg-elevated/40 p-2.5 rounded-lg border border-light">
                              <span className="text-muted text-[9px] block">Tugas Selesai:</span>
                              <span className="text-primary font-bold font-stats text-sm">{agent.tasksCompleted}</span>
                            </div>
                            <div className="bg-elevated/40 p-2.5 rounded-lg border border-light">
                              <span className="text-muted text-[9px] block">Uptime:</span>
                              <span className="text-emerald-500 font-bold font-stats text-sm">{agent.uptime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-card border border-light border-dashed rounded-2xl">
                    <span className="text-secondary text-xs">Belum ada AI Agents terdaftar untuk divisi ini.</span>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Terminal Console Simulator Panel */}
          <div className="bg-card border border-light p-5 rounded-2xl flex flex-col h-[380px] shadow-sm">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5 mb-3 font-mono">
              <Terminal size={14} className="text-primary" /> Log AI Payroll &amp; HR Dispatcher:
            </span>
            <div className="flex-1 bg-elevated dark:bg-black/90 text-primary dark:text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-y-auto space-y-1.5 border border-light dark:border-white/10">
              {simLogs.length > 0 ? (
                simLogs.map((l, i) => <div key={i}>{l}</div>)
              ) : (
                <span className="text-muted italic">Klik tombol alat kerja untuk melihat simulasi eksekusi...</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
