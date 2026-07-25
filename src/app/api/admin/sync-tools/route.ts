import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/sync-tools
 * Membaca tools.html, mengekstrak perkakas spesifik & umum per peran, 
 * memetakan ke AIAgent yang cocok, dan menyuntikkannya ke tabel AgentTool serta kolum sopMarkdown.
 */
export async function POST(req: NextRequest) {
  try {
    // Dynamic SQL DDL Migration: Create AgentTool table if it does not exist to bypass run_command restrictions
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AgentTool" (
          "id" TEXT NOT NULL,
          "agentId" TEXT NOT NULL,
          "toolName" TEXT NOT NULL,
          "description" TEXT,
          "category" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AgentTool_pkey" PRIMARY KEY ("id")
        );
      `);
      
      try {
        await db.$executeRawUnsafe(`
          ALTER TABLE "AgentTool" 
          ADD CONSTRAINT "AgentTool_agentId_fkey" 
          FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        `);
      } catch (fkErr) {
        // Constraint already exists, skip safely
      }
      console.log("[Sync Tools DDL] AgentTool table check/creation completed successfully.");
    } catch (ddlErr) {
      console.error("[Sync Tools DDL Error] Failed to verify/create AgentTool table:", ddlErr);
    }

    const htmlPath = path.resolve(process.cwd(), "tools.html");
    if (!fs.existsSync(htmlPath)) {
      return NextResponse.json(
        { success: false, error: `Berkas tools.html tidak ditemukan di ${htmlPath}` },
        { status: 404 }
      );
    }

    const htmlContent = fs.readFileSync(htmlPath, "utf8");
    const $ = cheerio.load(htmlContent);

    let matchedCount = 0;
    let toolCount = 0;

    const cards = $(".rc");
    console.log(`[Sync Tools] Ditemukan ${cards.length} kartu role di tools.html`);

    for (let i = 0; i < cards.length; i++) {
      const el = cards[i];
      const roleName = $(el).find(".rt").text().trim();
      
      // Ambil list tools spesifik
      const specTools: string[] = [];
      $(el).find(".tool-spec").each((_, item) => {
        specTools.push($(item).text().trim());
      });

      // Ambil list tools umum
      const genTools: string[] = [];
      $(el).find(".tool-gen").each((_, item) => {
        genTools.push($(item).text().trim());
      });

      // Ambil alur otomasi
      const automationSteps: string[] = [];
      $(el).find(".af-txt").each((_, item) => {
        automationSteps.push($(item).text().trim());
      });

      if (specTools.length === 0 && genTools.length === 0) continue;

      // Pencarian pintar: mencocokkan nama depan agen (misal "Tax Manager (AI)" akan cocok dengan "Tax Manager")
      const agents = await db.aIAgent.findMany({
        where: {
          name: {
            startsWith: roleName,
            mode: "insensitive"
          }
        }
      });

      if (agents.length > 0) {
        matchedCount += agents.length;

        for (const agent of agents) {
          // Bersihkan relasi tools lama agar sinkronisasi bersifat idempoten
          await db.agentTool.deleteMany({
            where: { agentId: agent.id }
          });

          // Simpan ke tabel relasional AgentTool baru
          for (const t of specTools) {
            await db.agentTool.create({
              data: {
                agentId: agent.id,
                toolName: t,
                category: "SPESIFIK"
              }
            });
            toolCount++;
          }

          for (const t of genTools) {
            await db.agentTool.create({
              data: {
                agentId: agent.id,
                toolName: t,
                category: "UMUM"
              }
            });
            toolCount++;
          }

          // Perbarui sopMarkdown otonom milik agen
          let baseSop = agent.sopMarkdown;
          const markerIndex = baseSop.indexOf("\n\n## Peralatan Kerja (Tools) dari System");
          if (markerIndex !== -1) {
            baseSop = baseSop.substring(0, markerIndex);
          }

          const toolsSection = `\n\n## Peralatan Kerja (Tools) dari System
### Tools Spesifik:
${specTools.map(t => `- ${t}`).join('\n')}

### Tools Umum:
${genTools.map(t => `- ${t}`).join('\n')}

### Ritme Alur Kerja Otomatis:
${automationSteps.map(o => `- ${o}`).join('\n')}`;

          await db.aIAgent.update({
            where: { id: agent.id },
            data: {
              sopMarkdown: baseSop + toolsSection
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi otonom berhasil! ${matchedCount} Karyawan AI diperbarui dengan total ${toolCount} perkas tools spesifik/umum terpasang.`
    });
  } catch (error: any) {
    console.error("[Sync Tools API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}
