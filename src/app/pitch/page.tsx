'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import {
  ChevronLeft, ChevronRight, Zap, TrendingDown, Users,
  ShieldCheck, Presentation, ArrowRight, CheckCircle
} from 'lucide-react';

const SLIDES = [
  {
    title: 'AgentFlow Enterprise 🚀',
    subtitle: 'ERP AI Agent Otonom 24/7 untuk Kantor Masa Depan',
    type: 'welcome',
  },
  {
    title: 'Masalah Operasional Kantor ⚠️',
    subtitle: 'Mengapa Sistem Manual Menghambat Skala Bisnis Anda?',
    points: [
      { text: '70% waktu kerja tim habis untuk input data manual, entri bon, dan follow-up tagihan.', color: 'text-amber-400' },
      { text: 'Rawan kesalahan manusia (human error) yang memicu salah hitung laporan bulanan.', color: 'text-rose-400' },
      { text: 'Biaya operasional tinggi (headcount staf admin bertambah seiring perkembangan bisnis).', color: 'text-rose-400' }
    ]
  },
  {
    title: 'Solusi: AgentFlow AI Workers 🤖',
    subtitle: 'Karyawan AI Otonom yang Bekerja di Latar Belakang Tanpa Lelah',
    points: [
      { text: 'ERP Otonom: AI langsung terhubung ke database Postgres untuk menyelesaikan pekerjaan.', color: 'text-teal-400' },
      { text: 'Fleksibilitas SOP: Latih agen secara instan dengan menyunting SOP tertulis di Workbench.', color: 'text-teal-400' },
      { text: 'Integrasi Multi-Divisi: Finance AI, HR AI, Purchasing AI bekerja secara kolaboratif.', color: 'text-emerald-400' }
    ]
  },
  {
    title: 'Kalkulator ROI & Efisiensi Biaya 💰',
    subtitle: 'Bandingkan Pengeluaran Admin Staf vs Agen AI Otonom',
    type: 'roi_calculator',
  },
  {
    title: 'Simulasi Langsung: Uji Otonom 🤖',
    subtitle: 'Saksikan AI Menerima Perintah, Menavigasi Sistem, dan Bekerja Sendiri',
    type: 'demo_trigger',
  },
  {
    title: 'Keamanan Data & Skema BYOK 🔒',
    subtitle: 'Keamanan Tingkat Enterprise Berada di Tangan Anda',
    points: [
      { text: 'BYOK (Bring Your Own Key): Hubungkan API Key Gemini perusahaan Anda untuk kontrol penuh.', color: 'text-indigo-400' },
      { text: 'Isolasi Tenant: Data transaksi dipisahkan dengan aman dalam isolasi baris PostgreSQL.', color: 'text-indigo-400' },
      { text: 'Persetujuan Manual: Fitur antrean eskalasi membiarkan supervisor mengontrol persetujuan AI.', color: 'text-indigo-400' }
    ]
  },
  {
    title: 'Mulai Uji Coba Pilot Project 🎁',
    subtitle: 'Dapatkan Akses Penuh Uji Coba 14 Hari di Perusahaan Anda',
    points: [
      { text: 'Uji coba gratis di 1 Divisi pilihan (misal: Otomasi Rekap Keuangan).', color: 'text-emerald-400' },
      { text: 'Pendampingan integrasi SOP lokal ke dalam platform AI.', color: 'text-emerald-400' },
      { text: 'Hubungi pengembang untuk demo khusus C-Suite: hello@agentflow.id', color: 'text-teal-400' }
    ],
    type: 'conclusion'
  }
];

