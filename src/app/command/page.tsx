'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Header from '@/components/Header';
import { ToastContainer, useToast } from '@/components/Toast';
import { useTheme } from '@/components/ThemeProvider';
import {
  Send, Paperclip, X, Download, Copy, Loader2,
  FileText, Bot, User, Users, Zap, Calendar, BarChart3,
  Mail, ChevronRight, AlertCircle, CheckCircle2,
  Search, Briefcase, ExternalLink, Star,
} from 'lucide-react';
import type { CommandResult } from '@/app/api/command/route';

/* ─── Types ──────────────────────────────────────── */
interface ScraperLead {
  companyName: string;
  title: string;
  description: string;
  url: string;
  email: string;
  aiScore: number;
  status: string;
  industry: string;
  location: string;
}

/* ─── Types ──────────────────────────────────────── */
interface Message {
  id:       string;
  role:     'user' | 'assistant';
  text:     string;
  file?:    { name: string; preview?: string };
  result?:  CommandResult;
  time:     string;
}

/* ─── Quick Actions ──────────────────────────────── */
const QUICK_ACTIONS = [
  {
    icon:  Search,
    label: '🔍 Cari Klien',
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30',
    prompt: 'Cari klien prospek buyer industri Logistik di Serang, cari 5 prospek terbaik.',
  },
  {
    icon:  FileText,
    label: '📄 Input Invoice',
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 border border-violet-100 dark:bg-violet-950/20 dark:border-violet-900/30',
    prompt: 'Tolong bantu saya input data dari invoice ini ke rekap Excel. Saya akan upload file invoicenya sekarang.',
  },
  {
    icon:  BarChart3,
    label: '💰 Rekap Keuangan',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30',
    prompt: 'Tampilkan rekap keuangan dan total pengeluaran bulan ini.',
  },
  {
    icon:  Users,
    label: '👥 Cek Absensi',
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30',
    prompt: 'Siapa saja karyawan yang hadir dan absen hari ini?',
  },
  {
    icon:  Calendar,
    label: '📋 Pengajuan Cuti',
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-50 border border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30',
    prompt: 'Saya mau buat pengajuan cuti karyawan. Tolong buatkan format pengajuan cutinya.',
  },
  {
    icon:  BarChart3,
    label: '🔎 Audit Keuangan',
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30',
    prompt: 'Lakukan audit dan cocokkan semua bon keuangan bulan ini.',
  },
];

