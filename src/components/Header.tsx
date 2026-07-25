'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, RefreshCw, X, CheckCircle2, AlertCircle, XCircle, Info } from 'lucide-react';
import { mockNotifications, mockTasks, mockAgents } from '@/lib/mock-data';
import { Notification } from '@/lib/types';

/* ── Notification Panel ───────────────────────────────── */
function NotifPanel({ notifs, setNotifs, onClose }: { notifs: typeof mockNotifications; setNotifs: React.Dispatch<React.SetStateAction<typeof mockNotifications>>; onClose: () => void }) {
  const markAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, read: true })));

  const iconMap: Record<Notification['type'], typeof CheckCircle2> = {
    success: CheckCircle2,
    warning: AlertCircle,
    error: XCircle,
    info: Info,
  };
  const colorMap: Record<Notification['type'], string> = {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#38bdf8',
  };

  return (
    <div className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl z-50 slide-in overflow-hidden border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-premium)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-sm font-bold text-primary">Notifikasi</span>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="text-xs font-semibold text-teal-600 dark:text-teal-400 cursor-pointer hover:underline">
            Tandai semua terbaca
          </button>
          <button onClick={onClose} className="text-secondary hover:text-primary cursor-pointer"><X size={14} /></button>
        </div>
      </div>
      <div>
        {notifs.map((n, idx) => {
          const Icon = iconMap[n.type];
          return (
            <div key={n.id}
              className={`px-4 py-3 flex gap-3 transition-colors cursor-pointer hover:bg-hover ${
                n.read ? 'bg-transparent' : 'bg-primary-glow'
              }`}
              style={{ borderBottom: idx < notifs.length - 1 ? '1px solid var(--border)' : 'none' }}
              onClick={() => setNotifs(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x))}
            >
              <Icon size={15} style={{ color: colorMap[n.type], flexShrink: 0, marginTop: 2 }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-primary truncate">{n.title}</span>
                  <span className="text-[10px] text-muted flex-shrink-0">{n.timestamp}</span>
                </div>
                <p className="text-xs mt-0.5 leading-relaxed text-secondary">{n.message}</p>
              </div>
              {!n.read && (
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--primary)' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Search Panel ─────────────────────────────────────── */
function SearchPanel({ query, onClose }: { query: string; onClose: () => void }) {
  const filtered = [
    ...mockTasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase()) || t.agentName.toLowerCase().includes(query.toLowerCase())).map(t => ({ type: 'task', label: t.title, sub: t.agentName, href: '/tasks' })),
    ...mockAgents.filter(a => a.name.toLowerCase().includes(query.toLowerCase()) || a.type.toLowerCase().includes(query.toLowerCase())).map(a => ({ type: 'agent', label: a.name, sub: a.type, href: '/agents' })),
  ].slice(0, 6);

  if (!query || filtered.length === 0) return null;

  return (
    <div className="absolute left-0 top-12 w-full rounded-xl shadow-2xl z-50 slide-in overflow-hidden"
      style={{ background: '#111113', border: '1px solid #27272a' }}>
      {filtered.map((item, i) => (
        <a key={i} href={item.href}
          className="flex items-center gap-3 px-4 py-2.5 transition-colors"
          style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1c1c1f' : 'none' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1c1c1f')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          onClick={onClose}
        >
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{
            background: item.type === 'task' ? 'rgba(45,212,191,0.1)' : 'rgba(56,189,248,0.1)',
            color: item.type === 'task' ? '#2dd4bf' : '#38bdf8'
          }}>{item.type}</span>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: '#fafafa' }}>{item.label}</div>
            <div className="text-xs" style={{ color: '#71717a' }}>{item.sub}</div>
          </div>
        </a>
      ))}
    </div>
  );
}

/* ── Main Header ──────────────────────────────────────── */
export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const [searchQ, setSearchQ] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [companyName, setCompanyName] = useState('Memuat...');
  const [notifs, setNotifs] = useState(mockNotifications);
  const unread = notifs.filter(n => !n.read).length;
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          setCompanyName(data.stats.companyName);
        } else {
          setCompanyName('Main Office');
        }
      })
      .catch(() => setCompanyName('Main Office'));
  }, []);

  // Close panels on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRefresh = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 1000);
  };

  return (
    <header className="h-14 glass flex items-center justify-between px-6 sticky top-0 z-40"
      style={{ borderBottom: '1px solid var(--border)' }}>
      <div>
        <h2 className="font-bold text-primary" style={{ fontSize: '1rem' }}>{title}</h2>
        {subtitle && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div ref={searchRef} className="relative hidden md:block">
          <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 w-52 transition-all duration-300 focus-within:w-64 border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Cari task, agent… (Ctrl+K)"
              className="bg-transparent text-sm outline-none w-full text-primary"
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
            />
            {searchQ && (
              <button onClick={() => { setSearchQ(''); setShowSearch(false); }}>
                <X size={12} style={{ color: 'var(--text-secondary)' }} />
              </button>
            )}
          </div>
          {showSearch && <SearchPanel query={searchQ} onClose={() => { setShowSearch(false); setSearchQ(''); }} />}
        </div>

        {/* Refresh */}
        <button onClick={handleRefresh}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer border hover:border-primary/30"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          title="Refresh data"
        >
          <RefreshCw size={14} className={spinning ? 'animate-spin' : ''} style={{ color: spinning ? 'var(--primary)' : 'var(--text-secondary)' }} />
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button onClick={() => setShowNotifs(v => !v)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer relative border"
            style={{
              background: showNotifs ? 'var(--primary-glow)' : 'var(--bg-elevated)',
              borderColor: showNotifs ? 'var(--primary)' : 'var(--border)',
            }}
          >
            <Bell size={14} style={{ color: showNotifs ? 'var(--primary)' : 'var(--text-secondary)' }} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-extrabold flex items-center justify-center text-white bg-red-500 transition-all duration-300 scale-100 animate-pulse hover:scale-110 shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                {unread}
              </span>
            )}
          </button>
          {showNotifs && <NotifPanel notifs={notifs} setNotifs={setNotifs} onClose={() => setShowNotifs(false)} />}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: 'var(--primary)', color: '#ffffff' }}>
            S
          </div>
          <div className="hidden lg:block">
            <div className="text-sm font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>Supervisor</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{companyName}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
