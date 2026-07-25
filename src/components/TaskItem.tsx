import { Task, TaskStatus, TaskType, Priority } from '@/lib/types';
import { FileText, Mail, RefreshCw, BarChart3, Clipboard, Search, AlertCircle, Clock, CheckCircle2, Loader2, XCircle } from 'lucide-react';

const typeConfig: Record<TaskType, { label: string; icon: typeof FileText; color: string }> = {
  invoice_ocr: { label: 'Invoice OCR', icon: FileText, color: 'text-indigo-600 dark:text-blue-400' },
  email_parse: { label: 'Email Parse', icon: Mail, color: 'text-violet-600 dark:text-violet-400' },
  reconciliation: { label: 'Rekonsiliasi', icon: RefreshCw, color: 'text-amber-600 dark:text-amber-400' },
  report_gen: { label: 'Buat Laporan', icon: BarChart3, color: 'text-emerald-600 dark:text-emerald-400' },
  data_entry: { label: 'Input Data', icon: Clipboard, color: 'text-cyan-600 dark:text-cyan-400' },
  form_fill: { label: 'Isi Form', icon: Search, color: 'text-pink-600 dark:text-pink-400' },
};

const statusConfig: Record<TaskStatus, { label: string; icon: typeof Clock; bg: string; text: string }> = {
  pending: { label: 'Antri', icon: Clock, bg: 'bg-slate-100 dark:bg-zinc-800', text: 'text-slate-500 dark:text-zinc-400' },
  processing: { label: 'Berjalan', icon: Loader2, bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400' },
  completed: { label: 'Selesai', icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' },
  failed: { label: 'Gagal', icon: XCircle, bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-600 dark:text-red-400' },
  waiting_approval: { label: 'Perlu Review', icon: AlertCircle, bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400' },
};

const priorityBadge: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
  critical: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
};

export default function TaskItem({ task }: { task: Task }) {
  const type = typeConfig[task.type];
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  const TypeIcon = type.icon;

  return (
    <div className="group bg-card border border-light rounded-xl p-4 hover:bg-hover transition-all duration-150">
      <div className="flex items-start gap-4">
        {/* Type Icon */}
        <div className="w-9 h-9 rounded-xl bg-elevated border border-light flex items-center justify-center flex-shrink-0 mt-0.5">
          <TypeIcon size={16} className={type.color} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-primary text-sm font-semibold truncate">{task.title}</p>
              <p className="text-secondary text-xs mt-0.5">
                {task.agentName} · {task.startedAt}
                {task.duration && ` · ${Math.floor(task.duration / 60)}m ${task.duration % 60}s`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${priorityBadge[task.priority]}`}>
                {task.priority}
              </span>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
                <StatusIcon
                  size={11}
                  className={`${status.text} ${task.status === 'processing' ? 'animate-spin' : ''}`}
                />
                <span className={`text-xs font-semibold ${status.text}`}>{status.label}</span>
              </div>
            </div>
          </div>

          {/* Source → Destination */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-secondary bg-elevated rounded-lg px-2 py-1 truncate max-w-[180px]">
              {task.source}
            </span>
            <span className="text-muted text-xs">→</span>
            <span className="text-xs text-secondary bg-elevated rounded-lg px-2 py-1 truncate max-w-[180px]">
              {task.destination}
            </span>
          </div>

          {/* Confidence Bar */}
          {task.confidence !== undefined && task.status !== 'pending' && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-secondary">Confidence</span>
              <div className="flex-1 h-1.5 bg-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    task.confidence >= 90 ? 'bg-emerald-500' :
                    task.confidence >= 70 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${task.confidence}%` }}
                />
              </div>
              <span className={`text-xs font-semibold ${
                task.confidence >= 90 ? 'text-emerald-500' :
                task.confidence >= 70 ? 'text-amber-500' : 'text-red-500'
              }`}>
                {task.confidence}%
              </span>
            </div>
          )}

          {/* Error Message */}
          {task.errorMessage && (
            <div className="mt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/10 rounded-lg px-2.5 py-1.5">
              <AlertCircle size={12} />
              <span>{task.errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
