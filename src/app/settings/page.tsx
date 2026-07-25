'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Save, Key, Mail, Bot, Shield, Globe, Server } from 'lucide-react';
import { ToastContainer, useToast } from '@/components/Toast';
import { useTheme } from '@/components/ThemeProvider';

type ToggleState = Record<string, boolean>;

const initialToggles: ToggleState = {
  'whatsapp':   true,
  'auto_approve': true,
  'mode_24_7':  true,
  'email_digest': false,
  'audit_trail': true,
  'sandbox':    false,
};

export default function SettingsPage() {
  const { toasts, addToast } = useToast();
  const [toggles, setToggles] = useState(initialToggles);
  const [model, setModel] = useState('gemini-2.5-flash');
  const [threshold, setThreshold] = useState(75);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Company Settings State
  const [companyId, setCompanyId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');

  // MCP Monitor State
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [loadingMcp, setLoadingMcp] = useState(true);

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Gagal mengambil pengaturan.');
      const data = await res.json();
      if (data.success && data.company) {
        setCompanyId(data.company.id || '');
        setCompanyName(data.company.name || '');
        setGeminiApiKey(data.company.geminiApiKey || '');
        setTelegramBotToken(data.company.telegramBotToken || '');
      }
    } catch (err: any) {
      addToast(err.message || 'Terjadi kesalahan saat memuat pengaturan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMcp = async () => {
    try {
      const res = await fetch('/api/mcp');
      if (!res.ok) throw new Error('Gagal memuat status MCP.');
      const data = await res.json();
      if (data.success) {
        setMcpServers(data.servers || []);
      }
    } catch (err) {
      console.error('Failed to fetch MCP status:', err);
    } finally {
      setLoadingMcp(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchMcp();
  }, []);

  const flip = (key: string) => setToggles(t => ({ ...t, [key]: !t[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: companyId,
          name: companyName,
          geminiApiKey,
          telegramBotToken
        })
      });
      
      if (!res.ok) throw new Error('Gagal menyimpan pengaturan ke database.');
      const data = await res.json();
      if (data.success) {
        addToast('Pengaturan perusahaan berhasil disimpan!', 'success');
      }
    } catch (err: any) {
      addToast(err.message || 'Gagal menyimpan pengaturan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleRows = [
    { key: 'whatsapp',    label: 'Notifikasi WhatsApp',           desc: 'Kirim alert ke WhatsApp supervisor saat ada task penting' },
    { key: 'auto_approve',label: 'Auto-approve confidence > 95%', desc: 'Task langsung diproses tanpa review jika AI sangat yakin' },
    { key: 'mode_24_7',   label: 'Mode 24/7 Otomatis',            desc: 'Agent tetap berjalan di luar jam kerja normal' },
    { key: 'email_digest',label: 'Email Digest Harian',           desc: 'Kirim ringkasan performa ke email setiap pukul 08:00' },
    { key: 'audit_trail', label: 'Audit Trail Lengkap',           desc: 'Simpan log semua perubahan data ke database' },
    { key: 'sandbox',     label: 'Sandbox Mode (Testing)',        desc: 'Uji coba tanpa menyimpan ke sistem nyata' },
  ];

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const section = (icon: any, title: string, desc: string, color: string, children: React.ReactNode) => {
    const Icon = icon;
    return (
      <div className="bg-card border border-light overflow-hidden rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 p-5 border-b border-light">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-elevated border border-light">
            <Icon size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-primary">{title}</p>
            <p className="text-xs text-secondary">{desc}</p>
          </div>
        </div>
        <div className="p-5">{children}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-secondary text-sm">
        Memuat pengaturan sistem... ⏳
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <Header title="Settings" subtitle="Konfigurasi platform, integrasi, dan preferensi sistem" />
      <ToastContainer toasts={toasts} />

      <div className="p-6 space-y-5 max-w-3xl fade-up">
        {/* Profile Perusahaan */}
        {section(Globe, 'Profil Perusahaan (SaaS Tenant)', 'Pengaturan identitas organisasi dan ruang kerja Anda', '#3b82f6',
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-secondary">ID Perusahaan (Read-only)</label>
              <input type="text" value={companyId} readOnly disabled className="w-full px-3 py-2.5 rounded-xl bg-elevated border border-light text-sm text-muted cursor-not-allowed opacity-60" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-secondary">Nama Perusahaan / Organisasi</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-elevated border border-light text-sm text-primary placeholder-muted focus:outline-none focus:border-primary" />
            </div>
          </div>
        )}

        {/* API Keys */}
        {section(Key, 'API & Integrasi (SaaS)', 'Konfigurasi API keys kecerdasan buatan dan Telegram Bot khusus', '#2dd4bf',
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-secondary">Google Gemini API Key (BYOK)</label>
              <input type="password" value={geminiApiKey} onChange={e => setGeminiApiKey(e.target.value)} placeholder="Masukkan API Key Gemini untuk bypass kuota gratis" className="w-full px-3 py-2.5 rounded-xl bg-elevated border border-light text-sm text-primary placeholder-muted focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-secondary">Custom Telegram Bot Token</label>
              <input type="password" value={telegramBotToken} onChange={e => setTelegramBotToken(e.target.value)} placeholder="Hubungkan bot Telegram khusus perusahaan Anda" className="w-full px-3 py-2.5 rounded-xl bg-elevated border border-light text-sm text-primary placeholder-muted focus:outline-none focus:border-primary" />
            </div>
          </div>
        )}

        {/* Email */}
        {section(Mail, 'Email & Notifikasi', 'Pengaturan email sumber dan penerima laporan', '#38bdf8',
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-secondary">Email Sumber (IMAP)</label>
              <input type="text" defaultValue="finance@azizautomation.com" className="w-full px-3 py-2.5 rounded-xl bg-elevated border border-light text-sm text-primary placeholder-muted focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-secondary">Email Laporan Harian</label>
              <input type="text" defaultValue="owner@azizautomation.com" className="w-full px-3 py-2.5 rounded-xl bg-elevated border border-light text-sm text-primary placeholder-muted focus:outline-none focus:border-primary" />
            </div>
          </div>
        )}

        {/* Toggles */}
        {section(Shield, 'Preferensi Sistem', 'Toggle fitur dan mode operasional agent', '#22c55e',
          <div className="divide-y divide-light">
            {toggleRows.map(row => (
              <div key={row.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-primary">{row.label}</p>
                  <p className="text-xs mt-0.5 text-secondary">{row.desc}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={toggles[row.key]}
                  onClick={() => flip(row.key)}
                  className="toggle-track"
                  data-on={String(toggles[row.key])}
                >
                  <div className="toggle-thumb" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Model Context Protocol (MCP) Monitor */}
        {section(Server, 'Model Context Protocol (MCP) Monitor', 'Status koneksi server MCP eksternal dan perkakas AI aktif', '#a855f7',
          loadingMcp ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : mcpServers.length === 0 ? (
            <p className="text-xs text-secondary italic">Tidak ada server MCP eksternal yang terkonfigurasi. Daftarkan server di mcp-config.json.</p>
          ) : (
            <div className="space-y-4">
              {mcpServers.map((server: any) => (
                <div key={server.name} className="border border-light rounded-xl p-3.5 bg-elevated/45 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block text-sm font-heading">{server.name}</span>
                      <span className="text-[10px] text-muted font-mono block mt-0.5">{server.command} {server.args.join(' ')}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                      server.status === 'CONNECTED' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {server.status === 'CONNECTED' ? '● Connected' : '○ Offline'}
                    </span>
                  </div>

                  {server.tools.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-light/50">
                      <p className="text-[10px] text-muted font-bold uppercase tracking-wider font-heading">Perkakas Aktif ({server.tools.length}):</p>
                      <div className="grid grid-cols-1 gap-2">
                        {server.tools.map((tool: any) => (
                          <div key={tool.name} className="bg-card/45 border border-light p-2.5 rounded-lg space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] text-indigo-400 font-bold">{tool.name}</span>
                              <span className="text-[8px] text-muted font-mono">mcp__{server.name}__{tool.name}</span>
                            </div>
                            <p className="text-[10px] text-secondary leading-relaxed mt-0.5">{tool.description}</p>
                            
                            {tool.inputSchema?.properties && Object.keys(tool.inputSchema.properties).length > 0 && (
                              <div className="text-[8px] text-muted font-mono pt-1">
                                <strong>Params:</strong> {Object.keys(tool.inputSchema.properties).join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted italic">Tidak ada perkakas yang terdeteksi dari server ini.</p>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Sinkronisasi Perkakas Kerja (tools.html) */}
        {section(Server, 'Sinkronisasi Perkakas Kerja AI', 'Mencocokkan dan memperbarui perkakas kerja spesifik peran dari tools.html ke database', '#10b981',
          <div className="space-y-4">
            <p className="text-xs text-secondary leading-relaxed">
              Tekan tombol di bawah untuk membaca berkas <b>tools.html</b> secara otonom, membuat relasi perkakas spesifik untuk ke-142 peran karyawan di database, serta menyinkronkan ritme alur kerja otomatis ke dalam SOP Markdown masing-masing agen.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={async () => {
                  try {
                    addToast('Memulai sinkronisasi otonom dari tools.html... ⏳', 'info');
                    const res = await fetch('/api/admin/sync-tools', { method: 'POST' });
                    const data = await res.json();
                    if (data.success) {
                      addToast(data.message, 'success');
                    } else {
                      addToast(data.error || 'Gagal sinkronisasi.', 'error');
                    }
                  } catch (err: any) {
                    addToast(err.message || 'Gagal menghubungi server.', 'error');
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Sync Tools &amp; Workflows
              </button>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[10px] text-secondary flex-1 font-mono">
                ⚠️ <b>Catatan Migrasi:</b> Setelah sinkronisasi pertama kali, pastikan Anda telah menjalankan perintah migrasi prisma: <code>npx prisma migrate dev</code> di terminal lokal Anda.
              </div>
            </div>
          </div>
        )}

        {/* Agent Config */}
        {section(Bot, 'Konfigurasi Agent Global', 'Pengaturan default yang berlaku untuk semua agent', '#f59e0b',
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-secondary">Model AI Default</label>
              <select className="w-full px-3 py-2.5 rounded-xl bg-elevated border border-light text-sm text-primary focus:outline-none focus:border-primary" value={model} onChange={e => setModel(e.target.value)}>
                <option value="gemini-2.5-flash" className="bg-card text-primary">gemini-2.5-flash (Cepat - Direkomendasikan)</option>
                <option value="gemini-1.5-pro" className="bg-card text-primary">gemini-1.5-pro (Akurat)</option>
                <option value="gemini-2.5-pro" className="bg-card text-primary">gemini-2.5-pro (Terbaik)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-secondary">
                Confidence Threshold: <span className="text-primary">{threshold}%</span>
              </label>
              <input type="range" min={50} max={99} value={threshold}
                onChange={e => setThreshold(+e.target.value)}
                className="w-full" style={{ accentColor: 'var(--primary)' }} />
              <div className="flex justify-between text-xs mt-1 text-muted">
                <span>50% (Permisif)</span><span>99% (Ketat)</span>
              </div>
            </div>
          </div>
        )}

        {/* Save */}
        <div className="flex justify-end gap-3 pb-4">
          <button className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-primary transition-colors">Reset Default</button>
          <button className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 transition-all" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>Menyimpan…</>
            ) : (
              <><Save size={14} /> Simpan Perubahan</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
