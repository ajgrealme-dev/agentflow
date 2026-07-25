import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch all purchase requisitions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
    }

    const whereClause: any = { companyId };
    if (status) whereClause.status = status;

    const requisitions = await db.purchaseRequisition.findMany({
      where: whereClause,
      include: {
        salesOrder: {
          select: { soNumber: true, customerName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, requisitions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Create a new purchase requisition
export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON request body' }, { status: 400 });
    }
    const { companyId, prNumber, salesOrderId, itemsJson, status } = body;

    // Check if companyId, prNumber, salesOrderId are strings (if provided)
    if (companyId !== undefined && typeof companyId !== 'string') {
      return NextResponse.json({ success: false, error: 'companyId must be a string' }, { status: 400 });
    }
    if (prNumber !== undefined && typeof prNumber !== 'string') {
      return NextResponse.json({ success: false, error: 'prNumber must be a string' }, { status: 400 });
    }
    if (salesOrderId !== undefined && salesOrderId !== null && typeof salesOrderId !== 'string') {
      return NextResponse.json({ success: false, error: 'salesOrderId must be a string' }, { status: 400 });
    }

    // Strict validation
    if (!companyId || !prNumber || !itemsJson) {
      return NextResponse.json({ success: false, error: 'companyId, prNumber, and itemsJson are required' }, { status: 400 });
    }

    if (typeof itemsJson !== 'string') {
      return NextResponse.json({ success: false, error: 'itemsJson must be a valid JSON string' }, { status: 400 });
    }

    // Validate JSON format
    try {
      JSON.parse(itemsJson);
    } catch {
      return NextResponse.json({ success: false, error: 'itemsJson must be a valid JSON string' }, { status: 400 });
    }

    // Verify company exists
    const companyExists = await db.company.findUnique({ where: { id: companyId } });
    if (!companyExists) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    // Verify related sales order exists if provided
    if (salesOrderId) {
      const salesOrderExists = await db.salesOrder.findFirst({
        where: { id: salesOrderId, companyId }
      });
      if (!salesOrderExists) {
        return NextResponse.json({ success: false, error: 'Sales Order not found' }, { status: 404 });
      }
    }

    // Check unique prNumber
    const existingPR = await db.purchaseRequisition.findUnique({ where: { prNumber } });
    if (existingPR) {
      return NextResponse.json({ success: false, error: 'PR number already exists' }, { status: 400 });
    }

    const newRequisition = await db.purchaseRequisition.create({
      data: {
        companyId,
        prNumber,
        salesOrderId: (salesOrderId === "" || salesOrderId === null) ? null : salesOrderId,
        itemsJson,
        status: status || 'DRAFT'
      }
    });

    return NextResponse.json({ success: true, requisition: newRequisition }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Update an existing purchase requisition
export async function PUT(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON request body' }, { status: 400 });
    }
    const { id, itemsJson, status, salesOrderId, companyId, prNumber } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'ID transaksi wajib diisi dan harus string' }, { status: 400 });
    }

    if (companyId !== undefined && typeof companyId !== 'string') {
      return NextResponse.json({ success: false, error: 'companyId must be a string' }, { status: 400 });
    }
    if (prNumber !== undefined && typeof prNumber !== 'string') {
      return NextResponse.json({ success: false, error: 'prNumber must be a string' }, { status: 400 });
    }

    let resolvedSalesOrderId: string | null | undefined = undefined;
    if (salesOrderId !== undefined) {
      if (salesOrderId === "" || salesOrderId === null) {
        resolvedSalesOrderId = null;
      } else {
        if (typeof salesOrderId !== 'string') {
          return NextResponse.json({ success: false, error: 'salesOrderId must be a string' }, { status: 400 });
        }
        resolvedSalesOrderId = salesOrderId;
      }
    }

    // Validate existence
    const existing = await db.purchaseRequisition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    // Validate itemsJson format if provided
    if (itemsJson !== undefined) {
      if (typeof itemsJson !== 'string') {
        return NextResponse.json({ success: false, error: 'itemsJson must be a valid JSON string' }, { status: 400 });
      }
      try {
        JSON.parse(itemsJson);
      } catch {
        return NextResponse.json({ success: false, error: 'itemsJson must be a valid JSON string' }, { status: 400 });
      }
    }

    // Verify sales order if changed
    if (resolvedSalesOrderId) {
      const soExists = await db.salesOrder.findFirst({
        where: { id: resolvedSalesOrderId, companyId: existing.companyId }
      });
      if (!soExists) {
        return NextResponse.json({ success: false, error: 'Sales Order not found' }, { status: 404 });
      }
    }

    const updated = await db.purchaseRequisition.update({
      where: { id },
      data: {
        itemsJson: itemsJson !== undefined ? itemsJson : undefined,
        status: status !== undefined ? status : undefined,
        salesOrderId: resolvedSalesOrderId !== undefined ? resolvedSalesOrderId : undefined,
      }
    });

    return NextResponse.json({ success: true, requisition: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a purchase requisition
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID transaksi wajib diisi' }, { status: 400 });
    }

    const existing = await db.purchaseRequisition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    await db.purchaseRequisition.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Requisition berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
