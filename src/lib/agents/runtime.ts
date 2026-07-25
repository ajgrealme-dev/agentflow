import { db } from "@/lib/db";
import { helpdeskTools } from "./tools/helpdesk";
import { dataformTools } from "./tools/dataform";
import { purchasingTools } from "./tools/purchasing";
import { marketingTools } from "./tools/marketing";
import { hrTools } from "./tools/hr";
import { mcpClient } from "@/lib/mcp/client";
import { exportSessionToVault } from "@/lib/obsidian";

interface ToolCall {
  name: string;
  args: any;
}

// Model Gemini yang digunakan
const GEMINI_MODEL = "gemini-2.5-flash";

// ── ENGINE RUNTIME UTAMA MULTI-AGEN ────────────────────────────

/**
 * Menjalankan satu langkah siklus rapat multi-agen.
 * Mengambil giliran bicara (Moderator), mengeksekusi agen AI, memanggil tool, 
 * dan menyimpan statusnya ke database.
 */
export async function executeSessionStep(sessionId: string): Promise<void> {
  try {
    // 0. Initialize external MCP connection
    await mcpClient.init();

    // 1. Ambil data sesi rapat beserta riwayat percakapan dari DB
    const session = await db.agentSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        participants: true
      }
    });

    if (!session || session.status !== "RUNNING") {
      console.log(`[Agent Runtime] Sesi ${sessionId} dihentikan atau tidak ditemukan.`);
      return;
    }

    const company = await db.company.findUnique({
      where: { id: session.companyId }
    });

    const apiKey = company?.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error(`[Agent Runtime] API Key tidak tersedia untuk sesi ${sessionId}`);
      await db.agentSession.update({
        where: { id: sessionId },
        data: { status: "FAILED" }
      });
      return;
    }

    console.log(`[Agent Runtime] Menjalankan langkah evaluasi untuk rapat: "${session.title}"`);

    // 2. Evaluasi giliran bicara berikutnya menggunakan Moderator AI (Router)
    const decision = await determineNextTurn(session, apiKey);

    console.log(`[Agent Runtime] Keputusan Moderator:`, decision);

    if (decision.action === "PAUSE_FOR_HUMAN") {
      // Jeda rapat untuk meminta persetujuan / input manusia
      await db.agentSession.update({
        where: { id: sessionId },
        data: { status: "PAUSED_FOR_HUMAN" }
      });

      // Simpan pengumuman moderator ke dalam chat
      await db.agentMessage.create({
        data: {
          sessionId,
          senderName: "Moderator (AI)",
          senderRole: "MODERATOR",
          content: `Rapat dijeda. Butuh tanggapan dari ${decision.targetName} (${decision.targetRole}) karena alasan: "${decision.reason}".`
        }
      });

      // Export current transcript state to Obsidian Vault
      const updatedSess = await db.agentSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } }, participants: true }
      });
      exportSessionToVault(updatedSess);

      // Cari user berdasarkan pencocokan nama persis (targetName)
      const cleanTargetName = decision.targetName.replace(/\(Human\)/gi, "").trim();
      const humanUser = await db.user.findFirst({
        where: {
          companyId: session.companyId,
          name: {
            mode: "insensitive",
            equals: cleanTargetName
          }
        }
      });

      const token = process.env.TELEGRAM_BOT_TOKEN;
      const adminChatId = process.env.ADMIN_CHAT_ID || "7618497952";
      let targetChatId = adminChatId;

      if (humanUser && humanUser.telegramChatId) {
        targetChatId = humanUser.telegramChatId;
        console.log(`[Notification Alert] Menemukan user Telegram: ${humanUser.name} (${targetChatId})`);
      } else {
        console.log(`[Notification Alert] User "${cleanTargetName}" tidak ditemukan atau chat ID kosong. Menggunakan fallback ke Admin (${targetChatId}).`);
      }

      if (token) {
        const textMessage = `🔔 <b>[AgentFlow Rapat Dijeda]</b>\n\nSesi Rapat: <b>${session.title}</b>\n\nModerator meminta tanggapan Anda (<b>${decision.targetName}</b>):\n📝 Alasan: <i>${decision.reason}</i>\n\nSilakan klik tombol di bawah untuk memberikan direktif langsung lewat Telegram!`;
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        try {
          await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: targetChatId,
              text: textMessage,
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "✍️ Kirim Direktif", callback_data: `sess_dir:${session.id}` }
                  ]
                ]
              }
            })
          });
          console.log(`[Notification Alert] Notifikasi Telegram berhasil dikirim ke chat ${targetChatId}`);
        } catch (err) {
          console.error(`[Notification Alert] Gagal kirim notifikasi ke Telegram:`, err);
        }
      } else {
        console.warn(`[Notification Alert] TELEGRAM_BOT_TOKEN tidak terkonfigurasi. Tidak dapat mengirim notifikasi.`);
      }
      
      return;
    }

    if (decision.action === "COMPLETE_SESSION") {
      // Tugas selesai, rapat ditutup
      await db.agentSession.update({
        where: { id: sessionId },
        data: { status: "COMPLETED" }
      });

      await db.agentMessage.create({
        data: {
          sessionId,
          senderName: "Moderator (AI)",
          senderRole: "MODERATOR",
          content: "Tugas rapat koordinasi telah diselesaikan dengan sukses. Rapat resmi ditutup."
        }
      });

      // Export current transcript state to Obsidian Vault
      const updatedSess = await db.agentSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } }, participants: true }
      });
      exportSessionToVault(updatedSess);
      return;
    }

    // 3. Eksekusi Agen AI yang ditugaskan berbicara berikutnya
    const targetAgent = session.participants.find(p => p.name === decision.targetName && p.type === "AI");
    if (!targetAgent) {
      console.error(`[Agent Runtime] Agen ${decision.targetName} tidak terdaftar di sesi ini.`);
      return;
    }

    await db.agentMessage.create({
      data: {
        sessionId,
        senderName: "Moderator (AI)",
        senderRole: "MODERATOR",
        content: `Mempersilakan ${targetAgent.name} (${targetAgent.role}) untuk menyampaikan pandangan.`
      }
    });

    const response = await callAgentModel(targetAgent.name, targetAgent.role, session.messages, apiKey);

    // 4. Handle pemanggilan alat kerja (Function Calling) jika terpicu oleh AI
    if (response.functionCall) {
      const toolCall: ToolCall = response.functionCall;
      console.log(`[Agent Runtime] Agen ${targetAgent.name} memicu tool: ${toolCall.name} dengan args:`, toolCall.args);

      // Catat pemanggilan tool ke DB
      const toolMsg = await db.agentMessage.create({
        data: {
          sessionId,
          senderName: targetAgent.name,
          senderRole: targetAgent.role,
          content: `[Memanggil Alat Kerja: ${toolCall.name}]`,
          toolName: toolCall.name,
          toolArgs: JSON.stringify(toolCall.args)
        }
      });

      // Jalankan fungsi tool secara lokal atau via MCP
      let result;
      if (toolCall.name.startsWith("mcp__")) {
        try {
          const rawMcpRes = await mcpClient.handleCall(toolCall.name, toolCall.args);
          result = { success: true, output: rawMcpRes };
        } catch (err: any) {
          result = { success: false, error: err.message || String(err) };
        }
      } else {
        result = await executeTool(toolCall.name, toolCall.args);
      }

      // Update pesan tool dengan hasil kembalian
      await db.agentMessage.update({
        where: { id: toolMsg.id },
        data: {
          toolResult: JSON.stringify(result),
          content: `[Selesai Memanggil Alat Kerja: ${toolCall.name}] Hasil: ${typeof result === 'object' ? JSON.stringify(result) : result}`
        }
      });

    } else {
      // Simpan tanggapan teks normal agen ke DB
      await db.agentMessage.create({
        data: {
          sessionId,
          senderName: targetAgent.name,
          senderRole: targetAgent.role,
          content: response.text
        }
      });
    }

    // Sync current session state to Obsidian Vault
    const updatedSess = await db.agentSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } }, participants: true }
    });
    if (updatedSess) {
      exportSessionToVault(updatedSess);
    }

    // 5. Ulangi langkah berikutnya secara asinkron (rekursif aman)
    setTimeout(() => executeSessionStep(sessionId), 1000);

  } catch (error) {
    console.error(`[Agent Runtime Error] Sesi ${sessionId} gagal:`, error);
    await db.agentSession.update({
      where: { id: sessionId },
      data: { status: "FAILED" }
    }).catch(() => {});
  }
}

