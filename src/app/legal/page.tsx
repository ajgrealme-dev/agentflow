'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { Scale, FileCheck, ShieldAlert, Terminal, FileText, CheckCircle2, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function LegalPage() {
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'contracts' | 'aml' | 'opinions'>('contracts');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [logOutput, setLogOutput] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState<string>('Memuat...');

  // Contract Risk Scanner state
  const [contractText, setContractText] = useState('Pihak Kedua bersedia menanggung denda keterlambatan sebesar 5% per hari dari nilai proyek tanpa batas maksimum limit ganti rugi.');
  const [riskIssues, setRiskIssues] = useState<{ severity: 'HIGH' | 'MED' | 'LOW'; clause: string; recommendation: string }[]>([]);

  // AML state
  const [searchEntity, setSearchEntity] = useState('PT Cahaya Abadi Sejahtera');
  const [amlResult, setAmlResult] = useState<{ status: string; checkedAt: string; hits: number } | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const tool = searchParams.get('tool');
    if (tool) {
      setActiveTool(tool);
    } else {
      setActiveTool(null);
    }

    if (tab && (tab === 'contracts' || tab === 'aml' || tab === 'opinions')) {
      setActiveTab(tab as 'contracts' | 'aml' | 'opinions');
    } else if (tool) {
      if (['contracts', 'permit', 'nda'].includes(tool)) {
        setActiveTab('contracts');
      } else if (tool === 'aml') {
        setActiveTab('aml');
      } else if (['opinions', 'litigation'].includes(tool)) {
        setActiveTab('opinions');
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

  const runLegalSim = (toolName: string, steps: string[]) => {
    setRunning(true);
    setLogOutput([`[SYS] Memulai eksekusi perkakas Hukum: ${toolName}...`]);
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setLogOutput(prev => [...prev, step]);
        if (idx === steps.length - 1) setRunning(false);
      }, (idx + 1) * 600);
    });
  };

  const runContractAudit = () => {
    setRunning(true);
    setLogOutput([`[SYS] Memulai analisis kontrak menggunakan model LLM Hukum...`]);

    setTimeout(() => {
      setLogOutput(prev => [...prev, `[LEGAL] Memindai struktur kalimat & batas liabilitas hukum...`]);
    }, 600);

    setTimeout(() => {
      setLogOutput(prev => [...prev, `[AI] Mendeteksi 1 klausul risiko tinggi (Tinggi Denda & Tanpa Batas Liabilitas).`]);
    }, 1200);

    setTimeout(() => {
      setRiskIssues([
        {
          severity: 'HIGH',
          clause: 'Denda keterlambatan sebesar 5% per hari dari nilai proyek.',
          recommendation: 'Ubah denda menjadi maksimal 0.1% per hari dengan batas limit (cap) ganti rugi 5% hingga 10% dari total nilai proyek.'
        },
        {
          severity: 'MED',
          clause: 'Batas maksimum limit ganti rugi ditiadakan.',
          recommendation: 'Pastikan ada pasal batas liabilitas maksimum (Limitation of Liability) setara dengan nilai kontrak.'
        }
      ]);
      setLogOutput(prev => [
        ...prev,
        `[SUCCESS] Analisis Kontrak Selesai!`,
        `✓ Klausul Kerahasiaan (NDA) Sesuai standar`,
        `✓ Rekomendasi perbaikan draf kontrak diterbitkan.`
      ]);
      setRunning(false);
    }, 2000);
  };

  const runAmlScreening = () => {
    setRunning(true);
    setLogOutput([`[SYS] Menghubungkan ke API KYC & Direktori AML Sanksi Hukum...`]);

    setTimeout(() => {
      setLogOutput(prev => [...prev, `[AML] Membaca database sanksi DTTOT, PEP, dan FATF...`]);
    }, 600);

    setTimeout(() => {
      setAmlResult({
        status: 'BEBAS SANKSI (BERSIH)',
        checkedAt: new Date().toLocaleString('id-ID'),
        hits: 0
      });
      setLogOutput(prev => [
        ...prev,
        `[SUCCESS] Screening Selesai!`,
        `✓ Entitas: ${searchEntity}`,
        `✓ Status: Bebas dari daftar hitam pencegahan pendanaan terorisme.`
      ]);
      setRunning(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen relative font-sans">
      <Header 
        title="Divisi Hukum (Legal AI)" 
        subtitle={`Organisasi: ${companyName} · Review Kontrak, Audit AML/KYC, &amp; Legal Opinion`} 
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-light pb-0.5 gap-2">
          <button
            onClick={() => setActiveTab('contracts')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'contracts' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            ⚖️ Review Kontrak &amp; Perjanjian
          </button>
          <button
            onClick={() => setActiveTab('aml')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'aml' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            📜 Audit Kepatuhan Regulasi &amp; AML
          </button>
          <button
            onClick={() => setActiveTab('opinions')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'opinions' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            📌 Draf Somasi &amp; Legal Opinion
          </button>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* ── TAB 1: CONTRACTS REVIEW ────────────────────────── */}
            {activeTab === 'contracts' && (
              <div className="space-y-6 fade-in">
                {/* Additional Legal Tool Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`bg-card border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('permit')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">🏢 Audit NIB &amp; Izin Usaha</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Verifikasi keabsahan NIB &amp; KBLI perizinan berusaha OSS.</p>
                    <button
                      disabled={running}
                      onClick={() => runLegalSim('Audit Izin Usaha', [
                        '[PERMIT] Memindai NIB & Izin Usaha OSS...',
                        '[AI] Verifikasi KBLI & izin operasional...',
                        '[SUCCESS] NIB terverifikasi valid.'
                      ])}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      Audit Izin Usaha
                    </button>
                  </div>

                  <div className={`bg-card border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('nda')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">📑 NDA &amp; HAKI Generator</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Penyusunan draf Kerahasiaan Informasi &amp; pendaftaran HAKI.</p>
                    <button
                      disabled={running}
                      onClick={() => runLegalSim('NDA Generator', [
                        '[NDA] Menyusun draf Kerahasiaan Informasi...',
                        '[AI] Menetapkan masa berlaku kerahasiaan 3 tahun...',
                        '[SUCCESS] Draf NDA_Standar.pdf terbit.'
                      ])}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      Generate Draf NDA
                    </button>
                  </div>
                </div>

                <div className={`bg-card border border-light p-6 rounded-2xl space-y-4 shadow-sm ${getToolGlow('contracts')}`}>
                  <h3 className="font-bold text-primary text-base flex items-center gap-2">
                    <FileText className="text-primary" size={16} />
                    Contract Risk Analyzer
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Tempel Draf Kontrak / Klausul:</label>
                      <textarea
                        value={contractText}
                        onChange={(e) => setContractText(e.target.value)}
                        rows={3}
                        className="w-full p-3 bg-elevated border border-light rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <button
                      disabled={running}
                      onClick={runContractAudit}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      {running ? 'Menganalisis...' : 'Jalankan Review Resiko Kontrak'}
                    </button>
                  </div>
                </div>

                {riskIssues.length > 0 && (
                  <div className="space-y-3 slide-up">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Temuan Kerawanan Hukum:</span>
                    <div className="space-y-3">
                      {riskIssues.map((issue, idx) => (
                        <div key={idx} className="bg-card border border-light p-4 rounded-xl flex gap-3 shadow-sm">
                          <AlertCircle className={issue.severity === 'HIGH' ? 'text-red-500 flex-shrink-0' : 'text-amber-500 flex-shrink-0'} size={18} />
                          <div className="text-xs space-y-1">
                            <div className="font-bold text-primary">Klausul Bermasalah: "{issue.clause}"</div>
                            <div className="text-secondary mt-1">Rekomendasi AI: <span className="font-medium text-emerald-500">{issue.recommendation}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: AML SCREENING ───────────────────────────── */}
            {activeTab === 'aml' && (
              <div className="space-y-6 fade-in">
                <div className={`bg-card border border-light p-6 rounded-2xl space-y-4 shadow-sm ${getToolGlow('aml')}`}>
                  <h3 className="font-bold text-primary text-base flex items-center gap-2">
                    <Search className="text-primary" size={16} />
                    AML &amp; PEP Sanction Screening
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Nama Perusahaan / Perorangan:</label>
                      <input
                        type="text"
                        value={searchEntity}
                        onChange={(e) => setSearchEntity(e.target.value)}
                        className="w-full p-3 bg-elevated border border-light rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <button
                      disabled={running}
                      onClick={runAmlScreening}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      {running ? 'Memindai...' : 'Jalankan AML Screening'}
                    </button>
                  </div>
                </div>

                {amlResult && (
                  <div className="bg-card border border-light p-5 rounded-2xl flex items-center justify-between shadow-sm slide-up">
                    <div>
                      <span className="text-[10px] text-muted block uppercase font-bold tracking-wider">Hasil Audit AML</span>
                      <span className="text-emerald-500 font-extrabold text-sm mt-1 block">{amlResult.status}</span>
                    </div>
                    <div className="text-right text-[10px] text-muted">
                      <div>Checked: {amlResult.checkedAt}</div>
                      <div>Temuan: {amlResult.hits} hits</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: LEGAL OPINIONS ──────────────────────────── */}
            {activeTab === 'opinions' && (
              <div className="space-y-6 fade-in">
                <div className={`bg-card border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('litigation')}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-primary">🔍 Risk Assessment Somasi</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                  </div>
                  <p className="text-[11px] text-muted">Evaluasi potensi sengketa hukum &amp; risiko klaim somasi.</p>
                  <button
                    disabled={running}
                    onClick={() => runLegalSim('Risk Assessment Somasi', [
                      '[CASE] Menganalisis potensi sengketa hukum...',
                      '[AI] Menilai skor risiko somasi & bukti...',
                      '[SUCCESS] Rekomendasi penyelesaian damai diterbitkan.'
                    ])}
                    className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                  >
                    Mulai Assessment Somasi
                  </button>
                </div>

                <div className={`bg-card border border-light p-6 rounded-2xl space-y-4 shadow-sm ${getToolGlow('opinions')}`}>
                  <h3 className="font-bold text-primary text-base flex items-center gap-2">
                    <FileCheck className="text-primary" size={16} />
                    Draf Somasi &amp; Legal Opinion Generator
                  </h3>
                  <p className="text-xs text-secondary leading-relaxed">
                    Penyusunan draf tuntutan hukum atau opini formal otonom berdasarkan berkas perkara kasus.
                  </p>
                  <button
                    disabled={running}
                    onClick={() => runLegalSim('Draf Legal Opinion', [
                      '[LEGAL] Menyusun draf opini hukum formal...',
                      '[AI] Menyelaraskan dengan UU Perseroan Terbatas...',
                      '[SUCCESS] Draf Legal_Opinion_2026.pdf terbit.'
                    ])}
                    className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                  >
                    Generate Legal Opinion
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Log Output Console */}
          <div className="bg-card border border-light p-5 rounded-2xl flex flex-col h-[380px] shadow-sm">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5 mb-3 font-mono">
              <Terminal size={14} className="text-primary" /> Log AI Legal Counsel:
            </span>
            <div className="flex-1 bg-elevated dark:bg-black/90 text-primary dark:text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-y-auto space-y-1.5 border border-light dark:border-white/10">
              {logOutput.length > 0 ? (
                logOutput.map((l, i) => <div key={i}>{l}</div>)
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
