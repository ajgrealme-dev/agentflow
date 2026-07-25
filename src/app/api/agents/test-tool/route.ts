import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchasingTools } from "@/lib/agents/tools/purchasing";
import { hrTools } from "@/lib/agents/tools/hr";
import { marketingTools } from "@/lib/agents/tools/marketing";
import { dataformTools } from "@/lib/agents/tools/dataform";
import { helpdeskTools } from "@/lib/agents/tools/helpdesk";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, toolName, args } = body;

    if (!agentId || !toolName || !args) {
      return NextResponse.json({ error: "agentId, toolName, dan args wajib dikirimkan." }, { status: 400 });
    }

    const agent = await db.aIAgent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return NextResponse.json({ error: "Karyawan AI tidak ditemukan." }, { status: 404 });
    }

    const div = (agent.divisi || "FINANCE").toUpperCase();

    // Proteksi: Pastikan AI Agent hanya menjalankan tool yang sesuai divisinya
    const allowedTools: Record<string, string[]> = {
      PURCHASING: ["generateRFQ", "sortVendorPrices"],
      MARKETING: ["generateSocialCaption", "scrapeKeywordTrends"],
      HR: ["parseResume", "scheduleInterview"],
      TECH: ["compileAndTestDataform", "checkServerStatus", "resetEmployeePassword"],
      LEGAL: ["verifyContract", "complianceCheck"],
      FINANCE: ["calculateTax", "generateCashForecast"],
      CUSTOMER: ["analyzeTicketSentiment", "optimizeEcomPricing"],
      STRATEGY: ["evaluateESGImpact", "assessBusinessRisk"]
    };

    if (allowedTools[div] && !allowedTools[div].includes(toolName)) {
      return NextResponse.json({ error: `Alat ${toolName} tidak diizinkan untuk divisi ${div}.` }, { status: 403 });
    }

    let result: any = null;

    switch (toolName) {
      case "generateRFQ":
        result = await purchasingTools.generateRFQ(args.vendorName, args.itemsJson);
        break;
      case "sortVendorPrices":
        result = await purchasingTools.sortVendorPrices(args.sku, args.quotesJson);
        break;
      case "generateSocialCaption":
        result = await marketingTools.generateSocialCaption(args.productName, args.tone);
        break;
      case "scrapeKeywordTrends":
        result = await marketingTools.scrapeKeywordTrends(args.keyword);
        break;
      case "parseResume":
        result = await hrTools.parseResume(
          args.resumeText,
          args.targetPosition,
          args.requiredSkillsJson,
          args.minExperienceYears ? parseInt(args.minExperienceYears) : undefined
        );
        break;
      case "scheduleInterview":
        result = await hrTools.scheduleInterview(args.candidateName, args.time);
        break;
      case "compileAndTestDataform":
        result = await dataformTools.compileAndTestDataform(args.branchName);
        break;
      case "resetEmployeePassword":
        result = await helpdeskTools.resetEmployeePassword(args.employeeEmail);
        break;
      case "checkServerStatus":
        result = {
          message: `Audit status infrastruktur untuk server ${args.serverIp} (${args.checkType}) selesai dilakukan secara otonom.`,
          serverStatus: {
            latency: `${Math.floor(12 + Math.random() * 24)} ms`,
            cpuUsage: `${Math.floor(35 + Math.random() * 20)}%`,
            memoryUsage: `${Math.floor(55 + Math.random() * 20)}%`
          }
        };
        break;
      case "verifyContract":
        result = {
          message: `Analisis hukum klausul kontrak dengan ${args.partyName} berhasil diselesaikan.`,
          contractAnalysis: {
            risks: [
              "Klausul pembebasan tanggung jawab sepihak melanggar UU Hukum Perdata.",
              "Ketentuan denda ganti rugi belum seimbang bagi kedua belah pihak."
            ],
            recommendations: [
              "Revisi Klausul 12 untuk mencantumkan klausul force majeure standar.",
              "Tambahkan addendum ganti rugi maksimal 10% dari nilai kontrak."
            ]
          }
        };
        break;
      case "complianceCheck":
        result = {
          message: `Audit kepatuhan sistem untuk scope "${args.auditScope}" terhadap regulasi ${args.regulation} selesai.`,
          complianceReport: {
            score: Math.floor(78 + Math.random() * 15),
            issues: [
              "Pencatatan logs akses data pribadi belum dienkripsi secara penuh.",
              "Belum ada opsi bagi nasabah untuk menghapus data pribadi (Right to be Forgotten)."
            ]
          }
        };
        break;
      case "calculateTax":
        const rev = parseFloat(args.grossRevenue || "0");
        const ppnVal = rev * 0.11;
        const pphVal = rev * 0.02;
        result = {
          message: `Kalkulasi estimasi perpajakan korporat untuk periode ${args.taxPeriod} selesai dihitung.`,
          taxDetails: {
            ppn: `Rp ${Math.round(ppnVal).toLocaleString("id-ID")}`,
            pph23: `Rp ${Math.round(pphVal).toLocaleString("id-ID")}`,
            netAmount: `Rp ${Math.round(rev - ppnVal - pphVal).toLocaleString("id-ID")}`
          }
        };
        break;
      case "generateCashForecast":
        const months = parseInt(args.forecastMonths || "6");
        const growth = parseFloat(args.estimatedGrowth || "10") / 100;
        let balance = 1500000000;
        for (let i = 0; i < months; i++) {
          balance = balance * (1 + growth);
        }
        result = {
          message: `Simulasi proyeksi kas FP&A untuk ${months} bulan ke depan dengan pertumbuhan ${args.estimatedGrowth}% per bulan selesai.`,
          cashProjection: {
            projectedMonths: months,
            growthRate: `${args.estimatedGrowth}%`,
            endingBalance: `Rp ${Math.round(balance).toLocaleString("id-ID")}`
          }
        };
        break;
      case "analyzeTicketSentiment":
        result = {
          message: `Sentimen analisis untuk tiket keluhan CS terdeteksi secara otomatis.`,
          sentimentResult: {
            sentiment: args.priority === "HIGH" ? "Marah" : "Kecewa",
            urgency: args.priority === "HIGH" ? "SANGAT TINGGI (Eskalasi L2)" : "NORMAL",
            responseDraft: `Halo, mohon maaf atas ketidaknyamanan yang dialami. Tiket Anda dengan prioritas ${args.priority} telah kami eskalasikan ke tim teknis untuk investigasi saldo segera.`
          }
        };
        break;
      case "optimizeEcomPricing":
        const base = parseFloat(args.basePrice || "0");
        const comp = parseFloat(args.competitorPrice || "0");
        const opt = comp > base ? comp - (comp - base) * 0.3 : base * 1.15;
        result = {
          message: `Algoritma dinamis menentukan harga jual e-commerce paling optimal terhadap kompetitor.`,
          pricingOpt: {
            optimalPrice: `Rp ${Math.round(opt).toLocaleString("id-ID")}`,
            competitorDiff: `Rp ${Math.round(comp - opt).toLocaleString("id-ID")} (${comp > opt ? 'Lebih Murah Dari Kompetitor' : 'Lebih Mahal Dari Kompetitor'})`
          }
        };
        break;
      case "evaluateESGImpact":
        result = {
          message: `Evaluasi dampak lingkungan dan kelayakan karbon terhadap proyek "${args.carbonOffsetProject}" selesai.`,
          esgImpact: {
            score: "AA+ (Sangat Bagus)",
            co2Reduced: `${parseFloat(args.emissionCo2 || "0") * 12} Ton CO2/Tahun`
          }
        };
        break;
      case "assessBusinessRisk":
        const valueVal = parseFloat(args.dealValue || "0");
        result = {
          message: `Penilaian risiko akuisisi strategis untuk ${args.acquisitionTarget} (Nilai kesepakatan Rp ${valueVal.toLocaleString("id-ID")}) selesai dianalisis.`,
          businessRisk: {
            roi: `${(15 + Math.random() * 10).toFixed(1)}% per Tahun`,
            riskLevel: valueVal > 5000000000 ? "Tinggi (Memerlukan Escrow & Persetujuan Direksi)" : "Sedang",
            strategicFit: "89% (Sinergi Teknologi Tinggi)"
          }
        };
        break;
      default:
        return NextResponse.json({ error: `Alat ${toolName} belum didukung oleh Sandbox ini.` }, { status: 400 });
    }

    return NextResponse.json({ success: true, toolName, result });
  } catch (error: any) {
    console.error("[POST Test Tool Error]", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
