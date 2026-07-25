'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Shield, Key, User, ArrowRight, ChevronDown } from 'lucide-react';

const ROLE_OPTIONS = [
  {
    value: 'owner',
    label: 'Owner / Super Admin',
    divisi: 'Manajemen',
    description: 'Akses penuh ke semua fitur & laporan',
    color: '#4f46e5',
    bg: 'rgba(79, 70, 229, 0.08)',
    border: 'rgba(79, 70, 229, 0.2)',
  },
  {
    value: 'finance',
    label: 'Admin Keuangan',
    divisi: 'Finance & Accounting',
    description: 'Invoice, rekonsiliasi, laporan arus kas',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.2)',
  },
  {
    value: 'hr',
    label: 'Admin SDM (HR)',
    divisi: 'Human Resources',
    description: 'Absensi, cuti, kontrak, slip gaji',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.08)',
    border: 'rgba(139, 92, 246, 0.2)',
  },
  {
    value: 'purchasing',
    label: 'Admin Pengadaan',
    divisi: 'Purchasing & Gudang',
    description: 'PR, SO, supplier, stok gudang',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.2)',
  },
  {
    value: 'admin',
    label: 'Administrator',
    divisi: 'IT / Sistem',
    description: 'Akses penuh ke semua fitur',
    color: '#4f46e5',
    bg: 'rgba(79, 70, 229, 0.08)',
    border: 'rgba(79, 70, 229, 0.2)',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('owner');
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedRole = ROLE_OPTIONS.find((r) => r.value === role) ?? ROLE_OPTIONS[0];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_name', username || 'Admin');
      setLoading(false);
      router.push('/workbench');
    }, 900);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden select-none"
      style={{ background: '#000' }}>

      {/* Background ambient orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 65%)', filter: 'blur(80px)' }} />

      {/* Login Card */}
      <div
        className="relative z-10 w-full max-w-md m-4 fade-up"
        style={{
          background: 'rgba(8, 8, 8, 0.85)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '28px',
          padding: '40px',
          boxShadow: '0 32px 80px -20px rgba(0,0,0,0.8)',
        }}
      >
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 8px 24px rgba(79,70,229,0.3)' }}
          >
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white text-center">
            AgentFlow Enterprise
          </h1>
          <p className="text-xs text-center mt-1.5" style={{ color: '#4b5563' }}>
            Office Automation &amp; AI Workforce Portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b7280' }}>
              Username
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 w-4 h-4" style={{ color: '#4b5563' }} />
              <input
                id="username-input"
                type="text"
                required
                placeholder="Masukkan username..."
                className="w-full pl-10 pr-4 py-3 text-sm text-white focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={(e) => { e.currentTarget.style.borderColor = selectedRole.color + '66'; e.currentTarget.style.boxShadow = `0 0 0 3px ${selectedRole.color}18`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b7280' }}>
              Password
            </label>
            <div className="relative flex items-center">
              <Key className="absolute left-3.5 w-4 h-4" style={{ color: '#4b5563' }} />
              <input
                id="password-input"
                type="password"
                required
                placeholder="Masukkan password..."
                className="w-full pl-10 pr-4 py-3 text-sm text-white focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => { e.currentTarget.style.borderColor = selectedRole.color + '66'; e.currentTarget.style.boxShadow = `0 0 0 3px ${selectedRole.color}18`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Role Picker — custom dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b7280' }}>
              Pilih Divisi / Peran
            </label>
            <div className="relative">
              <button
                type="button"
                id="role-select"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center gap-3 py-3 px-4 text-sm transition-all text-left"
                style={{
                  background: selectedRole.bg,
                  border: `1px solid ${selectedRole.border}`,
                  borderRadius: '14px',
                  color: selectedRole.color,
                }}
              >
                <Shield className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{selectedRole.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{selectedRole.description}</div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown list */}
              {dropdownOpen && (
                <div
                  className="absolute z-50 w-full mt-2 overflow-hidden"
                  style={{
                    background: 'rgba(12,12,12,0.98)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  }}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setRole(opt.value); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                      style={{
                        background: role === opt.value ? opt.bg : 'transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = opt.bg; }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = role === opt.value ? opt.bg : 'transparent';
                      }}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.color }} />
                      <div>
                        <div className="text-sm font-semibold" style={{ color: role === opt.value ? opt.color : '#e5e7eb' }}>
                          {opt.label}
                        </div>
                        <div className="text-xs" style={{ color: '#6b7280' }}>{opt.divisi}</div>
                      </div>
                      {role === opt.value && (
                        <span className="ml-auto text-xs font-bold" style={{ color: opt.color }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-2"
            style={{
              background: `linear-gradient(135deg, ${selectedRole.color}, ${selectedRole.color}cc)`,
              color: '#fff',
              borderRadius: '14px',
              border: 'none',
              boxShadow: `0 8px 24px -4px ${selectedRole.color}44`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px -4px ${selectedRole.color}55`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px -4px ${selectedRole.color}44`; }}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Masuk ke Meja Kerja
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer hint */}
        <div className="mt-8 pt-6 text-center text-[10px] leading-relaxed" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#374151' }}>
          Pilih divisi/peran untuk menguji tampilan meja kerja berbasis RBAC.
          <br />Setiap admin hanya melihat tools yang relevan.
        </div>
      </div>
    </div>
  );
}
