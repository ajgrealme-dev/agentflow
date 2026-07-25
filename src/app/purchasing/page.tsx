'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import {
  Package, Search, Briefcase, Filter, ExternalLink, FileText,
  CheckCircle, XCircle, Clock, ArrowRight, Zap, RefreshCw, AlertCircle,
  TrendingUp, Download, Eye, ListTodo, ShieldCheck, Terminal
} from 'lucide-react';

type TabName = 'requisitions' | 'leads' | 'inventory';

interface Requisition {
  id: string;
  prNumber: string;
  salesOrderId: string | null;
  salesOrder: { soNumber: string; customerName: string } | null;
  itemsJson: string;
  status: 'DRAFT' | 'SENT_RFQ' | 'PO_CREATED';
  createdAt: string;
}

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

export default function PurchasingPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabName>('requisitions');
  const [companyId, setCompanyId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('Memuat...');
  
  // Data States
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Leads Filtering States
  const [filterSource, setFilterSource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Stock Opname Logs
  const [runningStockOpname, setRunningStockOpname] = useState(false);
  const [stockLogs, setStockLogs] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const tool = searchParams.get('tool');
    if (tool) {
      setActiveTool(tool);
    } else {
      setActiveTool(null);
    }

    if (tab && (tab === 'requisitions' || tab === 'leads' || tab === 'inventory' || tab === 'pr' || tab === 'rfq')) {
      if (tab === 'pr') setActiveTab('requisitions');
      else if (tab === 'rfq') setActiveTab('leads');
      else setActiveTab(tab as TabName);
    } else if (tool) {
      if (['pr', 'so', 'requisitions'].includes(tool)) {
        setActiveTab('requisitions');
      } else if (['rfq', 'supplier', 'leads'].includes(tool)) {
        setActiveTab('leads');
      } else if (['inventory', 'delivery', 'report'].includes(tool)) {
        setActiveTab('inventory');
      }
    }
  }, [searchParams]);

  const getToolGlow = (toolKey: string) => {
    return activeTool === toolKey
      ? 'ring-2 ring-primary border-primary animate-pulse shadow-lg shadow-primary/20 transition-all duration-300'
      : '';
  };

  const runPurchasingSim = (toolName: string, steps: string[]) => {
    setRunningStockOpname(true);
    setStockLogs([`[SYS] Memulai eksekusi perkakas Pengadaan: ${toolName}...`]);
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setStockLogs(prev => [...prev, step]);
        if (idx === steps.length - 1) setRunningStockOpname(false);
      }, (idx + 1) * 600);
    });
  };

  // Fetch company context first
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch('/api/company');
        const data = await res.json();
        if (data.success && data.companies.length > 0) {
          setCompanyId(data.companies[0].id);
          setCompanyName(data.companies[0].name);
        }
      } catch (err) {
        console.error('Error fetching company context:', err);
      }
    };
    fetchCompany();
  }, []);

  const fetchPurchasingData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      // 1. Fetch requisitions
      const prRes = await fetch(`/api/purchasing/requisition?companyId=${companyId}`);
      const prData = await prRes.json();
      if (prData.success) {
        setRequisitions(prData.requisitions);
      }

      // 2. Fetch leads
      const leadsRes = await fetch(`/api/purchasing/leads`);
      const leadsData = await leadsRes.json();
      if (leadsData.success) {
        setLeads(leadsData.leads);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchPurchasingData();
  }, [fetchPurchasingData]);

  // Filtering leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.companyName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = filterSource === 'all' || lead.source.toLowerCase() === filterSource;
    return matchesSearch && matchesSource;
  });

  const exportLeadsCSV = () => {
    const headers = ['Sumber', 'Judul Prospek', 'Klien', 'Kecocokan AI', 'Status', 'Tanggal Ditemukan'];
    const rows = filteredLeads.map(lead => [
      lead.source,
      lead.title.replace(/,/g, ' '),
      (lead.companyName ?? 'Umum').replace(/,/g, ' '),
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
    link.click();
  };

  const runStockOpname = () => {
    setRunningStockOpname(true);
    setStockLogs([`[SYS] Memulai Stock Opname otonom oleh Warehouse AI Agent...`]);

    setTimeout(() => {
      setStockLogs(prev => [...prev, `[GUDANG] Memindai barcode & log mutasi barang di database...`]);
    }, 600);

    setTimeout(() => {
      setStockLogs(prev => [...prev, `[AI] Verifikasi stok fisik terhadap invoice pembelian terakhir...`]);
    }, 1200);

    setTimeout(() => {
      setStockLogs(prev => [
        ...prev,
        `[SUCCESS] Stock Opname Selesai!`,
        `✓ Total SKU Terverifikasi: 42 SKU`,
        `✓ Rendah Stok: Semen Portland (12 sak - Min: 20 sak)`,
        `✓ Rekomendasi: Kirim Purchase Requisition (PR) otomatis.`
      ]);
      setRunningStockOpname(false);
    }, 2000);
  };

  const highMatchCount = leads.filter(l => (l.aiScore || 0) >= 85).length;
  const appliedCount = leads.filter(l => l.status === 'CONTACTED').length;

  return (
    <div className="min-h-screen relative font-sans">
      <Header
        title="Divisi Pengadaan (Purchasing AI)"
        subtitle={`Organisasi: ${companyName} · Otomasi Prospek B2B, RFQ Supplier, &amp; Manajemen Stok Gudang`}
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-light pb-0.5 gap-2">
          <button
            onClick={() => { setActiveTab('requisitions'); setSearchQuery(''); }}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'requisitions' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            📦 Pengadaan &amp; SO (Permintaan)
          </button>
          <button
            onClick={() => { setActiveTab('leads'); setSearchQuery(''); }}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'leads' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            🎯 B2B Client Prospector (Leads AI)
          </button>
          <button
            onClick={() => { setActiveTab('inventory'); setSearchQuery(''); }}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'inventory' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            🏭 Manajemen Stok Gudang
          </button>
        </div>

        {/* Content & Terminal Log Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* ── TAB 1: REQUISITIONS & SALES ORDERS ──────────────────── */}
            {activeTab === 'requisitions' && (
              <div className="space-y-6 fade-in">
                {/* Sales Order Matching Tool Card */}
                <div className={`bg-card border border-light p-4 rounded-xl flex items-center justify-between gap-4 ${getToolGlow('so')}`}>
                  <div>
                    <span className="font-bold text-xs text-primary block">📋 Sales Order Matching</span>
                    <p className="text-[11px] text-muted mt-0.5">Sinkronisasi otomatis item Sales Order (SO) ke draf Requisition (PR).</p>
                  </div>
                  <button
                    disabled={runningStockOpname}
                    onClick={() => runPurchasingSim('Sales Order Matching', [
                      '[SO] Membaca SO-2026-041...',
                      '[PR] Matching kuantitas item barang...',
                      '[SUCCESS] PR & SO terverifikasi 100% cocok.'
                    ])}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    Match SO &amp; PR
                  </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-4 bg-card border border-light p-4 rounded-xl">
                  <span className="text-xs text-secondary font-semibold">
                    Daftar Purchase Requisitions (PR) yang diajukan divisi otonom.
                  </span>
                  <button 
                    onClick={fetchPurchasingData}
                    className="flex items-center gap-1.5 px-4 py-2 bg-elevated border border-light text-secondary text-xs rounded-lg hover:text-primary transition-all cursor-pointer"
                  >
                    <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : requisitions.length > 0 ? (
                  <div className={`bg-card border border-light rounded-2xl overflow-hidden shadow-sm ${getToolGlow('pr')}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-elevated border-b border-light text-secondary font-bold">
                          <th className="p-4">No. PR</th>
                          <th className="p-4">Sales Order (SO) Acuan</th>
                          <th className="p-4">Nama Pelanggan</th>
                          <th className="p-4">Daftar Bahan Baku</th>
                          <th className="p-4">Tanggal Pengajuan</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light text-primary">
                        {requisitions.map((req) => {
                          const items = JSON.parse(req.itemsJson || '[]');
                          return (
                            <tr key={req.id} className="hover:bg-hover/20 transition-colors">
                              <td className="p-4 font-mono font-bold">{req.prNumber}</td>
                              <td className="p-4 font-mono text-muted">{req.salesOrder?.soNumber || 'Permintaan Internal'}</td>
                              <td className="p-4 font-semibold">{req.salesOrder?.customerName || 'Stok Gudang'}</td>
                              <td className="p-4">
                                <div className="space-y-0.5 font-mono text-[10px]">
                                  {items.map((item: any, idx: number) => (
                                    <div key={idx}>- {item.name || item.barang} ({item.qty || item.jumlah} {item.unit || 'pcs'})</div>
                                  ))}
                                </div>
                              </td>
                              <td className="p-4">{new Date(req.createdAt).toLocaleDateString('id-ID')}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  req.status === 'PO_CREATED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  req.status === 'SENT_RFQ' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                  'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-card border border-light border-dashed rounded-2xl">
                    <span className="text-secondary text-xs">Belum ada pengajuan Purchase Requisition di database.</span>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: B2B LEADS PROSPECTOR ──────────────────────────── */}
            {activeTab === 'leads' && (
              <div className="space-y-6 fade-in">
                {/* Supplier Rating Tool Card */}
                <div className={`bg-card border border-light p-4 rounded-xl flex items-center justify-between gap-4 ${getToolGlow('supplier')}`}>
                  <div>
                    <span className="font-bold text-xs text-primary block">🏪 Database &amp; Rating Supplier</span>
                    <p className="text-[11px] text-muted mt-0.5">Penilaian otomatis performa SLA & kualitas vendor pengadaan.</p>
                  </div>
                  <button
                    disabled={runningStockOpname}
                    onClick={() => runPurchasingSim('Rating Supplier', [
                      '[VENDOR] Mengambil histori performa 14 vendor...',
                      '[AI] Mengkalkulasi SLA pengiriman & kualitas...',
                      '[SUCCESS] Vendor PT Mitra Unggul meraih skor 98/100.'
                    ])}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    Audit Rating Supplier
                  </button>
                </div>

                {/* Stats Header */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Total Leads Ditemukan</span>
                    <span className="text-primary font-stats font-extrabold text-lg">{leads.length} prospek</span>
                  </div>
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Akurasi Tinggi (&ge; 85%)</span>
                    <span className="text-emerald-500 font-stats font-extrabold text-lg">{highMatchCount} match</span>
                  </div>
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Hubungi Klien (Contacted)</span>
                    <span className="text-primary font-stats font-extrabold text-lg">{appliedCount} klien</span>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-light p-4 rounded-xl">
                  <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        placeholder="Cari prospek atau nama perusahaan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-elevated border border-light rounded-lg text-xs text-primary focus:outline-none"
                      />
                    </div>
                    <select
                      value={filterSource}
                      onChange={(e) => setFilterSource(e.target.value)}
                      className="px-3 py-2 bg-elevated border border-light rounded-lg text-xs text-primary cursor-pointer focus:outline-none"
                    >
                      <option value="all">Semua Sumber</option>
                      <option value="upwork">Upwork</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="jobstreet">JobStreet</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportLeadsCSV}
                      className="flex items-center gap-1 px-4 py-2 bg-elevated border border-light text-secondary text-xs rounded-lg hover:text-primary transition-all cursor-pointer font-bold"
                    >
                      <Download size={12} />
                      Ekspor CSV
                    </button>
                  </div>
                </div>

                {/* Table Leads */}
                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredLeads.length > 0 ? (
                  <div className={`bg-card border border-light rounded-2xl overflow-hidden shadow-sm ${getToolGlow('rfq')}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-elevated border-b border-light text-secondary font-bold">
                          <th className="p-4">Sumber</th>
                          <th className="p-4">Judul Prospek</th>
                          <th className="p-4">Nama Perusahaan</th>
                          <th className="p-4">Kecocokan AI</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light text-primary">
                        {filteredLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-hover/20 transition-colors">
                            <td className="p-4 font-bold">{lead.source}</td>
                            <td className="p-4 font-semibold max-w-sm truncate">{lead.title}</td>
                            <td className="p-4">{lead.companyName || 'Vendor Umum'}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                (lead.aiScore || 0) >= 85 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                              }`}>
                                {lead.aiScore !== null ? `${lead.aiScore}%` : 'N/A'}
                              </span>
                            </td>
                            <td className="p-4 uppercase tracking-wider text-[10px]">
                              <span className={`px-2 py-0.5 rounded-full border ${
                                lead.status === 'NEW' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                lead.status === 'CONTACTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => setSelectedLead(lead)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-elevated border border-light text-secondary rounded-lg hover:text-primary transition-all cursor-pointer font-bold text-[10px]"
                              >
                                <Eye size={10} />
                                Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-card border border-light border-dashed rounded-2xl">
                    <span className="text-secondary text-xs">Belum ada prospek leads pembeli ditemukan oleh scraper AI.</span>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: WAREHOUSE INVENTORY ─────────────────────────── */}
            {activeTab === 'inventory' && (
              <div className="space-y-6 fade-in">
                {/* Delivery & Report Tool Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`bg-card border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('delivery')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">🚚 Tracking Pengiriman</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Lacak status pengiriman PO barang dari supplier ke gudang.</p>
                    <button
                      disabled={runningStockOpname}
                      onClick={() => runPurchasingSim('Tracking Pengiriman', [
                        '[LOGISTIK] Menghubungkan ke API ekspedisi...',
                        '[TRACK] PO-2026-081 dalam perjalanan (ETD: 2 jam)...',
                        '[SUCCESS] Posisi truk terverifikasi di tol Cikampek.'
                      ])}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      Lacak Pengiriman
                    </button>
                  </div>

                  <div className={`bg-card border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('report')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">📊 Laporan Pengadaan</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Rekap biaya pembelian & efisiensi budget pengadaan bulanan.</p>
                    <button
                      disabled={runningStockOpname}
                      onClick={() => runPurchasingSim('Laporan Pengadaan', [
                        '[REPORT] Menyusun rekapitulasi PO & PR bulanan...',
                        '[AI] Menghitung total efisiensi negosiasi vendor...',
                        '[SUCCESS] Laporan_Pengadaan_Juli.pdf terbit.'
                      ])}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      Generate Laporan Pengadaan
                    </button>
                  </div>
                </div>

                {/* Stats Header */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Total SKU Terdaftar</span>
                    <span className="text-primary font-stats font-extrabold text-base">42 Barang</span>
                  </div>
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Rendah Stok Alert</span>
                    <span className="text-amber-500 font-stats font-extrabold text-base">3 SKU</span>
                  </div>
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Status Gudang</span>
                    <span className="text-emerald-500 font-stats font-extrabold text-base">Optimal</span>
                  </div>
                </div>

                {/* Stock Items Table */}
                <div className={`bg-card border border-light rounded-2xl overflow-hidden shadow-sm ${getToolGlow('inventory')}`}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-elevated border-b border-light text-secondary font-bold">
                        <th className="p-4">Nama Barang</th>
                        <th className="p-4">Kategori</th>
                        <th className="p-4">Level Stok</th>
                        <th className="p-4">Batas Min</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light text-primary">
                      {[
                        { name: 'Besi Beton 10mm', cat: 'Material', qty: 250, unit: 'batang', min: 100, status: 'Aman' },
                        { name: 'Semen Portland 50kg', cat: 'Material', qty: 12, unit: 'sak', min: 20, status: 'Rendah' },
                        { name: 'Cat Tembok Putih 20L', cat: 'Finishing', qty: 45, unit: 'pail', min: 15, status: 'Aman' },
                        { name: 'Kawat Las 3.2mm', cat: 'Tools', qty: 5, unit: 'dus', min: 10, status: 'Rendah' },
                      ].map(item => (
                        <tr key={item.name} className="hover:bg-hover/20 transition-colors">
                          <td className="p-4 font-bold">{item.name}</td>
                          <td className="p-4 font-semibold">{item.cat}</td>
                          <td className="p-4 font-stats font-bold">{item.qty} {item.unit}</td>
                          <td className="p-4 font-stats text-muted">{item.min} {item.unit}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'Aman' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Terminal Console Simulator Panel */}
          <div className="bg-card border border-light p-5 rounded-2xl flex flex-col h-[380px] shadow-sm">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5 mb-3 font-mono">
              <Terminal size={14} className="text-primary" /> Log AI Warehouse &amp; Purchasing:
            </span>
            <div className="flex-1 bg-elevated dark:bg-black/90 text-primary dark:text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-y-auto space-y-1.5 border border-light dark:border-white/10">
              {stockLogs.length > 0 ? (
                stockLogs.map((l, i) => <div key={i}>{l}</div>)
              ) : (
                <span className="text-muted italic">Klik tombol alat kerja untuk melihat simulasi eksekusi...</span>
              )}
            </div>
            <button
              disabled={runningStockOpname}
              onClick={runStockOpname}
              className="w-full mt-3 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Zap size={11} />
              Mulai Audit Stok Otonom
            </button>
          </div>
        </div>

      </div>

      {/* ── DETAIL LEAD MODAL ────────────────────────────────────── */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
          <div className="relative w-full max-w-xl bg-card border border-light rounded-2xl shadow-2xl overflow-hidden m-4">
            <div className="p-5 border-b border-light flex items-center justify-between">
              <div>
                <h3 className="text-primary font-bold text-base leading-tight">{selectedLead.title}</h3>
                <span className="text-secondary text-xs">{selectedLead.companyName || 'Klien Umum'} &middot; {selectedLead.source}</span>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-secondary hover:text-red-500 transition-colors p-1">
                <XCircle size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Deskripsi Prospek:</span>
                <p className="text-xs text-secondary leading-relaxed font-sans">{selectedLead.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-elevated/40 border border-light p-3 rounded-xl">
                  <span className="text-[10px] text-muted block mb-0.5">Kecocokan AI:</span>
                  <span className="text-primary font-bold text-sm">{selectedLead.aiScore}% Match</span>
                </div>
                <div className="bg-elevated/40 border border-light p-3 rounded-xl">
                  <span className="text-[10px] text-muted block mb-0.5">Tanggal Ditemukan:</span>
                  <span className="text-primary font-bold text-sm">{new Date(selectedLead.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-elevated border-t border-light flex items-center justify-between">
              <a
                href={selectedLead.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
              >
                <ExternalLink size={12} />
                Buka Link Sumber
              </a>
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
