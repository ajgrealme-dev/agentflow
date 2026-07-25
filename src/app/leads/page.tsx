'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import {
  Search, Briefcase, Filter, ExternalLink, FileText,
  CheckCircle, XCircle, Clock, ArrowRight, Zap, RefreshCw, AlertCircle,
  Copy, Check, Loader2
} from 'lucide-react';

interface Lead {
  id: string;
  source: string;
  title: string;
  companyName: string | null;
  description: string;
  url: string;
  aiScore: number | null;
  status: string;
  createdAt: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [companyId, setCompanyId] = useState('');

  // AI Outreach states
  const [showOutreachDraft, setShowOutreachDraft] = useState(false);
  const [draftedMessage, setDraftedMessage] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) throw new Error('Gagal mengambil data leads.');
      const data = await res.json();
      setLeads(data.leads || []);
      setCompanyId(data.companyId || '');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Reset outreach when lead changes
  useEffect(() => {
    setShowOutreachDraft(false);
    setDraftedMessage('');
    setCopied(false);
  }, [selectedLead]);

  const generateOutreachDraft = (lead: Lead) => {
    setDraftLoading(true);
    setShowOutreachDraft(true);
    
    setTimeout(() => {
      const clientName = lead.companyName || 'Bapak/Ibu Pimpinan';
      const industry = lead.title;
      const desc = lead.description;
      const isUpwork = lead.source === 'UPWORK';
      const isLinkedIn = lead.source === 'LINKEDIN';
      
      let message = '';
      if (isUpwork) {
        message = `Dear Client,\n\nI read your job description for "${industry}" and noticed you need help with: "${desc.substring(0, 100)}...".\n\nI would love to propose implementing AgentFlow—our proprietary otonomous AI Workforce platform. AgentFlow utilizes specialized AI Agents reading your custom SOPs to execute daily tasks (data entry, document OCR processing, reporting) otonomously 24/7. This solution eliminates manual errors and saves up to 80% in operational costs compared to hiring manual remote assistants.\n\nOur system easily integrates in multi-tenant mode, allowing you to use your own API keys. I would be happy to host a quick 5-minute screen-recording demo to show you how our agents process workflows otonomously.\n\nBest regards,\n[Your Name]`;
      } else if (isLinkedIn) {
        message = `Halo Kak [Nama Penerima] / Tim HR & Purchasing ${clientName},\n\nSalam kenal. Saya melihat profil perusahaan Anda dan tertarik dengan kebutuhan operasional di bidang "${industry}".\n\nBiasanya, pimpinan atau manajer di ${clientName} menghabiskan waktu berjam-jam untuk proses input data, rekap kas, dan administrasi manual lainnya. Kami di AgentFlow menyediakan sistem otonom berbasis AI Worker yang membaca SOP Anda dan memprosesnya 24/7.\n\nBerikut draf penawaran agensi yang disesuaikan untuk kebutuhan Anda. Apakah Anda ada waktu luang 5 menit minggu ini untuk diskusi singkat atau demo langsung?\n\nTerima kasih,\n[Nama Anda]`;
      } else {
        message = `Halo Tim Rekrutmen / Manajemen ${clientName},\n\nSalam kenal. Kami tertarik dengan posisi/kebutuhan "${industry}" yang Anda publikasikan. Kami ingin mengajukan solusi alternatif berupa otomatisasi otonom menggunakan AgentFlow ERP AI.\n\nSistem kami menaruh AI Workers otonom di divisi Keuangan, HR, dan Pengadaan untuk menyelesaikan tugas rutin (seperti scan bon otonom, rekap absensi, dan update stok gudang) langsung di database Anda.\n\nKami menawarkan pilot project uji coba gratis selama 14 hari di 1 divisi Anda untuk membuktikan penghematan biaya secara nyata.\n\nHormat saya,\n[Nama Anda]`;
      }
      
      setDraftedMessage(message);
      setDraftLoading(false);
    }, 1200); // Realistic AI thinking speed
  };

  const markAsContacted = async (leadId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/leads`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: 'CONTACTED' })
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'CONTACTED' } : l));
        setSelectedLead(prev => prev && prev.id === leadId ? { ...prev, status: 'CONTACTED' } : prev);
      } else {
        alert('Gagal memperbarui status.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & Search logic
  const filteredLeads = leads.filter(lead => {
    const matchesSource = filterSource === 'all' || lead.source.toLowerCase() === filterSource.toLowerCase();
    const matchesStatus = filterStatus === 'all' || lead.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = lead.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lead.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (lead.companyName && lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSource && matchesStatus && matchesSearch;
  });

  const exportToCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ['ID', 'Source', 'Title', 'Client', 'URL', 'AI Match Score', 'Status', 'Created At'];
    const rows = filteredLeads.map(lead => [
      lead.id,
      lead.source,
      `"${lead.title.replace(/"/g, '""')}"`,
      `"${(lead.companyName || 'Unknown').replace(/"/g, '""')}"`,
      lead.url,
      lead.aiScore !== null ? `${lead.aiScore}%` : 'N/A',
      lead.status,
      lead.createdAt
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalLeads = leads.length;
  const highMatchCount = leads.filter(l => (l.aiScore || 0) >= 85).length;
  const appliedCount = leads.filter(l => l.status === 'CONTACTED').length;
  const rejectedCount = leads.filter(l => l.status.startsWith('Skipped') || l.status === 'REJECTED').length;

  return (
    <div className="min-h-screen relative">
      <Header
        title="B2B Client Prospector"
        subtitle="CRM Pemantau & Kualifikasi Prospek Pembeli (Buyer Leads) Otomatis"
      />

      <div className="p-6 space-y-6 relative z-10 fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-premium hover-glow float-interactive p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-xs font-heading font-semibold">Total Prospek Klien</span>
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                <Briefcase size={16} />
              </span>
            </div>
            <div className="text-2xl font-stats font-bold text-white">{totalLeads}</div>
            <div className="text-xs text-gray-500 mt-1 font-heading">Dipindai otonom oleh bot scraper</div>
          </div>

          <div className="glass-premium hover-glow float-interactive p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-xs font-heading font-semibold">Kesesuaian AI Tinggi (≥85%)</span>
              <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
                <Zap size={16} />
              </span>
            </div>
            <div className="text-2xl font-stats font-bold text-teal-400">{highMatchCount}</div>
            <div className="text-xs text-gray-500 mt-1 font-heading">Klien potensial siap ditawarkan</div>
          </div>

          <div className="glass-premium hover-glow float-interactive p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-xs font-heading font-semibold">Penawaran Diajukan</span>
              <span className="p-2 rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform">
                <CheckCircle size={16} />
              </span>
            </div>
            <div className="text-2xl font-stats font-bold text-violet-400">{appliedCount}</div>
            <div className="text-xs text-gray-500 mt-1 font-heading">Draf penawaran terkirim otomatis</div>
          </div>

          <div className="glass-premium hover-glow float-interactive p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-xs font-heading font-semibold">Diskualifikasi / Gagal</span>
              <span className="p-2 rounded-xl bg-red-500/10 text-red-400 group-hover:scale-110 transition-transform">
                <XCircle size={16} />
              </span>
            </div>
            <div className="text-2xl font-stats font-bold text-red-400">{rejectedCount}</div>
            <div className="text-xs text-gray-500 mt-1 font-heading">Tidak memenuhi syarat kualifikasi AI</div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="glass-premium p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type="text"
              placeholder="Cari kata kunci proyek, industri, nama klien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-sm text-primary placeholder-muted focus:outline-none focus:border-primary transition-all font-heading"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Source Filter */}
            <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-xl text-xs font-heading">
              <Filter size={12} className="text-secondary" />
              <span className="text-secondary">Sumber:</span>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="bg-transparent text-primary font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-card text-primary font-heading">Semua</option>
                <option value="upwork" className="bg-card text-primary font-heading">Upwork</option>
                <option value="linkedin" className="bg-card text-primary font-heading">LinkedIn</option>
                <option value="jobstreet" className="bg-card text-primary font-heading">Jobstreet</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-xl text-xs font-heading">
              <span className="text-secondary">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-primary font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-card text-primary font-heading">Semua</option>
                <option value="new" className="bg-card text-primary font-heading">Baru (New)</option>
                <option value="contacted" className="bg-card text-primary font-heading">Tawaran Terkirim (Pitched)</option>
                <option value="rejected" className="bg-card text-primary font-heading">Diskualifikasi (Disqualified)</option>
              </select>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={exportToCSV}
              disabled={filteredLeads.length === 0}
              className="px-3.5 py-2.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-xs font-heading font-semibold text-primary hover:bg-hover disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText size={14} className="text-primary" />
              Ekspor CSV
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="p-2.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-secondary hover:bg-hover disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Demo configuration notice */}
        {companyId && (
          <div className="glass-premium p-4 flex items-center gap-3 border border-teal-500/20 bg-teal-500/5">
            <AlertCircle className="text-teal-400 flex-shrink-0" size={18} />
            <p className="text-xs text-gray-300 font-heading">
              Menghubungkan scraping otonom Anda: Gunakan ID Perusahaan Anda <code className="font-stats font-bold text-teal-400 bg-black/40 px-1.5 py-0.5 rounded">{companyId}</code> di dalam file <code>.env</code> scraper bot Anda sebagai <code>COMPANY_ID</code> untuk menyinkronkan data secara otonom!
            </p>
          </div>
        )}

        {/* Main Grid View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Leads List */}
          <div className="lg:col-span-2 space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              <div className="glass-premium p-10 text-center text-gray-400 text-sm font-heading">
                Memuat data prospek klien... ⏳
              </div>
            ) : error ? (
              <div className="glass-premium p-10 text-center text-red-400 text-sm font-heading">
                ⚠️ Error: {error}
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="glass-premium p-10 text-center text-gray-500 text-sm font-heading">
                Tidak ada prospek yang cocok dengan kriteria pencarian Anda.
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const isHigh = (lead.aiScore || 0) >= 85;
                const isContacted = lead.status === 'CONTACTED';
                const isRejected = lead.status.startsWith('Skipped') || lead.status === 'REJECTED';

                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`glass p-5 cursor-pointer transition-all rounded-2xl ${
                      selectedLead?.id === lead.id
                        ? 'border border-teal-500/50 shadow-lg shadow-teal-500/5 scale-[1.01]'
                        : 'border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 hover-glow'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Source badge / logo replacement */}
                      <div className="p-3 rounded-2xl bg-black/20 dark:bg-white/5 border border-black/5 dark:border-white/5 flex-shrink-0 text-center">
                        <span className="text-[10px] font-heading font-bold tracking-widest text-teal-400 block mb-0.5">
                          {lead.source}
                        </span>
                        <Briefcase size={14} className="mx-auto text-gray-500" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="text-white font-heading font-bold text-sm truncate hover:text-teal-400 transition-colors">
                            {lead.title}
                          </h4>
                          {lead.aiScore !== null && (
                            <span className={`text-[10px] font-stats font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 ${
                              isHigh ? 'bg-teal-500/20 text-teal-400' : 'bg-black/20 dark:bg-white/5 text-gray-400'
                            }`}>
                              AI Match: {lead.aiScore}%
                            </span>
                          )}
                        </div>

                        <p className="text-gray-400 text-xs line-clamp-2 mb-3">
                          {lead.description}
                        </p>

                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                          <span className="font-heading">{lead.companyName || 'Client'}</span>
                          <span>•</span>
                          <span className="font-stats">{new Date(lead.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="ml-auto font-heading">
                            {isContacted ? (
                              <span className="bg-violet-500/10 text-violet-400 font-semibold px-2 py-0.5 rounded-full border border-violet-500/20">Pitched</span>
                            ) : isRejected ? (
                              <span className="bg-red-500/10 text-red-400 font-semibold px-2 py-0.5 rounded-full border border-red-500/20">Disqualified</span>
                            ) : (
                              <span className="bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">New Prospect</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Lead Detail Panel */}
          <div className="lg:col-span-1">
            {selectedLead ? (
              <div className="glass-premium hover-glow float-interactive p-5 space-y-5 sticky top-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-heading font-bold bg-teal-500/20 text-teal-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedLead.source}
                    </span>
                    <span className="text-xs text-gray-500 font-stats">
                      {new Date(selectedLead.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <h3 className="text-white font-heading font-bold text-base leading-snug">
                    {selectedLead.title}
                  </h3>
                  <p className="text-gray-400 text-xs mt-1 font-heading">
                    Calon Klien: <span className="text-gray-200 font-semibold">{selectedLead.companyName || 'Tidak Disebutkan'}</span>
                  </p>
                </div>

                <div className="border-t border-black/5 dark:border-white/5 pt-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-heading">Skor Kelayakan AI:</span>
                    <span className={`font-stats font-bold ${
                      (selectedLead.aiScore || 0) >= 85 ? 'text-teal-400 text-sm' : 'text-gray-400'
                    }`}>
                      {selectedLead.aiScore || 0}/100
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-heading">Status Proposal:</span>
                    <span className={`font-heading font-semibold ${
                      selectedLead.status === 'CONTACTED' ? 'text-violet-400' : 
                      selectedLead.status.startsWith('Skipped') ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {selectedLead.status === 'CONTACTED' ? 'Pitched' : 
                       selectedLead.status.startsWith('Skipped') || selectedLead.status === 'REJECTED' ? 'Disqualified' : 'New'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-black/5 dark:border-white/5 pt-4 space-y-2">
                  <h4 className="text-white font-heading font-semibold text-xs flex items-center gap-1.5">
                    <FileText size={12} className="text-teal-400" />
                    Kebutuhan Prospek Klien
                  </h4>
                  <div className="bg-black/20 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-3 text-xs text-gray-400 leading-relaxed max-h-48 overflow-y-auto">
                    {selectedLead.description}
                  </div>
                </div>

                {showOutreachDraft && (
                  <div className="border-t border-black/5 dark:border-white/5 pt-4 space-y-3">
                    <h4 className="text-white font-heading font-semibold text-xs flex items-center gap-1.5">
                      <Zap size={12} className="text-teal-400 animate-pulse" />
                      Draf Penawaran Otonom Ava (AI)
                    </h4>
                    
                    {draftLoading ? (
                      <div className="flex flex-col items-center justify-center py-6 space-y-2 bg-black/25 dark:bg-white/5 rounded-xl border border-dashed border-teal-500/30">
                        <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                        <span className="text-[10px] text-gray-400 font-heading">Merancang penawaran spesifik...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          readOnly
                          value={draftedMessage}
                          className="w-full h-40 p-3 bg-black/30 dark:bg-white/5 text-gray-300 border border-black/10 dark:border-white/10 rounded-xl text-xs font-sans leading-relaxed focus:outline-none focus:border-teal-500/50 resize-none font-mono"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(draftedMessage);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="flex-1 py-2 bg-black/20 hover:bg-black/45 dark:bg-white/5 dark:hover:bg-white/10 text-white rounded-lg text-xs font-heading font-semibold flex items-center justify-center gap-1.5 border border-black/10 dark:border-white/10 cursor-pointer"
                          >
                            {copied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            {copied ? 'Tersalin' : 'Salin Pesan'}
                          </button>
                          
                          {selectedLead.status === 'NEW' && (
                            <button
                              onClick={() => markAsContacted(selectedLead.id)}
                              disabled={actionLoading}
                              className="flex-1 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black font-heading font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                              Tandai Dihubungi
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cover letter draft link or actions */}
                <div className="pt-2 flex gap-3">
                  <a
                    href={selectedLead.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 rounded-xl border border-black/5 dark:border-white/5 text-gray-300 text-xs font-heading font-semibold hover:text-white hover:border-black/10 dark:hover:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    Lihat Sumber Prospek
                    <ExternalLink size={12} />
                  </a>

                  {selectedLead.status === 'NEW' && !showOutreachDraft && (
                    <button 
                      onClick={() => generateOutreachDraft(selectedLead)}
                      className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      Draf Penawaran AI
                      <Zap size={12} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-premium p-8 text-center text-gray-500 text-sm space-y-3 sticky top-6">
                <Briefcase size={24} className="mx-auto text-gray-600" />
                <div>
                  <h4 className="text-white font-heading font-semibold">Detail Prospek Klien</h4>
                  <p className="text-xs text-gray-500 mt-1 font-heading">Pilih salah satu prospek di samping untuk melihat rincian kualifikasi AI, draf penawaran agensi, dan sumber data.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
