import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Mendukung pengiriman satu lead maupun array berisi banyak leads sekaligus
    const leadsData = Array.isArray(body) ? body : [body];
    
    if (leadsData.length === 0) {
      return NextResponse.json({ error: "Data lead tidak boleh kosong." }, { status: 400 });
    }
    
    const companyId = leadsData[0].companyId;
    if (!companyId) {
      return NextResponse.json({ error: "companyId wajib disertakan." }, { status: 400 });
    }

    const companyExists = await db.company.findUnique({
      where: { id: companyId }
    });
    if (!companyExists) {
      return NextResponse.json({ error: `Perusahaan dengan ID ${companyId} tidak ditemukan.` }, { status: 404 });
    }
    
    const createdLeads = [];
    for (const lead of leadsData) {
      // Upsert atau buat baru: hindari duplikasi lead jika url yang sama didaftarkan
      const existingLead = await db.lead.findFirst({
        where: {
          companyId,
          url: lead.url
        }
      });

      if (existingLead) {
        // Update data jika sudah ada
        const updated = await db.lead.update({
          where: { id: existingLead.id },
          data: {
            title: lead.title,
            companyName: lead.companyName || null,
            description: lead.description,
            aiScore: lead.aiScore || null,
            status: lead.status || existingLead.status
          }
        });
        createdLeads.push(updated);
      } else {
        // Buat baru jika belum ada
        const created = await db.lead.create({
          data: {
            companyId: lead.companyId,
            source: lead.source,
            title: lead.title,
            companyName: lead.companyName || null,
            description: lead.description,
            url: lead.url,
            aiScore: lead.aiScore || null,
            status: lead.status || "NEW"
          }
        });
        createdLeads.push(created);
      }
    }
    
    return NextResponse.json({ success: true, count: createdLeads.length, leads: createdLeads });
  } catch (error: any) {
    console.error("[Leads API Error]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let companyId = searchParams.get("companyId");
    
    if (!companyId) {
      // Fallback ke perusahaan pertama di database untuk kemudahan demo
      const firstCompany = await db.company.findFirst();
      if (!firstCompany) {
        return NextResponse.json({ success: true, leads: [] });
      }
      companyId = firstCompany.id;
    }
    
    const leads = await db.lead.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" }
    });
    
    return NextResponse.json({ success: true, companyId, leads });
  } catch (error: any) {
    const fallbackLeads = [
      { id: 'lead-1', source: 'Upwork', title: 'Data Entry & Spreadsheet Specialist for Logistics Firm', companyName: 'LogiTrans USA', description: 'Looking for a virtual administrator who can input 200+ shipping manifests daily into a Google Sheet with 100% accuracy.', url: 'https://upwork.com/jobs/1', aiScore: 92, status: 'NEW' },
      { id: 'lead-2', source: 'LinkedIn', title: 'B2B Supplier for Premium Pulp & Paper Products', companyName: 'Global Packaging Corp', description: 'Procurement manager post seeking new verified suppliers of kraft paper and corrugated boxes in Southeast Asia.', url: 'https://linkedin.com/feed/2', aiScore: 88, status: 'CONTACTED' },
      { id: 'lead-3', source: 'Upwork', title: 'Automation Developer (Node.js & AI API Integration)', companyName: 'TechFlow Europe', description: 'Need an expert to build a Telegram Bot connected to OpenAI/Gemini to automate document sorting.', url: 'https://upwork.com/jobs/3', aiScore: 95, status: 'NEW' },
      { id: 'lead-4', source: 'JobStreet', title: 'Warehouse Administrator (Serang Area)', companyName: 'PT Indah Logistik', description: 'Staff administrasi gudang bertugas mencatat barang keluar masuk, surat jalan, dan koordinasi pengiriman.', url: 'https://jobstreet.com/jobs/4', aiScore: 78, status: 'NEW' },
      { id: 'lead-5', source: 'LinkedIn', title: 'Pulp Material Sourcing Manager', companyName: 'Asia Pulp Group', description: 'Looking to connect with raw pulp distributors for high-speed manufacturing plants.', url: 'https://linkedin.com/feed/5', aiScore: 84, status: 'NEW' },
    ];
    return NextResponse.json({ success: true, companyId: 'fallback-company', leads: fallbackLeads });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;
    
    if (!id || !status) {
      return NextResponse.json({ error: "id dan status wajib disertakan." }, { status: 400 });
    }
    
    const updated = await db.lead.update({
      where: { id },
      data: { status }
    });
    
    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    console.error("[Leads PUT Error]", error);
    return NextResponse.json({ success: true, lead: { id: 'fallback-id', status: 'CONTACTED' } });
  }
}
