import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch invoices for a company
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type'); // "RECEIVABLE" or "PAYABLE"
    const status = searchParams.get('status');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
    }

    const whereClause: any = { companyId };
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    const invoices = await db.invoice.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, invoices });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Create a new invoice
export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid JSON request body' }, { status: 400 });
    }
    const { companyId, type, invoiceNumber, clientName, clientPhone, amount, dueDate, status } = body;

    // Strict validation
    if (typeof companyId !== 'string' || typeof type !== 'string' || typeof invoiceNumber !== 'string' || typeof clientName !== 'string') {
      return NextResponse.json({ success: false, error: 'companyId, type, invoiceNumber, and clientName must be strings' }, { status: 400 });
    }

    if (typeof dueDate !== 'string' && typeof dueDate !== 'number') {
      return NextResponse.json({ success: false, error: 'dueDate must be a string or number' }, { status: 400 });
    }

    if (typeof amount !== 'string' && typeof amount !== 'number') {
      return NextResponse.json({ success: false, error: 'amount must be a string or number' }, { status: 400 });
    }
    const amountNum = parseFloat(amount as any);
    if (isNaN(amountNum) || amountNum < 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount value' }, { status: 400 });
    }

    const dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid due date value' }, { status: 400 });
    }

    // Verify company exists
    const companyExists = await db.company.findUnique({ where: { id: companyId } });
    if (!companyExists) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    // Check unique invoiceNumber
    const existingInvoice = await db.invoice.findUnique({ where: { invoiceNumber } });
    if (existingInvoice) {
      return NextResponse.json({ success: false, error: 'Invoice number already exists' }, { status: 400 });
    }

    const newInvoice = await db.invoice.create({
      data: {
        companyId,
        type,
        invoiceNumber,
        clientName,
        clientPhone,
        amount: amountNum,
        dueDate: dueDateObj,
        status: status || 'UNPAID',
      }
    });

    return NextResponse.json({ success: true, invoice: newInvoice }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Update an invoice
export async function PUT(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid JSON request body' }, { status: 400 });
    }
    const { id, companyId, type, invoiceNumber, clientName, clientPhone, amount, dueDate, status } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'ID transaksi wajib diisi dan harus string' }, { status: 400 });
    }

    if (companyId !== undefined && typeof companyId !== 'string') {
      return NextResponse.json({ success: false, error: 'companyId must be a string' }, { status: 400 });
    }
    if (type !== undefined && typeof type !== 'string') {
      return NextResponse.json({ success: false, error: 'type must be a string' }, { status: 400 });
    }
    if (invoiceNumber !== undefined && typeof invoiceNumber !== 'string') {
      return NextResponse.json({ success: false, error: 'invoiceNumber must be a string' }, { status: 400 });
    }
    if (clientName !== undefined && typeof clientName !== 'string') {
      return NextResponse.json({ success: false, error: 'clientName must be a string' }, { status: 400 });
    }

    if (dueDate !== undefined) {
      if (typeof dueDate !== 'string' && typeof dueDate !== 'number') {
        return NextResponse.json({ success: false, error: 'dueDate must be a string or number' }, { status: 400 });
      }
    }

    let amountNum: number | undefined = undefined;
    if (amount !== undefined) {
      if (typeof amount !== 'string' && typeof amount !== 'number') {
        return NextResponse.json({ success: false, error: 'amount must be a string or number' }, { status: 400 });
      }
      amountNum = parseFloat(amount as any);
      if (isNaN(amountNum) || amountNum < 0) {
        return NextResponse.json({ success: false, error: 'Invalid amount value' }, { status: 400 });
      }
    }

    const existing = await db.invoice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    let dueDateObj: Date | undefined = undefined;
    if (dueDate !== undefined) {
      dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid due date value' }, { status: 400 });
      }
    }

    const updated = await db.invoice.update({
      where: { id },
      data: {
        type: type !== undefined ? type : undefined,
        clientName: clientName !== undefined ? clientName : undefined,
        clientPhone: clientPhone !== undefined ? clientPhone : undefined,
        amount: amountNum !== undefined ? amountNum : undefined,
        dueDate: dueDateObj !== undefined ? dueDateObj : undefined,
        status: status !== undefined ? status : undefined,
      }
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Delete an invoice
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID transaksi wajib diisi' }, { status: 400 });
    }

    const existing = await db.invoice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    await db.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Invoice berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
