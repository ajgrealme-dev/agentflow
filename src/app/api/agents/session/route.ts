import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { executeSessionStep } from "@/lib/agents/runtime";

export const dynamic = 'force-dynamic';

/**
 * GET /api/agents/session
 * Mengambil daftar seluruh sesi rapat koordinasi agen untuk suatu perusahaan.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let companyId = req.headers.get("x-company-id") || url.searchParams.get("companyId");

    if (!companyId) {
      const firstCompany = await db.company.findFirst();
      if (firstCompany) companyId = firstCompany.id;
    }

    if (!companyId) {
      return NextResponse.json({ error: "Company ID tidak ditemukan" }, { status: 400 });
    }

    const sessions = await db.agentSession.findMany({
      where: { companyId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        participants: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(sessions);
  } catch (error: any) {
    console.error("[GET Sesi Rapat Error]", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

/**
 * POST /api/agents/session
 * Membuat sesi rapat koordinasi baru dan memulai eksekusi moderator loop asinkron.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, participants, initialMessage } = body;
    
    let companyId = req.headers.get("x-company-id") || body.companyId;
    if (!companyId) {
      const firstCompany = await db.company.findFirst();
      if (firstCompany) companyId = firstCompany.id;
    }

    if (!companyId || !title || !participants || !Array.isArray(participants)) {
      return NextResponse.json({ error: "Parameter tidak lengkap (companyId, title, atau participants wajib ada)" }, { status: 400 });
    }

    // 1. Buat sesi rapat di database
    const session = await db.agentSession.create({
      data: {
        companyId,
        title,
        status: "RUNNING",
        participants: {
          create: participants.map((p: any) => ({
            name: p.name,
            role: p.role,
            type: p.type || "AI"
          }))
        }
      },
      include: { participants: true }
    });

    // 2. Simpan pesan awal rapat dari Owner (Human) jika diinputkan
    if (initialMessage) {
      await db.agentMessage.create({
        data: {
          sessionId: session.id,
          senderName: "Aziz Maulana (Human)",
          senderRole: "OWNER",
          content: initialMessage
        }
      });
    }

    // 3. Tulis pesan pengantar dari Moderator AI
    await db.agentMessage.create({
      data: {
        sessionId: session.id,
        senderName: "Moderator (AI)",
        senderRole: "MODERATOR",
        content: `Rapat koordinasi "${title}" telah dibuka. Anggota rapat yang bergabung: ${participants.map(p => p.name).join(", ")}. Memulai diskusi...`
      }
    });

    // 4. Jalankan siklus runtime asinkron di background
    // (Gunakan setImmediate atau tidak meng-await agar respons API langsung kembali)
    setImmediate(() => {
      executeSessionStep(session.id).catch(err => {
        console.error(`[Background Runtime Error] Gagal menjalankan sesi ${session.id}:`, err);
      });
    });

    return NextResponse.json(session);
  } catch (error: any) {
    console.error("[POST Sesi Rapat Error]", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

/**
 * PATCH /api/agents/session
 * Meneruskan sesi rapat yang sedang dijeda (WAITING_FOR_HUMAN) dengan input dari manusia.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, userInput } = body;

    if (!sessionId || !userInput) {
      return NextResponse.json({ error: "sessionId dan userInput wajib disertakan." }, { status: 400 });
    }

    const session = await db.agentSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
    }

    if (session.status !== "PAUSED_FOR_HUMAN") {
      return NextResponse.json({ error: "Sesi rapat tidak sedang menunggu tanggapan manusia." }, { status: 400 });
    }

    // 1. Simpan tanggapan manusia ke database chat logs
    await db.agentMessage.create({
      data: {
        sessionId,
        senderName: "Aziz Maulana (Human)",
        senderRole: "OWNER",
        content: userInput
      }
    });

    // 2. Ubah status sesi kembali menjadi RUNNING
    const updatedSession = await db.agentSession.update({
      where: { id: sessionId },
      data: { status: "RUNNING" }
    });

    // 3. Picu kembali kelanjutan eksekusi moderator loop secara asinkron
    setImmediate(() => {
      executeSessionStep(sessionId).catch(err => {
        console.error(`[Background Runtime Resume Error] Gagal melanjutkan sesi ${sessionId}:`, err);
      });
    });

    return NextResponse.json(updatedSession);
  } catch (error: any) {
    console.error("[PATCH Sesi Rapat Error]", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
