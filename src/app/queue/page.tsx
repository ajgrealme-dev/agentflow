'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { mockApprovalItems } from '@/lib/mock-data';
import { ApprovalItem } from '@/lib/types';
import { AlertCircle, CheckCircle2, XCircle, Edit3, FileText, Bot, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { ToastContainer, useToast } from '@/components/Toast';

export default function QueuePage() {
  const { toasts, addToast } = useToast();
  const [items, setItems] = useState(mockApprovalItems);
  const [expanded, setExpanded] = useState<string | null>(items[0]?.id ?? null);
  const [approved, setApproved] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);

  const approvedCount = 18 + approved.length;
  const rejectedCount = 2 + rejected.length;
  const pending = items.filter(i => !approved.includes(i.id) && !rejected.includes(i.id));

  const handleApprove = (item: ApprovalItem) => {
    setApproved(p => [...p, item.id]);
    addToast(`✅ Disetujui: ${item.documentName}`, 'success');
  };
  const handleReject = (item: ApprovalItem) => {
    setRejected(p => [...p, item.id]);
    addToast(`❌ Ditolak: ${item.documentName}`, 'error');
  };

  return (
    <div className="min-h-screen relative">
      <Header title="Approval Queue" subtitle="Dokumen yang perlu review & persetujuan manual" />
      <ToastContainer toasts={toasts} />

      <div className="p-6 space-y-5 fade-up">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Menunggu Review', value: pending.length, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30' },
            { label: 'Disetujui Hari Ini', value: approvedCount, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30' },
            { label: 'Ditolak Hari Ini',   value: rejectedCount, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30' },
          ].map(s => (
            <div key={s.label} className={`border rounded-2xl p-5 ${s.bg}`}>
              <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-sm mt-1 text-secondary">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Queue Items */}
        {pending.length === 0 && (
          <div className="text-center py-16">
            <CheckCircle2 size={48} className="mx-auto mb-3 text-emerald-500 opacity-60" />
            <p className="font-semibold text-primary">Queue kosong!</p>
            <p className="text-sm mt-1 text-secondary">Semua dokumen sudah diproses.</p>
          </div>
        )}

        {pending.map(item => {
          const isOpen = expanded === item.id;
          const confColor = item.confidence >= 80 ? 'text-emerald-600 dark:text-emerald-400' : item.confidence >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
          const confFillBg = item.confidence >= 80 ? '#16a34a' : item.confidence >= 60 ? '#d97706' : '#dc2626';
          
          const priorityStyle: Record<string, string> = {
            critical: 'bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/10 text-red-600 dark:text-red-400',
            high:     'bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/10 text-orange-600 dark:text-orange-400',
            medium:   'bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/10 text-amber-600 dark:text-amber-400',
            low:      'bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-400',
          };
          const psClass = priorityStyle[item.priority] ?? priorityStyle.medium;

          return (
            <div key={item.id} className="bg-card border border-light overflow-hidden rounded-2xl shadow-sm fade-up">
              {/* Header row */}
              <button
                className="w-full flex items-start justify-between p-5 text-left transition-colors hover:bg-hover"
                onClick={() => setExpanded(isOpen ? null : item.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-elevated border border-light">
                    <FileText size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-primary">{item.documentName}</p>
                    <p className="text-xs text-secondary">{item.documentType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${psClass}`}>{item.priority}</span>
                  <span className={`text-xs font-bold ${confColor}`}>{item.confidence}%</span>
                  {isOpen ? <ChevronUp size={16} className="text-secondary" /> : <ChevronDown size={16} className="text-secondary" />}
                </div>
              </button>

              {/* Reason */}
              <div className="mx-5 mb-3 flex items-start gap-2 rounded-xl px-3 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/10">
                <AlertCircle size={13} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-amber-600 dark:text-amber-400">{item.reason}</p>
              </div>

              {/* Meta */}
              <div className="mx-5 mb-3 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-secondary">
                  <Bot size={11} /> {item.agentName}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-secondary">
                  <Clock size={11} /> {item.submittedAt}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-secondary">Confidence:</span>
                  <div className="flex-1 h-1.5 w-24 bg-elevated rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.confidence}%`, background: confFillBg }} />
                  </div>
                  <span className={`text-xs font-bold ${confColor}`}>{item.confidence}%</span>
                </div>
              </div>

              {/* Expandable detail */}
              {isOpen && (
                <div className="border-t border-light mx-0">
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-light">
                    {/* Extracted data */}
                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-secondary">
                        Data yang Diekstrak AI
                      </p>
                      <div className="space-y-2">
                        {Object.entries(item.extractedData).map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-3">
                            <span className="text-xs text-secondary">{k}</span>
                            <span className="text-xs font-semibold text-right text-primary">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Raw text */}
                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-secondary">
                        Teks Asli Dokumen
                      </p>
                      <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono rounded-xl p-3 overflow-auto max-h-40 bg-elevated border border-light text-secondary">
                        {item.rawText}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 p-4 border-t border-light">
                <button onClick={() => handleApprove(item)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-sm">
                  <CheckCircle2 size={15} /> Setujui & Input
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all bg-card hover:bg-hover border border-light text-primary"
                  onClick={() => addToast('Mode edit belum tersedia di versi demo', 'info')}>
                  <Edit3 size={15} /> Edit & Setujui
                </button>
                <button onClick={() => handleReject(item)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/10">
                  <XCircle size={15} /> Tolak
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
