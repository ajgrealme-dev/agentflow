import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getStartDate(type: string): Date {
  const now = new Date();
  if (type === 'daily') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  } else if (type === 'weekly') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  } else {
    // monthly
    const d = new Date(now);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let companyId = searchParams.get('companyId');
    const type = searchParams.get('type') || 'monthly';

    if (!companyId) {
      return NextResponse.json({ success: false, error: "companyId is required" }, { status: 400 });
    }

    const startDate = getStartDate(type);

    const [receipts, leads, absences, approvals] = await Promise.all([
      db.financialReceipt.findMany({
        where: { companyId, createdAt: { gte: startDate } },
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.lead.findMany({
        where: { companyId, createdAt: { gte: startDate } },
        orderBy: { createdAt: 'desc' },
      }),
      db.absensi.findMany({
        where: { companyId, createdAt: { gte: startDate } },
        include: { user: { select: { name: true, divisi: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.approval.findMany({
        where: { companyId, createdAt: { gte: startDate } },
        include: { requester: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalSpend = receipts.reduce((s, r) => s + (r.totalAmount ?? 0), 0);
    const newLeads = leads.length;
    const totalHadir = absences.filter((a) => a.statusKehadiran === 'Hadir').length;
    const attendanceRate =
      absences.length > 0 ? Math.round((totalHadir / absences.length) * 100) : 0;
    const pendingApprovals = approvals.filter((a) => a.status === 'PENDING').length;

    return NextResponse.json({
      success: true,
      period: type,
      startDate: startDate.toISOString(),
      stats: { totalSpend, newLeads, attendanceRate, pendingApprovals },
      receipts,
      leads,
      absences,
      approvals,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
