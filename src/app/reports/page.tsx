'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import {
  BarChart3, Wallet, Users, CheckCircle2, Clock,
  Briefcase, RefreshCw, Download, TrendingUp, FileText,
  Receipt, Calendar,
} from 'lucide-react';

type ReportType = 'daily' | 'weekly' | 'monthly';

interface ReportStats {
  totalSpend: number;
  newLeads: number;
  attendanceRate: number;
  pendingApprovals: number;
  totalReceipts: number;
}

interface ReportData {
  period: string;
  startDate: string;
  stats: ReportStats;
  receipts: any[];
  leads: any[];
  absences: any[];
  approvals: any[];
}

const TYPE_LABELS: Record<ReportType, string> = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
};

function formatRp(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReportsPage() {
  const [type, setType] = useState<ReportType>('monthly');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${type}`);
      const json = await res.json();
      if (json.success) setData(json);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function exportReport() {
    if (!data) return;
    const { stats, receipts, leads } = data;
    let csv = `LAPORAN ${TYPE_LABELS[type].toUpperCase()} — AgentFlow ERP\n`;
    csv += `Periode,${TYPE_LABELS[type]}\n`;
    csv += `Mulai,${formatDate(data.startDate)}\n\n`;
    csv += `RINGKASAN EKSEKUTIF\n`;
    csv += `Total Pengeluaran,${formatRp(stats.totalSpend)}\n`;
    csv += `Prospek Baru,${stats.newLeads}\n`;
    csv += `Tingkat Kehadiran,${stats.attendanceRate}%\n`;
    csv += `Persetujuan Pending,${stats.pendingApprovals}\n\n`;
    csv += `RINCIAN TRANSAKSI\nMerchant,Total,Tanggal\n`;
    receipts.forEach(r => { csv += `${r.merchantName ?? '-'},${formatRp(r.totalAmount ?? 0)},${formatDate(r.createdAt)}\n`; });
    csv += `\nPROSPEK BARU\nPerusahaan,Sumber,Status\n`;
    leads.forEach(l => { csv += `${l.companyName ?? l.title},${l.source},${l.status}\n`; });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `laporan_${type}_agentflow.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const summaryCards = data ? [
    { label: 'Total Pengeluaran', value: formatRp(data.stats.totalSpend), icon: Wallet, color: 'indigo', sub: `${data.stats.totalReceipts} transaksi bon` },
    { label: 'Prospek Klien Baru', value: String(data.stats.newLeads), icon: Briefcase, color: 'blue', sub: 'dari Buyer Scraper & manual' },
    { label: 'Tingkat Kehadiran', value: `${data.stats.attendanceRate}%`, icon: Users, color: 'emerald', sub: `${data.absences.length} total catatan absensi` },
    { label: 'Persetujuan Pending', value: String(data.stats.pendingApprovals), icon: Clock, color: 'amber', sub: 'menunggu tindakan supervisor' },
  ] : [];

  return (
    <div className="min-h-screen relative">
      <Header title="Reports Center" subtitle="Rekap harian, mingguan & bulanan otomatis dari semua data platform" />
      <div className="p-6 space-y-6 fade-in">

        {/* Header Controls */}
        <div className="glass-premium rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" />
            <span className="text-primary font-heading font-semibold text-sm">Tipe Laporan:</span>
          </div>
          <div className="flex rounded-xl overflow-hidden border border-black/5 dark:border-white/5">
            {(Object.keys(TYPE_LABELS) as ReportType[]).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="px-4 py-2 text-sm font-heading font-medium transition-colors cursor-pointer"
                style={{
                  background: type === t ? 'var(--primary)' : 'transparent',
                  color: type === t ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-heading font-medium bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-secondary hover:text-primary transition-colors cursor-pointer">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={exportReport} disabled={!data} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-colors disabled:opacity-40 cursor-pointer text-white" style={{ background: 'var(--primary)' }}>
              <Download size={13} /> Export Laporan CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {!loading && data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map(({ label, value, icon: Icon, color, sub }) => (
              <div key={label} className="glass-premium hover-glow float-interactive rounded-2xl p-5 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' :
                  color === 'blue' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' :
                  color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' :
                  'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                }`}>
                  <Icon size={18} />
                </div>
                <div className="text-2xl font-stats font-extrabold text-primary">{value}</div>
                <div className="text-secondary text-xs mt-1 font-heading">{label}</div>
                <div className="text-muted text-xs mt-0.5 font-stats">{sub}</div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-muted glass-premium rounded-2xl">
            <RefreshCw size={16} className="animate-spin" /> Menyusun laporan {TYPE_LABELS[type].toLowerCase()}...
          </div>
        )}

        {!loading && data && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Recent Transactions */}
            <div className="glass-premium rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                <Receipt size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-primary font-heading font-semibold text-sm">Transaksi Keuangan</span>
                <span className="ml-auto text-muted text-xs font-stats">{data.receipts.length} entri</span>
              </div>
              {data.receipts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted">
                  <Receipt size={28} className="opacity-20" />
                  <p className="text-xs font-heading">Belum ada transaksi periode ini</p>
                </div>
              ) : (
                <div className="divide-y divide-black/5 dark:divide-white/5 max-h-72 overflow-y-auto">
                  {data.receipts.map(r => (
                    <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-hover transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center flex-shrink-0">
                        <Receipt size={13} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-primary text-sm font-medium truncate">{r.merchantName ?? 'Merchant'}</div>
                        <div className="text-muted text-xs font-stats">{formatDate(r.createdAt)}</div>
                      </div>
                      <div className="text-primary font-stats font-bold text-sm flex-shrink-0">
                        {formatRp(r.totalAmount ?? 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New Leads */}
            <div className="glass-premium rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                <Briefcase size={15} className="text-blue-600 dark:text-blue-400" />
                <span className="text-primary font-heading font-semibold text-sm">Prospek Klien Baru</span>
                <span className="ml-auto text-muted text-xs font-stats">{data.leads.length} prospek</span>
              </div>
              {data.leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted">
                  <Briefcase size={28} className="opacity-20" />
                  <p className="text-xs font-heading">Belum ada leads periode ini</p>
                </div>
              ) : (
                <div className="divide-y divide-black/5 dark:divide-white/5 max-h-72 overflow-y-auto">
                  {data.leads.map(l => (
                    <div key={l.id} className="flex items-center gap-3 px-5 py-3 hover:bg-hover transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center flex-shrink-0">
                        <Briefcase size={13} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-primary text-sm font-medium truncate">{l.companyName ?? l.title}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted text-xs font-stats">{l.source}</span>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full font-stats ${
                            l.status === 'NEW' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' :
                            l.status === 'CONTACTED' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' :
                            'bg-black/5 dark:bg-white/5 text-secondary'
                          }`}>{l.status}</span>
                        </div>
                      </div>
                      {l.aiScore && (
                        <div className="text-emerald-600 dark:text-emerald-400 font-stats font-bold text-sm flex-shrink-0">
                          {l.aiScore}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Approvals */}
            <div className="glass-premium rounded-2xl shadow-sm overflow-hidden xl:col-span-2">
              <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                <Clock size={15} className="text-amber-600 dark:text-amber-400" />
                <span className="text-primary font-heading font-semibold text-sm">Antrian Persetujuan</span>
                <span className="ml-auto text-muted text-xs font-stats">{data.approvals.length} pengajuan</span>
              </div>
              {data.approvals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted">
                  <CheckCircle2 size={28} className="opacity-20" />
                  <p className="text-xs font-heading">Tidak ada pengajuan menunggu periode ini</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                        {['Pengaju', 'Tipe', 'Detail', 'Status', 'Tanggal'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-heading font-semibold text-muted uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {data.approvals.map(a => {
                        let detail = '';
                        try { const d = JSON.parse(a.details); detail = d.reason ?? d.item ?? JSON.stringify(d); } catch {}
                        return (
                          <tr key={a.id} className="hover:bg-hover transition-colors">
                            <td className="px-5 py-3 text-primary font-medium">{a.requester?.name ?? '—'}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full font-heading ${
                                a.type === 'LEAVE' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' :
                                a.type === 'PURCHASE' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' :
                                'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                              }`}>{a.type}</span>
                            </td>
                            <td className="px-5 py-3 text-secondary text-xs max-w-xs truncate">{detail}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full font-heading ${
                                a.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400' :
                                a.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' :
                                'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                              }`}>{a.status}</span>
                            </td>
                            <td className="px-5 py-3 text-muted text-xs font-stats">{formatDate(a.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
