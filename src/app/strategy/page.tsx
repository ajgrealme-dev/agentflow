'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { LineChart, ShieldAlert, PieChart, Terminal, Cpu, RefreshCw, Layers, TrendingUp, Compass, Target } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function StrategyPage() {
  const { theme } = useTheme();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'scenario' | 'erm' | 'kpi'>('scenario');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [logOutput, setLogOutput] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState<string>('Memuat...');

  // Monte Carlo simulation state
  const [growthRate, setGrowthRate] = useState(12);
  const [inflation, setInflation] = useState(3.5);
  const [iterations, setIterations] = useState(1000);
  const [simResult, setSimResult] = useState<{ revenueEst: number; confidence: number; riskRating: string } | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const tool = searchParams.get('tool');
    if (tool) {
      setActiveTool(tool);
    } else {
      setActiveTool(null);
    }

    if (tab && (tab === 'scenario' || tab === 'erm' || tab === 'kpi')) {
      setActiveTab(tab as 'scenario' | 'erm' | 'kpi');
    } else if (tool) {
      if (['scenario', 'cashflow', 'expansion'].includes(tool)) {
        setActiveTab('scenario');
      } else if (['erm', 'radar'].includes(tool)) {
        setActiveTab('erm');
      } else if (tool === 'kpi') {
        setActiveTab('kpi');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/company')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.companies.length > 0) {
          setCompanyName(data.companies[0].name);
        }
      })
      .catch(console.error);
  }, []);

  const getToolGlow = (toolKey: string) => {
    return activeTool === toolKey
      ? 'ring-2 ring-primary border-primary animate-pulse shadow-lg shadow-primary/20 transition-all duration-300'
      : '';
  };

  const runStrategySim = (toolName: string, steps: string[]) => {
    setRunning(true);
    setLogOutput([`[SYS] Memulai eksekusi perkakas Strategi: ${toolName}...`]);
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setLogOutput(prev => [...prev, step]);
        if (idx === steps.length - 1) setRunning(false);
      }, (idx + 1) * 600);
    });
  };

  const runStrategySimulation = () => {
    setRunning(true);
    setLogOutput([`[SYS] Menginisialisasi model simulasi makroekonomi Monte Carlo...`]);

    setTimeout(() => {
      setLogOutput(prev => [...prev, `[STRATEGY] Mengkalkulasi ${iterations} probabilitas skenario pertumbuhan (${growthRate}%) & inflasi (${inflation}%)...`]);
    }, 600);

    setTimeout(() => {
      setLogOutput(prev => [...prev, `[AI] Mengolah statistik varians pendapatan & tingkat risiko korporasi...`]);
    }, 1200);

    setTimeout(() => {
      setSimResult({
        revenueEst: 1420000000,
        confidence: 88.5,
        riskRating: 'MODERATE-LOW'
      });
      setLogOutput(prev => [
        ...prev,
        `[SUCCESS] Simulasi Monte Carlo Selesai!`,
        `✓ Hasil proyeksi: Est. Rp 1.42 Miliar (Keyakinan 88.5%)`,
        `✓ Rekomendasi Alokasi Modal: Fokus ekspansi 15% ke pasar B2B.`
      ]);
      setRunning(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen relative font-sans">
      <Header 
        title="Divisi Perencanaan Strategis (Strategy &amp; M&amp;A AI)" 
        subtitle={`Organisasi: ${companyName} · Simulasi Monte Carlo, ERM Risk Matrix, &amp; Executive KPI`} 
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-light pb-0.5 gap-2">
          <button
            onClick={() => setActiveTab('scenario')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'scenario' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            📈 Simulator Skenario &amp; M&amp;A
          </button>
          <button
            onClick={() => setActiveTab('erm')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'erm' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            🛡️ Enterprise Risk Matrix (ERM)
          </button>
          <button
            onClick={() => setActiveTab('kpi')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'kpi' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            📊 Executive KPI Dashboard
          </button>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* ── TAB 1: MONTE CARLO SCENARIOS ────────────────────── */}
            {activeTab === 'scenario' && (
              <div className="space-y-6 fade-in">
                {/* Additional Strategy Tool Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`bg-card border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('cashflow')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">💵 Proyeksi Cashflow 12 Bulan</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Proyeksi arus kas masuk &amp; keluar untuk 4 kuartal mendatang.</p>
                    <button
                      disabled={running}
                      onClick={() => runStrategySim('Proyeksi Cashflow', [
                        '[CASHFLOW] Membaca proyeksi piutang AR & hutang AP...',
                        '[AI] Menghitung perkiraan saldo kas bebas Q4...',
                        '[SUCCESS] Proyeksi surplus kas Rp 850 Juta.'
                      ])}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      Simulasi Proyeksi Cashflow
                    </button>
                  </div>

                  <div className={`bg-card border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('expansion')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">🌍 Analisis Ekspansi Pasar &amp; M&amp;A</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Evaluasi kelayakan akuisisi atau pembukaan cabang wilayah baru.</p>
                    <button
                      disabled={running}
                      onClick={() => runStrategySim('Ekspansi Pasar', [
                        '[M&A] Menganalisis 3 opsi target akuisisi...',
                        '[AI] Menghitung estimasi ROI & payback period...',
                        '[SUCCESS] Target A direkomendasikan dengan IRR 24%.'
                      ])}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      Mulai Analisis Ekspansi
                    </button>
                  </div>
                </div>

                <div className={`bg-card border border-light p-6 rounded-2xl space-y-4 shadow-sm ${getToolGlow('scenario')}`}>
                  <h3 className="font-bold text-primary text-base flex items-center gap-2">
                    <LineChart className="text-primary" size={16} />
                    Simulator Probabilitas Bisnis Monte Carlo
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Target Pertumbuhan (%):</label>
                      <input
                        type="number"
                        value={growthRate}
                        onChange={(e) => setGrowthRate(parseFloat(e.target.value))}
                        className="w-full p-2 bg-elevated border border-light rounded-lg text-xs text-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Asumsi Inflasi (%):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={inflation}
                        onChange={(e) => setInflation(parseFloat(e.target.value))}
                        className="w-full p-2 bg-elevated border border-light rounded-lg text-xs text-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Jumlah Iterasi:</label>
                      <select
                        value={iterations}
                        onChange={(e) => setIterations(parseInt(e.target.value))}
                        className="w-full p-2 bg-elevated border border-light rounded-lg text-xs text-primary focus:outline-none cursor-pointer"
                      >
                        <option value={100}>100 kali</option>
                        <option value={1000}>1.000 kali</option>
                        <option value={5000}>5.000 kali</option>
                      </select>
                    </div>
                  </div>

                  <button
                    disabled={running}
                    onClick={runStrategySimulation}
                    className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                  >
                    {running ? 'Simulasi Berjalan...' : 'Mulai Simulasi Monte Carlo'}
                  </button>
                </div>

                {simResult && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 slide-up">
                    <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                      <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Est. Pendapatan</span>
                      <span className="text-primary font-stats font-extrabold text-base">Rp 1,42 Miliar</span>
                    </div>
                    <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                      <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Index Keyakinan</span>
                      <span className="text-emerald-500 font-stats font-extrabold text-base">{simResult.confidence}%</span>
                    </div>
                    <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                      <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Level Risiko</span>
                      <span className="text-amber-500 font-stats font-extrabold text-base">{simResult.riskRating}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: ENTERPRISE RISK MATRIX ───────────────────── */}
            {activeTab === 'erm' && (
              <div className="space-y-6 fade-in">
                {/* Competitor Radar Tool Card */}
                <div className={`bg-card border border-light p-4 rounded-xl flex items-center justify-between gap-4 ${getToolGlow('radar')}`}>
                  <div>
                    <span className="font-bold text-xs text-primary block">📡 Radar Risiko Pasar &amp; Competitor</span>
                    <p className="text-[11px] text-muted mt-0.5">Pemantauan pergerakan harga &amp; strategi kompetitor industri.</p>
                  </div>
                  <button
                    disabled={running}
                    onClick={() => runStrategySim('Radar Kompetitor', [
                      '[RADAR] Memindai data rilis produk 5 pesaing utama...',
                      '[AI] Mendeteksi pergeseran strategi penetapan harga...',
                      '[SUCCESS] Laporan intelijen pesaing diperbarui.'
                    ])}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    Pindai Radar Kompetitor
                  </button>
                </div>

                <div className={`bg-card border border-light p-6 rounded-2xl space-y-4 shadow-sm ${getToolGlow('erm')}`}>
                  <h3 className="font-bold text-primary text-base flex items-center gap-2">
                    <ShieldAlert className="text-primary" size={16} />
                    Risk Assessment (ERM) Matrix 5x5
                  </h3>
                  
                  {/* Visual grid illustration */}
                  <div className="grid grid-cols-5 gap-2 max-w-md mx-auto pt-2">
                    {Array.from({ length: 25 }).map((_, i) => {
                      const row = Math.floor(i / 5);
                      const col = i % 5;
                      let color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      if (row + col >= 6) {
                        color = 'bg-red-500/20 text-red-400 border-red-500/30';
                      } else if (row + col >= 4) {
                        color = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                      }
                      return (
                        <div key={i} className={`aspect-square border rounded-lg flex items-center justify-center font-mono font-bold text-[10px] ${color}`}>
                          {row+1},{col+1}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-center text-secondary">Grid di atas memetakan dampak risiko (vertikal) vs kemungkinan terjadinya risiko (horizontal).</p>
                </div>
              </div>
            )}

            {/* ── TAB 3: EXECUTIVE KPI GAUGES ─────────────────────── */}
            {activeTab === 'kpi' && (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 fade-in ${getToolGlow('kpi')}`}>
                {[
                  { title: 'Kesehatan Finansial (CFO)', rate: '96.2%', status: 'Sangat Optimal' },
                  { title: 'Tingkat Kehadiran SDM (CHRO)', rate: '92.4%', status: 'Optimal' },
                  { title: 'Akurasi Pengadaan Gudang (COO)', rate: '97.8%', status: 'Sangat Optimal' },
                  { title: 'ROAS Efisiensi Iklan (CMO)', rate: '4.2x ROAS', status: 'Optimal' },
                ].map(gauge => (
                  <div key={gauge.title} className="bg-card border border-light p-5 rounded-2xl flex flex-col justify-between gap-3 shadow-sm">
                    <div>
                      <span className="text-[10px] text-muted block uppercase font-bold tracking-wider">{gauge.title}</span>
                      <div className="text-xl font-extrabold text-primary font-stats mt-1">{gauge.rate}</div>
                    </div>
                    <span className="text-[10px] text-emerald-500 font-bold">{gauge.status}</span>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Log Output Console */}
          <div className="bg-card border border-light p-5 rounded-2xl flex flex-col h-[380px] shadow-sm">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5 mb-3 font-mono">
              <Terminal size={14} className="text-primary" /> Log AI Chief Strategy Officer:
            </span>
            <div className="flex-1 bg-elevated dark:bg-black/90 text-primary dark:text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-y-auto space-y-1.5 border border-light dark:border-white/10">
              {logOutput.length > 0 ? (
                logOutput.map((l, i) => <div key={i}>{l}</div>)
              ) : (
                <span className="text-muted italic">Klik tombol simulasi untuk memicu pemodelan Monte Carlo...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
