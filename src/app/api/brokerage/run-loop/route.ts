import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function POST() {
  try {
    // 1. PERCEIVE: Ambil barang Sourcing Matrix
    const items = await prisma.sourcingItem.findMany({
      include: { supplier: true },
      take: 5,
    });

    if (items.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Sourcing Matrix masih kosong. Silakan jalankan Auto-Sourcing di UI dulu.',
      });
    }

    const company = await prisma.company.findFirst();
    if (!company) {
      return NextResponse.json({ success: false, error: 'No company found' }, { status: 400 });
    }

    // 2. REASONING: Hitung margin 8% dan DP 50%
    const targetFactories = [
      { name: 'PT Nikomas Gemilang', city: 'Cikande, Serang', item: items[0] },
      { name: 'PT Asietex Sinar Indopratama', city: 'Cikande, Serang', item: items[1] || items[0] },
      { name: 'PT Krakatau Posco', city: 'KIEC, Cilegon', item: items[2] || items[0] },
    ];

    const executedDeals = [];

    // 3. ACTION: Simpan deals ke database atas nama AZIZ (Perorangan)
    for (const target of targetFactories) {
      const item = target.item;
      const qty = 500;
      const baseCost = item.baseCostPrice;
      const marginPct = 8.0; // Margin tipis 8%
      const sellingPrice = baseCost * (1 + marginPct / 100);

      const totalBaseCost = qty * baseCost;
      const totalSellingVal = qty * sellingPrice;
      const grossProfit = totalSellingVal - totalBaseCost;
      const requiredDpAmt = totalSellingVal * 0.5; // DP 50%

      const deal = await prisma.brokerDeal.create({
        data: {
          companyId: company.id,
          buyerName: target.name,
          buyerCity: target.city,
          supplierId: item.supplierId,
          sourcingItemId: item.id,
          quantity: qty,
          totalBaseCost,
          totalSellingVal,
          grossProfit,
          paymentScheme: 'DP50',
          requiredDpAmt,
          status: 'QUOTED',
        },
      });

      executedDeals.push(deal);
    }

    return NextResponse.json({
      success: true,
      executedDealsCount: executedDeals.length,
      message: `✅ [LOOP ENGINE] Berhasil mengeksekusi ${executedDeals.length} draf penawaran otonom B2B!`,
      deals: executedDeals,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
