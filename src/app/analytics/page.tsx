import Header from '@/components/Header';
import { mockDailyStats, mockAgents } from '@/lib/mock-data';
import { TrendingUp, TrendingDown, FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function AnalyticsPage() {
  const totalCompleted = mockDailyStats.reduce((s, d) => s + d.tasksCompleted, 0);
  const totalFailed = mockDailyStats.reduce((s, d) => s + d.tasksFailed, 0);
  const totalHours = mockDailyStats.reduce((s, d) => s + d.hoursSaved, 0);
  const totalDocs = mockDailyStats.reduce((s, d) => s + d.documentsProcessed, 0);
  const avgAccuracy = (((totalCompleted - totalFailed) / totalCompleted) * 100).toFixed(1);
  const maxTasks = Math.max(...mockDailyStats.map(d => d.tasksCompleted));

  return (
    <div className="min-h-screen relative">
      <Header
        title="Analytics"
        subtitle="Laporan performa dan efisiensi sistem 7 hari terakhir"
      />
      <div className="p-6 space-y-6 fade-in">

        {/* KPI Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Task Selesai', value: totalCompleted.toLocaleString('id-ID'), icon: CheckCircle2, color: 'emerald', change: '+22%' },
            { label: 'Total Jam Dihemat', value: `${totalHours.toFixed(1)}h`, icon: Clock, color: 'violet', change: '+18%' },
            { label: 'Dokumen Processed', value: totalDocs.toLocaleString('id-ID'), icon: FileText, color: 'blue', change: '+15%' },
            { label: 'Rata-rata Akurasi', value: `${avgAccuracy}%`, icon: TrendingUp, color: 'amber', change: '+2.1%' },
          ].map(({ label, value, icon: Icon, color, change }) => (
            <div key={label} className="bg-card border border-light rounded-2xl p-5 hover:bg-hover transition-all shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' :
                  color === 'violet' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' :
                  color === 'blue' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' :
                  'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                }`}>
                  <Icon size={18} />
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <TrendingUp size={11} /> {change}
                </span>
              </div>
              <div className={`text-2xl font-extrabold ${
                color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                color === 'violet' ? 'text-indigo-600 dark:text-indigo-400' :
                color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                'text-amber-600 dark:text-amber-400'
              }`}>{value}</div>
              <div className="text-secondary text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Bar Chart — Tasks per Day */}
          <div className="bg-card border border-light rounded-2xl p-6 shadow-sm">
            <h3 className="text-primary font-bold mb-1">Task Harian</h3>
            <p className="text-secondary text-xs mb-6">Jumlah task selesai vs gagal per hari</p>
            <div className="space-y-3">
              {mockDailyStats.map((d, i) => {
                const completedPct = (d.tasksCompleted / maxTasks) * 100;
                const failedPct = (d.tasksFailed / maxTasks) * 100;
                const isToday = i === mockDailyStats.length - 1;
                return (
                  <div key={d.date} className="flex items-center gap-4">
                    <span className={`text-xs w-10 text-right flex-shrink-0 ${isToday ? 'text-indigo-600 dark:text-violet-400 font-bold' : 'text-secondary'}`}>
                      {d.date.split(' ')[0]}
                    </span>
                    <div className="flex-1 flex items-center gap-1 h-7">
                      {/* Completed */}
                      <div
                        className={`h-full rounded-l-lg flex items-center pl-2 transition-all ${isToday ? 'bg-indigo-600 dark:bg-violet-500' : 'bg-indigo-600/50 dark:bg-violet-500/50'}`}
                        style={{ width: `${completedPct}%` }}
                      >
                        <span className="text-white text-xs font-bold whitespace-nowrap overflow-hidden">{d.tasksCompleted}</span>
                      </div>
                      {/* Failed */}
                      <div
                        className="h-full rounded-r-lg bg-red-500/50 flex items-center pl-1"
                        style={{ width: `${failedPct * 3}%` }}
                      />
                    </div>
                    <div className="text-xs text-secondary w-10 flex-shrink-0">
                      <span className="text-red-500 dark:text-red-400">{d.tasksFailed}❌</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-light">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-indigo-600 dark:bg-violet-500" />
                <span className="text-xs text-secondary">Task Selesai</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red-500/50" />
                <span className="text-xs text-secondary">Gagal</span>
              </div>
            </div>
          </div>

          {/* Hours Saved Chart */}
          <div className="bg-card border border-light rounded-2xl p-6 shadow-sm">
            <h3 className="text-primary font-bold mb-1">Jam Kerja Dihemat</h3>
            <p className="text-secondary text-xs mb-6">Estimasi waktu yang dihemat dibanding manual</p>
            <div className="flex items-end gap-3 h-44 pb-2">
              {mockDailyStats.map((d, i) => {
                const maxH = Math.max(...mockDailyStats.map(s => s.hoursSaved));
                const heightPct = (d.hoursSaved / maxH) * 100;
                const isToday = i === mockDailyStats.length - 1;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                    <span className={`text-xs font-bold ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-secondary'}`}>
                      {d.hoursSaved}h
                    </span>
                    <div className="w-full flex flex-col justify-end" style={{ height: '120px' }}>
                      <div
                        className={`w-full rounded-lg transition-all ${isToday ? 'bg-emerald-500' : 'bg-emerald-500/40'}`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className={`text-xs ${isToday ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-secondary'}`}>
                      {d.date.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agent Performance Table */}
          <div className="bg-card border border-light rounded-2xl p-6 shadow-sm">
            <h3 className="text-primary font-bold mb-1">Performa per Agent</h3>
            <p className="text-secondary text-xs mb-4">Ranking berdasarkan task selesai hari ini</p>
            <div className="space-y-3">
              {[...mockAgents]
                .sort((a, b) => b.tasksToday - a.tasksToday)
                .map((agent, i) => (
                  <div key={agent.id} className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-5 text-center ${
                      i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-800' : 'text-secondary'
                    }`}>#{i + 1}</span>
                    <span className="text-lg">{agent.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-primary font-medium truncate">{agent.name}</span>
                        <span className="text-xs text-secondary ml-2">{agent.tasksToday} task</span>
                      </div>
                      <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${agent.status === 'error' ? 'bg-red-500' : 'bg-indigo-600 dark:bg-violet-500'}`}
                          style={{ width: `${(agent.tasksToday / 70) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${agent.errorRate > 3 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {(100 - agent.errorRate).toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* ROI Calculator */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-6 shadow-sm">
            <h3 className="text-primary font-bold mb-1">💰 Estimasi Penghematan (Bulan Ini)</h3>
            <p className="text-secondary text-xs mb-5">Dibandingkan proses manual dengan 10 karyawan</p>

            <div className="space-y-4">
              {[
                { label: 'Gaji karyawan manual (10 org × Rp5jt)', value: 'Rp 50.000.000', negative: true },
                { label: 'Biaya AgentFlow platform', value: 'Rp 2.500.000', negative: true },
                { label: 'Sisa 3 supervisor (Rp5jt each)', value: 'Rp 15.000.000', negative: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-secondary text-sm">{item.label}</span>
                  <span className={`font-bold text-sm ${item.negative ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {item.value}
                  </span>
                </div>
              ))}

              <div className="pt-3 border-t border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center justify-between">
                  <span className="text-primary font-bold">Total Penghematan</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">Rp 32.500.000</span>
                </div>
                <p className="text-muted text-xs mt-1">per bulan · efisiensi 65%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
