'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { Server, ShieldCheck, Cpu, RefreshCw, CheckCircle2, AlertTriangle, Terminal, Code2, Lock, Zap } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function TechPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'cloud' | 'security' | 'cicd'>('cloud');
  const [activeTool, setActiveTool] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const tool = searchParams.get('tool');
    if (tool) {
      setActiveTool(tool);
    } else {
      setActiveTool(null);
    }

    if (tab && (tab === 'cloud' || tab === 'security' || tab === 'cicd')) {
      setActiveTab(tab as 'cloud' | 'security' | 'cicd');
    } else if (tool) {
      if (['cloud', 'uptime'].includes(tool)) {
        setActiveTab('cloud');
      } else if (['security', 'iam'].includes(tool)) {
        setActiveTab('security');
      } else if (['cicd', 'backup'].includes(tool)) {
        setActiveTab('cicd');
      }
    }
  }, [searchParams]);

  const [running, setRunning] = useState(false);
  const [logOutput, setLogOutput] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState<string>('Memuat...');

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

  const runAudit = (toolName: string) => {
    setRunning(true);
    setLogOutput([`[SYS] Memulai eksekusi perkakas otonom: ${toolName}...`]);

    setTimeout(() => {
      setLogOutput(prev => [...prev, `[CLOUD] Menghubungkan ke AWS / GCP API Node Cluster...`]);
    }, 600);

    setTimeout(() => {
      setLogOutput(prev => [...prev, `[SEC] Memindai kontainer Docker & grup keamanan IT...`]);
    }, 1400);

    setTimeout(() => {
      setLogOutput(prev => [
        ...prev,
        `[SUCCESS] Eksekusi ${toolName} Selesai!`,
        `✓ Memori teroptimasi (Skala Hemat: $420/bulan)`,
        `✓ Kerentanan TLS 1.1 diperbaiki ke TLS 1.3`,
        `✓ 0 downtime terdeteksi dalam 30 hari terakhir`
      ]);
      setRunning(false);
    }, 2200);
  };

  return (
    <div className="min-h-screen relative font-sans">
      <Header 
        title="Divisi Teknologi (Tech AI)" 
        subtitle={`Organisasi: ${companyName} · Cloud Audit, SOC Security, & CI/CD Pipeline Automation`} 
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-light pb-0.5 gap-2">
          <button
            onClick={() => setActiveTab('cloud')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'cloud' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            🌐 Audit Cloud &amp; Server
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'security' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            🛡️ Pemindaian Keamanan (SOC)
          </button>
          <button
            onClick={() => setActiveTab('cicd')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'cicd' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            🚀 Auto-Deploy Pipeline CI/CD
          </button>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            
            {/* TAB 1: CLOUD AUDIT & UPTIME */}
            {activeTab === 'cloud' && (
              <div className="bg-card border border-light p-6 rounded-2xl space-y-4 fade-in">
                <h3 className="font-bold text-primary text-base flex items-center gap-2">
                  <Cpu className="text-primary" size={18} />
                  Tools Otomatisasi Cloud &amp; Infrastructure Server
                </h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Pilih perkakas di bawah untuk memicu pemindaian atau audit infra oleh AI Agent divisi Tech.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`bg-elevated border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('cloud')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">Cloud Cost &amp; RAM Optimizer</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Mendeteksi pemborosan instance server yang idle &amp; me-downsize kapasitas otomatis.</p>
                    <button
                      disabled={running}
                      onClick={() => runAudit('Cloud Cost Optimizer')}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      {running ? 'Memindai...' : 'Jalankan Audit Infrastructure'}
                    </button>
                  </div>

                  <div className={`bg-elevated border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('uptime')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">Monitoring Uptime Server</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Memantau ketersediaan node server 24/7 &amp; deteksi lonjakan latensi API.</p>
                    <button
                      disabled={running}
                      onClick={() => runAudit('Server Uptime Monitor')}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      {running ? 'Memindai...' : 'Cek Uptime Cluster'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SOC SECURITY & IAM */}
            {activeTab === 'security' && (
              <div className="bg-card border border-light p-6 rounded-2xl space-y-4 fade-in">
                <h3 className="font-bold text-primary text-base flex items-center gap-2">
                  <ShieldCheck className="text-primary" size={18} />
                  SOC Security &amp; Audit Akses IAM
                </h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Audit celah enkripsi, hak akses IAM, dan proteksi server publik dari ancaman cyber.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`bg-elevated border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('security')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">Vulnerability SOC Scanner</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Scan port terbuka &amp; celah enkripsi SSL/TLS pada domain publik.</p>
                    <button
                      disabled={running}
                      onClick={() => runAudit('Vulnerability SOC Scanner')}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      {running ? 'Memindai...' : 'Mulai Security Scan'}
                    </button>
                  </div>

                  <div className={`bg-elevated border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('iam')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">Audit Akses IAM &amp; Enkripsi</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Periksa hak akses user yang tidak aktif &amp; sertifikat SSL/TLS yang kedaluwarsa.</p>
                    <button
                      disabled={running}
                      onClick={() => runAudit('Audit Akses IAM')}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      {running ? 'Memindai...' : 'Audit Akses IAM'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CI/CD PIPELINE & BACKUP */}
            {activeTab === 'cicd' && (
              <div className="bg-card border border-light p-6 rounded-2xl space-y-4 fade-in">
                <h3 className="font-bold text-primary text-base flex items-center gap-2">
                  <Code2 className="text-primary" size={18} />
                  Auto-Deploy CI/CD &amp; Disaster Recovery
                </h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Otomatisasi pengujian kode baru, deployment zero-downtime, &amp; skenario pemulihan cadangan.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`bg-elevated border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('cicd')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">Auto-Deploy Pipeline CI/CD</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Menjalankan pengujian unit otomatis &amp; rilis build ke server staging/prod.</p>
                    <button
                      disabled={running}
                      onClick={() => runAudit('Pipeline CI/CD')}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      {running ? 'Memindai...' : 'Trigger CI/CD Pipeline'}
                    </button>
                  </div>

                  <div className={`bg-elevated border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('backup')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">Disaster Recovery &amp; Backup</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Pencadangan database otomatis &amp; verifikasi integritas snapshot.</p>
                    <button
                      disabled={running}
                      onClick={() => runAudit('Disaster Recovery Backup')}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      {running ? 'Memindai...' : 'Mulai Disaster Recovery Backup'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Log Output Console */}
          <div className="bg-card border border-light p-5 rounded-2xl flex flex-col h-[380px] shadow-sm">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5 mb-3 font-mono">
              <Terminal size={14} className="text-primary" /> Log Real-time Server AI:
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
