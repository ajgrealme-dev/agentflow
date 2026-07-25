'use client';

import { useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import {
  Upload, FileText, Loader2, CheckCircle2, AlertCircle,
  Zap, Copy, RotateCcw, Download
} from 'lucide-react';
import { ToastContainer, useToast } from '@/components/Toast';

interface OCRResult {
  documentType: string;
  confidence: number;
  extractedData: Record<string, string>;
  summary: string;
  issues: string[];
}

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
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: dragging ? 'var(--primary-glow)' : 'var(--bg-elevated)' }}>
        <Upload size={28} style={{ color: dragging ? 'var(--primary)' : 'var(--text-secondary)' }} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-primary">
          {dragging ? 'Lepas file di sini!' : 'Drop dokumen atau klik untuk pilih'}
        </p>
        <p className="text-sm mt-1 text-secondary">
          Mendukung: JPG, PNG, WebP, PDF (max 10MB)
        </p>
        <p className="text-xs mt-2 font-medium" style={{ color: '#2dd4bf' }}>
          Dianalisis oleh Google Gemini 2.0 Flash Vision ✨
        </p>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: OCRResult }) {
  const { addToast } = useToast();
  const confColor = result.confidence >= 80 ? '#22c55e' : result.confidence >= 60 ? '#f59e0b' : '#ef4444';

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    addToast('JSON disalin ke clipboard!', 'success');
  };

  return (
    <div className="card fade-up bg-card">
      {/* Result Header */}
      <div className="flex items-center justify-between p-5 border-b border-light">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-glow">
            <FileText size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-primary">{result.documentType}</p>
            <p className="text-xs text-secondary">Diekstrak oleh Gemini Vision AI</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-extrabold" style={{ color: confColor }}>{result.confidence}%</div>
            <div className="text-xs" style={{ color: '#52525b' }}>Confidence</div>
          </div>
          <div className="w-1.5 h-12 rounded-full" style={{ background: '#1c1c1f' }}>
            <div className="w-full rounded-full" style={{
              height: `${result.confidence}%`,
              background: confColor,
              marginTop: `${100 - result.confidence}%`,
              transition: 'all 0.5s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mx-5 my-4 p-3 rounded-xl" style={{ background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.15)' }}>
        <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
          <span className="font-semibold" style={{ color: '#2dd4bf' }}>Ringkasan: </span>
          {result.summary}
        </p>
      </div>

      {/* Issues */}
      {result.issues && result.issues.length > 0 && (
        <div className="mx-5 mb-4 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertCircle size={13} style={{ color: '#f59e0b' }} />
            <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Perlu Verifikasi Manual</span>
          </div>
          {result.issues.map((issue, i) => (
            <p key={i} className="text-xs" style={{ color: '#d97706' }}>• {issue}</p>
          ))}
        </div>
      )}

      {/* Extracted Data */}
      <div className="px-5 pb-5">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-secondary">
          Data Terekstrak ({Object.keys(result.extractedData).length} field)
        </p>
        <div className="rounded-xl overflow-hidden border border-light">
          {Object.entries(result.extractedData).map(([k, v], i, arr) => (
            <div key={k}
              className="flex items-start justify-between gap-4 px-4 py-3 hover:bg-hover transition-colors"
              style={{
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'var(--bg-elevated)',
              }}>
              <span className="text-sm flex-shrink-0 text-secondary" style={{ minWidth: 140 }}>{k}</span>
              <span className="text-sm font-semibold text-right text-primary">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 p-4 border-t border-light">
        <button onClick={copyJSON}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer bg-elevated text-secondary border border-light hover:bg-hover">
          <Copy size={13} /> Copy JSON
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
          onClick={() => addToast('Export ke Google Sheets belum tersedia di fase ini', 'info')}>
          <Download size={13} /> Export ke Sheets
        </button>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const { toasts, addToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const start = Date.now();

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const [header, base64Image] = dataUrl.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';

        try {
          const res = await fetch('/api/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Image, mimeType }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? 'Unknown error');
          setResult(data);
          setElapsed(Date.now() - start);
          addToast(`Analisis selesai dalam ${((Date.now() - start) / 1000).toFixed(1)}s`, 'success');
        } catch (err: unknown) {
          setError(String(err));
          addToast('Analisis gagal. Cek console untuk detail.', 'error');
        } finally {
          setLoading(false);
        }
      };
    } catch (err: unknown) {
      setError(String(err));
      setLoading(false);
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
    setPreview(dataUrl);
    setResult(null);
    setError(null);
    setElapsed(null);
    addToast('File struk belanja contoh berhasil digenerate!', 'success');
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setElapsed(null);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Header title="Document Scanner" subtitle="Upload dokumen kantor — AI langsung baca dan ekstrak datanya" />
      <ToastContainer toasts={toasts} />

      <div className="p-6 space-y-6 fade-up max-w-5xl">
        {/* Info Banner */}
        <div className="rounded-2xl p-4 flex items-start gap-4"
          style={{ background: 'linear-gradient(135deg, rgba(45,212,191,0.08), rgba(56,189,248,0.08))', border: '1px solid rgba(45,212,191,0.2)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-glow">
            <Zap size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-primary">Demo Langsung — Fase 2 AgentFlow</p>
            <p className="text-sm mt-0.5 leading-relaxed" style={{ color: '#71717a' }}>
              Upload foto invoice, bon, PO, laporan keuangan, atau dokumen kantor apapun.
              <strong style={{ color: '#2dd4bf' }}> Google Gemini 2.0 Flash</strong> akan membacanya dan mengekstrak
              semua data penting secara otomatis — ini yang nanti akan diinput ke Google Sheets atau ERP secara otomatis!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Upload + Preview */}
          <div className="space-y-4">
            {!file ? (
              <div className="space-y-4">
                <DropZone onFile={handleFile} />
                <div className="flex justify-center">
                  <button
                    onClick={generateSampleReceipt}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border border-violet-800 bg-violet-950/20 text-violet-400 hover:bg-violet-900/30"
                  >
                    ✨ Klik di sini untuk memuat Struk Belanja Contoh (Bahan Tes)
                  </button>
                </div>
              </div>
            ) : (
              <div className="card p-4 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    <span className="text-sm font-medium text-primary">{file.name}</span>
                  </div>
                  <button onClick={reset} className="text-secondary hover:text-primary cursor-pointer animate-pulse" title="Ganti file">
                    <RotateCcw size={14} />
                  </button>
                </div>
                <p className="text-xs mb-3 text-secondary">
                  {(file.size / 1024).toFixed(1)} KB · {file.type}
                </p>
                {preview && (
                  <img src={preview} alt="preview"
                    className="w-full rounded-xl object-contain max-h-72 border border-light"
                    style={{ background: 'var(--bg-elevated)' }} />
                )}
                {!preview && (
                  <div className="rounded-xl flex items-center justify-center h-24 bg-elevated">
                    <span className="text-sm text-secondary">PDF — preview tidak tersedia</span>
                  </div>
                )}
              </div>
            )}

            {/* Analyze Button */}
            {file && !loading && !result && (
              <button onClick={handleAnalyze} className="btn-primary w-full justify-center py-3"
                style={{ background: 'linear-gradient(135deg, #2dd4bf, #0ea5e9)', fontSize: '1rem' }}>
                <Zap size={18} /> Analisis dengan Gemini AI
              </button>
            )}

            {/* Loading */}
            {loading && (
              <div className="card p-6 flex flex-col items-center gap-4 bg-card">
                <div className="relative">
                  <Loader2 size={40} className="animate-spin text-primary" />
                  <div className="absolute inset-0 rounded-full animate-pulse bg-primary-glow" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-primary">Gemini sedang membaca dokumen…</p>
                  <p className="text-sm mt-1 text-secondary">Biasanya 2–5 detik</p>
                </div>
                <div className="w-full rounded-full h-1 bg-elevated">
                  <div className="h-full rounded-full" style={{
                    width: '60%',
                    background: 'linear-gradient(90deg, var(--primary), #0ea5e9)',
                    animation: 'shimmer 1.5s linear infinite',
                    backgroundSize: '200% auto',
                  }} />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="card p-4 flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#ef4444' }}>Analisis gagal</p>
                  <p className="text-xs mt-1" style={{ color: '#71717a' }}>{error}</p>
                </div>
              </div>
            )}

            {/* Success meta */}
            {result && elapsed && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#52525b' }}>
                <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
                <span>Selesai dalam <strong style={{ color: '#22c55e' }}>{(elapsed / 1000).toFixed(1)} detik</strong></span>
              </div>
            )}
          </div>

          {/* Right: Result */}
          <div>
            {!result && !loading && (
              <div className="card flex flex-col items-center justify-center gap-4 h-full min-h-64 bg-card">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-elevated">
                  <FileText size={24} className="text-muted" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-secondary">Hasil ekstraksi muncul di sini</p>
                  <p className="text-sm mt-1 text-muted">Upload dan analisis dokumen dulu</p>
                </div>
              </div>
            )}
            {result && <ResultCard result={result} />}
          </div>
        </div>

        {/* Example documents hint */}
        <div className="card p-5 bg-card">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-secondary">
            💡 Coba dengan dokumen ini
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['📄 Invoice/Faktur', '🧾 Bon/Kwitansi', '📋 Purchase Order', '📊 Laporan Keuangan'].map(d => (
              <div key={d} className="text-sm px-3 py-2 rounded-xl text-center bg-elevated text-secondary">
                {d}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
