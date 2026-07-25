# Integrasi Model Context Protocol (MCP) Client

AgentFlow mengimplementasikan standardisasi Model Context Protocol (MCP) Anthropic di tingkat backend Next.js untuk memperluas kapabilitas 142 Agen AI secara modular.

## ⚙️ Cara Kerja Client Stdio (`client.ts`)
Backend Next.js bertindak sebagai **MCP Host Client** yang mem-parsing konfigurasi dari `mcp-config.json` di root proyek:
1.  **Spawn Subprocess:** Menggunakan `child_process.spawn` untuk menjalankan server MCP standar via stdio.
2.  **JSON-RPC Handshake:** Mengirimkan pesan JSON `initialize` dan mendengarkan stdout server untuk mengumpulkan daftar tools (`tools/list`).
3.  **Dynamic Function Declarations:** Mengubah skema input tool MCP menjadi format `FunctionDeclaration` yang didukung oleh Gemini API.
4.  **Prefix Routing:** Ketika agen memicu tool berawalan `mcp__`, runtime meneruskan parameter tersebut ke proses server terkait dan mengembalikan hasilnya ke siklus berpikir agen.

## 📦 Konfigurasi Server Demo (`mcp-config.json`)
*   `filesystem`: Memberikan akses file aman bagi agen ke dalam folder `obsidian-vault/`.
*   `fetch`: Memberikan kemampuan otonom bagi agen untuk membaca konten web dinamis.

---
*Kembali ke [[00-Developer-Hub]]*