// ── FUNGSI KEPUTUSAN TURN-TAKING (MODERATOR AI) ────────────────

async function determineNextTurn(session: any, apiKey: string): Promise<any> {
  const participantsList = session.participants
    .map((p: any) => `- Name: "${p.name}", Role: "${p.role}", Type: "${p.type}"`)
    .join("\n");

  const conversationTranscript = session.messages
    .map((m: any) => `[${m.senderName} (${m.senderRole})]: ${m.content}`)
    .join("\n");

  const moderatorPrompt = `Kamu adalah AI Manager bertindak sebagai Moderator Rapat koordinasi perusahaan.
Tugasmu adalah membaca transkrip rapat, lalu menentukan giliran bicara berikutnya untuk menyelesaikan sasaran rapat.

Daftar Anggota Rapat:
${participantsList}

Sasaran Rapat:
"${session.title}"

Transkrip Rapat Saat Ini:
${conversationTranscript}

ATURAN KEPUTUSAN:
1. Jika sasaran rapat sudah tercapai seutuhnya (misal semua data sudah valid dan dilaporkan), pilih ACTION: "COMPLETE_SESSION".
2. Jika ada masalah yang butuh keputusan, verifikasi manual, atau pengeluaran kas bernilai Rp 0 yang wajib disetujui manusia (HUMAN), pilih ACTION: "PAUSE_FOR_HUMAN", target ke nama manusia tersebut, sertakan alasan ringkas di REASON.
3. Jika masih proses diskusi/pengerjaan data oleh agen AI, pilih ACTION: "CALL_AGENT" dan tunjuk nama Agen AI berikutnya yang harus berbicara/menjalankan fungsinya sesuai SOP mereka.

Kembalikan HANYA respons dalam format JSON mentah tanpa markdown:
{
  "action": "CALL_AGENT" atau "PAUSE_FOR_HUMAN" atau "COMPLETE_SESSION",
  "targetName": "Nama Agen atau Manusia selanjutnya (sesuai daftar anggota)",
  "targetRole": "Role target selanjutnya (misal: STAFF, OWNER)",
  "reason": "Alasan singkat (khusus jika PAUSE_FOR_HUMAN)",
  "explanation": "Penjelasan singkat jalan pikiranmu"
}`;

  const responseText = await callRawGemini(moderatorPrompt, apiKey);
  try {
    return JSON.parse(responseText);
  } catch {
    // Fallback jika parsing gagal
    return {
      action: "PAUSE_FOR_HUMAN",
      targetName: "Aziz Maulana (Human)",
      targetRole: "OWNER",
      reason: "Gagal parse keputusan moderator AI, bwalih ke manual.",
      explanation: responseText
    };
  }
}

