'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, LayoutGrid, MessageSquare, Wallet, Users, Package,
  Cpu, Scale, Megaphone, Headphones, Target, Bot, Settings, Presentation,
  ChevronLeft, ChevronRight, ChevronDown, Sun, Moon, LogOut, Zap
} from 'lucide-react';
import { useSidebar } from './SidebarProvider';
import { useTheme } from './ThemeProvider';
import type { AdminRole } from '@/lib/types';
import { getRoleConfig } from '@/lib/workbench-config';

interface SubToolItem {
  href: string;
  label: string;
}

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  primary?: boolean;
  badge?: number;
  highlight?: boolean;
  subItems?: SubToolItem[];
}

const navItems: NavItem[] = [
  { href: '/workbench',  icon: LayoutGrid,      label: 'Meja Kerja', primary: true },
  { href: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/command',    icon: MessageSquare,   label: 'Chatbot' },
  
  // ── 8 CHIEF DIVISIONS WITH FULL TOOLS SUB-MENUS ──────────────
  {
    href: '/finance',
    icon: Wallet,
    label: 'Keuangan AI',
    subItems: [
      { href: '/finance?tab=invoices&tool=invoices',     label: '🧾 Rekap Invoice AR/AP' },
      { href: '/finance?tab=scanner&tool=scanner',      label: '✨ Scan & OCR Dokumen' },
      { href: '/finance?tab=receipts&tool=receipts',     label: '💵 Rekap Bon Cash (Arus Kas)' },
      { href: '/finance?tab=invoices&tool=reminder',    label: '⏰ Reminder Utang/Piutang' },
      { href: '/finance?tab=invoices&tool=create',      label: '📝 Buat Invoice Baru' },
      { href: '/finance?tab=invoices&tool=reconcile',   label: '🔄 Rekonsiliasi Bank' },
      { href: '/finance?tab=receipts&tool=export',      label: '📤 Ekspor Laporan PDF/Excel' },
    ]
  },
  {
    href: '/attendance',
    icon: Users,
    label: 'SDM AI',
    subItems: [
      { href: '/attendance?tab=roster&tool=roster',     label: '📅 Roster & Jadwal Shift' },
      { href: '/attendance?tab=attendance&tool=checkin', label: '✅ Koreksi Absensi Mandiri' },
      { href: '/attendance?tab=leaves&tool=leave',       label: '📝 Pengajuan Cuti (Leave)' },
      { href: '/attendance?tab=attendance&tool=recap',   label: '📊 Rekap Absensi AI Bulanan' },
      { href: '/attendance?tab=payroll&tool=payroll',    label: '💵 Slip Gaji (Payroll)' },
      { href: '/attendance?tab=payroll&tool=bpjs',       label: '🏥 BPJS & PPh21 Kalkulator' },
      { href: '/attendance?tab=leaves&tool=sp',          label: '⚠️ Surat Peringatan (SP) Otomatis' },
    ]
  },
  {
    href: '/purchasing',
    icon: Package,
    label: 'Pengadaan AI',
    subItems: [
      { href: '/purchasing?tab=requisitions&tool=requisition', label: '📝 Draf Purchase Requisition' },
      { href: '/purchasing?tab=inventory&tool=stock',          label: '📦 Cek Stok & Opname' },
      { href: '/purchasing?tab=leads&tool=rfq',           label: '⚖️ Analisis Vendor & RFQ' },
      { href: '/purchasing?tab=leads&tool=supplier',     label: '⭐ Database & Rating Supplier' },
      { href: '/purchasing?tab=inventory&tool=audit',    label: '🔍 Audit Selisih Stok AI' },
      { href: '/purchasing?tab=requisitions&tool=po',    label: '📥 Buat Purchase Order (PO)' },
      { href: '/purchasing?tab=inventory&tool=alert',    label: '🚨 Alert Reorder Point' },
    ]
  },
  {
    href: '/tech',
    icon: Cpu,
    label: 'IT & Sistem AI',
    subItems: [
      { href: '/tech?tab=logs&tool=logs',         label: '🖥️ Monitor Error System logs' },
      { href: '/tech?tab=security&tool=firewall', label: '🛡️ Audit Keamanan & Firewall' },
      { href: '/tech?tab=deploy&tool=deploy',     label: '⚙️ Konfigurasi Autodeploy Pipeline' },
      { href: '/tech?tab=security&tool=mcp',      label: '🔌 Hubungkan MCP Server' },
      { href: '/tech?tab=logs&tool=performance',  label: '📈 Laporan Latency API' },
      { href: '/tech?tab=deploy&tool=env',        label: '🔑 Vault Credentials (.env)' },
      { href: '/tech?tab=security&tool=db',       label: '💾 Backup Database Postgres' },
    ]
  },
  {
    href: '/legal',
    icon: Scale,
    label: 'Legal & Kepatuhan AI',
    subItems: [
      { href: '/legal?tab=contracts&tool=review', label: '⚖️ Review Klausul Kontrak' },
      { href: '/legal?tab=permits&tool=permit',   label: '📄 Monitor Izin & Lisensi' },
      { href: '/legal?tab=complaints&tool=ombud', label: '🔍 Whistleblowing & Keluhan' },
      { href: '/legal?tab=contracts&tool=draft',  label: '📝 Auto-draft Perjanjian Kerja' },
      { href: '/legal?tab=permits&tool=notaris',  label: '🏛️ Cek Akta Notaris & OSS' },
      { href: '/legal?tab=complaints&tool=check', label: '🚨 Checklists Kepatuhan UU' },
      { href: '/legal?tab=contracts&tool=expiry', label: '⏰ Alarm Kontrak Kadaluarsa' },
    ]
  },
  {
    href: '/marketing',
    icon: Megaphone,
    label: 'Pemasaran & Prospek AI',
    subItems: [
      { href: '/marketing?tab=leads&tool=crawled',   label: '🔍 Cari Prospek Klien B2B' },
      { href: '/marketing?tab=campaigns&tool=social', label: '📱 Copywriting Sosmed Draft' },
      { href: '/marketing?tab=seo&tool=seo',         label: '📈 Riset Keyword & SEO' },
      { href: '/marketing?tab=leads&tool=crm',       label: '🤝 Integrasi CRM Pipeline' },
      { href: '/marketing?tab=campaigns&tool=ads',   label: '💰 Kalkulator Budget Ads' },
      { href: '/marketing?tab=seo&tool=backlink',    label: '🔗 Monitor Backlink AI' },
      { href: '/marketing?tab=campaigns&tool=email', label: '📧 Broadcast Newsletter Draft' },
    ]
  },
  {
    href: '/customer',
    icon: Headphones,
    label: 'Layanan Pelanggan AI',
    subItems: [
      { href: '/customer?tab=tickets&tool=tickets',   label: '📥 Tiket Bantuan Masuk' },
      { href: '/customer?tab=faq&tool=faq',           label: '💬 Auto-Response Generator' },
      { href: '/customer?tab=sentiment&tool=sentiment', label: '🎭 Analisis Sentimen Ulasan' },
      { href: '/customer?tab=tickets&tool=escalation', label: '🚨 Eskalasi Tiket Prioritas' },
      { href: '/customer?tab=faq&tool=chatbot',       label: '🤖 Custom Knowledge Base' },
      { href: '/customer?tab=sentiment&tool=nps',     label: '⭐ Kalkulator Skor NPS' },
      { href: '/customer?tab=tickets&tool=recap',     label: '📝 Laporan KPI Cs Bulanan' },
    ]
  },
  {
    href: '/strategy',
    icon: Target,
    label: 'Strategi & Ekspansi AI',
    subItems: [
      { href: '/strategy?tab=scenario&tool=scenario',  label: '🎯 Simulasi Skenario Bisnis' },
      { href: '/strategy?tab=erm&tool=erm',       label: '⚠️ Risk Assessment (ERM)' },
      { href: '/strategy?tab=kpi&tool=kpi',       label: '📊 Dashboard KPI Eksekutif' },
      { href: '/strategy?tab=scenario&tool=cashflow', label: '💸 Peramalan Flow Bunga' },
      { href: '/strategy?tab=scenario&tool=expansion',label: '🌐 Evaluator Ekspansi Bisnis' },
      { href: '/strategy?tab=erm&tool=radar',    label: '🔍 Market Intelligence Radar' },
    ]
  },

  { href: '/agents',     icon: Bot,             label: 'AI Agents' },
  { href: '/settings',   icon: Settings,        label: 'Settings' },
];

const ROLE_NAV: Record<AdminRole, string[]> = {
  owner:     ['*'],
  admin:     ['*'],
  finance:   ['/workbench', '/', '/finance', '/command', '/agents', '/settings'],
  hr:        ['/workbench', '/', '/attendance', '/command', '/agents', '/settings'],
  purchasing:['/workbench', '/', '/purchasing', '/command', '/agents', '/settings'],
};

export default function Sidebar() {
  const pathname  = usePathname();
  const router = useRouter();
  const { open, toggle } = useSidebar();
  const { theme, toggle: toggleTheme } = useTheme();  
  const isDark = theme === 'dark';

  const [role, setRole] = useState<AdminRole>('admin');
  const [userName, setUserName] = useState<string>('Admin');
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const savedRole = localStorage.getItem('user_role') as AdminRole;
    const savedName = localStorage.getItem('user_name');
    if (savedRole) setRole(savedRole);
    if (savedName) setUserName(savedName);
  }, [pathname]);

  // Auto-expand current active division menu
  useEffect(() => {
    navItems.forEach(item => {
      if (item.subItems && pathname.startsWith(item.href)) {
        setExpandedMenus(prev => ({ ...prev, [item.href]: true }));
      }
    });
  }, [pathname]);

  const toggleSubMenu = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedMenus(prev => ({ ...prev, [href]: !prev[href] }));
  };

  const roleConfig = getRoleConfig(role);

  if (pathname === '/login') return null;

  const bg      = isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.9)';
  const border  = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const logoSub = 'var(--text-muted)';
  const navMutedColor = 'var(--text-secondary)';

  const activeColor = 'var(--primary)';
  const activeBg    = 'var(--primary-glow)';
  const activeBorder= isDark ? 'rgba(0, 242, 254, 0.15)' : 'rgba(79, 70, 229, 0.12)';
  const primaryBorder = isDark ? 'rgba(0, 242, 254, 0.25)' : 'rgba(79, 70, 229, 0.25)';

  return (
    <>
      <aside
        className="fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          width: open ? '250px' : '64px',
          background: bg,
          borderRight: `1px solid ${border}`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Logo Row */}
        <div className="flex items-center px-4 py-4 border-b flex-shrink-0 overflow-hidden"
          style={{ borderColor: border, minHeight: '64px' }}>
          <div className={`flex items-center w-full transition-all duration-300 ${open ? 'gap-3 justify-start' : 'gap-0 justify-center'}`}>
            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 pointer-events-none'}`}>
              <span className="text-sm font-bold tracking-tight block whitespace-nowrap"
                style={{ color: 'var(--text-primary)' }}>
                AgentFlow
              </span>
              <div className="text-[10px] whitespace-nowrap" style={{ color: logoSub }}>Enterprise Automation</div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.filter(item => {
            const allowed = ROLE_NAV[role] ?? ROLE_NAV.admin;
            if (allowed[0] === '*') return true;
            return allowed.includes(item.href);
          }).map(({ href, icon: Icon, label, badge, highlight, primary, subItems }) => {
            const isActive = pathname === href || (pathname.startsWith(href) && href !== '/');
            const isExpanded = expandedMenus[href];
            const hasSub = subItems && subItems.length > 0;

            const linkBorder = primary && !isActive
              ? `1px solid ${primaryBorder}`
              : isActive
              ? `1px solid ${activeBorder}`
              : '1px solid transparent';
            const linkBg = primary && !isActive
              ? 'var(--primary-glow)'
              : isActive
              ? activeBg
              : 'transparent';

            return (
              <div key={href} className="space-y-0.5">
                <div className="flex items-center">
                  <Link
                    href={href}
                    title={!open ? label : undefined}
                    className={`flex-1 flex items-center rounded-xl text-xs font-semibold transition-all duration-150 group relative ${
                      open ? 'gap-2.5' : 'gap-0'
                    }`}
                    style={{
                      padding: open ? '9px 11px' : '9px',
                      justifyContent: open ? 'flex-start' : 'center',
                      background: linkBg,
                      color: isActive ? activeColor : primary ? activeColor : navMutedColor,
                      border: linkBorder,
                      marginBottom: primary ? '4px' : '0',
                    }}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
                        style={{ background: activeColor }} />
                    )}
                    <Icon size={15} className="flex-shrink-0" />
                    <span className={`whitespace-nowrap transition-all duration-300 ease-in-out ${
                      open ? 'flex-1 opacity-100 max-w-[170px]' : 'opacity-0 max-w-0 overflow-hidden pointer-events-none'
                    }`}>
                      {label}
                    </span>
                  </Link>

                  {hasSub && open && (
                    <button
                      onClick={(e) => toggleSubMenu(href, e)}
                      className="p-2 text-muted hover:text-primary transition-all cursor-pointer rounded-lg hover:bg-hover/50"
                      title="Buka Alat Kerja"
                    >
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-primary' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {/* Submenu Tool List */}
                {hasSub && open && isExpanded && (
                  <div className="ml-5 pl-2 border-l border-light/40 space-y-0.5 py-1">
                    {subItems.map((sub) => {
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="block px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all text-secondary hover:text-primary hover:bg-hover/30"
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 pb-3 border-t pt-3 flex-shrink-0 space-y-2" style={{ borderColor: border }}>
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`w-full flex items-center rounded-xl text-xs transition-all duration-150 ${open ? 'gap-3' : 'gap-0'}`}
            style={{
              padding: open ? '8px 12px' : '8px',
              justifyContent: open ? 'flex-start' : 'center',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: `1px solid ${border}`,
            }}
          >
            {isDark ? <Sun size={14} className="flex-shrink-0" /> : <Moon size={14} className="flex-shrink-0" />}
            <span className={`text-xs transition-all duration-300 ease-in-out ${
              open ? 'opacity-100 max-w-[100px]' : 'opacity-0 max-w-0 overflow-hidden pointer-events-none'
            }`}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('user_role');
              router.push('/login');
            }}
            title="Keluar dari Akun"
            className={`w-full flex items-center rounded-xl text-xs transition-all duration-150 ${open ? 'gap-3' : 'gap-0'}`}
            style={{
              padding: open ? '8px 12px' : '8px',
              justifyContent: open ? 'flex-start' : 'center',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: `1px solid ${border}`,
            }}
          >
            <LogOut size={14} className="flex-shrink-0" />
            <span className={`text-xs transition-all duration-300 ease-in-out ${
              open ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0 overflow-hidden pointer-events-none'
            }`}>
              Keluar ({roleConfig.label})
            </span>
          </button>
        </div>
      </aside>

      {/* Collapse toggle button */}
      <button
        onClick={toggle}
        className="fixed z-50 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        style={{
          top: '20px',
          left: open ? '234px' : '48px',
          width: '24px',
          height: '24px',
          background: 'var(--primary)',
          color: '#ffffff',
          border: `2px solid ${bg}`,
        }}
        title={open ? 'Tutup sidebar' : 'Buka sidebar'}
      >
        {open
          ? <ChevronLeft size={13} strokeWidth={3} />
          : <ChevronRight size={13} strokeWidth={3} />
        }
      </button>
    </>
  );
}
