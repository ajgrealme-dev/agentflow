'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { MessageSquare, HeartHandshake, Ticket, Send, Terminal, Bot, CheckCircle, Star, Phone } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function CustomerPage() {
  const { theme } = useTheme();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'bot' | 'sentiment' | 'tickets'>('bot');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [logOutput, setLogOutput] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState<string>('Memuat...');

  // Live Chat simulation state
  const [chatInput, setChatInput] = useState('Bagaimana cara mengajukan pengembalian dana barang cacat?');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([
    { sender: 'user', text: 'Halo, apakah produk ini bergaransi resmi?' },
    { sender: 'bot', text: 'Halo! Ya, seluruh produk kami dilengkapi garansi resmi pabrik selama 12 bulan sejak tanggal pembelian tertera di invoice Anda. Ada hal lain yang bisa kami bantu? 😊' }
  ]);

  // Ticket Queue state
  const [tickets, setTickets] = useState([
    { id: 'TKT-991', desc: 'Komplain barang rusak pada pengiriman INV-2026-004', priority: 'HIGH', date: 'Hari Ini' },
    { id: 'TKT-992', desc: 'Pertanyaan pengembalian sisa dana invoice AP', priority: 'MED', date: 'Kemarin' },
  ]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const tool = searchParams.get('tool');
    if (tool) {
      setActiveTool(tool);
    } else {
      setActiveTool(null);
    }

    if (tab && (tab === 'bot' || tab === 'sentiment' || tab === 'tickets')) {
      setActiveTab(tab as 'bot' | 'sentiment' | 'tickets');
    } else if (tool) {
      if (['bot', 'review', 'voice'].includes(tool)) {
        setActiveTab('bot');
      } else if (['sentiment', 'csat'].includes(tool)) {
        setActiveTab('sentiment');
      } else if (tool === 'tickets') {
        setActiveTab('tickets');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/company')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.companies.length > 0) {
          setCompanyName(data.companies[0].name);
        }
      })
      .catch(console.error);
  }, []);

  const getToolGlow = (toolKey: string) => {
    return activeTool === toolKey
      ? 'ring-2 ring-primary border-primary animate-pulse shadow-lg shadow-primary/20 transition-all duration-300'
      : '';
  };

  const runCustomerSim = (toolName: string, steps: string[]) => {
    setLogOutput([`[SYS] Memulai eksekusi perkakas Layanan Pelanggan: ${toolName}...`]);
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setLogOutput(prev => [...prev, step]);
      }, (idx + 1) * 600);
    });
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setLogOutput(prev => [...prev, `[USER_CHAT] "${userText}"`]);

    setTimeout(() => {
      let botReply = 'Terima kasih telah menghubungi Customer Service. Tim AI kami siap mendampingi Anda 24/7.';
      if (userText.toLowerCase().includes('refund') || userText.toLowerCase().includes('pengembalian')) {
        botReply = 'Untuk pengembalian dana (refund), silakan lampirkan foto nomor invoice dan resi pengiriman. Tim Finance & CS kami akan memproses dalam 1x24 jam.';
      }
      setChatMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
      setLogOutput(prev => [...prev, `[AI_BOT_REPLY] "${botReply}"`]);
    }, 1000);
  };

  const runTicketResolution = (ticketId: string) => {
    setLogOutput(prev => [...prev, `[TICKET] Mengambil alih penanganan ${ticketId}...`]);
    setTimeout(() => {
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      setLogOutput(prev => [...prev, `[SUCCESS] Tiket ${ticketId} berhasil diselesaikan otonom & dikirim email konfirmasi!`]);
    }, 1200);
  };

  return (
    <div className="min-h-screen relative font-sans">
      <Header 
        title="Divisi Layanan Pelanggan (Customer Support AI)" 
        subtitle={`Organisasi: ${companyName} · Auto-Responder Chatbot, Sentimen CSAT, &amp; Tiket Eskalasi`} 
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-light pb-0.5 gap-2">
          <button
            onClick={() => setActiveTab('bot')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'bot' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            🤖 CS Chatbot &amp; Voice AI
          </button>
          <button
            onClick={() => setActiveTab('sentiment')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'sentiment' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            ❤️ Analisis Sentimen &amp; CSAT
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'tickets' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            🎫 Tiket Eskalasi Pelanggan
          </button>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* ── TAB 1: CS CHATBOT & VOICE ─────────────────────────── */}
            {activeTab === 'bot' && (
              <div className="space-y-6 fade-in">
                {/* Additional CS Tools */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`bg-card border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('review')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">⭐ AI Reply Ulasan Publik</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Balas otomatis ulasan Google Maps &amp; Tokopedia dengan kalimat ramah.</p>
                    <button
                      onClick={() => runCustomerSim('Reply Ulasan Publik', [
                        '[REVIEWS] Membaca 15 ulasan bintang 5 baru...',
                        '[AI] Menyusun kalimat terima kasih yang personal...',
                        '[SUCCESS] 15 balasan ulasan terpublikasi.'
                      ])}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      Generate Respon Ulasan
                    </button>
                  </div>

                  <div className={`bg-card border border-light p-4 rounded-xl space-y-2 hover:border-primary/50 transition-all ${getToolGlow('voice')}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">🎙️ Analisis Suara Telepon (IVR)</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">AKTIF</span>
                    </div>
                    <p className="text-[11px] text-muted">Transkripsi percakapan telepon CS &amp; evaluasi nada bicara.</p>
                    <button
                      onClick={() => runCustomerSim('Transkripsi IVR', [
                        '[VOICE] Mengambil 8 rekaman panggilan telepon masuk...',
                        '[AI] Mengonversi rekaman audio menjadi teks...',
                        '[SUCCESS] Sentimen positif terdeteksi 92%.'
                      ])}
                      className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                    >
                      Mulai Transkripsi IVR
                    </button>
                  </div>
                </div>

                <div className={`bg-card border border-light rounded-2xl overflow-hidden shadow-sm ${getToolGlow('bot')}`}>
                  <div className="p-4 bg-elevated border-b border-light flex items-center justify-between">
                    <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                      <Bot size={14} className="text-primary" /> Live Chat Simulator AI Customer Support
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">ONLINE 24/7</span>
                  </div>

                  {/* Message History */}
                  <div className="p-4 space-y-3 h-64 overflow-y-auto font-sans text-xs">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`max-w-[80%] p-3 rounded-xl flex flex-col ${
                          msg.sender === 'user'
                            ? 'ml-auto bg-primary text-white font-medium'
                            : 'mr-auto bg-elevated border border-light text-primary'
                        }`}
                      >
                        <span className="font-bold text-[9px] uppercase opacity-75 mb-1">{msg.sender === 'user' ? 'Pelanggan' : 'AI Assistant'}</span>
                        <span>{msg.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Input Box */}
                  <div className="p-3 border-t border-light bg-elevated flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ketik pertanyaan simulasi..."
                      className="flex-1 px-3 py-2 bg-card border border-light rounded-lg text-xs text-primary focus:outline-none"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Send size={11} />
                      Kirim
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: SENTIMENT ANALYSIS ───────────────────────── */}
            {activeTab === 'sentiment' && (
              <div className="space-y-6 fade-in">
                <div className={`bg-card border border-light p-4 rounded-xl flex items-center justify-between gap-4 ${getToolGlow('csat')}`}>
                  <div>
                    <span className="font-bold text-xs text-primary block">📊 Survei Kepuasan CSAT</span>
                    <p className="text-[11px] text-muted mt-0.5">Kirim otomatis formulir evaluasi kepuasan setelah tiket selesai.</p>
                  </div>
                  <button
                    onClick={() => runCustomerSim('Survei CSAT', [
                      '[CSAT] Mengirim formulir evaluasi ke 42 pelanggan...',
                      '[AI] Mengagregasi skor kepuasan rata-rata...',
                      '[SUCCESS] Skor CSAT bulan ini mencapai 94.5%.'
                    ])}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    Kirim Survei CSAT
                  </button>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${getToolGlow('sentiment')}`}>
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Tingkat Kepuasan CSAT</span>
                    <span className="text-primary font-stats font-extrabold text-lg">94.5%</span>
                  </div>
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Net Promoter Score (NPS)</span>
                    <span className="text-primary font-stats font-extrabold text-lg">+78</span>
                  </div>
                  <div className="bg-card border border-light p-4 rounded-xl flex flex-col gap-1 shadow-sm">
                    <span className="text-muted text-[10px] uppercase font-bold tracking-wider">Ulasan Positif</span>
                    <span className="text-emerald-500 font-stats font-extrabold text-lg">892 Ulasan</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: TICKET ESCALATION ────────────────────────── */}
            {activeTab === 'tickets' && (
              <div className="space-y-4 fade-in">
                <div className={`bg-card border border-light rounded-2xl overflow-hidden shadow-sm ${getToolGlow('tickets')}`}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-elevated border-b border-light text-secondary font-bold">
                        <th className="p-4">ID Tiket</th>
                        <th className="p-4">Keluhan</th>
                        <th className="p-4">Prioritas</th>
                        <th className="p-4">Tanggal</th>
                        <th className="p-4">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light text-primary">
                      {tickets.map(tkt => (
                        <tr key={tkt.id} className="hover:bg-hover/20 transition-colors">
                          <td className="p-4 font-mono font-bold text-primary">{tkt.id}</td>
                          <td className="p-4 font-medium">{tkt.desc}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              tkt.priority === 'HIGH' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {tkt.priority}
                            </span>
                          </td>
                          <td className="p-4 text-muted">{tkt.date}</td>
                          <td className="p-4">
                            <button
                              onClick={() => runTicketResolution(tkt.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg hover:opacity-90 transition-all cursor-pointer font-bold text-[10px] shadow-sm"
                            >
                              <CheckCircle size={10} />
                              Selesaikan
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Log Console */}
          <div className="bg-card border border-light p-5 rounded-2xl flex flex-col h-[380px] shadow-sm">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5 mb-3 font-mono">
              <Terminal size={14} className="text-primary" /> Log AI Support Dispatcher:
            </span>
            <div className="flex-1 bg-elevated dark:bg-black/90 text-primary dark:text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-y-auto space-y-1.5 border border-light dark:border-white/10">
              {logOutput.length > 0 ? (
                logOutput.map((l, i) => <div key={i}>{l}</div>)
              ) : (
                <span className="text-muted italic">Klik tombol alat kerja untuk melihat simulasi eksekusi...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
