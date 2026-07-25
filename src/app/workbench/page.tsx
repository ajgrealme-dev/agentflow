'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Crown, DollarSign, Users, Package, ChevronRight, Sparkles, Search, 
  Play, Pause, Check, X, ShieldAlert, Terminal, MessageSquare, 
  HelpCircle, Eye, AlertCircle
} from 'lucide-react';
import WorkbenchToolCard from '@/components/WorkbenchToolCard';
import type { AdminRole, WorkbenchTool } from '@/lib/types';
import { getRoleConfig, getToolsByCategory, getToolsForRole } from '@/lib/workbench-config';

// Pipeline Node Interface
interface PipelineNode {
  id: string;
  label: string;
  role: string;
  goal: string;
  sop: string;
  status: 'idle' | 'running' | 'paused' | 'error';
  icon: string;
  x?: number;
  y?: number;
  divisi?: string;
}

// Chat log message interface
interface ChatMessage {
  id: string;
  time: string;
  sender: string;
  divisi: 'FINANCE' | 'HR' | 'PURCHASING';
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const INITIAL_CHAT: ChatMessage[] = [
  { id: '1', time: '10:05:12', sender: 'Billing Intern (AI)', divisi: 'FINANCE', message: 'Mendeteksi upload invoice baru berkas-tagihan.pdf. Memulai OCR...', type: 'info' },
  { id: '2', time: '10:05:15', sender: 'Billing Intern (AI)', divisi: 'FINANCE', message: 'Ekstraksi OCR selesai (PT Global Distribusi, Rp 15.000.000). Mengirim ke Tax Staff (AI).', type: 'success' },
  { id: '3', time: '10:05:18', sender: 'Tax Staff (AI)', divisi: 'FINANCE', message: 'Menerima draf invoice. Menjalankan pencocokan PO #PO-GD-098...', type: 'info' },
  { id: '4', time: '10:05:22', sender: 'Tax Staff (AI)', divisi: 'FINANCE', message: '3-Way Match cocok. Meneruskan ke Finance Manager (AI).', type: 'success' },
  { id: '5', time: '10:05:25', sender: 'Finance Manager (AI)', divisi: 'FINANCE', message: 'Invoice nominal Rp 15.000.000 terdeteksi. Melebihi wewenang otomatis (Rp 5jt). Eskalasi ke Manusia (CFO).', type: 'warning' },
];

const SIMULATED_STREAM: ChatMessage[] = [
  { id: 's1', time: '10:08:02', sender: 'Timekeeper Intern (AI)', divisi: 'HR', message: 'Mendapat koordinat GPS absensi Eko Supervisor. Menghitung jarak...', type: 'info' },
  { id: 's2', time: '10:08:05', sender: 'Timekeeper Intern (AI)', divisi: 'HR', message: 'Jarak dihitung: 62.5 meter. Valid (Batas Geofence: 100m). Catat Hadir.', type: 'success' },
  { id: 's3', time: '10:09:12', sender: 'Inventory Staff (AI)', divisi: 'PURCHASING', message: 'Membaca log draf Sales Order SO-2026-002. Membuat draf PR...', type: 'info' },
  { id: 's4', time: '10:09:16', sender: 'Inventory Staff (AI)', divisi: 'PURCHASING', message: 'Draf PR-2026-002 berhasil disimpan dan dihubungkan ke SO-2026-002.', type: 'success' },
  { id: 's5', time: '10:10:01', sender: 'Purchasing Staff (AI)', divisi: 'PURCHASING', message: 'Mendeteksi PR baru berstatus DRAFT. Memulai persiapan RFQ ke supplier...', type: 'info' },
  { id: 's6', time: '10:11:42', sender: 'Billing Intern (AI)', divisi: 'FINANCE', message: 'Gagal memproses file invoice-mismatch.pdf. OCR tidak mendeteksi NPWP vendor.', type: 'error' },
  { id: 's7', time: '10:11:45', sender: 'Billing Intern (AI)', divisi: 'FINANCE', message: 'Tugas di-eskalasikan ke Tax Staff (AI) untuk audit manual.', type: 'warning' },
];

const DIVISION_BASES: Record<string, number> = {
  'LEGAL': 1000,
  'FINANCE': 2200,
  'PURCHASING': 3400,
  'TECH': 4600,
  'STRATEGY': 5800,
  'MARKETING': 7000,
  'CUSTOMER': 8200,
  'HR': 9400
};

const SYNONYMS: Record<string, string[]> = {
  'tax': ['tax', 'perpajakan', 'pajak'],
  'audit': ['audit', 'auditor', 'internal audit'],
  'treasury': ['treasury', 'finance', 'fpa', 'cash', 'kas', 'budgeting', 'analyst', 'financial'],
  'accounting': ['accounting', 'akuntansi', 'akuntan', 'ap', 'ar', 'gl'],
  'legal': ['legal', 'hukum', 'lawyer', 'contract'],
  'tech': ['tech', 'teknologi', 'infrastructure', 'network', 'platform', 'developer', 'programmer', 'ciso', 'soc', 'security', 'it'],
  'purchasing': ['purchasing', 'buyer', 'procurement', 'pembelian', 'gudang', 'warehouse'],
  'marketing': ['marketing', 'pemasaran', 'ads', 'brand', 'pr', 'creative', 'content', 'social'],
  'hr': ['hr', 'chro', 'hrbp', 'recruitment', 'recruiter', 'dei', 'payroll', 'learning', 'ld']
};

function getWords(str: string): string[] {
  return str.toLowerCase().replace(/[^a-z0-9\s/]/g, ' ').split(/\s+/).filter(Boolean);
}

function cleanLaporKe(sopMarkdown: string | null | undefined): string {
  if (!sopMarkdown) return '';
  const match = sopMarkdown.match(/Lapor\s*ke.*/i);
  if (!match) return '';
  let line = match[0];
  let clean = line.replace(/lapor\s*ke/gi, "");
  clean = clean.replace(/^[\s*:*📌*|*\-*]+/g, "").trim();
  clean = clean.replace(/\*\*/g, "").trim();
  if (clean.includes('|')) {
    clean = clean.split('|')[0].trim();
  }
  return clean;
}

function findParentAgent(agent: any, candidates: any[]): any | null {
  const laporTarget = cleanLaporKe(agent.sopMarkdown || agent.sop);
  if (!laporTarget) return null;

  if (laporTarget.toLowerCase() === 'ceo') {
    return candidates.find(c => c.id === 'ceo');
  }

  const options = laporTarget.split('/').map(o => o.trim().toLowerCase());
  let bestScore = -1;
  let bestCandidate = null;

  candidates.forEach(candidate => {
    let score = 0;
    const candName = (candidate.name || candidate.label || '').toLowerCase();
    const candRole = (candidate.role || '').toLowerCase();
    const candWords = getWords(candidate.name || candidate.label || '');

    options.forEach(option => {
      const optWords = getWords(option);

      // 1. Exact abbreviation/word containment match (boosted)
      const matchesAllOptWords = optWords.every(w => candWords.includes(w) || candRole.includes(w) || candName.includes(w));
      if (matchesAllOptWords) {
        score += 150;
      }

      // 2. Partial word match
      const matchingWords = optWords.filter(w => candName.includes(w) || candWords.includes(w) || candRole.includes(w));
      if (matchingWords.length > 0) {
        score += matchingWords.length * 10;
      }

      // 3. Synonym matching boost (within same category)
      Object.entries(SYNONYMS).forEach(([cat, syns]) => {
        const childHasCat = getWords(agent.name || agent.label || '').some(w => syns.includes(w));
        const candHasCat = getWords(candidate.name || candidate.label || '').some(w => syns.includes(w));
        if (childHasCat && candHasCat) {
          score += 15;
        }
      });

      // 4. Role alignment boost
      if (option.includes('manager') && candidate.role === 'MANAGER') score += 5;
      if (option.includes('senior') && candidate.role === 'SENIOR') score += 5;
      if (option.includes('supervisor') && candidate.role === 'SUPERVISOR') score += 5;
      if (option.includes('staff') && candidate.role === 'STAFF') score += 5;
      if (option.includes('intern') && candidate.role === 'INTERN') score += 5;
      if (option.includes('chief') && candidate.role === 'CHIEF') score += 5;
    });

    if (score > bestScore && score > 0) {
      bestScore = score;
      bestCandidate = candidate;
    }
  });

  return bestCandidate;
}

export default function WorkbenchPage() {
  const router = useRouter();
  const [role, setRole] = useState<AdminRole>('admin');
  const [userName, setUserName] = useState('Admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  // Real Database Approvals State
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [resolvingTaskId, setResolvingTaskId] = useState<string | null>(null);

  // Real Multi-Agent Chat Sessions State
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [submittingInput, setSubmittingInput] = useState(false);
  const [showNewRapatModal, setShowNewRapatModal] = useState(false);
  const [newRapatTitle, setNewRapatTitle] = useState('');
  const [newRapatPrompt, setNewRapatPrompt] = useState('');
  const [newRapatPilar, setNewRapatPilar] = useState<'FINANCE' | 'PURCHASING' | 'HR' | 'TECH' | 'MARKETING'>('FINANCE');
  const [sandboxTab, setSandboxTab] = useState<'templates' | 'custom' | 'json'>('templates');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [jsonScenario, setJsonScenario] = useState('');

  // Real DB Agents State for Canvas Graph
  const [dbAgents, setDbAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  // Node details selection
  const [selectedNode, setSelectedNode] = useState<PipelineNode | null>(null);

  // Tools Sandbox states
  const [detailTab, setDetailTab] = useState<'sop' | 'sandbox'>('sop');
  const [sandboxTool, setSandboxTool] = useState<string>('');
  const [sandboxArgs, setSandboxArgs] = useState<Record<string, string>>({});
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [sandboxError, setSandboxError] = useState<string | null>(null);

  // Reset sandbox when switching selected employee node
  useEffect(() => {
    setDetailTab('sop');
    setSandboxTool('');
    setSandboxArgs({});
    setSandboxResult(null);
    setSandboxError(null);
  }, [selectedNode]);

  // Set default parameters when tool changes
  useEffect(() => {
    if (!sandboxTool) {
      setSandboxArgs({});
      setSandboxResult(null);
      setSandboxError(null);
      return;
    }

    const defaults: Record<string, string> = {};
    if (sandboxTool === 'generateRFQ') {
      defaults.vendorName = 'PT Baja Makmur Indonesia';
      defaults.itemsJson = '[\n  {"sku": "BRG-01-STEEL", "name": "Besi Baja H-Beam 200", "qty": 25},\n  {"sku": "BRG-02-CEMENT", "name": "Semen Portland Tiga Roda", "qty": 150}\n]';
    } else if (sandboxTool === 'sortVendorPrices') {
      defaults.sku = 'BRG-01-STEEL';
      defaults.quotesJson = '[\n  {"vendor": "Vendor Global", "price": "48500"},\n  {"vendor": "Vendor Lokal Utama", "price": "52000"},\n  {"vendor": "Distributor Utama Baja", "price": "46900"}\n]';
    } else if (sandboxTool === 'generateSocialCaption') {
      defaults.productName = 'AgentFlow Enterprise Office Automation';
      defaults.tone = 'Kreatif dan Menarik';
    } else if (sandboxTool === 'scrapeKeywordTrends') {
      defaults.keyword = 'otomasi kantor';
    } else if (sandboxTool === 'parseResume') {
      defaults.targetPosition = 'Senior Full Stack Developer AI';
      defaults.requiredSkillsJson = '["React", "Node.js", "PostgreSQL", "Prisma"]';
      defaults.minExperienceYears = '3';
      defaults.resumeText = '';
    } else if (sandboxTool === 'scheduleInterview') {
      defaults.candidateName = 'Aziz Maulana';
      defaults.time = 'Senin, 20 Juli 2026 jam 10.00 WIB';
    } else if (sandboxTool === 'compileAndTestDataform') {
      defaults.branchName = 'feat/security-auth-patch';
    } else if (sandboxTool === 'resetEmployeePassword') {
      defaults.employeeEmail = 'karyawan@example.com';
    } else if (sandboxTool === 'checkServerStatus') {
      defaults.serverIp = '10.102.5.40';
      defaults.checkType = 'PING';
    } else if (sandboxTool === 'verifyContract') {
      defaults.contractText = 'Klausul 12: Penanggung jawab melepaskan semua tanggung jawab hukum apabila sistem mati karena serangan DDOS dan tidak memberikan ganti rugi.';
      defaults.partyName = 'PT Solusi Cloud Nusantara';
    } else if (sandboxTool === 'complianceCheck') {
      defaults.regulation = 'UU PDP 2022';
      defaults.auditScope = 'Sistem Perlindungan Data Nasabah Utama';
    } else if (sandboxTool === 'calculateTax') {
      defaults.grossRevenue = '250000000';
      defaults.taxPeriod = 'Juni 2026';
    } else if (sandboxTool === 'generateCashForecast') {
      defaults.forecastMonths = '6';
      defaults.estimatedGrowth = '12';
    } else if (sandboxTool === 'analyzeTicketSentiment') {
      defaults.ticketDescription = 'Sistem error parah! Saya tidak bisa melakukan transfer transaksi dan dana saya terpotong tanpa ada riwayat status yang jelas! Tolong dikembalikan secepatnya!';
      defaults.priority = 'HIGH';
    } else if (sandboxTool === 'optimizeEcomPricing') {
      defaults.basePrice = '150000';
      defaults.competitorPrice = '140000';
    } else if (sandboxTool === 'evaluateESGImpact') {
      defaults.emissionCo2 = '45';
      defaults.carbonOffsetProject = 'Penanaman Mangrove Karawang';
    } else if (sandboxTool === 'assessBusinessRisk') {
      defaults.acquisitionTarget = 'PT E-Commerce Retail Cepat';
      defaults.dealValue = '12000000000';
    }

    setSandboxArgs(defaults);
    setSandboxResult(null);
    setSandboxError(null);
  }, [sandboxTool]);

  const loadSampleResume = () => {
    setSandboxArgs(prev => ({
      ...prev,
      resumeText: `CV AZIZ MAULANA\nEmail: aziz@example.com\nNo HP: 08123456789\nPengalaman kerja selama 5 tahun di bidang rekayasa perangkat lunak.\nKeahlian: React, Node.js, PostgreSQL, Prisma, Git, Docker, Figma.`
    }));
  };

  const handleRunSandboxTool = async () => {
    if (!selectedNode || !sandboxTool) return;
    setSandboxRunning(true);
    setSandboxResult(null);
    setSandboxError(null);

    try {
      const res = await fetch('/api/agents/test-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedNode.id,
          toolName: sandboxTool,
          args: sandboxArgs
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem.');
      }

      setSandboxResult(data.result);
    } catch (err: any) {
      setSandboxError(err.message || String(err));
    } finally {
      setSandboxRunning(false);
    }
  };

  // Draggable viewport panning & zooming state
  const [pan, setPan] = useState({ x: -1400, y: 80 }); // Initial center offset to show CEO & main branches
  const [zoom, setZoom] = useState(0.4); // Initial zoomed out scale to fit more nodes
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-node') || target.closest('button')) return;
    
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setPan({ x: -1400, y: 80 });
    setZoom(0.4);
  };



  // Fetch pending approvals from DB
  const fetchPendingApprovals = async (silent = false) => {
    try {
      if (!silent) setLoadingTasks(true);
      const res = await fetch('/api/tasks?status=WAITING_APPROVAL&escalatedTo=HUMAN');
      const data = await res.json();
      if (data.success) {
        setPendingTasks(data.tasks);
      }
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      if (!silent) setLoadingTasks(false);
    }
  };

  // Fetch real agent list from DB
  const fetchDbAgents = async () => {
    try {
      setLoadingAgents(true);
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (data.success && Array.isArray(data.agents)) {
        setDbAgents(data.agents);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoadingAgents(false);
    }
  };

  // Fetch real agent chat sessions
  const fetchSessions = async (silent = false) => {
    try {
      if (!silent) setLoadingSessions(true);
      const res = await fetch('/api/agents/session');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSessions(data);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      if (!silent) setLoadingSessions(false);
    }
  };

  useEffect(() => {
    const savedRole = localStorage.getItem('user_role') as AdminRole;
    const savedName = localStorage.getItem('user_name');
    if (savedRole) setRole(savedRole);
    if (savedName) setUserName(savedName);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchPendingApprovals();
      fetchSessions();
      fetchDbAgents();
      
      // Setup live session polling interval (every 12 seconds to reduce terminal logs noise)
      const pollingInterval = setInterval(() => {
        fetchSessions(true);
        fetchPendingApprovals(true);
      }, 12000);

      return () => clearInterval(pollingInterval);
    }
  }, [mounted]);

    // Dynamic layout coordinate calculation for 142 AI agents (Pyramid Tree Structure)
    const computeGraphNodes = (agents: any[]): PipelineNode[] => {
      const nodes: PipelineNode[] = [];
      
      // 1. Add CEO at top center
      nodes.push({
        id: 'ceo',
        label: '👑 CEO / Owner (Aziz Maulana)',
        role: 'CEO',
        goal: 'Pemilik perusahaan & pengawas utama operasional AI.',
        sop: 'Mengawasi kinerja para Chief, menyetujui anggaran besar, & menandatangani kontrak PKWT akhir.',
        status: 'running',
        icon: '👑',
        x: 5200,
        y: 80,
        divisi: 'MANAJEMEN'
      });

      // Role order for sorting levels and vertical y-coordinates
      const roleLevels: Record<string, { y: number, priority: number }> = {
        'CHIEF': { y: 260, priority: 6 },
        'MANAGER': { y: 440, priority: 5 },
        'SUPERVISOR': { y: 620, priority: 4 },
        'SENIOR': { y: 800, priority: 3 },
        'STAFF': { y: 980, priority: 2 },
        'INTERN': { y: 1160, priority: 1 }
      };

      // Spanning horizontal base coordinates for 8 divisions side-by-side
      const divisionBases = DIVISION_BASES;

      // Group agents by division
      const agentsByDiv: Record<string, any[]> = {};
      Object.keys(divisionBases).forEach(div => {
        agentsByDiv[div] = [];
      });

      agents.forEach(agent => {
        const div = (agent.divisi || 'FINANCE').toUpperCase();
        if (agentsByDiv[div]) {
          agentsByDiv[div].push(agent);
        }
      });

      // Layout each division horizontally & vertically as a pyramid
      Object.entries(agentsByDiv).forEach(([divName, divAgents]) => {
        const baseX = divisionBases[divName];

        // Group by role level inside the division
        const byLevel: Record<string, any[]> = {
          'CHIEF': [], 'MANAGER': [], 'SUPERVISOR': [], 'SENIOR': [], 'STAFF': [], 'INTERN': []
        };
        divAgents.forEach(a => {
          const role = (a.role || 'STAFF').toUpperCase();
          if (byLevel[role]) {
            byLevel[role].push(a);
          }
        });

        // Parse parent-child relationships from SOP
        const parentMap: Record<string, string> = {};
        const childrenMap: Record<string, string[]> = {};

        divAgents.forEach(agent => {
          const parentAgent = findParentAgent(agent, divAgents);
          if (parentAgent) {
            parentMap[agent.id] = parentAgent.id;
            if (!childrenMap[parentAgent.id]) childrenMap[parentAgent.id] = [];
            childrenMap[parentAgent.id].push(agent.id);
          }
        });

        // Bottom-up horizontal X coordinate calculation
        const levelsOrder = ['INTERN', 'STAFF', 'SENIOR', 'SUPERVISOR', 'MANAGER', 'CHIEF'];
        
        // Group family trees together by sorting levels by their parent ID
        levelsOrder.forEach(lvl => {
          const levelAgents = byLevel[lvl];
          if (levelAgents.length === 0) return;
          levelAgents.sort((a, b) => {
            const pA = parentMap[a.id] || '';
            const pB = parentMap[b.id] || '';
            return pA.localeCompare(pB);
          });
        });

        // Top-down centered pyramid layout within this division
        const tempX: Record<string, number> = {};
        
        // 1. Identify roots (agents in this division who have no parent in this division, or report to CEO)
        const roots = divAgents.filter(agent => {
          const parentId = parentMap[agent.id];
          return !parentId || !divAgents.some(a => a.id === parentId);
        });

        // Sort roots by role priority to keep chief/manager at the center
        roots.sort((a, b) => {
          const priorityA = roleLevels[a.role || 'STAFF']?.priority || 0;
          const priorityB = roleLevels[b.role || 'STAFF']?.priority || 0;
          return priorityB - priorityA;
        });

        // Position roots centered around baseX
        if (roots.length > 0) {
          const rootSpacing = 280;
          roots.forEach((root, idx) => {
            tempX[root.id] = baseX + (idx - (roots.length - 1) / 2) * rootSpacing;
          });
        }

        // 2. Queue-based top-down propagation centering children under their parent
        const queue = [...roots];
        while (queue.length > 0) {
          const parent = queue.shift()!;
          const parentX = tempX[parent.id] ?? baseX;

          // Find direct children in this division
          const childrenIds = childrenMap[parent.id] || [];
          const children = divAgents.filter(a => childrenIds.includes(a.id));

          if (children.length > 0) {
            // Determine child spacing based on parent's level for pyramid aesthetics
            const parentRole = parent.role || 'STAFF';
            const childSpacing = parentRole === 'CHIEF' ? 280
                              : parentRole === 'MANAGER' ? 220
                              : parentRole === 'SUPERVISOR' ? 190
                              : parentRole === 'SENIOR' ? 170
                              : 150;

            children.forEach((child, idx) => {
              if (tempX[child.id] === undefined) {
                tempX[child.id] = parentX + (idx - (children.length - 1) / 2) * childSpacing;
                queue.push(child);
              }
            });
          }
        }

        // Finalize node coordinates inside the division
        divAgents.forEach(agent => {
          const role = (agent.role || 'STAFF').toUpperCase();
          const y = roleLevels[role]?.y || 620;
          let x = tempX[agent.id] ?? baseX;

          // Resolve overlap by symmetrical horizontal shifting of siblings positioned close to each other
          let attempts = 0;
          let originalX = x;
          while (nodes.some(n => Math.abs((n.x ?? 0) - x) < 185 && Math.abs((n.y ?? 0) - y) < 30) && attempts < 25) {
            attempts++;
            const dir = attempts % 2 === 0 ? 1 : -1;
            const multiplier = Math.ceil(attempts / 2);
            x = originalX + dir * multiplier * 195;
          }

          nodes.push({
            id: agent.id,
            label: agent.name,
            role: agent.role,
            goal: agent.goal,
            sop: agent.sopMarkdown,
            status: agent.status === 'error' ? 'error' : agent.status === 'paused' ? 'paused' : agent.status === 'running' ? 'running' : 'idle',
            icon: agent.icon || '🤖',
            x,
            y,
            divisi: agent.divisi
          });
        });
      });

      return nodes;
    };

  const graphNodes = computeGraphNodes(dbAgents);

  // Auto-center search matched agent
  useEffect(() => {
    if (searchQuery.trim() && graphNodes.length > 0) {
      const q = searchQuery.toLowerCase();
      const matched = graphNodes.find(n => n.label.toLowerCase().includes(q));
      if (matched && matched.x && matched.y) {
        setPan({
          x: 350 - matched.x * zoom,
          y: 280 - matched.y * zoom
        });
      }
    }
  }, [searchQuery, dbAgents]);

  // Draw clean orthogonal step connect lines between hierarchy levels
  const renderOrthogonalLines = () => {
    const paths: React.ReactNode[] = [];
    
    // Trace selected node ancestors
    const activePathConnections = new Set<string>();
    if (selectedNode) {
      let currentId = selectedNode.id;
      let depth = 0;
      while (currentId && depth < 10) {
        depth++;
        const currentNode = graphNodes.find(n => n.id === currentId);
        if (!currentNode) break;
        
        // Find parent
        const parentAgent = findParentAgent(currentNode, graphNodes);
        if (parentAgent) {
          activePathConnections.add(`${parentAgent.id}->${currentId}`);
          currentId = parentAgent.id;
        } else {
          if (currentId !== 'ceo' && (currentNode.role === 'CHIEF' || currentId.includes('chief'))) {
            activePathConnections.add(`ceo->${currentId}`);
            currentId = 'ceo';
          } else {
            break;
          }
        }
      }
    }

    graphNodes.forEach(node => {
      if (node.id === 'ceo' || !node.x || !node.y) return;

      // Try to find parent agent in the same division
      const divNodes = graphNodes.filter(n => n.divisi === node.divisi && n.id !== node.id);
      let parentNode = findParentAgent(node, divNodes);

      // If Chief or no parent matched, default direct link to CEO
      if (!parentNode && (node.role === 'CHIEF' || node.id?.includes('chief'))) {
        parentNode = graphNodes.find(n => n.id === 'ceo');
      }

      if (parentNode && parentNode.x && parentNode.y) {
        const x1 = parentNode.x;
        const y1 = parentNode.y + 20;
        const x2 = node.x;
        const y2 = node.y - 20;
        const ctrlY = (y1 + y2) / 2;

        let strokeColor = 'var(--canvas-line)';
        if (node.divisi === 'FINANCE') strokeColor = 'var(--canvas-line-finance)';
        else if (node.divisi === 'PURCHASING') strokeColor = 'var(--canvas-line-purchasing)';
        else if (node.divisi === 'MARKETING') strokeColor = 'var(--canvas-line-marketing)';
        else if (node.divisi === 'HR') strokeColor = 'var(--canvas-line-hr)';
        else if (node.divisi === 'TECH') strokeColor = 'var(--canvas-line-tech)';
        else if (node.divisi === 'LEGAL') strokeColor = 'var(--canvas-line-legal)';
        else if (node.divisi === 'CUSTOMER') strokeColor = 'var(--canvas-line-customer)';
        else if (node.divisi === 'STRATEGY') strokeColor = 'var(--canvas-line-strategy)';

        const isActive = activePathConnections.has(`${parentNode.id}->${node.id}`);

        // 1. Background static faint line
        paths.push(
          <path
            key={`path-bg-${parentNode.id}-${node.id}`}
            d={`M ${x1} ${y1} L ${x1} ${ctrlY} L ${x2} ${ctrlY} L ${x2} ${y2}`}
            stroke={strokeColor}
            strokeWidth={isActive ? "2.6" : "1.8"}
            fill="none"
            opacity={isActive ? "0.85" : "0.35"}
            className="transition-all duration-300"
          />
        );

        // 2. Animated flow line moving UPWARDS (from child x2,y2 to parent x1,y1)
        paths.push(
          <path
            key={`path-flow-${parentNode.id}-${node.id}`}
            d={`M ${x2} ${y2} L ${x2} ${ctrlY} L ${x1} ${ctrlY} L ${x1} ${y1}`}
            stroke={strokeColor}
            strokeWidth={isActive ? "2.8" : "1.8"}
            fill="none"
            opacity={isActive ? "1" : "0.7"}
            className={`fill-none transition-all duration-300 ${isActive ? 'flow-line-pulse' : 'animate-flow-up'}`}
          />
        );
      }
    });

    return paths;
  };

  // Auto-scroll chat log on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [sessions, selectedSessionId]);

  // Predefined templates helper for Simulation Sandbox
  const handleLaunchTemplate = async (title: string, prompt: string, pilar: string) => {
    try {
      setSubmittingInput(true);
      const pilarAgents = dbAgents.filter(a => (a.divisi || 'FINANCE').toUpperCase() === pilar.toUpperCase());
      const chosen: any[] = [];
      const levels = ['CHIEF', 'MANAGER', 'SUPERVISOR', 'SENIOR', 'STAFF', 'INTERN'];
      levels.forEach(lv => {
        const match = pilarAgents.find(a => (a.role || '').toUpperCase() === lv);
        if (match && !chosen.some(c => c.name === match.name)) {
          chosen.push({ name: match.name, role: match.role, type: 'AI' });
        }
      });

      let participants = chosen;
      if (participants.length === 0) {
        if (pilar === 'FINANCE') {
          participants = [
            { name: "Finance Manager (AI)", role: "MANAGER", type: "AI" },
            { name: "Tax & Reconciliation Staff (AI)", role: "STAFF", type: "AI" },
            { name: "Billing & Invoice Intern (AI)", role: "INTERN", type: "AI" }
          ];
        } else if (pilar === 'PURCHASING') {
          participants = [
            { name: "Procurement Manager (AI)", role: "MANAGER", type: "AI" },
            { name: "Purchasing Specialist (AI)", role: "STAFF", type: "AI" },
            { name: "Supplier Relations Intern (AI)", role: "INTERN", type: "AI" }
          ];
        } else if (pilar === 'HR') {
          participants = [
            { name: "HR Operations Manager (AI)", role: "MANAGER", type: "AI" },
            { name: "Payroll & Attendance Staff (AI)", role: "STAFF", type: "AI" },
            { name: "Timekeeper Intern (AI)", role: "INTERN", type: "AI" }
          ];
        } else {
          participants = [
            { name: "Finance Manager (AI)", role: "MANAGER", type: "AI" },
            { name: "Tax & Reconciliation Staff (AI)", role: "STAFF", type: "AI" }
          ];
        }
      }

      const res = await fetch('/api/agents/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          participants,
          initialMessage: prompt
        })
      });

      const data = await res.json();
      if (data && data.id) {
        setSelectedSessionId(data.id);
        fetchSessions();
        setShowNewRapatModal(false);
      } else {
        alert('Gagal meluncurkan skenario simulasi.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungi server.');
    } finally {
      setSubmittingInput(false);
    }
  };

