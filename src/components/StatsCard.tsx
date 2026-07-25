import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color?: 'violet' | 'emerald' | 'amber' | 'blue' | 'red';
  pulse?: boolean;
}

const colorMap = {
  violet: {
    bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
    border: 'border-indigo-100 dark:border-indigo-900/30',
    icon: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    value: 'text-indigo-600 dark:text-indigo-400',
  },
  emerald: {
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    value: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    border: 'border-amber-100 dark:border-amber-900/30',
    icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
  },
  blue: {
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
    border: 'border-blue-100 dark:border-blue-900/30',
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    value: 'text-blue-600 dark:text-blue-400',
  },
  red: {
    bg: 'bg-red-50/50 dark:bg-red-950/20',
    border: 'border-red-100 dark:border-red-900/30',
    icon: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
  },
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'violet',
  pulse = false,
}: StatsCardProps) {
  const c = colorMap[color];

  return (
    <div className={`relative overflow-hidden rounded-2xl glass-premium hover-glow float-interactive p-5 ${c.bg}`}>
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} />
        </div>
        {pulse && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-stats font-medium">LIVE</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className={`text-3xl font-stats font-extrabold tracking-tight ${c.value}`}>
          {value}
        </div>
        <div className="text-primary font-heading font-semibold text-sm mt-1">{title}</div>
        {subtitle && (
          <div className="text-secondary text-xs mt-0.5">{subtitle}</div>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-stats font-semibold ${trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            <span>{trend.positive ? '↑' : '↓'}</span>
            <span>{trend.value} vs kemarin</span>
          </div>
        )}
      </div>

      {/* Decorative glow */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 ${c.icon} blur-xl`} />
    </div>
  );
}
