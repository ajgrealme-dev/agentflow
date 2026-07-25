import { Agent, AgentStatus } from '@/lib/types';
import { Activity, AlertCircle, Pause, CheckCircle } from 'lucide-react';

const statusConfig: Record<AgentStatus, { label: string; dot: string; textClass: string; bgClass: string }> = {
  running: { label: 'Berjalan', dot: 'bg-emerald-500 animate-pulse', textClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' },
  idle: { label: 'Standby', dot: 'bg-gray-500', textClass: 'text-slate-500 dark:text-zinc-400', bgClass: 'bg-slate-50 dark:bg-zinc-800/40 border-slate-100 dark:border-zinc-800' },
  error: { label: 'Error', dot: 'bg-red-500 animate-pulse', textClass: 'text-red-600 dark:text-red-400', bgClass: 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30' },
  paused: { label: 'Dijeda', dot: 'bg-amber-500', textClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30' },
};

export default function AgentCard({ agent, onClick }: { agent: Agent; onClick?: () => void }) {
  const s = statusConfig[agent.status];

  return (
    <div 
      onClick={onClick}
      className="glass-premium hover-glow float-interactive rounded-2xl p-5 shadow-sm cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{agent.icon}</div>
          <div>
            <p className="text-primary font-heading font-bold text-sm">{agent.name}</p>
            <p className="text-secondary text-xs">{agent.type}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${s.bgClass} ${s.textClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          <span>{s.label}</span>
        </div>
      </div>

      {/* Current Task */}
      {agent.currentTask ? (
        <div className="glass rounded-xl p-3 mb-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity size={11} className="text-indigo-600 dark:text-violet-400" />
            <span className="text-xs text-indigo-600 dark:text-violet-400 font-bold">Task Sekarang</span>
          </div>
          <p className="text-primary text-xs leading-relaxed">{agent.currentTask}</p>
        </div>
      ) : (
        <div className="glass rounded-xl p-3 mb-4 flex items-center gap-2">
          {agent.status === 'error' ? (
            <AlertCircle size={12} className="text-red-500" />
          ) : (
            <Pause size={12} className="text-secondary" />
          )}
          <p className="text-secondary text-xs">
            {agent.status === 'error' ? 'Agent mengalami error' : 'Menunggu task baru'}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-primary font-stats font-bold text-sm">{agent.tasksToday}</div>
          <div className="text-secondary text-xs">Hari ini</div>
        </div>
        <div className="text-center border-x border-black/5 dark:border-white/5">
          <div className="text-primary font-stats font-bold text-sm">{agent.uptime}</div>
          <div className="text-secondary text-xs">Uptime</div>
        </div>
        <div className="text-center">
          <div className={`font-stats font-bold text-sm ${agent.errorRate > 3 ? 'text-red-500' : 'text-primary'}`}>
            {agent.errorRate}%
          </div>
          <div className="text-secondary text-xs">Error</div>
        </div>
      </div>

      {/* Last Activity */}
      <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex items-center gap-1.5">
        <CheckCircle size={11} className="text-muted" />
        <span className="text-xs text-secondary font-stats">Aktif {agent.lastActivity}</span>
        <span className="ml-auto text-xs text-muted font-stats font-medium">{agent.tasksCompleted.toLocaleString('id-ID')} total</span>
      </div>
    </div>
  );
}
