import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let companyId = searchParams.get("companyId");

    if (!companyId) {
      const firstCompany = await db.company.findFirst();
      if (!firstCompany) {
        return NextResponse.json({ error: "Perusahaan tidak ditemukan. Harap jalankan seeding database." }, { status: 404 });
      }
      companyId = firstCompany.id;
    }

    const company = await db.company.findUnique({
      where: { id: companyId }
    });

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, geminiApiKey, telegramBotToken } = body;

    let companyId = id;
    if (!companyId) {
      const firstCompany = await db.company.findFirst();
      if (!firstCompany) {
        return NextResponse.json({ error: "Perusahaan tidak ditemukan." }, { status: 404 });
      }
      companyId = firstCompany.id;
    }

    const updated = await db.company.update({
      where: { id: companyId },
      data: {
        name,
        geminiApiKey: geminiApiKey || null,
        telegramBotToken: telegramBotToken || null
      }
    });

    return NextResponse.json({ success: true, company: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
