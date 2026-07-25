'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import {
  Receipt, TrendingDown, Clock, CheckCircle2, Search,
  Download, RefreshCw, Filter, AlertCircle,
  Building2, User, Calendar, Wallet, Edit2, Save, Trash2,
  FileText, Upload, Copy, RotateCcw, MessageSquare, Send, Terminal
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

type Period = 'today' | 'week' | 'month' | 'all';
type TabName = 'invoices' | 'scanner' | 'receipts';

interface Invoice {
  id: string;
  type: 'RECEIVABLE' | 'PAYABLE';
  invoiceNumber: string;
  clientName: string;
  clientPhone: string | null;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'UNPAID' | 'OVERDUE';
  lastReminderSent: string | null;
  createdAt: string;
}

interface FinancialReceipt {
  id: string;
  merchantName: string | null;
  totalAmount: number | null;
  transactionDate: string | null;
  createdAt: string;
  rawAiAnalysis: string | null;
  uploadedBy: { name: string; divisi: string | null } | null;
}

interface OCRResult {
  documentType: string;
  confidence: number;
  extractedData: Record<string, string>;
  summary: string;
  issues: string[];
}

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hari Ini',
  week: '7 Hari Terakhir',
  month: 'Bulan Ini',
  all: 'Semua Waktu',
};

