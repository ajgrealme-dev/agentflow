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
  // 'all' — return epoch-like far past
  return new Date('2000-01-01');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let companyId = searchParams.get('companyId');
    const period = searchParams.get('period') || 'month';

    if (!companyId) {
      return NextResponse.json({ success: false, error: "companyId is required" }, { status: 400 });
    }

    const startDate = getStartDate(period);

    const receipts = await db.financialReceipt.findMany({
      where: {
        companyId,
        createdAt: { gte: startDate },
      },
      include: {
        uploadedBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalAmount = receipts.reduce((sum, r) => sum + (r.totalAmount ?? 0), 0);
    const totalCount = receipts.length;

    const pendingApprovals = await db.approval.count({
      where: {
        companyId,
        status: 'PENDING',
        type: { in: ['PURCHASE', 'REIMBURSEMENT'] },
      },
    });

    return NextResponse.json({
      success: true,
      receipts,
      stats: { totalAmount, totalCount, pendingApprovals, period },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, merchantName, totalAmount, transactionDate, description } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID transaksi wajib diisi' }, { status: 400 });
    }

    // Get old receipt to merge rawAiAnalysis description
    const oldReceipt = await db.financialReceipt.findUnique({ where: { id } });
    if (!oldReceipt) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }
    let newRawAiAnalysis = oldReceipt.rawAiAnalysis || '{}';
    
    let parsed: any = {};
    try {
      parsed = JSON.parse(oldReceipt.rawAiAnalysis || '{}');
    } catch {}
    
    if (description !== undefined) {
      parsed.deskripsi = description;
      newRawAiAnalysis = JSON.stringify(parsed);
    }

    const updated = await db.financialReceipt.update({
      where: { id },
      data: {
        merchantName,
        totalAmount: totalAmount !== undefined ? parseFloat(totalAmount) : undefined,
        transactionDate: transactionDate ? new Date(transactionDate) : undefined,
        rawAiAnalysis: newRawAiAnalysis,
      },
    });

    return NextResponse.json({ success: true, receipt: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID transaksi wajib diisi' }, { status: 400 });
    }

    const oldReceipt = await db.financialReceipt.findUnique({ where: { id } });
    if (!oldReceipt) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    await db.financialReceipt.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Transaksi berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

