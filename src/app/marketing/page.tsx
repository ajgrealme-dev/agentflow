'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { Megaphone, Share2, Palette, Sparkles, Send, RefreshCw, Terminal, TrendingUp, Search } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function MarketingPage() {
  const { theme } = useTheme();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'ads' | 'social' | 'creative'>('ads');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [logOutput, setLogOutput] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState<string>('Memuat...');
  
  // Copywriting Generator State
  const [themeInput, setThemeInput] = useState('Promo Spesial Kemerdekaan diskon 17% untuk produk otomasi perkantoran');
  const [channel, setChannel] = useState('instagram');
  const [generatedText, setGeneratedText] = useState('');

  useEffect(() => {
    const tab = searchParams.get('tab');
    const tool = searchParams.get('tool');
    if (tool) {
      setActiveTool(tool);
    } else {
      setActiveTool(null);
    }

    if (tab && (tab === 'ads' || tab === 'social' || tab === 'creative')) {
      setActiveTab(tab as 'ads' | 'social' | 'creative');
    } else if (tool) {
      if (['ads', 'roas'].includes(tool)) {
        setActiveTab('ads');
      } else if (['social', 'email'].includes(tool)) {
        setActiveTab('social');
      } else if (['creative', 'seo'].includes(tool)) {
        setActiveTab('creative');
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

  const runMktSim = (toolName: string, steps: string[]) => {
    setRunning(true);
    setLogOutput([`[SYS] Memulai eksekusi perkakas Pemasaran: ${toolName}...`]);
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setLogOutput(prev => [...prev, step]);
        if (idx === steps.length - 1) setRunning(false);
      }, (idx + 1) * 600);
    });
  };

  const runAdsOptimizer = () => {
    setRunning(true);
    setLogOutput([`[SYS] Memulai sinkronisasi & optimasi kampanye iklan...`]);

    setTimeout(() => {
      setLogOutput(prev => [...prev, `[ADS] Membaca metrik CPC & CTR dari Google Ads API...`]);
    }, 600);

    setTimeout(() => {
      setLogOutput(prev => [...prev, `[AI] Menyesuaikan alokasi budget kampanye berkinerja tinggi...`]);
    }, 1200);

    setTimeout(() => {
      setLogOutput(prev => [
        ...prev,
        `[SUCCESS] Optimasi Iklan Selesai!`,
        `✓ Anggaran dialihkan ke Kampanye B2B SaaS (+14% conversion)`,
        `✓ Target ROAS ditingkatkan ke 3.8x`
      ]);
      setRunning(false);
    }, 2000);
  };

  const handleGenerateCopywriting = () => {
    if (!themeInput.trim()) return;
    setRunning(true);
    setLogOutput([`[SYS] Menghubungkan ke AI Engine Copywriter...`]);

    setTimeout(() => {
      setLogOutput(prev => [...prev, `[LLM] Menggenerasikan draf copywriting untuk saluran ${channel.toUpperCase()}...`]);
    }, 600);

    setTimeout(() => {
      setGeneratedText(`🚀 Dapatkan Otomasi Bisnis Terbaik! 🚀\n\n${themeInput}\n\nSolusi cerdas AI Agents yang siap membantu percepatan pertumbuhan bisnis Anda 24/7!\n\n#AgentFlow #OtomasiBisnis #AIAgents #Teknologi`);
      setLogOutput(prev => [
        ...prev,
        `[SUCCESS] Draf Teks Copywriting Berhasil Dibuat!`
      ]);
      setRunning(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen relative font-sans">
      <Header 
        title="Divisi Pemasaran (Marketing AI)" 
        subtitle={`Organisasi: ${companyName} · Kampanye Iklan Otonom, Social Copywriting, & Visual Brand Assets`} 
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-light pb-0.5 gap-2">
          <button
            onClick={() => setActiveTab('ads')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'ads' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            📢 Optimasi Iklan & ROAS
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'social' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            ✍️ Copywriting & Content Engine
          </button>
          <button
            onClick={() => setActiveTab('creative')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'creative' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            🎨 Produksi Banner & Aset Kreatif
          </button>
        </div>

        {/* Content & Terminal Log Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* ── TAB 1: ADS OPTIMIZATION & ROAS ──────────────────────── */}
            {activeTab === 'ads' && (
              <div className="space-y-6 fade-in">
                {/* Additional ROAS Tool Card */}
                <div className={`bg-card border border-light p-4 rounded-xl flex items-center justify-between gap-4 ${getToolGlow('roas')}`}>
                  <div>
                    <span className="font-bold text-xs text-primary block">📈 Analisis & Optimasi ROAS</span>
                    <p className="text-[11px] text-muted mt-0.5">Penyesuaian bid budget iklan otonom berbasis Return On Ad Spend.</p>
                  </div>
                  <button
                    disabled={running}
                    onClick={() => runMktSim('Optimasi ROAS Iklan', [
                      '[ROAS] Membaca data iklan Google & Meta Ads...',
                      '[AI] Mengalokasikan ulang anggaran ke campaign performa tertinggi...',
                      '[SUCCESS] ROAS meningkat 2.4x.'
                    ])}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    Optimasi ROAS Iklan
                  </button>
                </div>

                {/* Stats Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Total Anggaran Iklan</span>
                    <span className="text-primary font-stats font-extrabold text-base">Rp 45.000.000</span>
                  </div>
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Rata-rata ROAS</span>
                    <span className="text-emerald-500 font-stats font-extrabold text-base">3.4x</span>
                  </div>
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Total Lead Dihasilkan</span>
                    <span className="text-primary font-stats font-extrabold text-base">1,280 Lead</span>
                  </div>
                </div>

                {/* Ads Campaigns Table */}
                <div className={`bg-card border border-light rounded-2xl overflow-hidden shadow-sm ${getToolGlow('ads')}`}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-elevated border-b border-light text-secondary font-bold">
                        <th className="p-4">Nama Kampanye</th>
                        <th className="p-4">Platform</th>
                        <th className="p-4">CTR</th>
                        <th className="p-4">ROAS</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light text-primary">
                      {[
                        { name: 'B2B Enterprise SaaS Promo', platform: 'Google Search', ctr: '4.2%', roas: '3.8x', status: 'Aktif' },
                        { name: 'HR Agent Retargeting', platform: 'LinkedIn Ads', ctr: '2.1%', roas: '2.9x', status: 'Aktif' },
                        { name: 'Branding Awareness Q3', platform: 'Meta Ads', ctr: '1.8%', roas: '2.4x', status: 'Ditinjau' },
                      ].map(camp => (
                        <tr key={camp.name} className="hover:bg-hover/20 transition-colors">
                          <td className="p-4 font-bold">{camp.name}</td>
                          <td className="p-4 font-semibold">{camp.platform}</td>
                          <td className="p-4 font-stats font-bold">{camp.ctr}</td>
                          <td className="p-4 font-stats text-emerald-400 font-bold">{camp.roas}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold">
                              {camp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 2: COPYWRITING GENERATOR ────────────────────────── */}
            {activeTab === 'social' && (
              <div className="space-y-6 fade-in">
                {/* Email Blast Tool Card */}
                <div className={`bg-card border border-light p-4 rounded-xl flex items-center justify-between gap-4 ${getToolGlow('email')}`}>
                  <div>
                    <span className="font-bold text-xs text-primary block">📧 Blast Email Marketing AI</span>
                    <p className="text-[11px] text-muted mt-0.5">Personalisasi pesan email otomatis ke basis data calon pembeli.</p>
                  </div>
                  <button
                    disabled={running}
                    onClick={() => runMktSim('Blast Email', [
                      '[EMAIL] Memfilter 4,200 kontak segmen B2B...',
                      '[AI] Melakukan A/B testing subjek email...',
                      '[SUCCESS] Email terkirim dengan open rate 42%.'
                    ])}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    Trigger Blast Email
                  </button>
                </div>

                <div className={`bg-card border border-light p-6 rounded-2xl space-y-4 shadow-sm ${getToolGlow('social')}`}>
                  <h3 className="font-bold text-primary text-base flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    Generator Draf Copywriting
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Tema / Deskripsi Produk:</label>
                      <textarea
                        value={themeInput}
                        onChange={(e) => setThemeInput(e.target.value)}
                        rows={3}
                        className="w-full p-3 bg-elevated border border-light rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Saluran Medsos:</label>
                        <select
                          value={channel}
                          onChange={(e) => setChannel(e.target.value)}
                          className="w-full px-3 py-2 bg-elevated border border-light rounded-lg text-xs text-primary focus:outline-none cursor-pointer"
                        >
                          <option value="instagram">Instagram</option>
                          <option value="tiktok">TikTok</option>
                          <option value="linkedin">LinkedIn</option>
                        </select>
                      </div>
                    </div>

                    <button
                      disabled={running}
                      onClick={handleGenerateCopywriting}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      {running ? 'Menggenerasikan...' : 'Buat Draf Teks Copywriting'}
                    </button>
                  </div>
                </div>

                {generatedText && (
                  <div className="bg-card border border-light p-6 rounded-2xl space-y-3 shadow-md slide-up">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Hasil Copywriting AI:</span>
                    <div className="p-4 bg-elevated border border-light rounded-xl whitespace-pre-wrap text-xs text-primary font-sans leading-relaxed">
                      {generatedText}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: CREATIVE ASSETS PRODUCTION ──────────────────── */}
            {activeTab === 'creative' && (
              <div className="space-y-6 fade-in">
                {/* SEO Audit Tool Card */}
                <div className={`bg-card border border-light p-4 rounded-xl flex items-center justify-between gap-4 ${getToolGlow('seo')}`}>
                  <div>
                    <span className="font-bold text-xs text-primary block">🔍 Audit SEO &amp; Keyword Tracker</span>
                    <p className="text-[11px] text-muted mt-0.5">Analisis peringkat kata kunci &amp; optimasi meta tag otomatis.</p>
                  </div>
                  <button
                    disabled={running}
                    onClick={() => runMktSim('Audit SEO', [
                      '[SEO] Memindai 120 kata kunci target...',
                      '[AI] Mengoptimasi meta description & alt text...',
                      '[SUCCESS] Ranking 8 kata kunci naik ke halaman 1.'
                    ])}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    Jalankan Audit SEO
                  </button>
                </div>

                <div className={`bg-card border border-light p-6 rounded-2xl space-y-4 shadow-sm ${getToolGlow('creative')}`}>
                  <h3 className="font-bold text-primary text-base flex items-center gap-2">
                    <Palette size={16} className="text-primary" />
                    Produksi Banner &amp; Aset Kreatif Otonom
                  </h3>
                  <p className="text-xs text-secondary leading-relaxed">
                    Kumpulan aset gambar kampanye visual yang diproduksi otonom oleh AI Image generator.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    {[
                      { title: 'Promo Merdeka - Otomasi', size: '1080x1080', format: 'PNG', color: 'indigo' },
                      { title: 'B2B Dashboard Campaign', size: '1920x1080', format: 'JPG', color: 'blue' },
                      { title: 'Story Ads Office Agent', size: '1080x1920', format: 'PNG', color: 'emerald' },
                    ].map(asset => (
                      <div key={asset.title} className="bg-elevated border border-light rounded-xl overflow-hidden hover:border-primary/50 transition-all flex flex-col">
                        <div className={`h-40 bg-gradient-to-br from-${asset.color}-500/20 to-purple-500/20 flex flex-col items-center justify-center border-b border-light p-4`}>
                          <span className="text-3xl">🎨</span>
                          <span className="text-[10px] text-muted font-stats mt-2">{asset.size} &middot; {asset.format}</span>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-xs text-primary">{asset.title}</h4>
                            <p className="text-[10px] text-secondary mt-1">Dihasilkan oleh model Kreatif AI.</p>
                          </div>
                          <button className="w-full py-1.5 bg-card hover:bg-hover/20 border border-light text-secondary hover:text-primary text-[10px] font-bold rounded-lg transition-all cursor-pointer">
                            Unduh Aset
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Terminal logs */}
          <div className="bg-card border border-light p-5 rounded-2xl flex flex-col h-[380px] shadow-sm">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5 mb-3 font-mono">
              <Terminal size={14} className="text-primary" /> Log AI Marketing:
            </span>
            <div className="flex-1 bg-elevated dark:bg-black/90 text-primary dark:text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-y-auto space-y-1.5 border border-light dark:border-white/10">
              {logOutput.length > 0 ? (
                logOutput.map((l, i) => <div key={i}>{l}</div>)
              ) : (
                <span className="text-muted italic">Klik tombol alat kerja untuk melihat simulasi eksekusi...</span>
              )}
            </div>
            <button
              disabled={running}
              onClick={runAdsOptimizer}
              className="w-full mt-3 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <RefreshCw size={11} className={running ? 'animate-spin' : ''} />
              Jalankan Optimasi Iklan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