export default function PitchDeckPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // ROI Calculator states
  const [staffCount, setStaffCount] = useState(3);
  const [staffSalary, setStaffSalary] = useState(5000000); // Default Rp 5.000.000

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const startAutoPilotSimulation = () => {
    localStorage.setItem('agentflow_tour_active', 'true');
    localStorage.setItem('agentflow_tour_autopilot', 'true');
    localStorage.setItem('agentflow_tour_step', '0');
    router.push('/');
  };

  // Cost calculations
  const totalManualCost = staffCount * staffSalary;
  const totalAgentFlowCost = 350000; // Average token API costs for high volumes
  const monthlySavings = totalManualCost - totalAgentFlowCost;

  const current = SLIDES[currentSlide];

  return (
    <div className="min-h-screen flex flex-col relative select-none" style={{ background: '#000' }}>
      
      {/* Dynamic ambient background orbs */}
      <div className="absolute top-[-10%] left-[-15%] w-[700px] h-[700px] rounded-full pointer-events-none transition-all duration-1000"
        style={{
          background: currentSlide === 0 
            ? 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)' 
            : currentSlide === 1 || currentSlide === 5
            ? 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          filter: 'blur(80px)'
        }} 
      />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <Header
        title="Interactive Pitch Board"
        subtitle="Modul Presentasi & Studi Kelayakan Nilai Investasi (ROI) AgentFlow"
      />

      {/* Main Slideshow Container */}
      <div className="flex-1 flex items-center justify-center p-8 max-w-5xl mx-auto w-full">
        <div 
          className="w-full min-h-[500px] glass-premium hover-glow p-10 flex flex-col justify-between rounded-3xl relative overflow-hidden transition-all duration-300"
          style={{
            background: 'rgba(8, 8, 8, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Top Indicators */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <span className="text-[10px] font-mono font-bold tracking-wider text-teal-400 flex items-center gap-1.5">
              <Presentation size={12} />
              SLIDE DECK PRESENTASI
            </span>
            <span className="text-[10px] font-mono font-bold text-gray-500">
              {currentSlide + 1} / {SLIDES.length}
            </span>
          </div>

          {/* Slide Content Router */}
          <div className="flex-1 flex flex-col justify-center py-6">
            <h2 className="text-white font-heading font-extrabold text-2xl lg:text-3xl tracking-tight mb-2">
              {current.title}
            </h2>
            <p className="text-gray-400 text-xs font-heading font-medium mb-8">
              {current.subtitle}
            </p>

            {/* Custom: Welcome Screen */}
            {current.type === 'welcome' && (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-5">
                <div 
                  className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center shadow-xl animate-pulse cursor-pointer hover:scale-105 transition-transform"
                  style={{ boxShadow: '0 10px 30px rgba(79, 70, 229, 0.4)' }}
                  onClick={nextSlide}
                >
                  <Zap className="text-white w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-white font-heading font-bold text-base">Platform AI Kerja Otonom</h3>
                  <p className="text-gray-500 text-xs font-heading">Gunakan panah kiri/kanan pada keyboard untuk navigasi slide deck</p>
                </div>
              </div>
            )}

            {/* Custom: ROI Calculator */}
            {current.type === 'roi_calculator' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
                <div className="space-y-5 bg-white/5 p-5 rounded-2xl border border-white/5">
                  <h4 className="text-white font-heading font-bold text-xs flex items-center gap-2">
                    <Users size={14} className="text-teal-400" />
                    Input Kebutuhan Staf Admin
                  </h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-400 font-heading flex justify-between">
                      <span>Jumlah Karyawan Admin:</span>
                      <span className="text-teal-400 font-bold">{staffCount} Orang</span>
                    </label>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      value={staffCount}
                      onChange={(e) => setStaffCount(parseInt(e.target.value))}
                      className="w-full accent-teal-400 bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-400 font-heading flex justify-between">
                      <span>Rata-Rata Gaji Bulanan:</span>
                      <span className="text-teal-400 font-bold">Rp {staffSalary.toLocaleString('id-ID')}</span>
                    </label>
                    <input 
                      type="range"
                      min="3000000"
                      max="10000000"
                      step="500000"
                      value={staffSalary}
                      onChange={(e) => setStaffSalary(parseInt(e.target.value))}
                      className="w-full accent-teal-400 bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-2 bg-black/40 p-5 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Total Biaya Gaji Staf:</span>
                      <span className="text-rose-400 font-bold">Rp {totalManualCost.toLocaleString('id-ID')} /bln</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Biaya Token AgentFlow:</span>
                      <span className="text-emerald-400 font-bold">Rp {totalAgentFlowCost.toLocaleString('id-ID')} /bln</span>
                    </div>
                    <div className="border-t border-white/5 my-2 pt-2 flex justify-between items-center">
                      <span className="text-white font-heading font-bold text-xs">Nilai Hemat Bulanan (ROI):</span>
                      <span className="text-emerald-400 font-stats font-extrabold text-sm">
                        Rp {monthlySavings.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-gray-500 leading-relaxed italic text-center">
                    *Kalkulasi estimasi biaya token API didasarkan pada model Gemini 2.0 Flash dengan rata-rata 10.000 transaksi berkas per bulan.
                  </div>
                </div>
              </div>
            )}

            {/* Custom: Demo Trigger */}
            {current.type === 'demo_trigger' && (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
                <p className="text-gray-400 text-xs font-heading max-w-lg leading-relaxed">
                  Platform akan menavigasi rute dashboard secara otomatis, memicu chatbot Ava untuk mengetik perintah absensi secara otonom, dan mengalirkan logs simulator di divisi Keuangan.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={startAutoPilotSimulation}
                    className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer text-xs font-heading"
                    style={{ boxShadow: '0 8px 30px rgba(16, 185, 129, 0.4)' }}
                  >
                    <Zap size={16} />
                    MULAI SIMULASI AUTO-PILOT AI 🤖
                  </button>
                  <a
                    href="/api/pitch/generate-pptx"
                    download="AgentFlow-PitchDeck.pptx"
                    className="px-6 py-4 bg-indigo-700/60 hover:bg-indigo-600 text-white font-bold rounded-2xl border border-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer text-xs font-heading"
                  >
                    <ArrowRight size={16} />
                    Download Pitch Deck (.pptx)
                  </a>
                </div>
              </div>
            )}

            {/* Points slides */}
            {current.points && (
              <ul className="space-y-4">
                {current.points.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-gray-300">
                    <span className="p-1 rounded bg-white/5 border border-white/5 flex-shrink-0 mt-0.5">
                      <CheckCircle size={10} className="text-teal-400" />
                    </span>
                    <span className={p.color}>{p.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Bottom Slide Navigation controls */}
          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="px-4 py-2 border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:pointer-events-none rounded-xl text-xs font-heading font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft size={16} />
              Kembali
            </button>

            <span className="text-[10px] text-gray-500 font-heading">
              Gunakan Panah Kanan/Kiri Keyboard
            </span>

            {currentSlide === SLIDES.length - 1 ? (
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-[1.02] active:scale-95"
              >
                Masuk Dashboard
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={nextSlide}
                className="px-4 py-2 border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl text-xs font-heading font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                Lanjut
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