function formatRp(n: number | null | undefined) {
  if (!n && n !== 0) return '—';
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FinancePage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabName>('invoices');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [runningSim, setRunningSim] = useState(false);
  const [logOutput, setLogOutput] = useState<string[]>([]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const tool = searchParams.get('tool');
    if (tool) {
      setActiveTool(tool);
    } else {
      setActiveTool(null);
    }

    if (tab && (tab === 'invoices' || tab === 'scanner' || tab === 'receipts')) {
      setActiveTab(tab as TabName);
    } else if (tool) {
      if (['invoices', 'reminder', 'create', 'reconcile'].includes(tool)) {
        setActiveTab('invoices');
      } else if (tool === 'scanner') {
        setActiveTab('scanner');
      } else if (['receipts', 'export'].includes(tool)) {
        setActiveTab('receipts');
      }
    }
  }, [searchParams]);

  const getToolGlow = (toolKey: string) => {
    return activeTool === toolKey
      ? 'ring-2 ring-primary border-primary animate-pulse shadow-lg shadow-primary/20 transition-all duration-300'
      : '';
  };

  const runFinanceToolSimulation = (toolName: string, steps: string[]) => {
    setRunningSim(true);
    setLogOutput([`[SYS] Memulai eksekusi perkakas Keuangan: ${toolName}...`]);
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setLogOutput(prev => [...prev, step]);
        if (idx === steps.length - 1) setRunningSim(false);
      }, (idx + 1) * 600);
    });
  };

  const [companyId, setCompanyId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('Memuat...');
  
  // Data States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<FinancialReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Search
  const [period, setPeriod] = useState<Period>('month');
  const [search, setSearch] = useState('');
  const [filterInvoiceType, setFilterInvoiceType] = useState('ALL');
  
  // OCR File Upload State
  const [uploading, setUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalCount: 0,
    pendingApprovals: 0,
  });

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

  // Fetch Invoices and Receipts
  const fetchFinanceData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      // 1. Fetch Invoices
      const invRes = await fetch(`/api/finance/invoice?companyId=${companyId}`);
      const invData = await invRes.json();
      if (invData.success) {
        setInvoices(invData.invoices);
      }

      // 2. Fetch Receipts & Stats
      const recRes = await fetch(`/api/finance?companyId=${companyId}&period=${period}`);
      const recData = await recRes.json();
      if (recData.success) {
        setReceipts(recData.receipts);
        setStats(recData.stats);
      }
    } catch (err) {
      console.error('Error fetching finance data:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, period]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  // Handle OCR file processing
  const handleOcrFile = async (file: File) => {
    setUploading(true);
    setOcrResult(null);

    // Create image preview
    const readerForPreview = new FileReader();
    readerForPreview.onloadend = () => {
      setFilePreview(readerForPreview.result as string);
    };
    readerForPreview.readAsDataURL(file);

    // Read base64 for API
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Image: base64String,
            mimeType: file.type,
            companyId: companyId
          })
        });
        const data = await res.json();
        if (data.error) {
          alert('OCR Error: ' + data.error);
        } else {
          setOcrResult(data);
          // Refresh data since a new receipt is stored in PostgreSQL
          fetchFinanceData();
        }
      } catch (err) {
        alert('Gagal menghubungkan ke Gemini Vision API');
      } finally {
        setUploading(false);
      }
    };
  };

  // Trigger WhatsApp reminder simulation via API PUT
  const sendWhatsAppReminder = async (invoiceId: string) => {
    try {
      const targetInvoice = invoices.find(i => i.id === invoiceId);
      if (!targetInvoice || !targetInvoice.clientPhone) {
        alert('Nomor kontak vendor/klien tidak tersedia');
        return;
      }

      // Update lastReminderSent to now
      const res = await fetch('/api/finance/invoice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: invoiceId,
          companyId,
          status: targetInvoice.status,
          dueDate: targetInvoice.dueDate,
          amount: targetInvoice.amount,
          invoiceNumber: targetInvoice.invoiceNumber,
          clientName: targetInvoice.clientName,
          clientPhone: targetInvoice.clientPhone,
          lastReminderSent: new Date().toISOString()
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`🔔 WhatsApp Reminder Terkirim!\n\nPenerima: ${targetInvoice.clientName} (${targetInvoice.clientPhone})\nPesan: Tagihan ${targetInvoice.invoiceNumber} senilai ${formatRp(targetInvoice.amount)} jatuh tempo tanggal ${formatDate(targetInvoice.dueDate)}.`);
        fetchFinanceData(); // refresh list
      } else {
        alert(data.error || 'Gagal mengirim pengingat');
      }
    } catch (err) {
      console.error(err);
      alert('Koneksi database gagal');
    }
  };

  // Filtering
  const filteredReceipts = receipts.filter(r =>
    !search || (r.merchantName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredInvoices = invoices.filter(i => {
    const matchesSearch = !search || 
      i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterInvoiceType === 'ALL' || i.type === filterInvoiceType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen relative font-sans">
      <Header 
        title="Divisi Keuangan (Finance AI)" 
        subtitle={`Organisasi: ${companyName} · Otonomisasi Tagihan AR/AP, OCR Bon, & Arus Kas`} 
      />
      
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-light pb-0.5 gap-2">
          <button
            onClick={() => { setActiveTab('invoices'); setSearch(''); }}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'invoices' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            🧾 Rekap Invoice (AR/AP)
          </button>
          <button
            onClick={() => { setActiveTab('scanner'); setSearch(''); }}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'scanner' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            ✨ Scan &amp; OCR Dokumen (Vision AI)
          </button>
          <button
            onClick={() => { setActiveTab('receipts'); setSearch(''); }}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'receipts' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            💵 Rekap Bon Cash (Arus Kas)
          </button>
        </div>

        {/* Content & Terminal Log Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* ── TAB 1: INVOICES AR/AP ───────────────────────────────── */}
            {activeTab === 'invoices' && (
              <div className="space-y-6 fade-in">
                {/* Quick Tools Grid for Finance */}
                <div data-tour="finance-tools" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`bg-card border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('reminder')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">Reminder Utang/Piutang</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Kirim pengingat tagihan otomatis via WhatsApp/Telegram untuk invoice jatuh tempo.</p>
                    <button
                      disabled={runningSim}
                      onClick={() => runFinanceToolSimulation('Reminder Utang/Piutang', [
                        '[WA] Memindai invoice outstanding AR/AP...',
                        '[AI] Mengirim pesan tagihan otomatis ke vendor & klien...',
                        '[SUCCESS] Reminder WA terkirim ke 3 vendor.'
                      ])}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      Jalankan Auto-Reminder WA
                    </button>
                  </div>

                  <div className={`bg-card border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('create')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">Buat Invoice Baru</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Generate draf invoice otomatis dengan kalkulasi PPN 11% & diskon.</p>
                    <button
                      disabled={runningSim}
                      onClick={() => runFinanceToolSimulation('Buat Invoice Baru', [
                        '[SYS] Menyusun draf invoice standar...',
                        '[AI] Memasukkan kalkulasi PPN 11% & nomor registrasi...',
                        '[SUCCESS] Draf Invoice AR-2026-089 berhasil dibuat.'
                      ])}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      Buat Invoice Draf AI
                    </button>
                  </div>

                  <div className={`bg-card border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('reconcile')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">Rekonsiliasi Bank</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Pencocokan mutasi rekening bank dengan daftar invoice terverifikasi.</p>
                    <button
                      disabled={runningSim}
                      onClick={() => runFinanceToolSimulation('Rekonsiliasi Bank', [
                        '[BANK] Mengunduh mutasi rekening mutakhir via Open API...',
                        '[AI] Melakukan fuzzy-matching klaim transaksi...',
                        '[SUCCESS] 18 transaksi terpasang 100% cocok.'
                      ])}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      Mulai Rekonsiliasi
                    </button>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-light p-4 rounded-xl">
                  <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        placeholder="Cari nomor invoice atau vendor..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-elevated border border-light rounded-lg text-xs text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <select
                      value={filterInvoiceType}
                      onChange={(e) => setFilterInvoiceType(e.target.value)}
                      className="px-3 py-2 bg-elevated border border-light rounded-lg text-xs text-primary cursor-pointer focus:outline-none"
                    >
                      <option value="ALL">Semua Tipe</option>
                      <option value="RECEIVABLE">Piutang (AR)</option>
                      <option value="PAYABLE">Utang (AP)</option>
                    </select>
                  </div>
                  <button 
                    onClick={fetchFinanceData}
                    className="flex items-center gap-1.5 px-4 py-2 bg-elevated border border-light text-secondary text-xs rounded-lg hover:text-primary transition-all cursor-pointer"
                  >
                    <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>

                {/* Invoices List */}
                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredInvoices.length > 0 ? (
                  <div className={`bg-card border border-light rounded-2xl overflow-hidden shadow-sm ${getToolGlow('invoices')}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-elevated border-b border-light text-secondary font-bold">
                          <th className="p-4">No. Invoice</th>
                          <th className="p-4">Tipe</th>
                          <th className="p-4">Nama Vendor/Klien</th>
                          <th className="p-4">Nominal</th>
                          <th className="p-4">Jatuh Tempo</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">WA Reminder</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light text-primary">
                        {filteredInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-hover/20 transition-colors">
                            <td className="p-4 font-mono font-bold">{inv.invoiceNumber}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.type === 'RECEIVABLE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                              }`}>
                                {inv.type === 'RECEIVABLE' ? 'Receivable' : 'Payable'}
                              </span>
                            </td>
                            <td className="p-4 font-semibold">{inv.clientName}</td>
                            <td className="p-4 font-bold font-stats text-sm">{formatRp(inv.amount)}</td>
                            <td className="p-4">{formatDate(inv.dueDate)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="p-4">
                              {inv.status !== 'PAID' && inv.clientPhone ? (
                                <button
                                  onClick={() => sendWhatsAppReminder(inv.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer shadow-sm"
                                >
                                  <Send size={10} />
                                  Tagih WA
                                </button>
                              ) : inv.status === 'PAID' ? (
                                <span className="text-muted text-[11px] italic">Lunas</span>
                              ) : (
                                <span className="text-muted text-[11px]">No kontak</span>
                              )}
                              {inv.lastReminderSent && (
                                <span className="block text-[9px] text-muted mt-1 font-stats">
                                  Sent: {new Date(inv.lastReminderSent).toLocaleDateString('id-ID')}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-card border border-light border-dashed rounded-2xl">
                    <span className="text-secondary text-xs">Belum ada data invoice tercatat di database.</span>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: SCANNER & OCR ────────────────────────────────── */}
            {activeTab === 'scanner' && (
              <div className={`grid grid-cols-1 gap-6 fade-in ${getToolGlow('scanner')}`}>
                <div className="space-y-4">
                  <DropZone onFile={handleOcrFile} />
                  
                  {uploading && (
                    <div className="flex items-center justify-center gap-2 p-4 bg-card border border-light rounded-2xl text-xs text-secondary">
                      <Loader2 className="animate-spin text-primary" size={16} />
                      <span>Sedang mengekstrak berkas menggunakan Gemini Vision AI...</span>
                    </div>
                  )}

                  {filePreview && (
                    <div className="bg-card border border-light p-4 rounded-2xl space-y-2">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Preview Berkas Terunggah:</span>
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-light">
                        {filePreview.startsWith('data:application/pdf') ? (
                          <div className="flex flex-col items-center justify-center h-full bg-elevated/40 text-secondary text-xs gap-2">
                            <FileText size={40} className="text-muted" />
                            <span>Dokumen PDF Terunggah</span>
                          </div>
                        ) : (
                          <img src={filePreview} alt="OCR Preview" className="object-contain w-full h-full" />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  {ocrResult ? (
                    <div className="bg-card border border-light rounded-2xl overflow-hidden shadow-xl slide-up">
                      <div className="p-5 border-b border-light flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-primary text-sm">{ocrResult.documentType}</h4>
                          <p className="text-[10px] text-secondary">Akurasi Ekstraksi AI</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-extrabold text-emerald-500 font-stats">{ocrResult.confidence}%</div>
                        </div>
                      </div>

                      <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div>
                          <span className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">Ringkasan AI:</span>
                          <p className="text-xs text-secondary leading-relaxed font-sans">{ocrResult.summary}</p>
                        </div>

                        {ocrResult.issues.length > 0 && (
                          <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl space-y-1">
                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block flex items-center gap-1">
                              <AlertCircle size={10} /> Hal yang Perlu Audit Manual:
                            </span>
                            <ul className="list-disc list-inside text-secondary text-[11px] space-y-0.5 pl-1">
                              {ocrResult.issues.map((issue, idx) => (
                                <li key={idx}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div>
                          <span className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">Hasil Ekstraksi Data:</span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(ocrResult.extractedData).map(([key, val]) => (
                              <div key={key} className="bg-elevated/45 border border-light p-2.5 rounded-lg flex flex-col gap-0.5">
                                <span className="text-[9px] text-muted truncate">{key}</span>
                                <span className="text-primary font-bold truncate">{val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-card border border-light border-dashed rounded-2xl text-center gap-3">
                      <span className="text-3xl">🤖</span>
                      <div>
                        <h5 className="font-bold text-primary text-sm">Menunggu Unggahan Dokumen</h5>
                        <p className="text-[11px] text-secondary mt-0.5 max-w-xs mx-auto">
                          Unggah tagihan listrik, kwitansi bensin, atau invoice untuk memicu ekstraksi otonom oleh AI.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 3: RECEIPTS / CASH FLOW ─────────────────────────── */}
            {activeTab === 'receipts' && (
              <div className="space-y-6 fade-in">
                {/* Export Card */}
                <div className={`bg-card border border-light p-4 rounded-xl flex items-center justify-between gap-4 ${getToolGlow('export')}`}>
                  <div>
                    <span className="font-bold text-xs text-primary block">Ekspor Laporan PDF/Excel</span>
                    <p className="text-[11px] text-muted mt-0.5">Ekspor rekap arus kas dan bon belanja ke dokumen resmi.</p>
                  </div>
                  <button
                    disabled={runningSim}
                    onClick={() => runFinanceToolSimulation('Ekspor Laporan PDF/Excel', [
                      '[EXCEL] Menyusun spreadsheet arus kas...',
                      '[PDF] Merender laporan keuangan format PDF...',
                      '[SUCCESS] File Laporan_Finance_2026.pdf diunduh.'
                    ])}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    Ekspor PDF
                  </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Total Bon</span>
                    <span className="text-primary font-stats font-extrabold text-lg">{formatRp(stats?.totalAmount)}</span>
                  </div>
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Bon Masuk</span>
                    <span className="text-primary font-stats font-extrabold text-lg">{stats?.totalCount || 0} file</span>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-light p-4 rounded-xl">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      placeholder="Cari merchant..."
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
                    <option value="all">Semua Waktu</option>
                  </select>
                </div>

                {/* Table Receipts */}
                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredReceipts.length > 0 ? (
                  <div className={`bg-card border border-light rounded-2xl overflow-hidden ${getToolGlow('receipts')}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-elevated border-b border-light text-secondary font-bold">
                          <th className="p-4">Merchant/Toko</th>
                          <th className="p-4">Tanggal Transaksi</th>
                          <th className="p-4">Total</th>
                          <th className="p-4">Diunggah Oleh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light text-primary">
                        {filteredReceipts.map((r) => (
                          <tr key={r.id} className="hover:bg-hover/20 transition-colors">
                            <td className="p-4 font-bold">{r.merchantName || 'Toko Umum'}</td>
                            <td className="p-4">{formatDate(r.transactionDate)}</td>
                            <td className="p-4 font-stats font-bold">{formatRp(r.totalAmount)}</td>
                            <td className="p-4">{r.uploadedBy?.name || 'AI Assistant'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-card border border-light border-dashed rounded-2xl">
                    <span className="text-secondary text-xs">Belum ada bon cash yang tercatat.</span>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Log Console Simulator Panel */}
          <div className="bg-card border border-light p-5 rounded-2xl flex flex-col h-[380px] shadow-sm">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5 mb-3 font-mono">
              <Terminal size={14} className="text-primary" /> Log AI Finance Dispatcher:
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

// ── CUSTOM COMPONENTS ───────────────────────────────────────
function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <div
      className="relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all"
      style={{
        borderColor: dragging ? 'var(--primary)' : 'var(--border)',
        background: dragging ? 'var(--primary-glow)' : 'var(--bg-card)',
        padding: '3rem 2rem',
        minHeight: 220,
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-elevated border border-light">
        <Upload size={28} className="text-secondary" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-primary">
          {dragging ? 'Lepas berkas di sini!' : 'Jatuhkan berkas dokumen atau klik untuk memilih'}
        </p>
        <p className="text-sm mt-1 text-secondary">
          Mendukung: JPG, PNG, PDF (max 10MB)
        </p>
        <p className="text-xs mt-2 font-medium text-emerald-500">
          Diproses otonom oleh Gemini 2.5 Flash Vision AI ✨
        </p>
      </div>
    </div>
  );
}

function Loader2({ className, size }: { className?: string, size?: number }) {
  return <RefreshCw className={`animate-spin ${className}`} size={size} />;
}
