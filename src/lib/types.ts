export type AgentStatus = 'running' | 'idle' | 'error' | 'paused';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'waiting_approval';
export type TaskType = 'invoice_ocr' | 'data_entry' | 'report_gen' | 'email_parse' | 'form_fill' | 'reconciliation';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

// ── RBAC Role Types ─────────────────────────────────────────
export type AdminRole = 'owner' | 'admin' | 'finance' | 'hr' | 'purchasing';

export type WorkbenchToolStatus = 'available' | 'beta' | 'soon';

export interface WorkbenchTool {
  id: string;
  title: string;
  description: string;
  icon: string;           // emoji icon
  href?: string;         // navigate to page, if available
  action?: string;       // action key for modal/handler
  status: WorkbenchToolStatus;
  category: string;
  roles: AdminRole[];    // which roles can see this tool
}

export interface RoleConfig {
  role: AdminRole;
  label: string;
  divisi: string;
  accentColor: string;
  accentGlow: string;
  gradient: string;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: AgentStatus;
  tasksCompleted: number;
  tasksToday: number;
  errorRate: number;
  uptime: string;
  lastActivity: string;
  currentTask?: string;
  icon: string;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  agentId: string;
  agentName: string;
  priority: Priority;
  startedAt: string;
  completedAt?: string;
  duration?: number; // in seconds
  source: string;
  destination: string;
  confidence?: number; // AI confidence score 0-100
  errorMessage?: string;
  documentName?: string;
}

export interface ApprovalItem {
  id: string;
  taskId: string;
  documentName: string;
  documentType: string;
  agentName: string;
  submittedAt: string;
  confidence: number;
  priority: Priority;
  extractedData: Record<string, string>;
  rawText: string;
  thumbnailUrl?: string;
  reason: string; // why human review needed
}

export interface DailyStats {
  date: string;
  tasksCompleted: number;
  tasksFailed: number;
  hoursSaved: number;
  documentsProcessed: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
