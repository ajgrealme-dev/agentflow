import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

// GET: Ambil daftar Sourcing Matrix & Supplier
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const suppliers = await prisma.supplier.findMany({
      where: category ? { category } : undefined,
      include: {
        sourcingItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const deals = await prisma.brokerDeal.findMany({
      include: {
        supplier: true,
        sourcingItem: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      suppliers,
      deals,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Tambah Supplier Baru atau Sourcing Item Baru dengan Margin Otomatis
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, companyId, supplierName, category, city, phone, itemName, baseCostPrice, targetMarginPct, minOrderQty } = body;

    // Cari company default jika tidak ada
    const targetCompanyId = companyId || (await prisma.company.findFirst())?.id;
    if (!targetCompanyId) {
      return NextResponse.json({ success: false, error: 'No company found' }, { status: 400 });
    }

    if (action === 'CREATE_SUPPLIER') {
      const supplier = await prisma.supplier.create({
        data: {
          companyId: targetCompanyId,
          name: supplierName,
          category,
          city,
          phone,
        },
      });
      return NextResponse.json({ success: true, supplier });
    }

    if (action === 'CREATE_ITEM') {
      const margin = targetMarginPct || 25.0; // Margin default 25%
      const cost = parseFloat(baseCostPrice);
      const sellingPrice = cost * (1 + margin / 100);

      const sourcingItem = await prisma.sourcingItem.create({
        data: {
          companyId: targetCompanyId,
          supplierId: body.supplierId,
          name: itemName,
          category,
          baseCostPrice: cost,
          targetMarginPct: margin,
          sellingPrice,
          minOrderQty: parseInt(minOrderQty || 100),
        },
      });
      return NextResponse.json({ success: true, sourcingItem });
    }

    if (action === 'CREATE_DEAL') {
      const { buyerName, buyerCity, supplierId, sourcingItemId, quantity, paymentScheme } = body;
      
      const item = await prisma.sourcingItem.findUnique({ where: { id: sourcingItemId } });
      if (!item) return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });

      const qty = parseInt(quantity);
      const totalBaseCost = qty * item.baseCostPrice;
      const totalSellingVal = qty * item.sellingPrice;
      const grossProfit = totalSellingVal - totalBaseCost;
      const requiredDpAmt = paymentScheme === 'DP30' ? totalSellingVal * 0.3 : totalSellingVal;

      const deal = await prisma.brokerDeal.create({
        data: {
          companyId: targetCompanyId,
          buyerName,
          buyerCity,
          supplierId,
          sourcingItemId,
          quantity: qty,
          totalBaseCost,
          totalSellingVal,
          grossProfit,
          paymentScheme: paymentScheme || 'DP30',
          requiredDpAmt,
          status: 'QUOTED',
        },
      });

      return NextResponse.json({ success: true, deal });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