  // Handle start new multi-agent rapat
  const handleStartNewRapat = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sandboxTab === 'json') {
      try {
        setSubmittingInput(true);
        const scenario = JSON.parse(jsonScenario);
        if (!scenario.title || !scenario.initialMessage || !Array.isArray(scenario.participants)) {
          alert('Format JSON salah. Wajib memiliki field: "title", "initialMessage", dan "participants" (array).');
          setSubmittingInput(false);
          return;
        }

        const res = await fetch('/api/agents/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: scenario.title,
            participants: scenario.participants,
            initialMessage: scenario.initialMessage
          })
        });

        const data = await res.json();
        if (data && data.id) {
          setSelectedSessionId(data.id);
          fetchSessions();
          setShowNewRapatModal(false);
          setJsonScenario('');
        } else {
          alert('Gagal membuat sesi rapat dari JSON.');
        }
      } catch (err) {
        alert('Gagal mengurai JSON: ' + String(err));
      } finally {
        setSubmittingInput(false);
      }
      return;
    }

    if (sandboxTab === 'custom') {
      if (!newRapatTitle.trim() || !newRapatPrompt.trim()) return;
      if (selectedAgents.length === 0) {
        alert('Pilih minimal 1 Agen AI untuk bergabung dalam rapat kustom.');
        return;
      }

      try {
        setSubmittingInput(true);
        const participants = selectedAgents.map(id => {
          const agent = dbAgents.find(a => a.id === id);
          return {
            name: agent.name,
            role: agent.role,
            type: 'AI'
          };
        });

        const res = await fetch('/api/agents/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newRapatTitle,
            participants,
            initialMessage: newRapatPrompt
          })
        });

        const data = await res.json();
        if (data && data.id) {
          setSelectedSessionId(data.id);
          fetchSessions();
          setShowNewRapatModal(false);
          setNewRapatTitle('');
          setNewRapatPrompt('');
          setSelectedAgents([]);
        } else {
          alert('Gagal membuat sesi rapat kustom.');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal menghubungi server.');
      } finally {
        setSubmittingInput(false);
      }
      return;
    }

    // Default / templates fallback
    if (!newRapatTitle.trim() || !newRapatPrompt.trim()) return;

    try {
      setSubmittingInput(true);
      
      // Ambil perwakilan pilar karyawan dari database
      const pilarAgents = dbAgents.filter(a => (a.divisi || 'FINANCE').toUpperCase() === newRapatPilar);
      const chosen: any[] = [];
      const levels = ['CHIEF', 'MANAGER', 'SUPERVISOR', 'SENIOR', 'STAFF', 'INTERN'];
      
      levels.forEach(lv => {
        const match = pilarAgents.find(a => (a.role || '').toUpperCase() === lv);
        if (match && !chosen.some(c => c.name === match.name)) {
          chosen.push({
            name: match.name,
            role: match.role,
            type: 'AI'
          });
        }
      });

      // Fallback jika tidak ada data di DB
      let participants = chosen;
      if (participants.length === 0) {
        if (newRapatPilar === 'FINANCE') {
          participants = [
            { name: "Finance Manager (AI)", role: "MANAGER", type: "AI" },
            { name: "Tax & Reconciliation Staff (AI)", role: "STAFF", type: "AI" },
            { name: "Billing & Invoice Intern (AI)", role: "INTERN", type: "AI" }
          ];
        } else if (newRapatPilar === 'PURCHASING') {
          participants = [
            { name: "Procurement Manager (AI)", role: "MANAGER", type: "AI" },
            { name: "Purchasing Specialist (AI)", role: "STAFF", type: "AI" },
            { name: "Supplier Relations Intern (AI)", role: "INTERN", type: "AI" }
          ];
        } else if (newRapatPilar === 'HR') {
          participants = [
            { name: "HR Operations Manager (AI)", role: "MANAGER", type: "AI" },
            { name: "Payroll & Attendance Staff (AI)", role: "STAFF", type: "AI" },
            { name: "Timekeeper Intern (AI)", role: "INTERN", type: "AI" }
          ];
        } else if (newRapatPilar === 'TECH') {
          participants = [
            { name: "IT Infrastructure Manager (AI)", role: "MANAGER", type: "AI" },
            { name: "Network Administrator Staff (AI)", role: "STAFF", type: "AI" },
            { name: "Magang Jaringan / Infrastruktur IT (AI)", role: "INTERN", type: "AI" }
          ];
        } else {
          participants = [
            { name: "Finance Manager (AI)", role: "MANAGER", type: "AI" },
            { name: "Tax & Reconciliation Staff (AI)", role: "STAFF", type: "AI" }
          ];
        }
      }

      const res = await fetch('/api/agents/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newRapatTitle,
          participants,
          initialMessage: newRapatPrompt
        })
      });

      const data = await res.json();
      if (data && data.id) {
        setSelectedSessionId(data.id);
        fetchSessions();
        setShowNewRapatModal(false);
        setNewRapatTitle('');
        setNewRapatPrompt('');
      } else {
        alert('Gagal membuat sesi rapat baru.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungi server.');
    } finally {
      setSubmittingInput(false);
    }
  };

  // Handle human reply to paused multi-agent session
  const handleSendHumanInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || !userInput.trim()) return;

    try {
      setSubmittingInput(true);
      const res = await fetch('/api/agents/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          userInput: userInput
        })
      });

      const data = await res.json();
      if (data && data.id) {
        setUserInput('');
        fetchSessions(true);
      } else {
        alert('Gagal mengirimkan tanggapan Anda.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungi server.');
    } finally {
      setSubmittingInput(false);
    }
  };

  // Handle human approvals (Legacy task desk)
  const handleResolveTask = async (taskId: string, decision: 'COMPLETED' | 'FAILED', note: string) => {
    try {
      setResolvingTaskId(taskId);
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          status: decision,
          decisionNote: note,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingTasks(prev => prev.filter(t => t.id !== taskId));
      } else {
        alert(data.error || 'Gagal mengirim keputusan');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungi server database');
    } finally {
      setResolvingTaskId(null);
    }
  };

  const roleConfig = getRoleConfig(role);
  const toolsByCategory = getToolsByCategory(role);
  const allRoleTools = getToolsForRole(role);
  const totalTools = allRoleTools.length;
  const availableTools = allRoleTools.filter((t) => t.status === 'available').length;

  // Filter tools by search
  const filteredCategories: Record<string, WorkbenchTool[]> = {};
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    for (const [cat, tools] of Object.entries(toolsByCategory)) {
      const filtered = tools.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
      if (filtered.length > 0) filteredCategories[cat] = filtered;
    }
  } else {
    Object.assign(filteredCategories, toolsByCategory);
  }

  if (!mounted) return null;

  // Node bubble renderer
  const renderNode = (node: PipelineNode) => {
    const isSelected = selectedNode?.id === node.id;
    let borderColor = 'var(--border)';
    
    if (isSelected) {
      borderColor = roleConfig.accentColor;
    } else if (node.id === 'ceo') {
      borderColor = '#eab308'; // Gold for CEO
    } else {
      // Color-code by division
      const div = (node.divisi || 'FINANCE').toUpperCase();
      if (div === 'FINANCE') borderColor = '#10b981'; // Emerald
      else if (div === 'PURCHASING') borderColor = '#f59e0b'; // Amber
      else if (div === 'MARKETING') borderColor = '#ec4899'; // Pink
      else if (div === 'HR') borderColor = '#f43f5e'; // Rose
      else if (div === 'TECH') borderColor = '#8b5cf6'; // Violet
      else if (div === 'LEGAL') borderColor = '#f97316'; // Orange
      else if (div === 'CUSTOMER') borderColor = '#06b6d4'; // Cyan
      else if (div === 'STRATEGY') borderColor = '#84cc16'; // Lime
    }

    return (
      <div
        key={node.id}
        onClick={() => setSelectedNode(node)}
        className="flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 hover:scale-105 group"
        style={{ width: '135px' }}
      >
        {/* Bubble */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg relative transition-all"
          style={{
            background: 'var(--bg-card)',
            border: `2px solid ${borderColor}`,
            boxShadow: isSelected ? `0 0 14px 2px ${borderColor}66` : 'none',
          }}
        >
          {node.icon}
          {node.status === 'running' && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-black" />
          )}
          {node.status === 'paused' && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse border border-black" />
          )}
        </div>

        {/* Name */}
        <span 
          className="text-[9px] font-bold text-center leading-tight w-full line-clamp-2 px-0.5 group-hover:text-primary transition-colors"
          style={{ color: isSelected ? roleConfig.accentColor : 'var(--text-primary)' }}
        >
          {node.label}
        </span>
        {/* Role tag */}
        <span 
          className="text-[7.5px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded border"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            color: isSelected ? roleConfig.accentColor : 'var(--text-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          {node.role}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative font-sans">
      
      {/* ── TOP HERO HEADER ─────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${roleConfig.accentColor}10 0%, transparent 60%)`,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="relative z-10 px-8 pt-8 pb-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            <span>AgentFlow Enterprise</span>
            <ChevronRight size={12} />
            <span style={{ color: roleConfig.accentColor }}>Mission Control Center</span>
          </div>

          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
                  Mission Control Center (Meja Kerja)
                </h1>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full animate-pulse font-heading"
                  style={{
                    background: roleConfig.accentGlow,
                    color: roleConfig.accentColor,
                    border: `1px solid ${roleConfig.accentColor}33`,
                  }}
                >
                  {roleConfig.label}
                </span>
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                Pengawasan terpusat 24/7 asinkron terhadap seluruh koloni AI Agent perusahaan Anda.
              </p>
            </div>
            
            {/* Real Uptime indicator */}
            <div className="flex items-center gap-3 bg-card border border-light p-3 rounded-xl">
              <span className="live-badge">Sistem Online</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{dbAgents.length} AI Karyawan Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MISSION CONTROL CENTER LAYOUT ───────────────────────── */}
      <div className="px-8 pt-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div data-tour="workbench-tools" className="lg:col-span-2 space-y-6 flex flex-col">
          <div className="bg-card border border-light rounded-2xl p-6 shadow-sm flex-1">
            <h3 className="text-white font-bold text-sm mb-5 flex items-center gap-2 font-heading">
              <Terminal size={16} style={{ color: roleConfig.accentColor }} />
              Peta Alur Kerja Karyawan AI (Workflows Node Graph)
            </h3>

            {/* Draggable/Pannable Org Chart Viewport */}
            <div 
              ref={canvasRef}
              data-tour="workbench-graph"
              className="relative select-none overflow-hidden cursor-grab active:cursor-grabbing border border-light/50 rounded-2xl h-[650px] w-full mt-4"
              style={{ background: 'var(--bg-elevated)' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Reset Viewport button & Instructions */}
              <div className="absolute top-3 left-3 z-30 flex items-center gap-2 opacity-30 hover:opacity-100 transition-all duration-300">
                <button 
                  onClick={handleReset}
                  className="px-2 py-1 bg-elevated/80 border border-light text-[9px] text-secondary rounded hover:bg-hover active:scale-95 transition-all cursor-pointer font-heading"
                >
                  Reset
                </button>
                <div className="px-2 py-1 bg-elevated/80 border border-light rounded flex items-center gap-1.5 text-secondary text-[9px] backdrop-blur-sm">
                  <span className="text-muted font-bold">🔍 ZOOM</span>
                  <input 
                    type="range" 
                    min="0.15" 
                    max="1.5" 
                    step="0.05"
                    value={zoom} 
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-16 accent-primary h-0.5 bg-border rounded cursor-pointer outline-none"
                  />
                  <span className="font-mono text-[9px] w-8 text-right">{Math.round(zoom * 100)}%</span>
                </div>
              </div>

              {/* Draggable Canvas container */}
              <div 
                className="absolute origin-top-left transition-transform duration-75 ease-out p-12 w-[9000px] h-[1400px]"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  left: '0px',
                  top: '0px',
                  backgroundColor: 'var(--bg-elevated)'
                }}
              >
                {/* Radial grid lines background */}
                <div 
                  className="absolute inset-0 [background-size:24px_24px] pointer-events-none" 
                  style={{ backgroundImage: 'var(--canvas-grid)' }}
                />

                 {/* SVG Orthogonal Connection lines */}
                <svg className="absolute inset-0 pointer-events-none w-[9000px] h-[1400px]">
                  {renderOrthogonalLines()}
                </svg>

                {/* Render nodes positioned absolutely */}
                {graphNodes.map(node => (
                  <div
                    key={node.id}
                    className="absolute interactive-node"
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {renderNode(node)}
                  </div>
                ))}

                {/* Division headers positioned absolutely at the top of columns */}
                {Object.entries(DIVISION_BASES).map(([divName, baseX]) => (
                  <div
                    key={`header-${divName}`}
                    className="absolute text-center select-none pointer-events-none transition-all duration-300"
                    style={{
                      left: `${baseX}px`,
                      top: '180px',
                      transform: 'translate(-50%, -50%)',
                      width: '260px'
                    }}
                  >
                    <div className="font-heading font-black tracking-widest text-[10px] text-muted uppercase border border-light/60 px-4 py-1.5 bg-card rounded-full shadow-sm">
                      DIVISI {divName}
                    </div>
                  </div>
                ))}
              </div>

              {/* Horizontal Scroll/Pan Slider (Controls X axis panning) */}
              <div className="absolute bottom-1 left-8 right-8 z-30 flex items-center gap-2 opacity-10 hover:opacity-100 transition-all duration-300 px-2 py-1 bg-elevated/40 hover:bg-elevated/80 rounded border border-transparent hover:border-light backdrop-blur-sm">
                <span className="text-[8px] text-muted font-bold font-stats">SCROLL X</span>
                <input 
                  type="range" 
                  min="-8000" 
                  max="0" 
                  value={pan.x} 
                  onChange={(e) => setPan(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                  className="w-full accent-primary h-0.5 bg-border rounded cursor-pointer outline-none"
                />
              </div>

              {/* Vertical Scroll/Pan Slider (Controls Y axis panning) */}
              <div className="absolute right-1 top-8 bottom-8 z-30 flex flex-col items-center gap-2 opacity-10 hover:opacity-100 transition-all duration-300 py-2 px-1 bg-elevated/40 hover:bg-elevated/80 rounded border border-transparent hover:border-light backdrop-blur-sm">
                <span className="text-[8px] text-muted font-bold font-stats [writing-mode:vertical-lr] rotate-180">SCROLL Y</span>
                <input 
                  type="range" 
                  min="-1200" 
                  max="300" 
                  value={pan.y} 
                  onChange={(e) => setPan(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                  className="h-full accent-primary w-0.5 bg-border rounded cursor-pointer outline-none"
                  style={{ transform: 'rotate(180deg)', appearance: 'slider-vertical' as any, WebkitAppearance: 'slider-vertical' }}
                />
              </div>
            </div>
            
            <p className="text-[10px] text-muted italic mt-4 font-sans">
              * Klik pada lingkaran node di atas untuk menampilkan detail SOP &amp; goal pengerjaan AI terkait.
            </p>
          </div>

          {/* Node detail card (displayed when a node is clicked) */}
          {selectedNode && (
            <div className="bg-elevated border border-light p-5 rounded-2xl shadow-sm space-y-3 fade-in">
              <div className="flex items-start justify-between border-b border-light pb-2">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{selectedNode.icon}</span>
                    {selectedNode.label}
                  </h4>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{selectedNode.role}</span>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="text-secondary hover:text-primary transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Tab Selector if agent has tools (Show for all AI Agents, except CEO) */}
              {selectedNode.id !== 'ceo' ? (
                <div className="flex border-b border-light pb-1 mb-2">
                  <button 
                    onClick={() => setDetailTab('sop')}
                    className={`px-3 py-1.5 text-xs font-bold font-heading border-b-2 transition-all cursor-pointer ${
                      detailTab === 'sop' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-white'
                    }`}
                  >
                    SOP &amp; Sasaran
                  </button>
                  <button 
                    onClick={() => setDetailTab('sandbox')}
                    className={`px-3 py-1.5 text-xs font-bold font-heading border-b-2 transition-all cursor-pointer ${
                      detailTab === 'sandbox' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-white'
                    }`}
                  >
                    🔧 Uji Coba Tools
                  </button>
                </div>
              ) : null}

              {detailTab === 'sop' || selectedNode.id === 'ceo' ? (
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-muted block font-bold">Sasaran Kerja (Goal):</span>
                    <p className="text-secondary leading-relaxed mt-0.5">{selectedNode.goal}</p>
                  </div>
                  <div>
                    <span className="text-muted block font-bold">Standard Operating Procedure (SOP):</span>
                    <p className="text-secondary leading-relaxed mt-0.5 bg-card/60 p-2.5 rounded-lg border border-light font-mono text-[10px] max-h-[150px] overflow-y-auto">
                      {selectedNode.sop}
                    </p>
                  </div>
                </div>
              ) : (
                /* Sandbox Tab Content */
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-muted block font-bold mb-1">Pilih Alat Kerja (Tool):</label>
                    <select
                      value={sandboxTool}
                      onChange={(e) => setSandboxTool(e.target.value)}
                      className="w-full bg-card border border-light rounded-lg p-2 text-xs text-white outline-none focus:border-primary"
                    >
                      <option value="">-- Pilih Tool --</option>
                      {selectedNode.divisi?.toUpperCase() === 'PURCHASING' && (
                        <>
                          <option value="generateRFQ">generateRFQ (Buat RFQ PDF)</option>
                          <option value="sortVendorPrices">sortVendorPrices (Audit Harga)</option>
                        </>
                      )}
                      {selectedNode.divisi?.toUpperCase() === 'MARKETING' && (
                        <>
                          <option value="generateSocialCaption">generateSocialCaption (Draft Caption)</option>
                          <option value="scrapeKeywordTrends">scrapeKeywordTrends (Riset SEO)</option>
                        </>
                      )}
                      {selectedNode.divisi?.toUpperCase() === 'HR' && (
                        <>
                          <option value="parseResume">parseResume (Skrining CV)</option>
                          <option value="scheduleInterview">scheduleInterview (Jadwal Interview)</option>
                        </>
                      )}
                      {selectedNode.divisi?.toUpperCase() === 'TECH' && (
                        <>
                          <option value="compileAndTestDataform">compileAndTestDataform (Uji Pipeline Dataform)</option>
                          <option value="checkServerStatus">checkServerStatus (Audit Status Server)</option>
                          <option value="resetEmployeePassword">resetEmployeePassword (Reset Sandi Karyawan)</option>
                        </>
                      )}
                      {selectedNode.divisi?.toUpperCase() === 'LEGAL' && (
                        <>
                          <option value="verifyContract">verifyContract (Analisis Hukum Kontrak)</option>
                          <option value="complianceCheck">complianceCheck (Audit Kepatuhan GRC)</option>
                        </>
                      )}
                      {selectedNode.divisi?.toUpperCase() === 'FINANCE' && (
                        <>
                          <option value="calculateTax">calculateTax (Estimasi PPN &amp; PPh)</option>
                          <option value="generateCashForecast">generateCashForecast (Proyeksi FP&amp;A)</option>
                        </>
                      )}
                      {selectedNode.divisi?.toUpperCase() === 'CUSTOMER' && (
                        <>
                          <option value="analyzeTicketSentiment">analyzeTicketSentiment (Analisis Keluhan)</option>
                          <option value="optimizeEcomPricing">optimizeEcomPricing (Optimasi Harga Jual)</option>
                        </>
                      )}
                      {selectedNode.divisi?.toUpperCase() === 'STRATEGY' && (
                        <>
                          <option value="evaluateESGImpact">evaluateESGImpact (Evaluasi Nilai ESG)</option>
                          <option value="assessBusinessRisk">assessBusinessRisk (Analisis Risiko M&amp;A)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {sandboxTool && (
                    <div className="space-y-2 bg-card/30 border border-light p-3 rounded-xl">
                      <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2 border-b border-light/50 pb-1">
                        Parameter Input
                      </div>

                      {/* generateRFQ Fields */}
                      {sandboxTool === 'generateRFQ' && (
                        <>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Nama Vendor:</label>
                            <input
                              type="text"
                              value={sandboxArgs.vendorName || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, vendorName: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Daftar Barang (JSON Array):</label>
                            <textarea
                              rows={4}
                              value={sandboxArgs.itemsJson || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, itemsJson: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                        </>
                      )}

                      {/* sortVendorPrices Fields */}
                      {sandboxTool === 'sortVendorPrices' && (
                        <>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">SKU Barang:</label>
                            <input
                              type="text"
                              value={sandboxArgs.sku || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, sku: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Daftar Penawaran Harga (JSON Array):</label>
                            <textarea
                              rows={4}
                              value={sandboxArgs.quotesJson || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, quotesJson: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                        </>
                      )}

                      {/* generateSocialCaption Fields */}
                      {sandboxTool === 'generateSocialCaption' && (
                        <>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Nama Produk:</label>
                            <input
                              type="text"
                              value={sandboxArgs.productName || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, productName: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Tone Bahasa:</label>
                            <select
                              value={sandboxArgs.tone || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, tone: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            >
                              <option value="Kreatif dan Menarik">Kreatif dan Menarik</option>
                              <option value="Profesional B2B">Profesional B2B</option>
                              <option value="Lucu dan Viral">Lucu dan Viral</option>
                              <option value="Edukasi Formal">Edukasi Formal</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* scrapeKeywordTrends Fields */}
                      {sandboxTool === 'scrapeKeywordTrends' && (
                        <div>
                          <label className="text-muted block mb-0.5 font-semibold">Kata Kunci Iklan:</label>
                          <input
                            type="text"
                            value={sandboxArgs.keyword || ''}
                            onChange={(e) => setSandboxArgs(prev => ({ ...prev, keyword: e.target.value }))}
                            className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      )}

                      {/* parseResume Fields */}
                      {sandboxTool === 'parseResume' && (
                        <>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-muted block font-semibold">Teks CV/Resume:</label>
                            <button
                              type="button"
                              onClick={loadSampleResume}
                              className="text-[9px] bg-primary/20 hover:bg-primary/35 text-primary border border-primary/30 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                            >
                              Muat Contoh CV
                            </button>
                          </div>
                          <textarea
                            rows={4}
                            value={sandboxArgs.resumeText || ''}
                            onChange={(e) => setSandboxArgs(prev => ({ ...prev, resumeText: e.target.value }))}
                            placeholder="Klik 'Muat Contoh CV' atau paste teks CV pelamar di sini..."
                            className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white font-mono"
                          />
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <div className="col-span-2">
                              <label className="text-[10px] text-muted block font-semibold">Target Jabatan:</label>
                              <input
                                type="text"
                                value={sandboxArgs.targetPosition || ''}
                                onChange={(e) => setSandboxArgs(prev => ({ ...prev, targetPosition: e.target.value }))}
                                className="w-full bg-card border border-light rounded px-1.5 py-1 text-[10px] text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted block font-semibold">Min. Exp:</label>
                              <input
                                type="number"
                                value={sandboxArgs.minExperienceYears || ''}
                                onChange={(e) => setSandboxArgs(prev => ({ ...prev, minExperienceYears: e.target.value }))}
                                className="w-full bg-card border border-light rounded px-1.5 py-1 text-[10px] text-white"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* scheduleInterview Fields */}
                      {sandboxTool === 'scheduleInterview' && (
                        <>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Nama Kandidat:</label>
                            <input
                              type="text"
                              value={sandboxArgs.candidateName || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, candidateName: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Jadwal Wawancara:</label>
                            <input
                              type="text"
                              value={sandboxArgs.time || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, time: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </>
                      )}

                      {/* compileAndTestDataform Fields */}
                      {sandboxTool === 'compileAndTestDataform' && (
                        <div>
                          <label className="text-muted block mb-0.5 font-semibold">Nama Git Branch:</label>
                          <input
                            type="text"
                            value={sandboxArgs.branchName || ''}
                            onChange={(e) => setSandboxArgs(prev => ({ ...prev, branchName: e.target.value }))}
                            className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                      )}

                      {/* resetEmployeePassword Fields */}
                      {sandboxTool === 'resetEmployeePassword' && (
                        <div>
                          <label className="text-muted block mb-0.5 font-semibold">Email Karyawan:</label>
                          <input
                            type="email"
                            value={sandboxArgs.employeeEmail || ''}
                            onChange={(e) => setSandboxArgs(prev => ({ ...prev, employeeEmail: e.target.value }))}
                            className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                      )}

                      {/* checkServerStatus Fields */}
                      {sandboxTool === 'checkServerStatus' && (
                        <>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">IP Server / Host:</label>
                            <input
                              type="text"
                              value={sandboxArgs.serverIp || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, serverIp: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Tipe Audit:</label>
                            <select
                              value={sandboxArgs.checkType || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, checkType: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            >
                              <option value="PING">PING (Cek Koneksi Paket ICMP)</option>
                              <option value="HTTP">HTTP (Audit Respon Gateway / Port 80)</option>
                              <option value="SSL">SSL (Verifikasi Kedaluwarsa Sertifikat)</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* verifyContract Fields */}
                      {sandboxTool === 'verifyContract' && (
                        <>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Teks Klausul Kontrak:</label>
                            <textarea
                              rows={3}
                              value={sandboxArgs.contractText || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, contractText: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Nama Pihak Kedua:</label>
                            <input
                              type="text"
                              value={sandboxArgs.partyName || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, partyName: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </>
                      )}

                      {/* complianceCheck Fields */}
                      {sandboxTool === 'complianceCheck' && (
                        <>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Pilih Regulasi Acuan:</label>
                            <select
                              value={sandboxArgs.regulation || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, regulation: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            >
                              <option value="UU PDP 2022">UU Pelindungan Data Pribadi (UU PDP 2022)</option>
                              <option value="GDPR">General Data Protection Regulation (GDPR)</option>
                              <option value="POJK GRC">Peraturan Otoritas Jasa Keuangan (POJK GRC)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Ruang Lingkup Sistem:</label>
                            <input
                              type="text"
                              value={sandboxArgs.auditScope || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, auditScope: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </>
                      )}

                      {/* calculateTax Fields */}
                      {sandboxTool === 'calculateTax' && (
                        <>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Pendapatan Kotor Bulanan (Rp):</label>
                            <input
                              type="number"
                              value={sandboxArgs.grossRevenue || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, grossRevenue: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Masa / Periode Pajak:</label>
                            <input
                              type="text"
                              value={sandboxArgs.taxPeriod || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, taxPeriod: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </>
                      )}

                      {/* generateCashForecast Fields */}
                      {sandboxTool === 'generateCashForecast' && (
                        <>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Jangka Waktu Proyeksi (Bulan):</label>
                            <input
                              type="number"
                              value={sandboxArgs.forecastMonths || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, forecastMonths: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Asumsi Pertumbuhan (%) per Bulan:</label>
                            <input
                              type="number"
                              value={sandboxArgs.estimatedGrowth || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, estimatedGrowth: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                        </>
                      )}

                      {/* analyzeTicketSentiment Fields */}
                      {sandboxTool === 'analyzeTicketSentiment' && (
                        <>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Teks Keluhan / Tiket CS:</label>
                            <textarea
                              rows={3}
                              value={sandboxArgs.ticketDescription || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, ticketDescription: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Skala Prioritas:</label>
                            <select
                              value={sandboxArgs.priority || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, priority: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            >
                              <option value="LOW">LOW (Biasa)</option>
                              <option value="MEDIUM">MEDIUM (Penting)</option>
                              <option value="HIGH">HIGH (Darurat / Critical)</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* optimizeEcomPricing Fields */}
                      {sandboxTool === 'optimizeEcomPricing' && (
                        <>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Harga Modal Pokok (Rp):</label>
                            <input
                              type="number"
                              value={sandboxArgs.basePrice || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, basePrice: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Harga Jual Kompetitor (Rp):</label>
                            <input
                              type="number"
                              value={sandboxArgs.competitorPrice || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, competitorPrice: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                        </>
                      )}

                      {/* evaluateESGImpact Fields */}
                      {sandboxTool === 'evaluateESGImpact' && (
                        <>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Rerata Emisi CO2 per Bulan (Ton):</label>
                            <input
                              type="number"
                              value={sandboxArgs.emissionCo2 || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, emissionCo2: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Proyek Carbon Offset Target:</label>
                            <input
                              type="text"
                              value={sandboxArgs.carbonOffsetProject || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, carbonOffsetProject: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </>
                      )}

                      {/* assessBusinessRisk Fields */}
                      {sandboxTool === 'assessBusinessRisk' && (
                        <>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Nama Perusahaan Target Akuisisi:</label>
                            <input
                              type="text"
                              value={sandboxArgs.acquisitionTarget || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, acquisitionTarget: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-muted block mb-0.5 font-semibold">Nilai Transaksi Kesepakatan (Rp):</label>
                            <input
                              type="number"
                              value={sandboxArgs.dealValue || ''}
                              onChange={(e) => setSandboxArgs(prev => ({ ...prev, dealValue: e.target.value }))}
                              className="w-full bg-card border border-light rounded px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={handleRunSandboxTool}
                        disabled={sandboxRunning}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/40 text-white font-bold py-2 rounded-lg text-xs mt-3 flex items-center justify-center gap-2 cursor-pointer transition-all font-heading"
                      >
                        {sandboxRunning ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Menjalankan Otonom...
                          </>
                        ) : (
                          <>
                            <Play size={11} />
                            Jalankan Simulasi Otonom
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Sandbox Run Outcomes */}
                  {sandboxError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-[11px] leading-relaxed">
                      <strong>Gagal:</strong> {sandboxError}
                    </div>
                  )}

                  {sandboxResult && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-[11px] space-y-2 leading-relaxed">
                      <div>
                        <strong>🟢 Hasil Sukses:</strong>
                        <p className="mt-1 text-white">{sandboxResult.message}</p>
                      </div>

                      {/* Special output display based on results */}
                      {sandboxResult.downloadUrl && (
                        <div className="pt-1.5 border-t border-emerald-500/20">
                          <a
                            href={sandboxResult.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-2.5 rounded text-[10px] transition-all"
                          >
                            <Eye size={10} />
                            Unduh RFQ PDF
                          </a>
                        </div>
                      )}

                      {/* Display compatibility score */}
                      {sandboxResult.matchScore !== undefined && (
                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-emerald-500/20 text-[10px]">
                          <div>
                            <span className="text-muted block">Skor Kecocokan:</span>
                            <span className="font-bold text-white text-xs">{sandboxResult.matchScore}%</span>
                          </div>
                          <div>
                            <span className="text-muted block">Rekomendasi:</span>
                            <span className="font-bold text-white text-[10px]">{sandboxResult.recommendation}</span>
                          </div>
                        </div>
                      )}

                      {/* Display generated drafts preview */}
                      {sandboxResult.drafts && (
                        <div className="pt-2 border-t border-emerald-500/20 text-[10px] space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                          <span className="text-muted block uppercase tracking-wider font-bold">Draf Kampanye (Disimpan ke Obsidian):</span>
                          <div>
                            <span className="text-primary block font-bold">LinkedIn:</span>
                            <p className="text-secondary leading-tight mt-0.5 font-sans whitespace-pre-wrap">{sandboxResult.drafts.linkedin.substring(0, 100)}...</p>
                          </div>
                          <div>
                            <span className="text-primary block font-bold">Instagram:</span>
                            <p className="text-secondary leading-tight mt-0.5 font-sans whitespace-pre-wrap">{sandboxResult.drafts.instagram.substring(0, 100)}...</p>
                          </div>
                        </div>
                      )}

                      {/* Display server status check outcomes */}
                      {sandboxResult.serverStatus && (
                        <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-emerald-500/20 text-[10px]">
                          <div>
                            <span className="text-muted block font-semibold">Latensi:</span>
                            <span className="font-bold text-white">{sandboxResult.serverStatus.latency}</span>
                          </div>
                          <div>
                            <span className="text-muted block font-semibold">CPU:</span>
                            <span className="font-bold text-white">{sandboxResult.serverStatus.cpuUsage}</span>
                          </div>
                          <div>
                            <span className="text-muted block font-semibold">Memory:</span>
                            <span className="font-bold text-white">{sandboxResult.serverStatus.memoryUsage}</span>
                          </div>
                        </div>
                      )}

                      {/* Display compliance report */}
                      {sandboxResult.complianceReport && (
                        <div className="pt-2 border-t border-emerald-500/20 text-[10px] space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-muted">Skor Audit Kepatuhan:</span>
                            <span className="text-white">{sandboxResult.complianceReport.score}%</span>
                          </div>
                          <div>
                            <span className="text-muted block font-semibold">Gaps Terdeteksi:</span>
                            <ul className="list-disc list-inside text-red-300 pl-1">
                              {sandboxResult.complianceReport.issues.map((iss: any, idx: number) => (
                                <li key={idx}>{iss}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Display tax calculation details */}
                      {sandboxResult.taxDetails && (
                        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-emerald-500/20 text-[9px] font-mono leading-tight">
                          <div>
                            <span className="text-muted block">PPN (11%):</span>
                            <span className="text-white">{sandboxResult.taxDetails.ppn}</span>
                          </div>
                          <div>
                            <span className="text-muted block">PPh 23:</span>
                            <span className="text-white">{sandboxResult.taxDetails.pph23}</span>
                          </div>
                          <div>
                            <span className="text-muted block">Net Kas:</span>
                            <span className="text-white">{sandboxResult.taxDetails.netAmount}</span>
                          </div>
                        </div>
                      )}

                      {/* Display cash forecast project */}
                      {sandboxResult.cashProjection && (
                        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-emerald-500/20 text-[9px] font-mono leading-tight">
                          <div>
                            <span className="text-muted block">Waktu Proyeksi:</span>
                            <span className="text-white">{sandboxResult.cashProjection.projectedMonths} Bln</span>
                          </div>
                          <div>
                            <span className="text-muted block">Growth Rate:</span>
                            <span className="text-white">{sandboxResult.cashProjection.growthRate}</span>
                          </div>
                          <div>
                            <span className="text-muted block">Kas Akhir:</span>
                            <span className="text-white">{sandboxResult.cashProjection.endingBalance}</span>
                          </div>
                        </div>
                      )}

                      {/* Display sentiment results */}
                      {sandboxResult.sentimentResult && (
                        <div className="pt-2 border-t border-emerald-500/20 text-[10px] space-y-1">
                          <div className="flex gap-4">
                            <div>
                              <span className="text-muted block font-semibold">Sentimen:</span>
                              <span className={`font-bold uppercase ${
                                sandboxResult.sentimentResult.sentiment === 'Marah' ? 'text-red-400' : 'text-amber-400'
                              }`}>{sandboxResult.sentimentResult.sentiment}</span>
                            </div>
                            <div>
                              <span className="text-muted block font-semibold">Urgensi:</span>
                              <span className="font-bold text-white">{sandboxResult.sentimentResult.urgency}</span>
                            </div>
                          </div>
                          <div className="bg-card/40 p-2 rounded border border-light">
                            <span className="text-muted block font-semibold">Draf Balasan Otomatis:</span>
                            <p className="text-white italic mt-0.5 leading-snug">{sandboxResult.sentimentResult.responseDraft}</p>
                          </div>
                        </div>
                      )}

                      {/* Display contract risk analysis */}
                      {sandboxResult.contractAnalysis && (
                        <div className="pt-2 border-t border-emerald-500/20 text-[10px] space-y-1">
                          <span className="text-muted block font-bold uppercase tracking-wider">Klausul Resiko Bahaya (Hukum):</span>
                          <ul className="list-disc list-inside text-red-300 pl-1">
                            {sandboxResult.contractAnalysis.risks.map((r: any, idx: number) => (
                              <li key={idx} className="leading-tight mb-0.5">{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Display pricing optimization recommendation */}
                      {sandboxResult.pricingOpt && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 text-[10px]">
                          <div>
                            <span className="text-muted block font-semibold">Harga Optimal:</span>
                            <span className="font-bold text-white">{sandboxResult.pricingOpt.optimalPrice}</span>
                          </div>
                          <div>
                            <span className="text-muted block font-semibold">Selisih Kompetitor:</span>
                            <span className="font-bold text-amber-300">{sandboxResult.pricingOpt.competitorDiff}</span>
                          </div>
                        </div>
                      )}

                      {/* Display ESG Impact audit */}
                      {sandboxResult.esgImpact && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 text-[10px]">
                          <div>
                            <span className="text-muted block font-semibold">Skor ESG Hijau:</span>
                            <span className="font-bold text-emerald-400">{sandboxResult.esgImpact.score}</span>
                          </div>
                          <div>
                            <span className="text-muted block font-semibold">CO2 Tereduksi:</span>
                            <span className="font-bold text-white">{sandboxResult.esgImpact.co2Reduced}</span>
                          </div>
                        </div>
                      )}

                      {/* Display Strategic investment risk */}
                      {sandboxResult.businessRisk && (
                        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-emerald-500/20 text-[9px] font-mono leading-tight">
                          <div>
                            <span className="text-muted block">Prediksi ROI:</span>
                            <span className="text-white">{sandboxResult.businessRisk.roi}</span>
                          </div>
                          <div>
                            <span className="text-muted block">Risk Level:</span>
                            <span className="text-red-300 font-bold">{sandboxResult.businessRisk.riskLevel}</span>
                          </div>
                          <div>
                            <span className="text-muted block">Fit Index:</span>
                            <span className="text-emerald-300 font-bold">{sandboxResult.businessRisk.strategicFit}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMNS: APPROVALS & LIVE SIMULATION ──────────── */}
        <div className="space-y-6 flex flex-col">
          
          {/* THE CEO DESK (APPROVALS) */}
          <div className="bg-card border border-light rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-white font-bold text-sm flex items-center gap-2 border-b border-light pb-3 font-heading">
              <ShieldAlert size={16} className="text-amber-500 animate-pulse" />
              The CEO Desk (Approval Inbox)
            </h3>

            {loadingTasks ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pendingTasks.length > 0 ? (
               <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {pendingTasks.map((task) => {
                  const currentData = JSON.parse(task.currentState || '{}');
                  return (
                    <div key={task.id} className="bg-elevated/45 border border-light p-3.5 rounded-xl text-xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-white truncate">{task.title}</h4>
                          <span className="text-[9px] font-semibold text-amber-500 uppercase tracking-wider block mt-0.5">
                            DIESKALASIKAN OLEH {task.agent?.name || 'Staff AI'}
                          </span>
                        </div>
                        <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
                      </div>
                      
                      <p className="text-secondary text-[11px] leading-relaxed">
                        {task.description}
                      </p>

                      <div className="bg-card/50 p-2.5 rounded-lg border border-light text-[10px] text-secondary font-mono leading-tight">
                        <span className="text-muted block uppercase tracking-wider mb-1 font-bold">Trace Data:</span>
                        {Object.entries(currentData).map(([k, v]) => (
                          <div key={k}>{k}: {String(v)}</div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1.5">
                        <button
                          onClick={() => handleResolveTask(task.id, 'COMPLETED', 'Disetujui Aziz Maulana')}
                          disabled={resolvingTaskId !== null}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-all cursor-pointer font-heading"
                        >
                          <Check size={11} />
                          Setujui
                        </button>
                        <button
                          onClick={() => handleResolveTask(task.id, 'FAILED', 'Ditolak Aziz Maulana')}
                          disabled={resolvingTaskId !== null}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-all cursor-pointer font-heading"
                        >
                          <X size={11} />
                          Tolak
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-elevated/20 border border-light border-dashed rounded-xl">
                <span className="text-emerald-500 text-[10px] font-bold uppercase block mb-1">🎉 Bersih!</span>
                <span className="text-secondary text-xs">Semua eskalasi dari manajer AI sudah terselesaikan.</span>
              </div>
            )}
          </div>

          {/* INTERAKTIF RAPAT KOORDINASI MULTI-AGEN */}
          <div className="bg-card border border-light rounded-2xl p-5 shadow-sm flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-light pb-3 flex-shrink-0">
              <h3 className="text-white font-bold text-sm flex items-center gap-2 font-heading">
                <MessageSquare size={16} className="text-indigo-600 dark:text-violet-400" />
                Rapat Koordinasi AI
              </h3>
              {selectedSessionId ? (
                <button
                  onClick={() => setSelectedSessionId(null)}
                  className="text-[10px] bg-elevated border border-light hover:text-white px-2 py-0.5 rounded transition-all cursor-pointer font-bold font-stats"
                >
                  Kembali
                </button>
              ) : (
                <button
                  onClick={() => setShowNewRapatModal(true)}
                  className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded transition-all cursor-pointer font-bold font-heading"
                >
                  + Rapat Baru
                </button>
              )}
            </div>

            {!selectedSessionId ? (
              // TAMPILKAN LIST SESI RAPAT AKTIF
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
                {sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-secondary text-[11px] block">Tidak ada sesi rapat aktif.</span>
                    <button
                      onClick={() => setShowNewRapatModal(true)}
                      className="mt-2 text-[10px] text-indigo-400 hover:underline font-bold"
                    >
                      Buka rapat baru sekarang &rarr;
                    </button>
                  </div>
                ) : (
                  sessions.map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => setSelectedSessionId(sess.id)}
                      className="bg-elevated/20 hover:bg-elevated/40 border border-light p-3 rounded-xl cursor-pointer transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs truncate max-w-[180px]">{sess.title}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                          sess.status === 'RUNNING' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 border animate-pulse' :
                          sess.status === 'PAUSED_FOR_HUMAN' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 border animate-bounce' :
                          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 border'
                        }`}>
                          {sess.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-secondary">
                        <span>{sess.participants.length} Anggota</span>
                        <span>{new Date(sess.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // TAMPILKAN UTAS DETAIL OBROLAN RAPAT AKTIF
              (() => {
                const currentSession = sessions.find(s => s.id === selectedSessionId);
                if (!currentSession) return <div className="text-xs text-center py-4">Sesi memuat...</div>;

                return (
                  <div className="flex flex-col flex-1 min-h-0">
                    {/* CEO EXECUTIVE DIRECTIVE PANEL */}
                    {(() => {
                      const latestDirective = [...(currentSession.messages || [])]
                        .reverse()
                        .find((m: any) => m.senderRole === 'OWNER' || m.senderRole === 'HUMAN' || m.senderName.includes('Aziz'));
                      
                      return (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs space-y-1 mb-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1 font-heading">
                              👑 Direktif Executive CEO Aktif
                            </span>
                            {latestDirective && (
                              <span className="text-[8px] text-muted font-mono">
                                Diperbarui {new Date(latestDirective.createdAt).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                          <p className="text-secondary leading-relaxed font-mono text-[10px]">
                            {latestDirective ? latestDirective.content : "Belum ada direktif tertulis. Berikan direktif di bawah untuk memandu alur rapat."}
                          </p>
                        </div>
                      );
                    })()}

                    <div 
                      ref={chatContainerRef}
                      className="flex-1 overflow-y-auto py-3 space-y-3 pr-1"
                    >
                      {currentSession.messages?.map((msg: any) => {
                        let badgeBg = 'bg-primary-glow border-primary/20 text-primary';
                        if (msg.senderRole === 'OWNER' || msg.senderRole === 'HUMAN') badgeBg = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
                        else if (msg.senderRole === 'MODERATOR') badgeBg = 'bg-slate-500/10 border-slate-500/20 text-slate-400';
                        else if (msg.senderName.includes('Billing') || msg.senderName.includes('Tax') || msg.senderName.includes('Finance')) badgeBg = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                        else if (msg.senderName.includes('IT') || msg.senderName.includes('Pipeline') || msg.senderName.includes('Security')) badgeBg = 'bg-blue-500/10 border-blue-500/20 text-blue-400';
                        else badgeBg = 'bg-amber-500/10 border-amber-500/20 text-amber-400';

                        return (
                          <div key={msg.id} className="text-[11px] leading-relaxed flex flex-col gap-0.5 fade-up">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-muted text-[10px] font-stats font-semibold">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${badgeBg}`}>
                                {msg.senderName}
                              </span>
                            </div>
                            <p className="mt-0.5 font-mono text-secondary" style={{ wordBreak: 'break-word' }}>
                              {msg.content}
                            </p>
                            
                            {/* LOG JALANNYA PIKIRAN ALAT (TOOL TRACE) */}
                            {msg.toolName && (
                              <details className="mt-1 bg-card/60 border border-light rounded-lg p-2 text-[9px] text-secondary font-mono">
                                <summary className="cursor-pointer font-bold text-muted uppercase tracking-wider mb-1 select-none">
                                  Trace Tool: {msg.toolName}
                                </summary>
                                <div className="space-y-1 mt-1 border-t border-light pt-1 text-[8px] text-secondary">
                                  <div><strong>Args:</strong> {msg.toolArgs}</div>
                                  <div><strong>Result:</strong> {msg.toolResult || 'Menunggu hasil...'}</div>
                                </div>
                              </details>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* FORM INPUT INTERAKSI MANUSIA */}
                    <div className="border-t border-light pt-2 flex-shrink-0">
                      {currentSession.status === 'PAUSED_FOR_HUMAN' ? (
                        <form onSubmit={handleSendHumanInput} className="space-y-2">
                          <div className="text-[9px] text-amber-500 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1 font-heading">
                            <span>⚠️ PENDING DIRECTIVE: Rapat Menjeda</span>
                          </div>
                          <div className="text-[10px] text-white font-bold font-heading">
                            👑 Kirim Direktif Executive CEO Baru:
                          </div>
                          
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={userInput}
                              onChange={(e) => setUserInput(e.target.value)}
                              placeholder="Tulis direktif atau instruksi kerja Anda di sini..."
                              disabled={submittingInput}
                              className="flex-1 bg-elevated border border-light text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                            />
                            <button
                              type="submit"
                              disabled={submittingInput || !userInput.trim()}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg cursor-pointer transition-all font-heading"
                            >
                              Kirim
                            </button>
                          </div>

                          {/* Tombol Pintasan Cepat */}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setUserInput('Setuju, jalankan sekarang.')}
                              className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded hover:bg-emerald-500/20 transition-all cursor-pointer"
                            >
                              Setuju
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserInput('Tolak dan batalkan proses.')}
                              className="text-[8px] bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded hover:bg-red-500/20 transition-all cursor-pointer"
                            >
                              Tolak
                            </button>
                          </div>
                        </form>
                      ) : currentSession.status === 'RUNNING' ? (
                        <div className="text-[10px] text-muted italic flex items-center gap-1.5 py-1">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                          <span>AI Manager Moderator sedang mengevaluasi rapat...</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-500 font-bold py-1">
                          🏁 Rapat koordinasi ini telah selesai dan ditutup.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>

        </div>
      </div>

      {/* ── ALL USER TOOLS AT THE BOTTOM ───────────────────────── */}
      <div className="px-8 pt-8 max-w-7xl mx-auto space-y-5">
        <div className="flex items-center gap-3 border-b border-light pb-4">
          <div className="w-1.5 h-6 bg-primary rounded-full" />
          <h2 className="text-base font-bold text-white font-heading">Alat Kerja Tersedia (Tools)</h2>
        </div>

        {Object.keys(filteredCategories).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 bg-card border border-light rounded-2xl">
            <span className="text-3xl">🔍</span>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Tidak ada tool yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(filteredCategories).map(([category, tools], catIdx) => (
              <section key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider font-heading" style={{ color: roleConfig.accentColor }}>
                    {category}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.2 bg-elevated/44 border border-light text-secondary rounded-full">
                    {tools.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
                  {tools.map((tool, toolIdx) => (
                    <WorkbenchToolCard
                      key={tool.id}
                      tool={tool}
                      accentColor={roleConfig.accentColor}
                      accentGlow={roleConfig.accentGlow}
                      gradient={roleConfig.gradient}
                      index={catIdx * 10 + toolIdx}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      
      {/* MODAL BUAT RAPAT KOORDINASI BARU */}
      {showNewRapatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 fade-in">
          <div className="bg-card border border-light w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-light pb-3">
              <h3 className="text-white font-bold text-base flex items-center gap-2 font-heading">
                <Sparkles size={18} className="text-indigo-400" />
                Simulation Sandbox
              </h3>
              <button 
                onClick={() => setShowNewRapatModal(false)}
                className="text-secondary hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-light text-xs font-heading font-semibold">
              <button
                type="button"
                onClick={() => setSandboxTab('templates')}
                className={`flex-1 pb-2 border-b-2 text-center transition-all cursor-pointer ${
                  sandboxTab === 'templates' ? 'border-indigo-500 text-white' : 'border-transparent text-muted hover:text-secondary'
                }`}
              >
                Templates
              </button>
              <button
                type="button"
                onClick={() => setSandboxTab('custom')}
                className={`flex-1 pb-2 border-b-2 text-center transition-all cursor-pointer ${
                  sandboxTab === 'custom' ? 'border-indigo-500 text-white' : 'border-transparent text-muted hover:text-secondary'
                }`}
              >
                Custom Rapat
              </button>
              <button
                type="button"
                onClick={() => setSandboxTab('json')}
                className={`flex-1 pb-2 border-b-2 text-center transition-all cursor-pointer ${
                  sandboxTab === 'json' ? 'border-indigo-500 text-white' : 'border-transparent text-muted hover:text-secondary'
                }`}
              >
                Impor JSON
              </button>
            </div>

            {/* TAB CONTENT: TEMPLATES */}
            {sandboxTab === 'templates' && (
              <div className="space-y-3 text-xs">
                <p className="text-muted leading-relaxed">Pilih salah satu skenario pradefinisi di bawah ini untuk meluncurkan simulasi kolaborasi multi-agen secara instan:</p>
                
                <div className="space-y-3">
                  {[
                    {
                      title: "Krisis Stockout Logistik & Rantai Pasok",
                      description: "Negosiasi otonom dengan vendor alternatif PT Sinar Jaya untuk diskon 15% bahan baku kertas A4.",
                      pilar: "PURCHASING",
                      prompt: "Stok bahan baku kertas A4 menipis di bawah tingkat keselamatan (safetystock). Lakukan negosiasi ulang dengan vendor eksternal PT Sinar Jaya untuk diskon 15% atau cari vendor alternatif otonom. Laporkan hasil audit harga kepada CFO."
                    },
                    {
                      title: "Investigasi Selisih Arus Kas Buku Besar",
                      description: "Melakukan rekonsiliasi otonom menggunakan tool audit untuk mencocokkan selisih kas kecil Rp 1.500.000.",
                      pilar: "FINANCE",
                      prompt: "Ditemukan selisih pengeluaran bon sebesar Rp 1.500.000 pada data audit kas kecil. Lakukan rekonsiliasi otonom menggunakan tool audit dan laporkan hasil pencocokan."
                    },
                    {
                      title: "Resolusi Absensi Geofence Karyawan",
                      description: "Peninjauan koordinat absensi otonom untuk memvalidasi deviasi lokasi GPS pekerja lapangan.",
                      pilar: "HR",
                      prompt: "Beberapa pekerja luar melaporkan GPS absensi mereka terblokir karena radius kantor/pabrik terdeteksi terlalu jauh. Lakukan peninjauan koordinat absensi otonom untuk memvalidasi deviasi geofence."
                    }
                  ].map((tpl) => (
                    <div 
                      key={tpl.title}
                      className="bg-elevated/44 border border-light p-3.5 rounded-xl space-y-2 hover:border-indigo-500/50 transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{tpl.title}</h4>
                        <span className="text-[8px] font-bold px-1.5 py-0.2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                          {tpl.pilar}
                        </span>
                      </div>
                      <p className="text-secondary text-[11px] leading-relaxed">{tpl.description}</p>
                      <button
                        type="button"
                        onClick={() => handleLaunchTemplate(tpl.title, tpl.prompt, tpl.pilar)}
                        disabled={submittingInput}
                        className="w-full mt-1 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-600/30 text-white font-bold py-1.5 rounded-lg transition-all cursor-pointer font-heading text-center"
                      >
                        {submittingInput ? "Meluncurkan..." : "Luncurkan Skenario"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: CUSTOM RAPAT */}
            {sandboxTab === 'custom' && (
              <form onSubmit={handleStartNewRapat} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-muted font-bold block">Judul Rapat</label>
                  <input
                    type="text"
                    required
                    value={newRapatTitle}
                    onChange={(e) => setNewRapatTitle(e.target.value)}
                    placeholder="Contoh: Rapat Koordinasi Audit Divisi Tech"
                    className="w-full bg-elevated border border-light text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted font-bold block mb-1">Pilih Anggota Rapat AI (Pilih Bebas)</label>
                  <div className="bg-elevated border border-light rounded-lg p-3 max-h-[160px] overflow-y-auto space-y-2">
                    {dbAgents.map((agent) => {
                      const isChecked = selectedAgents.includes(agent.id);
                      return (
                        <label key={agent.id} className="flex items-center gap-2 text-secondary cursor-pointer select-none text-[11px] hover:text-white">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAgents(prev => [...prev, agent.id]);
                              } else {
                                setSelectedAgents(prev => prev.filter(id => id !== agent.id));
                              }
                            }}
                            className="rounded border-light bg-card text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{agent.name} ({agent.role} - {agent.divisi})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-muted font-bold block">Pesan Awal / Instruksi Kerja (Owner)</label>
                  <textarea
                    required
                    rows={3}
                    value={newRapatPrompt}
                    onChange={(e) => setNewRapatPrompt(e.target.value)}
                    placeholder="Ketik direktif pembuka untuk memandu agen..."
                    className="w-full bg-elevated border border-light text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono text-xs resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewRapatModal(false)}
                    className="flex-1 bg-elevated/44 border border-light hover:bg-elevated text-secondary hover:text-white font-bold py-2 rounded-xl cursor-pointer transition-all font-stats"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInput}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl cursor-pointer transition-all font-heading"
                  >
                    {submittingInput ? "Membuat..." : "Mulai Rapat Kustom"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT: IMPORT JSON */}
            {sandboxTab === 'json' && (
              <form onSubmit={handleStartNewRapat} className="space-y-4 text-xs">
                <div className="space-y-2">
                  <label className="text-muted font-bold block font-heading mb-1">Tempel Skenario JSON</label>
                  <textarea
                    required
                    rows={8}
                    value={jsonScenario}
                    onChange={(e) => setJsonScenario(e.target.value)}
                    placeholder={`{\n  "title": "Audit Harga Vendor Besi",\n  "initialMessage": "Bandingkan harga besi beton...",\n  "participants": [\n    { "name": "Procurement Manager (AI)", "role": "MANAGER", "type": "AI" },\n    { "name": "Tax & Reconciliation Staff (AI)", "role": "STAFF", "type": "AI" }\n  ]\n}`}
                    className="w-full bg-elevated border border-light text-white rounded-lg p-3 focus:outline-none focus:border-indigo-500 font-mono text-[10px] resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewRapatModal(false)}
                    className="flex-1 bg-elevated/44 border border-light hover:bg-elevated text-secondary hover:text-white font-bold py-2 rounded-xl cursor-pointer transition-all font-stats"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInput}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl cursor-pointer transition-all font-heading"
                  >
                    {submittingInput ? "Mengimpor..." : "Impor & Luncurkan"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
      
    </div>
  );
}