// ── PANGGIL MODEL SPESIFIK AGEN AI ─────────────────────────────

async function callAgentModel(
  agentName: string,
  agentRole: string,
  messages: any[],
  apiKey: string
): Promise<{ text: string; functionCall?: ToolCall }> {
  
  // Ambil SOP resmi karyawan dari database jika ada
  const dbAgent = await db.aIAgent.findFirst({
    where: {
      name: {
        startsWith: agentName.replace(/\(AI\)/g, '').trim()
      }
    }
  });

  let sopSection = "";
  if (dbAgent && dbAgent.sopMarkdown) {
    sopSection = `SOP Resmi Karyawan Anda:\n${dbAgent.sopMarkdown}\n\n`;
  }

  // Cari direktif CEO aktif dari riwayat percakapan
  const latestDirective = [...messages]
    .reverse()
    .find((m: any) => m.senderRole === 'OWNER' || m.senderRole === 'HUMAN' || m.senderName.includes('Aziz'));

  let directivePrompt = "";
  if (latestDirective) {
    directivePrompt = `⚠️ DIREKTIF EXECUTIVE CEO AKTIF: "${latestDirective.content}"\nAnda wajib memprioritaskan instruksi/arahan dari CEO di atas sebelum mengusulkan solusi atau melanjutkan langkah lainnya!\n\n`;
  }

  const conversationHistory = messages
    .map((m: any) => `[${m.senderName} (${m.senderRole})]: ${m.content}`)
    .join("\n");

  const systemInstructions = `Kamu adalah asisten AI profesional dengan identitas:
Nama: "${agentName}"
Role: "${agentRole}"

${sopSection}${directivePrompt}Jalankan tugasmu secara profesional sesuai riwayat percakapan rapat, SOP Resmi Karyawan Anda, dan direktif CEO di atas. Jika kamu membutuhkan tools/alat kerja (seperti melakukan audit dataform, mereset password helpdesk, dll.), panggil fungsi/alat tersebut dengan parameter yang sesuai.

Riwayat Obrolan Rapat:
${conversationHistory}`;

  // Deklarasi Tools yang dapat dipanggil model
  const builtInTools = [
    {
      name: "resetEmployeePassword",
      description: "Mereset password akun login karyawan di Active Directory LDAP secara otomatis.",
      parameters: {
        type: "OBJECT",
        properties: {
          employeeEmail: { type: "STRING", description: "Email resmi karyawan yang akan direset." }
        },
        required: ["employeeEmail"]
      }
    },
    {
      name: "dispatchHardwareRepairTicket",
      description: "Membuat tiket perbaikan hardware/perangkat fisik untuk ditindaklanjuti IT Support L2 manusia.",
      parameters: {
        type: "OBJECT",
        properties: {
          email: { type: "STRING", description: "Email karyawan pemilik perangkat." },
          hardwareName: { type: "STRING", description: "Nama jenis perangkat (misal: Monitor, Keyboard)." },
          deskLocation: { type: "STRING", description: "Lokasi meja kerja karyawan." }
        },
        required: ["email", "hardwareName", "deskLocation"]
      }
    },
    {
      name: "compileAndTestDataform",
      description: "Menjalankan kompilasi dan pengujian run data pipeline Dataform secara staging.",
      parameters: {
        type: "OBJECT",
        properties: {
          branchName: { type: "STRING", description: "Nama branch Git yang akan diuji." }
        },
        required: ["branchName"]
      }
    },
    {
      name: "autoMergeSyntaxFix",
      description: "Melakukan auto-merge perbaikan sintaks SQL kecil langsung ke branch main produksi secara otonom.",
      parameters: {
        type: "OBJECT",
        properties: {
          branchName: { type: "STRING", description: "Nama branch asal yang berisi perbaikan sintaks." }
        },
        required: ["branchName"]
      }
    },
    {
      name: "generateRFQ",
      description: "Menghasilkan berkas dokumen Request for Quotation (RFQ) resmi secara otomatis di direktori public/rfqs/ dan mengembalikan tautan unduhan berkas.",
      parameters: {
        type: "OBJECT",
        properties: {
          vendorName: { type: "STRING", description: "Nama vendor mitra pengadaan barang." },
          itemsJson: { type: "STRING", description: "JSON string dari array barang yang diminta. Contoh: '[{\"sku\":\"BRG-01\",\"name\":\"Besi Beton\",\"qty\":10}]'" }
        },
        required: ["vendorName", "itemsJson"]
      }
    },
    {
      name: "sortVendorPrices",
      description: "Mengurutkan dan membandingkan penawaran harga dari beberapa vendor/supplier untuk mencari penawaran termurah/terbaik.",
      parameters: {
        type: "OBJECT",
        properties: {
          sku: { type: "STRING", description: "SKU barang yang dibandingkan harganya." },
          quotesJson: { type: "STRING", description: "JSON string dari array penawaran beberapa vendor. Contoh: '[{\"vendor\":\"Vendor A\",\"price\":50000},{\"vendor\":\"Vendor B\",\"price\":45000}]'" }
        },
        required: ["sku", "quotesJson"]
      }
    },
    {
      name: "generateSocialCaption",
      description: "Membuat draf caption promosi media sosial untuk produk dengan tone gaya bicara tertentu secara otomatis.",
      parameters: {
        type: "OBJECT",
        properties: {
          productName: { type: "STRING", description: "Nama produk yang akan dipromosikan." },
          tone: { type: "STRING", description: "Gaya bahasa caption (misal: santai, lucu, formal, profesional)." }
        },
        required: ["productName", "tone"]
      }
    },
    {
      name: "scrapeKeywordTrends",
      description: "Mengambil data otonom volume pencarian bulanan serta rentang harga pasang iklan Google/Meta Ads untuk riset pemasaran otonom.",
      parameters: {
        type: "OBJECT",
        properties: {
          keyword: { type: "STRING", description: "Kata kunci tren pemasaran yang ingin diriset." }
        },
        required: ["keyword"]
      }
    },
    {
      name: "parseResume",
      description: "Melakukan resume parsing secara otomatis terhadap teks CV pelamar kerja untuk mengekstrak data nama, kontak, keahlian, masa kerja, menghitung skor keselarasan, serta mengekspornya ke Obsidian.",
      parameters: {
        type: "OBJECT",
        properties: {
          resumeText: { type: "STRING", description: "Konten teks lengkap dari CV pelamar." },
          targetPosition: { type: "STRING", description: "Nama posisi jabatan target (misal: 'Senior Accountant')." },
          requiredSkillsJson: { type: "STRING", description: "JSON array berisi daftar keahlian wajib. Contoh: '[\"React\",\"TypeScript\"]'" },
          minExperienceYears: { type: "INTEGER", description: "Syarat minimum pengalaman kerja (tahun)." }
        },
        required: ["resumeText"]
      }
    },
    {
      name: "scheduleInterview",
      description: "Menjadwalkan slot waktu wawancara untuk kandidat pelamar kerja otonom serta menghasilkan tautan Google Meet.",
      parameters: {
        type: "OBJECT",
        properties: {
          candidateName: { type: "STRING", description: "Nama kandidat pelamar." },
          time: { type: "STRING", description: "Waktu pelaksanaan wawancara. Contoh: 'Senin, 20 Juli 2026 jam 10.00 WIB'" }
        },
        required: ["candidateName", "time"]
      }
    }
  ];

  // Filter built-in tools based on agent's division to prevent cross-division tool call hallucinations
  let allowedBuiltInTools = [...builtInTools];
  if (dbAgent) {
    const div = (dbAgent.divisi || "FINANCE").toUpperCase();
    if (div === "PURCHASING") {
      allowedBuiltInTools = builtInTools.filter(t => ["generateRFQ", "sortVendorPrices"].includes(t.name));
    } else if (div === "MARKETING") {
      allowedBuiltInTools = builtInTools.filter(t => ["generateSocialCaption", "scrapeKeywordTrends"].includes(t.name));
    } else if (div === "HR") {
      allowedBuiltInTools = builtInTools.filter(t => ["parseResume", "scheduleInterview"].includes(t.name));
    } else if (div === "TECH") {
      allowedBuiltInTools = builtInTools.filter(t => ["resetEmployeePassword", "dispatchHardwareRepairTicket", "compileAndTestDataform", "autoMergeSyntaxFix"].includes(t.name));
    } else {
      // FINANCE or other divisions with no specific JS action tools yet
      allowedBuiltInTools = [];
    }
  }

  // Merge built-in tools with dynamic MCP tools loaded from mcpClient config
  const mcpTools = mcpClient.getGeminiDeclarations();
  const functionDeclarations = [...allowedBuiltInTools, ...mcpTools];

  const toolsDeclaration = functionDeclarations.length > 0 ? [
    {
      function_declarations: functionDeclarations
    }
  ] : undefined;

  const payload = {
    contents: [{ parts: [{ text: systemInstructions }] }],
    tools: toolsDeclaration,
    generationConfig: { temperature: 0.2 }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini Agent API call failed: ${errText}`);
  }

  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.[0];

  if (part?.functionCall) {
    return {
      text: `[Memanggil alat: ${part.functionCall.name}]`,
      functionCall: {
        name: part.functionCall.name,
        args: part.functionCall.args
      }
    };
  }

  return { text: part?.text || "Pesan kosong." };
}

// ── EKSEKUSI TOOL FUNGSI NODE.JS SECARA LOKAL ──────────────────

async function executeTool(name: string, args: any): Promise<any> {
  console.log(`[Agent Runtime Tool] Menjalankan tool ${name} dengan parameter:`, args);
  try {
    switch (name) {
      case "resetEmployeePassword":
        return await helpdeskTools.resetEmployeePassword(args.employeeEmail);
      case "dispatchHardwareRepairTicket":
        return await helpdeskTools.dispatchHardwareRepairTicket(args.email, args.hardwareName, args.deskLocation);
      case "compileAndTestDataform":
        return await dataformTools.compileAndTestDataform(args.branchName);
      case "autoMergeSyntaxFix":
        return await dataformTools.autoMergeSyntaxFix(args.branchName);
      case "generateRFQ":
        return await purchasingTools.generateRFQ(args.vendorName, args.itemsJson);
      case "sortVendorPrices":
        return await purchasingTools.sortVendorPrices(args.sku, args.quotesJson);
      case "generateSocialCaption":
        return await marketingTools.generateSocialCaption(args.productName, args.tone);
      case "scrapeKeywordTrends":
        return await marketingTools.scrapeKeywordTrends(args.keyword);
      case "parseResume":
        return await hrTools.parseResume(
          args.resumeText,
          args.targetPosition,
          args.requiredSkillsJson,
          args.minExperienceYears
        );
      case "scheduleInterview":
        return await hrTools.scheduleInterview(args.candidateName, args.time);
      default:
        return { success: false, error: `Tool ${name} tidak ditemukan.` };
    }
  } catch (err: any) {
    console.error(`[Agent Runtime Tool Error] Gagal mengeksekusi ${name}:`, err);
    return { success: false, error: err.message || String(err) };
  }
}

// ── UTILITY FETCH GEMINI RAW ───────────────────────────────────

async function callRawGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini RAW API call failed: ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}
