import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getStartDate(period: string): Date {
  const now = new Date();
  if (period === 'today') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  } else if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  } else if (period === 'month') {
    const d = new Date(now);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date('2000-01-01');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let companyId = searchParams.get('companyId');
    const period = searchParams.get('period') || 'today';

    if (!companyId) {
      return NextResponse.json({ success: false, error: "companyId is required" }, { status: 400 });
    }

    const startDate = getStartDate(period);

    const records = await db.absensi.findMany({
      where: {
        companyId,
        createdAt: { gte: startDate },
      },
      include: {
        user: {
          select: { name: true, divisi: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalEmployees = await db.user.count({ where: { companyId } });
    const totalHadir = records.filter((r) => r.statusKehadiran === 'Hadir').length;
    const totalDitolak = records.filter((r) => r.statusKehadiran === 'Ditolak').length;
    const attendanceRate =
      records.length > 0 ? Math.round((totalHadir / records.length) * 100) : 0;

    return NextResponse.json({
      success: true,
      records,
      stats: { totalHadir, totalDitolak, totalEmployees, attendanceRate },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
