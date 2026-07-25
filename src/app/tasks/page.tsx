'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { mockTasks } from '@/lib/mock-data';
import { TaskStatus } from '@/lib/types';
import { useTheme } from '@/components/ThemeProvider';
import {
  CheckCircle2, Loader2, Clock, AlertCircle, XCircle,
  FileText, Mail, RefreshCw, BarChart3, Clipboard, Search,
} from 'lucide-react';

type Tab = TaskStatus | 'all';

const tabs: { key: Tab; label: string }[] = [
  { key: 'all',              label: 'Semua' },
  { key: 'processing',       label: 'Berjalan' },
  { key: 'waiting_approval', label: 'Perlu Review' },
  { key: 'completed',        label: 'Selesai' },
  { key: 'failed',           label: 'Gagal' },
  { key: 'pending',          label: 'Antri' },
];

const statusStyle: Record<TaskStatus, { bgClass: string; textClass: string; label: string }> = {
  pending:          { bgClass: 'bg-slate-100 dark:bg-zinc-800', textClass: 'text-slate-500 dark:text-zinc-400', label: 'Antri' },
  processing:       { bgClass: 'bg-blue-50 dark:bg-blue-950/40', textClass: 'text-blue-600 dark:text-blue-400', label: 'Berjalan' },
  completed:        { bgClass: 'bg-emerald-50 dark:bg-emerald-950/40', textClass: 'text-emerald-600 dark:text-emerald-400', label: 'Selesai' },
  failed:           { bgClass: 'bg-red-50 dark:bg-red-950/40', textClass: 'text-red-600 dark:text-red-400', label: 'Gagal' },
  waiting_approval: { bgClass: 'bg-amber-50 dark:bg-amber-950/40', textClass: 'text-amber-600 dark:text-amber-400', label: 'Perlu Review' },
};

const typeIcon: Record<string, typeof FileText> = {
  invoice_ocr:    FileText,
  email_parse:    Mail,
  reconciliation: RefreshCw,
  report_gen:     BarChart3,
  data_entry:     Clipboard,
  form_fill:      Search,
};

const typeColor: Record<string, string> = {
  invoice_ocr:    '#38bdf8',
  email_parse:    '#a78bfa',
  reconciliation: '#f59e0b',
  report_gen:     '#22c55e',
  data_entry:     '#2dd4bf',
  form_fill:      '#f472b6',
};

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');

  const filtered = mockTasks.filter(t => {
    const matchTab = activeTab === 'all' || t.status === activeTab;
    const matchSearch = !search
      || t.title.toLowerCase().includes(search.toLowerCase())
      || t.agentName.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const count = (k: Tab) => k === 'all' ? mockTasks.length : mockTasks.filter(t => t.status === k).length;

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const activeBg = 'var(--primary)';
  const activeText = '#ffffff';
  const tabBg = 'var(--bg-elevated)';
  const tabText = 'var(--text-secondary)';
  const tabBorder = 'var(--border)';

  return (
    <div className="min-h-screen relative">
      <Header title="Task Monitor" subtitle="Pantau semua task yang sedang dan sudah dijalankan" />

      <div className="p-6 fade-up">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {tabs.map(({ key, label }) => {
            const active = activeTab === key;
            return (
              <button key={key} onClick={() => setActiveTab(key)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all border"
                style={{
                  background: active ? activeBg : tabBg,
                  color: active ? activeText : 'var(--text-secondary)',
                  borderColor: active ? activeBg : tabBorder,
                }}>
                {label}
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md"
                  style={{ 
                    background: active ? 'rgba(255,255,255,0.2)' : 'var(--bg-card)', 
                    color: active ? activeText : 'var(--text-muted)',
                    border: `1px solid ${active ? 'transparent' : 'var(--border)'}`
                  }}>
                  {count(key)}
                </span>
              </button>
            );
          })}

          {/* Inline search */}
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
            <Search size={13} className="text-secondary" />
            <input
              type="text"
              placeholder="Cari task..."
              className="bg-transparent text-sm outline-none text-primary"
              style={{ width: 160 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Task List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-secondary">
            <CheckCircle2 size={40} className="mx-auto mb-3 opacity-30 text-secondary" />
            <p className="font-medium">Tidak ada task yang cocok</p>
          </div>
        ) : (
          <div className="space-y-2 stagger">
            {filtered.map(task => {
              const ss = statusStyle[task.status];
              const Icon = typeIcon[task.type] ?? FileText;
              const color = typeColor[task.type] ?? '#71717a';
              return (
                <div key={task.id}
                  className="bg-card border border-light rounded-xl p-4 hover:bg-hover transition-all duration-150 shadow-sm cursor-pointer fade-up">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-primary text-sm font-semibold truncate">{task.title}</p>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex-shrink-0 border ${ss.bgClass} ${ss.textClass}`}>
                          {ss.label}
                        </span>
                      </div>
                      <p className="text-secondary text-xs mt-0.5">
                        {task.agentName} · {task.startedAt}
                        {task.duration && ` · ${Math.floor(task.duration / 60)}m ${task.duration % 60}s`}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-md truncate max-w-48 bg-elevated text-secondary border border-light">
                          {task.source}
                        </span>
                        <span className="text-muted text-xs">→</span>
                        <span className="text-xs px-2 py-0.5 rounded-md truncate max-w-48 bg-elevated text-secondary border border-light">
                          {task.destination}
                        </span>
                      </div>

                      {task.confidence !== undefined && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-secondary">Confidence</span>
                          <div className="flex-1 h-1.5 bg-elevated rounded-full overflow-hidden">
                            <div
                              style={{
                                width: `${task.confidence}%`,
                                background: task.confidence >= 90 ? '#16a34a' : task.confidence >= 70 ? '#d97706' : '#dc2626'
                              }}
                              className="h-full rounded-full"
                            />
                          </div>
                          <span className="text-xs font-bold"
                            style={{ color: task.confidence >= 90 ? '#16a34a' : task.confidence >= 70 ? '#d97706' : '#dc2626' }}>
                            {task.confidence}%
                          </span>
                        </div>
                      )}

                      {task.errorMessage && (
                        <div className="flex items-center gap-2 mt-2 px-2.5 py-1.5 rounded-lg text-xs border border-red-200 dark:border-red-900/10"
                          style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--error)' }}>
                          <XCircle size={11} /> {task.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
