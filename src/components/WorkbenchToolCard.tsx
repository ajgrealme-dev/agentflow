'use client';

import { useRouter } from 'next/navigation';
import type { WorkbenchTool, WorkbenchToolStatus } from '@/lib/types';

interface WorkbenchToolCardProps {
  tool: WorkbenchTool;
  accentColor: string;
  accentGlow: string;
  gradient: string;
  index?: number;
}

const STATUS_LABELS: Record<WorkbenchToolStatus, string> = {
  available: 'Tersedia',
  beta: 'Beta',
  soon: 'Segera',
};

const STATUS_STYLES: Record<WorkbenchToolStatus, React.CSSProperties> = {
  available: {
    background: 'rgba(16, 185, 129, 0.12)',
    color: '#10b981',
    border: '1px solid rgba(16, 185, 129, 0.25)',
  },
  beta: {
    background: 'rgba(245, 158, 11, 0.12)',
    color: '#f59e0b',
    border: '1px solid rgba(245, 158, 11, 0.25)',
  },
  soon: {
    background: 'rgba(100, 116, 139, 0.12)',
    color: '#64748b',
    border: '1px solid rgba(100, 116, 139, 0.2)',
  },
};

export default function WorkbenchToolCard({
  tool,
  accentColor,
  accentGlow,
  gradient,
  index = 0,
}: WorkbenchToolCardProps) {
  const router = useRouter();
  const isDisabled = tool.status === 'soon';

  const handleClick = () => {
    if (isDisabled) return;
    if (tool.href) {
      router.push(tool.href);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="fade-up group relative flex flex-col gap-3 rounded-2xl p-5 transition-all duration-300"
      style={{
        animationDelay: `${index * 0.06}s`,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        cursor: isDisabled ? 'default' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (isDisabled) return;
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-4px)';
        el.style.boxShadow = `0 12px 40px -8px ${accentGlow}, 0 0 0 1px ${accentColor}33`;
        el.style.borderColor = `${accentColor}55`;
      }}
      onMouseLeave={(e) => {
        if (isDisabled) return;
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
        el.style.borderColor = 'var(--border)';
      }}
      title={isDisabled ? 'Fitur ini akan segera tersedia' : tool.title}
    >
      {/* Top row: icon + status badge */}
      <div className="flex items-start justify-between">
        {/* Icon container */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ background: gradient, boxShadow: `0 4px 16px -4px ${accentGlow}` }}
        >
          {tool.icon}
        </div>

        {/* Status badge */}
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
          style={STATUS_STYLES[tool.status]}
        >
          {STATUS_LABELS[tool.status]}
        </span>
      </div>

      {/* Text content */}
      <div className="flex flex-col gap-1">
        <h3
          className="text-sm font-bold leading-tight transition-colors duration-200"
          style={{ color: 'var(--text-primary)' }}
        >
          {tool.title}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {tool.description}
        </p>
      </div>

      {/* Category tag */}
      <div className="flex items-center gap-1.5 mt-auto pt-1">
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: accentColor }}
        />
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
          {tool.category}
        </span>

        {/* Arrow indicator */}
        {!isDisabled && (
          <span
            className="ml-auto text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-0 group-hover:translate-x-0.5"
            style={{ color: accentColor }}
          >
            →
          </span>
        )}
      </div>
    </div>
  );
}
