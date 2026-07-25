import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, ownerName, ownerEmail } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama organisasi/perusahaan wajib diisi." }, { status: 400 });
    }

    // 1. Buat Company (Tenant)
    const newCompany = await db.company.create({
      data: {
        name,
      }
    });

    // 2. Buat Default Owner User
    const owner = await db.user.create({
      data: {
        companyId: newCompany.id,
        name: ownerName || "Admin " + name,
        email: ownerEmail || `admin@${name.toLowerCase().replace(/[^a-z0-9]/g, "") || "org"}.com`,
        passwordHash: "$2b$10$EPf52dx.Rk4v67.E/R16.uQJ75pCgqQvIpxLhC3Uq.YtqD/pG5sWq", // Hash dari 'password'
        role: "OWNER"
      }
    });

    return NextResponse.json({
      success: true,
      message: "Organisasi baru berhasil didaftarkan!",
      company: newCompany,
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email
      }
    });
  } catch (error: any) {
    console.error("[Create Company Error]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // List all companies for switching context easily in demo mode
    const companies = await db.company.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ success: true, companies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
