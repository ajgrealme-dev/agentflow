import fs from 'fs';
import path from 'path';

const VAULT_ROOT = path.resolve(process.cwd(), 'obsidian-vault');

// Helper to clean names for wiki links and filenames
export function cleanNameForLink(name: string): string {
  return name.replace(/\(AI\)/g, '').trim().replace(/[\/:*?"<>|]/g, '');
}

// ── SAFE FILE WRITE (PREVENTS DIRECTORY TRAVERSAL) ─────────────────
export function safeWriteMarkdown(subPath: string, content: string) {
  const targetPath = path.resolve(VAULT_ROOT, subPath);
  
  // Verify that the resolved target path is inside the VAULT_ROOT directory
  const relative = path.relative(VAULT_ROOT, targetPath);
  if (relative.includes('..') || path.isAbsolute(relative)) {
    console.error(`[Obsidian Blocked] Directory traversal attempt blocked: ${subPath}`);
    return;
  }

  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(targetPath, content, 'utf8');
}

// ── SYNC ALL 142 AGENTS TO OBSIDIAN VAULT ──────────────────────────
export function syncAgentsToVault(agents: any[]) {
  console.log(`[Obsidian] Syncing ${agents.length} AI Agents to Obsidian Vault...`);

  // 1. Generate individual agent profiles
  agents.forEach(agent => {
    const cleanAgentName = cleanNameForLink(agent.name);
    
    // Parse parent name from SOP for backlinking
    let laporKeLink = 'CEO / Owner (Aziz Maulana)';
    const match = agent.sopMarkdown?.match(/Lapor\s*ke:\s*(?:📌\s*Lapor\s*ke:\s*)?([^\n]+)/i);
    if (match) {
      laporKeLink = `[[${cleanNameForLink(match[1])}]]`;
    } else if (agent.role === 'CHIEF') {
      laporKeLink = `[[Aziz Maulana (Human)]]`;
    }

    const mdContent = `# AI Agent: ${cleanAgentName}
**Level:** ${agent.role || 'STAFF'}
**Divisi:** ${agent.divisi || 'FINANCE'}
**Lapor ke:** ${laporKeLink}

## Sasaran Kerja (Goal)
${agent.goal || 'Tidak ada goal tertulis.'}

## Standard Operating Procedure (SOP)
${agent.sopMarkdown || 'Tidak ada SOP tertulis.'}

---
*Generated automatically by AgentFlow Enterprise on ${new Date().toLocaleDateString()}*
`;

    safeWriteMarkdown(`AI-Agents/${cleanAgentName}.md`, mdContent);
  });

  // 2. Generate CEO / Aziz profile
  const ceoContent = `# Aziz Maulana (Human)
**Level:** OWNER / CEO
**Divisi:** MANAJEMEN
**Lapor ke:** (Ultimate Owner)

## Sasaran Kerja
Pemilik perusahaan & pengawas utama seluruh operasional koloni AI Agent.

---
*Created on startup*
`;
  safeWriteMarkdown(`AI-Agents/Aziz Maulana (Human).md`, ceoContent);

  // 3. Generate Main Index Dashboard (00-Index.md)
  const divisionBases = ['FINANCE', 'PURCHASING', 'MARKETING', 'HR', 'TECH', 'LEGAL', 'CUSTOMER', 'STRATEGY'];
  let indexContent = `# 🧠 AgentFlow Enterprise — Second Brain

Selamat datang di memori organisasi perusahaan Anda. Folder ini tersambung langsung dengan platform koordinasi Next.js AgentFlow.

## 🏢 Struktur Direktorat & Koloni AI Karyawan

`;

  divisionBases.forEach(div => {
    indexContent += `### 📂 Divisi ${div}\n`;
    const divAgents = agents.filter(a => (a.divisi || 'FINANCE').toUpperCase() === div);
    
    const levels = ['CHIEF', 'MANAGER', 'SUPERVISOR', 'SENIOR', 'STAFF', 'INTERN'];
    levels.forEach(lv => {
      const lvAgents = divAgents.filter(a => (a.role || 'STAFF').toUpperCase() === lv);
      if (lvAgents.length > 0) {
        indexContent += `- **${lv}:**\n`;
        lvAgents.forEach(a => {
          indexContent += `  - [[${cleanNameForLink(a.name)}]]\n`;
        });
      }
    });
    indexContent += `\n`;
  });

  indexContent += `---
*Last Sync: ${new Date().toLocaleString()}*
`;
  safeWriteMarkdown('00-Index.md', indexContent);
}

// ── SYNC RAPAT KOORDINASI TRANSCRIPT TO OBSIDIAN VAULT ──────────────
export function exportSessionToVault(session: any) {
  if (!session) return;
  const cleanTitle = cleanNameForLink(session.title);
  const sessionFile = `Meetings/${cleanTitle}-${session.id.slice(0, 8)}.md`;

  const participantsLinks = session.participants
    .map((p: any) => `[[${cleanNameForLink(p.name)}]] (${p.role})`)
    .join(', ');

  let transcriptMd = `# Rapat Koordinasi: ${session.title}
**ID Sesi:** \`${session.id}\`
**Divisi Pilar:** ${session.participants[0]?.divisi || 'UMUM'}
**Status Rapat:** \`${session.status}\`
**Peserta Rapat:** ${participantsLinks}
**Tanggal Mulai:** ${new Date(session.createdAt).toLocaleString()}

---

## 💬 Transkrip Rapat Koordinasi

`;

  const messages = session.messages || [];
  messages.forEach((msg: any) => {
    const senderClean = cleanNameForLink(msg.senderName);
    const dateStr = new Date(msg.createdAt).toLocaleTimeString();
    
    if (msg.senderRole === 'MODERATOR') {
      transcriptMd += `> **[${dateStr}] [AI Moderator]**: *${msg.content}*\n\n`;
    } else {
      transcriptMd += `### 👤 [[${senderClean}]] (${msg.senderRole}) \`[${dateStr}]\`\n${msg.content}\n\n`;
      
      // Catat trace tool jika ada
      if (msg.toolName) {
        transcriptMd += `> ⚙️ **Trace Tool**: \`${msg.toolName}\`\n`;
        try {
          const args = JSON.parse(msg.toolArgs || '{}');
          const res = JSON.parse(msg.toolResult || '{}');
          transcriptMd += `> - **Arguments:** \`${JSON.stringify(args)}\`\n`;
          transcriptMd += `> - **Result:** \`${JSON.stringify(res)}\`\n\n`;
        } catch {
          transcriptMd += `> - **Args:** \`${msg.toolArgs}\`\n`;
          transcriptMd += `> - **Result:** \`${msg.toolResult}\`\n\n`;
        }
      }
    }
  });

  transcriptMd += `---
*Terakhir diperbarui: ${new Date().toLocaleString()}*
`;

  safeWriteMarkdown(sessionFile, transcriptMd);
}

// ── SYNC EXECUTIVE DECISIONS & DIRECTIVES ───────────────────────────
export function exportDecisionToVault(type: string, id: string, requester: string, details: any, status: string) {
  const cleanReq = cleanNameForLink(requester);
  const decisionFile = `Decisions/${type}-${id.slice(0, 8)}.md`;

  const decisionMd = `# Keputusan Eksekutif: ${type}
**ID Transaksi:** \`${id}\`
**Pemohon:** [[${cleanReq}]]
**Status:** \`${status}\`
**Tanggal:** ${new Date().toLocaleString()}

## Detail Permohonan
\`\`\`json
${JSON.stringify(details, null, 2)}
\`\`\`

## Keputusan / Catatan Direktif CEO:
- **Tindakan:** \`${status}\`
- **Catatan / Arahan:** (Diinput melalui CEO Desk panel)

---
*Generated automatically by AgentFlow Executive Console*
`;

  safeWriteMarkdown(decisionFile, decisionMd);
}
