# Integrasi Obsidian Vault (Second Brain Sync)

Platform AgentFlow menyinkronkan seluruh profil struktur organisasi dan riwayat rapat koordinasi secara real-time ke dalam folder lokal `obsidian-vault/` menggunakan berkas penulisan aman di [obsidian.ts](file:///C:/Users/L15%20RYZEN/Desktop/agentflow/src/lib/obsidian.ts).

## 📂 Struktur Berkas Vault
*   `00-Index.md` (Gerbang utama indeks organisasi)
*   `AI-Agents/` (Folder berisi berkas Markdown profil masing-masing dari 142 karyawan AI)
*   `Meetings/` (Folder berisi berkas transkrip percakapan rapat koordinasi dinamis)
*   `Decisions/` (Folder berisi catatan keputusan eksekutif & direktif CEO)

## 🔒 Proteksi Keamanan Directory Traversal
Seluruh proses penulisan berkas diverifikasi secara ketat menggunakan fungsi `safeWriteMarkdown`:
```typescript
const VAULT_ROOT = path.resolve(process.cwd(), 'obsidian-vault');
const targetPath = path.resolve(VAULT_ROOT, subPath);
const relative = path.relative(VAULT_ROOT, targetPath);

if (relative.includes('..') || path.isAbsolute(relative)) {
  console.error("Blocked Directory Traversal!");
  return;
}
```
Ini menjamin bahwa runtime Next.js tidak akan pernah bisa dimanipulasi oleh input LLM untuk menulis atau merusak berkas sensitif di luar folder `obsidian-vault/`.

---
*Kembali ke [[00-Developer-Hub]]*
