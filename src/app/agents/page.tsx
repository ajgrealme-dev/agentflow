'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AgentCard from '@/components/AgentCard';
import { 
  Plus, Filter, X, Save, Activity, AlertTriangle, 
  BookOpen, Edit3, CheckCircle, RefreshCw 
} from 'lucide-react';

interface TaskStep {
  id: string;
  actionName: string;
  inputData: string;
  outputData: string;
  isError: boolean;
  errorMessage: string | null;
  createdAt: string;
}

interface AgentTask {
  id: string;
  title: string;
  description: string;
  status: string;
  currentState: string;
  escalatedTo: string | null;
  createdAt: string;
  steps: TaskStep[];
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'running' | 'error' | 'paused';
  tasksCompleted: number;
  tasksToday: number;
  errorRate: number;
  uptime: string;
  lastActivity: string;
  goal: string;
  sopMarkdown: string;
  icon: string;
}

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create Agent Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('INTERN');
  const [newDivisi, setNewDivisi] = useState('FINANCE');
  const [newGoal, setNewGoal] = useState('');
  const [newSop, setNewSop] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail & Edit SOP State
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentDetails, setAgentDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isEditingSop, setIsEditingSop] = useState(false);
  const [editedSop, setEditedSop] = useState('');
  const [savingSop, setSavingSop] = useState(false);

  // Fetch agents
  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
      } else {
        setErrorMsg(data.error || 'Gagal memuat data agen');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // Fetch details when agent selected
  useEffect(() => {
    if (selectedAgent) {
      const fetchAgentDetails = async () => {
        try {
          setLoadingDetails(true);
          const res = await fetch(`/api/agents?agentId=${selectedAgent.id}`);
          const data = await res.json();
          if (data.success) {
            setAgentDetails(data.agent);
            setEditedSop(data.agent.sopMarkdown);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingDetails(false);
        }
      };
      fetchAgentDetails();
    } else {
      setAgentDetails(null);
      setIsEditingSop(false);
    }
  }, [selectedAgent]);

  // Create new agent handler
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newGoal || !newSop) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          role: newRole,
          divisi: newDivisi,
          goal: newGoal,
          sopMarkdown: newSop,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewName('');
        setNewGoal('');
        setNewSop('');
        fetchAgents();
      } else {
        alert(data.error || 'Gagal membuat agen');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungkan ke server');
    } finally {
      setSubmitting(false);
    }
  };

  // Save SOP handler
  const handleSaveSop = async () => {
    if (!selectedAgent) return;
    try {
      setSavingSop(true);
      const res = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAgent.id,
          sopMarkdown: editedSop,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditingSop(false);
        // Refresh details
        setAgentDetails((prev: any) => ({ ...prev, sopMarkdown: data.agent.sopMarkdown }));
        // Refresh agent list (since it holds the cached SOP)
        fetchAgents();
      } else {
        alert(data.error || 'Gagal menyimpan SOP');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungkan ke server');
    } finally {
      setSavingSop(false);
    }
  };

  const runningCount = agents.filter(a => a.status === 'running' || a.status === 'idle').length;
  const errorCount = agents.filter(a => a.status === 'error').length;
  const approvalCount = agents.filter(a => a.status === 'paused').length;

  return (
    <div className="min-h-screen relative font-sans">
      <Header
        title="AI Agents Workforce"
        subtitle="Mission Control Room untuk mengelola seluruh karyawan AI perusahaan Anda"
      />
      <div className="p-8 fade-in max-w-7xl mx-auto space-y-6">
        
        {/* Status Dashboard Summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-light p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-primary">{runningCount} Karyawan Aktif</span>
            </div>
            <div className="flex items-center gap-2.5 border-l border-light pl-6">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold text-primary">{errorCount} Error</span>
            </div>
            <div className="flex items-center gap-2.5 border-l border-light pl-6">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-semibold text-primary">{approvalCount} Butuh Approval</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchAgents}
              className="flex items-center gap-2 px-4 py-2.5 bg-elevated border border-light text-secondary text-sm font-semibold rounded-xl hover:text-primary hover:bg-hover transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus size={14} />
              Tambah Karyawan (AI)
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-500 text-sm flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-secondary">Menghubungkan ke server database agen...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {agents.map(agent => (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                onClick={() => setSelectedAgent(agent)}
              />
            ))}
          </div>
        )}

        {/* Vision Intro Info Card */}
        <div className="bg-primary-glow border border-primary/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-primary font-bold text-base mb-1.5 flex items-center gap-2">
              🤖 Visi Perusahaan Tunggal Terwujud
            </h3>
            <p className="text-secondary text-xs leading-relaxed max-w-3xl">
              Setiap entitas agen AI di atas membaca Standard Operating Procedure (SOP) tertulis 
              yang tersimpan langsung di database. Anda dapat mendefinisikan, menguji, dan melatih 
              mereka ulang dengan mengedit draf SOP mereka. Eksekusi 24/7 dimonitoring asinkron.
            </p>
          </div>
          <button 
            onClick={() => router.push('/workbench')}
            className="text-xs font-bold px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all cursor-pointer whitespace-nowrap"
          >
            Buka Meja Kerja →
          </button>
        </div>
      </div>

      {/* ── MODAL CREATE NEW AGENT ──────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-lg bg-card border border-light rounded-2xl shadow-2xl overflow-hidden m-4 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-light">
              <h3 className="text-primary font-bold text-lg">Deploy Karyawan (AI) Baru</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-secondary hover:text-red-500 transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">Nama Karyawan AI</label>
                <input 
                  type="text" 
                  required
                  placeholder="Misal: HR Assistant, Finance Matcher..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-elevated border border-light rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">Divisi</label>
                  <select 
                    value={newDivisi}
                    onChange={(e) => setNewDivisi(e.target.value)}
                    className="w-full px-4 py-2.5 bg-elevated border border-light rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer"
                  >
                    <option value="FINANCE">Finance & Accounting</option>
                    <option value="HR">Human Resources</option>
                    <option value="PURCHASING">Purchasing / Gudang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">Level Peran</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-elevated border border-light rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer"
                  >
                    <option value="INTERN">Intern (Magang)</option>
                    <option value="STAFF">Staff (Spesialis)</option>
                    <option value="MANAGER">Manager (Pengambil Keputusan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">Tujuan Utama (Goal)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Misal: Membaca email tagihan listrik..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="w-full px-4 py-2.5 bg-elevated border border-light rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">Standard Operating Procedure (SOP - Markdown)</label>
                <textarea 
                  rows={6}
                  required
                  placeholder="Tuliskan prosedur langkah demi langkah yang wajib dipatuhi AI saat bertugas..."
                  value={newSop}
                  onChange={(e) => setNewSop(e.target.value)}
                  className="w-full px-4 py-2.5 bg-elevated border border-light rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none font-mono text-xs"
                />
              </div>

              <div className="px-6 py-4 bg-elevated border-t border-light flex items-center justify-end gap-3 -mx-6 -mb-6">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors">
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Save size={16} />
                  {submitting ? 'Menyebarkan Karyawan...' : 'Simpan & Deploy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL AGENT WORK LOG & SOP EDITOR ────────────────────── */}
      {selectedAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center fade-in">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setSelectedAgent(null)} />
          <div className="relative w-full max-w-3xl bg-card border border-light rounded-2xl shadow-2xl overflow-hidden m-4 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-light">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedAgent.icon}</span>
                <div>
                  <h3 className="text-primary font-bold text-lg leading-tight">{selectedAgent.name}</h3>
                  <span className="text-secondary text-xs">{selectedAgent.type}</span>
                </div>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="text-secondary hover:text-red-500 transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Stats Block */}
              <div className="grid grid-cols-4 gap-4 bg-elevated/40 border border-light p-4 rounded-xl">
                <div className="text-center">
                  <span className="text-secondary text-[10px] uppercase font-bold block mb-1">Hari Ini</span>
                  <span className="text-primary font-stats font-bold text-sm block">{selectedAgent.tasksToday} task</span>
                </div>
                <div className="text-center border-l border-light">
                  <span className="text-secondary text-[10px] uppercase font-bold block mb-1">Total Task</span>
                  <span className="text-primary font-stats font-bold text-sm block">{selectedAgent.tasksCompleted.toLocaleString('id-ID')}</span>
                </div>
                <div className="text-center border-l border-light">
                  <span className="text-secondary text-[10px] uppercase font-bold block mb-1">Uptime</span>
                  <span className="text-emerald-500 font-stats font-bold text-sm block">{selectedAgent.uptime}</span>
                </div>
                <div className="text-center border-l border-light">
                  <span className="text-secondary text-[10px] uppercase font-bold block mb-1">Cost API</span>
                  <span className="text-violet-600 dark:text-violet-400 font-stats font-bold text-sm block">
                    ${selectedAgent.id === 'agent-001' || selectedAgent.id === 'agent-002' || selectedAgent.id === 'agent-003' || selectedAgent.id === 'agent-004' || selectedAgent.id === 'agent-005' || selectedAgent.id === 'agent-006' ? '0.00' : '0.15'}
                  </span>
                </div>
              </div>

              {/* SOP Interactive Section */}
              <div className="bg-elevated/30 border border-light p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-light pb-3">
                  <h4 className="text-primary font-bold text-sm flex items-center gap-2">
                    <BookOpen size={16} className="text-primary" />
                    Standard Operating Procedure (SOP Karyawan)
                  </h4>
                  {isEditingSop ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsEditingSop(false)}
                        className="text-xs px-3 py-1.5 border border-light text-secondary rounded-lg hover:text-primary transition-all"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={handleSaveSop}
                        disabled={savingSop}
                        className="text-xs px-3 py-1.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50"
                      >
                        {savingSop ? 'Menyimpan...' : 'Simpan SOP'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsEditingSop(true)}
                      className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                    >
                      <Edit3 size={12} />
                      Ubah Prosedur (Latih Ulang)
                    </button>
                  )}
                </div>

                {isEditingSop ? (
                  <textarea 
                    rows={8}
                    value={editedSop}
                    onChange={(e) => setEditedSop(e.target.value)}
                    className="w-full p-3 bg-card border border-light rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-primary"
                  />
                ) : (
                  <pre className="text-xs leading-relaxed text-secondary whitespace-pre-wrap font-sans bg-black/10 dark:bg-white/5 p-4 rounded-xl border border-light overflow-x-auto">
                    {agentDetails ? agentDetails.sopMarkdown : selectedAgent.sopMarkdown}
                  </pre>
                )}
              </div>

              {/* Work Log (List of Real Database Tasks) */}
              <div>
                <h4 className="text-primary font-bold text-sm mb-3 flex items-center gap-2">
                  <Activity size={16} className="text-indigo-600 dark:text-violet-400 animate-pulse" />
                  Log Aktivitas Latar Belakang (Real-Time Work Log)
                </h4>

                {loadingDetails ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : agentDetails && agentDetails.tasks && agentDetails.tasks.length > 0 ? (
                  <div className="space-y-4">
                    {agentDetails.tasks.map((task: any) => (
                      <div key={task.id} className="bg-elevated/35 border border-light p-4 rounded-xl text-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-primary font-bold text-sm">{task.title}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            task.status === 'RUNNING' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse' :
                            task.status === 'WAITING_APPROVAL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {task.status === 'COMPLETED' ? 'Selesai' :
                             task.status === 'RUNNING' ? 'Memproses' :
                             task.status === 'WAITING_APPROVAL' ? 'Menunggu Approval' :
                             'Gagal'}
                          </span>
                        </div>

                        <p className="text-secondary text-[11px] leading-relaxed">{task.description}</p>

                        {/* Execution Timeline Steps */}
                        <div className="space-y-2 pt-2 border-t border-light">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-violet-400 block uppercase tracking-wider">Langkah Eksekusi AI Agent:</span>
                          <div className="space-y-3 border-l border-indigo-500/20 ml-2 pl-3">
                            {task.steps.map((step: any) => (
                              <div key={step.id} className="relative text-[11px]">
                                <div className={`absolute -left-[17px] top-1 w-1.5 h-1.5 rounded-full ${step.isError ? 'bg-red-500' : 'bg-indigo-500'}`} />
                                <span className="text-primary font-semibold block">{step.actionName}</span>
                                <div className="text-secondary mt-0.5 space-y-1">
                                  <div><span className="text-muted">Input:</span> <code className="bg-black/10 dark:bg-white/5 px-1 py-0.2 rounded text-[10px]">{step.inputData}</code></div>
                                  <div><span className="text-muted">Output:</span> <code className="bg-black/10 dark:bg-white/5 px-1 py-0.2 rounded text-[10px]">{step.outputData}</code></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-elevated/20 border border-light border-dashed rounded-xl">
                    <span className="text-secondary text-xs">Belum ada riwayat aktivitas log dari agen ini di database.</span>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-elevated border-t border-light flex items-center justify-end">
              <button onClick={() => setSelectedAgent(null)} className="px-6 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer">
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
