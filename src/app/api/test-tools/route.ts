import { NextResponse } from "next/server";
import { purchasingTools } from "@/lib/agents/tools/purchasing";
import { hrTools } from "@/lib/agents/tools/hr";
import { marketingTools } from "@/lib/agents/tools/marketing";

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log("[Test API] Mulai memvalidasi dan menguji perkakas AI (Tools Verification)...");
  const results: Record<string, any> = {};

  try {
    // 1. Uji Coba Purchasing Tool (PDF Generator)
    console.log("[Test API] Menguji Purchasing Tool...");
    const rfqItems = [
      { sku: "BRG-01-STEEL", name: "Besi Baja H-Beam 200", qty: 25 },
      { sku: "BRG-02-CEMENT", name: "Semen Portland Tiga Roda", qty: 150 }
    ];
    const rfqRes = await purchasingTools.generateRFQ("PT Baja Makmur Indonesia", JSON.stringify(rfqItems));
    results.purchasing = rfqRes;

    // 2. Uji Coba HR Tool (Resume Parsing & Matching & Obsidian)
    console.log("[Test API] Menguji HR Tool...");
    const sampleResume = `CV AZIZ MAULANA
Email: aziz@example.com
No HP: 08123456789
Pengalaman kerja selama 5 tahun di bidang rekayasa perangkat lunak.
Keahlian: React, Node.js, PostgreSQL, Prisma, Git, Docker, Figma.`;
    const hrRes = await hrTools.parseResume(
      sampleResume,
      "Senior Full Stack Developer AI",
      JSON.stringify(["React", "Node.js", "PostgreSQL", "Prisma"]),
      3
    );
    results.hr = hrRes;

    // 3. Uji Coba Marketing Tool (Multi-Channel & Obsidian)
    console.log("[Test API] Menguji Marketing Tool...");
    const marketingRes = await marketingTools.generateSocialCaption(
      "AgentFlow Enterprise Office Automation",
      "Kreatif dan Menarik"
    );
    results.marketing = marketingRes;

    return NextResponse.json({
      success: true,
      message: "Seluruh pengujian unit perkakas AI (Tools Verification) berhasil dituntaskan secara lokal.",
      results
    });
  } catch (err: any) {
    console.error("[Test API Error] Terjadi kegagalan verifikasi:", err);
    return NextResponse.json({
      success: false,
      error: err.message || String(err)
    }, { status: 500 });
  }
}