/* ─── Message Bubble ─────────────────────────────── */
function MessageBubble({ msg, onCopy, onDownload }: {
  msg: Message;
  onCopy: (text: string) => void;
  onDownload: (csv: string, filename: string) => void;
}) {
  const isUser = msg.role === 'user';
  const r = msg.result;

  const actionColor: Record<string, string> = {
    ocr_done:      '#16a34a',
    cuti_drafted:  '#4f46e5',
    rekap:         '#2563eb',
    info:          '#4b5563',
    need_file:     '#d97706',
    error:         '#dc2626',
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} fade-up`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 border ${isUser ? 'bg-primary border-primary text-white' : 'bg-elevated border-light'}`}>
        {isUser
          ? <User size={14} className="text-white" />
          : <Bot size={14} className="text-primary" />
        }
      </div>

      {/* Bubble */}
      <div className="flex-1 max-w-[80%]" style={{ textAlign: isUser ? 'right' : 'left' }}>
        {/* File preview (user side) */}
        {msg.file && (
          <div className="inline-flex items-center gap-2 mb-2 px-3 py-2 rounded-xl text-sm bg-elevated border border-light">
            <FileText size={13} className="text-primary" />
            <span className="text-secondary">{msg.file.name}</span>
          </div>
        )}

        {/* Main bubble */}
        <div className="inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed border"
          style={{
            background: isUser ? 'var(--bg-elevated)' : 'var(--bg-card)',
            borderColor: isUser ? 'var(--primary)' : 'var(--border)',
            color: 'var(--text-primary)',
            textAlign: 'left',
          }}>
          {msg.text}
        </div>

        {/* Result card (AI only) */}
        {r && r.action !== 'info' && r.action !== 'error' && r.data && (
          <div className="mt-3 rounded-2xl overflow-hidden text-left bg-card border border-light shadow-sm">
            {/* Result header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-light">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: actionColor[r.action] ?? '#22c55e' }} />
                <span className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: actionColor[r.action] ?? '#22c55e' }}>
                  {r.action === 'ocr_done' ? 'Data Berhasil Diekstrak' :
                   r.action === 'cuti_drafted' ? 'Draft Pengajuan Cuti' :
                   r.action === 'rekap' ? 'Template Rekap' : 'Hasil'}
                </span>
              </div>
              {r.confidence !== undefined && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                  style={{
                    background: r.confidence >= 90 ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                    color: r.confidence >= 90 ? '#16a34a' : '#d97706',
                  }}>
                  {r.confidence}% akurat
                </span>
              )}
            </div>

            {/* Data table */}
            <div className="p-4">
              {Object.entries(r.data).map(([k, v], i, arr) => (
                <div key={k}
                  className="flex items-start justify-between gap-4 py-2"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span className="text-xs text-secondary" style={{ minWidth: 120 }}>{k}</span>
                  <span className="text-xs font-semibold text-right text-primary">{v}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-4 pb-4">
              {r.csvData && (
                <button
                  onClick={() => onDownload(r.csvData!, `agentflow-${r.action}-${Date.now()}.csv`)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 transition-all hover:opacity-90 shadow-sm">
                  <Download size={11} /> Download CSV (Excel)
                </button>
              )}
              {r.data && (
                <button
                  onClick={() => onCopy(Object.entries(r.data!).map(([k, v]) => `${k}: ${v}`).join('\n'))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all bg-elevated hover:bg-hover border border-light text-secondary">
                  <Copy size={11} /> Copy Data
                </button>
              )}
            </div>
          </div>
        )}

        {/* Need file warning */}
        {r?.needFile && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/10 text-amber-600 dark:text-amber-400">
            <AlertCircle size={12} /> Upload dokumennya dulu ya — pakai tombol 📎 di bawah
          </div>
        )}

        {/* Suggestions */}
        {r?.suggestions && r.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {r.suggestions.map((s, i) => (
              <button key={i}
                className="text-xs px-2.5 py-1 rounded-lg transition-all bg-elevated border border-light text-secondary hover:text-primary hover:bg-hover">
                {s} →
              </button>
            ))}
          </div>
        )}

        <div className="mt-1.5 text-xs text-muted" suppressHydrationWarning>{msg.time}</div>
      </div>
    </div>
  );
}

/* ─── Typing Indicator ───────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex gap-3 fade-up">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-elevated border border-light">
        <Bot size={14} className="text-primary" />
      </div>
      <div className="px-4 py-3 rounded-2xl flex items-center gap-2 bg-card border border-light shadow-sm">
        <Loader2 size={13} className="animate-spin text-primary" />
        <span className="text-sm text-secondary">Ava sedang memproses…</span>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────── */
export default function CommandPage() {
  const { toasts, addToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id:   'welcome',
      role: 'assistant',
      text: 'Halo! Saya Ava, asisten AI admin kantor kamu 👋\n\nSaya bisa bantu kamu:\n• Input data invoice/bon/kwitansi ke Excel otomatis\n• Buat draft pengajuan cuti karyawan\n• Bikin rekap kerja harian\n• Baca dan proses dokumen kantor apapun\n\nMau mulai dari mana? Ketik perintah atau pilih menu cepat di bawah!',
      time: '',
    },
  ]);

  // Set initial message time on client only to prevent hydration mismatch
  useEffect(() => {
    setMessages(prev => prev.map(m =>
      m.id === 'welcome' && m.time === ''
        ? { ...m, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }
        : m
    ));
  }, []);
  const [input, setInput]         = useState('');
  const [file, setFile]           = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const fileInputRef              = useRef<HTMLInputElement>(null);
  const chatEndRef                = useRef<HTMLDivElement>(null);
  const textareaRef               = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const now = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const handleFile = useCallback((f: File) => {
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text && !file) return;

    const userMsg: Message = {
      id:   `user-${Date.now()}`,
      role: 'user',
      text: text || '📎 File dikirim untuk diproses',
      file: file ? { name: file.name } : undefined,
      time: now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let base64File: string | null = null;
      let mimeType: string | null = null;
      let fileName: string | null = null;

      if (file) {
        mimeType = file.type;
        fileName = file.name;
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = e => {
            const dataUrl = e.target?.result as string;
            base64File = dataUrl.split(',')[1];
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }

      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:    text || 'Tolong proses file yang saya upload ini',
          base64File,
          mimeType,
          fileName,
        }),
      });

      const data: CommandResult = await res.json();

      const aiMsg: Message = {
        id:     `ai-${Date.now()}`,
        role:   'assistant',
        text:   data.reply,
        result: data,
        time:   now(),
      };

      setMessages(prev => [...prev, aiMsg]);

      if (data.action === 'ocr_done') {
        addToast('Data berhasil diekstrak! Silakan download CSV-nya.', 'success');
      }

      // ─── Handle Scraper Intent ───────────────────────
      if (data.action === 'cari_klien' && data.scraperParams) {
        const { industry, location, keyword, limit } = data.scraperParams;
        // Add loading indicator
        const loadingId = `scraper-loading-${Date.now()}`;
        setMessages(prev => [...prev, {
          id: loadingId,
          role: 'assistant',
          text: `🔄 Scanner AI sedang mencari prospek ${industry} di ${location}... Harap tunggu sebentar.`,
          time: now(),
        }]);

        try {
          const scraperRes = await fetch('/api/scraper', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ industry, location, keyword, limit }),
          });
          const scraperData = await scraperRes.json();

          // Remove loading indicator
          setMessages(prev => prev.filter(m => m.id !== loadingId));

          if (scraperData.success && scraperData.leads.length > 0) {
            const leadsText = scraperData.leads.map((l: ScraperLead, i: number) =>
              `**${i + 1}. ${l.companyName}**\n` +
              `   📧 ${l.email}\n` +
              `   🎯 AI Score: ${l.aiScore}%\n` +
              `   🔗 ${l.url}\n` +
              `   📝 ${l.description.substring(0, 120)}...`
            ).join('\n\n');

            setMessages(prev => [...prev, {
              id: `scraper-result-${Date.now()}`,
              role: 'assistant',
              text: `✅ **Ditemukan ${scraperData.count} prospek klien ${industry} di ${location}!**\n\n${leadsText}\n\n💡 Prospek telah siap disimpan ke CRM. Ketik "simpan ke CRM" untuk menyimpannya.`,
              result: { ...data, action: 'scraper_done', data: { count: String(scraperData.count), industry, location } },
              time: now(),
            }]);
            addToast(`${scraperData.count} prospek klien ditemukan!`, 'success');
          } else {
            setMessages(prev => prev.filter(m => m.id !== loadingId));
            setMessages(prev => [...prev, {
              id: `scraper-fail-${Date.now()}`,
              role: 'assistant',
              text: scraperData.error
                ? `⚠️ Scanner menemui kendala: ${scraperData.error}\n\nCoba lagi atau ubah parameter pencarian.`
                : '😔 Tidak ada prospek yang ditemukan untuk parameter ini. Coba ubah industri atau lokasi.',
              time: now(),
            }]);
          }
        } catch {
          setMessages(prev => prev.filter(m => m.id !== loadingId));
          addToast('Gagal menghubungi scraper engine', 'error');
        }
      }

      // ─── Handle Redirect Intents ───────────────────────
      if (data.action === 'rekap_keuangan') {
        addToast('Membuka Finance Monitor...', 'info');
        setTimeout(() => window.open('/finance', '_blank'), 1000);
      }
      if (data.action === 'cek_absensi') {
        addToast('Membuka Attendance Monitor...', 'info');
        setTimeout(() => window.open('/attendance', '_blank'), 1000);
      }
      if (data.action === 'audit') {
        addToast('Membuka Reports Center...', 'info');
        setTimeout(() => window.open('/reports', '_blank'), 1000);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id:   `err-${Date.now()}`,
        role: 'assistant',
        text: 'Maaf, terjadi kesalahan. Coba lagi ya!',
        time: now(),
      }]);
      addToast('Terjadi kesalahan saat memproses perintah', 'error');
    } finally {
      setLoading(false);
      setFile(null);
      setFilePreview(null);
    }
  };

  const generateSampleReceipt = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 620;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background paper color
    ctx.fillStyle = '#faf6eb';
    ctx.fillRect(0, 0, 400, 620);

    // Draw receipt border
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 380, 600);

    // Header
    ctx.fillStyle = '#18181b';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TOKO MAJU SEJAHTERA', 200, 45);
    
    ctx.font = '11px monospace';
    ctx.fillText('Jl. Jenderal Sudirman No. 12, Jakarta', 200, 65);
    ctx.fillText('Telp: (021) 555-9876', 200, 80);
    ctx.fillText('======================================', 200, 100);

    // Metadata
    ctx.textAlign = 'left';
    ctx.fillText('No. Nota : INV/20260701/9921', 30, 120);
    ctx.fillText('Tanggal  : 01-Jul-2026 09:15', 30, 138);
    ctx.fillText('Kasir    : Adi Wijaya', 30, 156);
    ctx.fillText('======================================', 30, 176);

    // Items list
    const items = [
      { name: 'Minyak Goreng Bimoli 2L', qty: '1 x 38.500', price: '38.500' },
      { name: 'Beras Pandan Wangi 5kg', qty: '1 x 72.000', price: '72.000' },
      { name: 'Gula Pasir Gulaku 1kg', qty: '2 x 16.500', price: '33.000' },
      { name: 'Teh Celup Sariwangi 25s', qty: '1 x 7.500', price: '7.500' },
      { name: 'Kopi Kapal Api 165g', qty: '1 x 14.500', price: '14.500' }
    ];

    let y = 200;
    items.forEach(item => {
      ctx.font = 'bold 11px monospace';
      ctx.fillText(item.name, 30, y);
      y += 18;
      ctx.font = '11px monospace';
      ctx.fillText(item.qty, 45, y);
      ctx.textAlign = 'right';
      ctx.fillText(item.price, 370, y);
      ctx.textAlign = 'left';
      y += 20;
    });

    ctx.fillText('======================================', 30, y);
    y += 20;

    // Totals
    ctx.fillText('SUBTOTAL', 30, y);
    ctx.textAlign = 'right';
    ctx.fillText('165.500', 370, y);
    ctx.textAlign = 'left';
    y += 18;

    ctx.fillText('PPN (11%)', 30, y);
    ctx.textAlign = 'right';
    ctx.fillText('18.205', 370, y);
    ctx.textAlign = 'left';
    y += 20;

    ctx.font = 'bold 13px monospace';
    ctx.fillText('TOTAL AKHIR (IDR)', 30, y);
    ctx.textAlign = 'right';
    ctx.fillText('183.705', 370, y);
    ctx.textAlign = 'left';
    y += 30;

    // Footer
    ctx.font = 'italic 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Terima Kasih Atas Kunjungan Anda', 200, y);
    ctx.fillText('Barang yang sudah dibeli tidak dapat', 200, y + 16);
    ctx.fillText('ditukar atau dikembalikan.', 200, y + 28);

    // Simple Barcode Simulation
    ctx.fillStyle = '#000';
    const startX = 130;
    const barcodeY = y + 45;
    const barcodeHeight = 20;
    const barWidths = [2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3, 2, 1, 4, 2];
    let currentX = startX;
    barWidths.forEach((w, idx) => {
      if (idx % 2 === 0) {
        ctx.fillRect(currentX, barcodeY, w, barcodeHeight);
      }
      currentX += w + 1;
    });

    // Convert canvas to File object
    const dataUrl = canvas.toDataURL('image/png');
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] ?? 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const sampleFile = new File([u8arr], 'contoh_struk_belanja.png', { type: mime });
    
    setFile(sampleFile);
    setFilePreview(dataUrl);
    addToast('Struk belanja contoh berhasil dimuat! Ketik instruksi dan kirim.', 'success');
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDownload = (csv: string, filename: string) => {
    // Add BOM for proper Excel UTF-8 encoding
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    addToast('File CSV berhasil didownload! Buka dengan Excel/Sheets.', 'success');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Data disalin ke clipboard!', 'success');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  return (
    <div className="h-screen flex flex-col relative"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}>

      <Header
        title="Command Center"
        subtitle="Ketik perintah — Ava (AI) yang eksekusi"
      />
      <ToastContainer toasts={toasts} />

      {/* Quick Actions */}
      <div className="px-6 py-3 border-b flex items-center gap-3 overflow-x-auto border-light bg-card">
        <span className="text-xs font-semibold flex-shrink-0 text-secondary">Aksi Cepat:</span>
        {QUICK_ACTIONS.map(({ icon: Icon, label, colorClass, bgClass, prompt }) => (
          <button key={label}
            onClick={() => handleQuickAction(prompt)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all ${colorClass} ${bgClass}`}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            <Icon size={12} />
            {label}
          </button>
        ))}
        <div className="ml-auto flex-shrink-0 flex items-center gap-1.5">
          <Zap size={11} className="text-primary" />
          <span className="text-xs font-semibold text-primary">Powered by Gemini 2.0 Flash</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            onCopy={handleCopy}
            onDownload={handleDownload}
          />
        ))}
        {loading && <TypingIndicator />}
        <div ref={chatEndRef} />
      </div>

      {/* File Preview Strip */}
      {file && (
        <div className="px-6 py-2 border-t flex items-center gap-3 border-light bg-card">
          {filePreview
            ? <img src={filePreview} alt="preview" className="h-10 w-10 object-cover rounded-lg border border-light" />
            : <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-elevated border border-light">
                <FileText size={16} className="text-primary" />
              </div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-primary">{file.name}</p>
            <p className="text-xs text-secondary">{(file.size / 1024).toFixed(1)} KB · Siap diproses</p>
          </div>
          <button onClick={() => { setFile(null); setFilePreview(null); }}
            className="text-secondary hover:text-primary">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-light bg-card">
        <div data-tour="command-chat" className="flex items-end gap-3 rounded-2xl px-4 py-3 bg-elevated border border-light">

          {/* File attach */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              file ? 'bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30' : 'text-secondary hover:bg-hover border border-transparent'
            }`}
            title="Upload dokumen (invoice, bon, foto, PDF)">
            <Paperclip size={16} />
          </button>
          
          {/* Sample Loader */}
          {!file && (
            <button
              onClick={generateSampleReceipt}
              className="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all"
              title="Gunakan contoh struk belanja untuk pengujian">
              ✨ Contoh Struk
            </button>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.xlsx,.xls,.csv"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none resize-none text-primary placeholder-muted"
            style={{
              maxHeight: '120px',
              lineHeight: '1.5',
            }}
            placeholder='Ketik perintah… contoh: "Input invoice ini ke rekap Juni" atau "Buat pengajuan cuti Budi 3 hari"'
            value={input}
            onChange={e => {
               setInput(e.target.value);
               // Auto-resize
               e.target.style.height = 'auto';
               e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={loading || (!input.trim() && !file)}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
              (loading || (!input.trim() && !file))
                ? 'bg-elevated border-light text-muted cursor-not-allowed'
                : 'bg-primary border-primary text-white hover:opacity-90 shadow-sm'
            }`}>
            {loading
              ? <Loader2 size={16} className="animate-spin text-primary" />
              : <Send size={15} />
            }
          </button>
        </div>
        <p className="text-center text-xs mt-2 text-muted">
          Enter untuk kirim · Shift+Enter untuk baris baru · 📎 untuk upload dokumen
        </p>
      </div>
    </div>
  );
}
