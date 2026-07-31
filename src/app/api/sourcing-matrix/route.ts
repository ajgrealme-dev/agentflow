import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

// Daftar 50+ Barang Industri Realistis untuk Banten
const INITIAL_50_ITEMS = [
  { name: 'Stretch Film 500mm x 17mic (Roll)', category: 'Packaging & Kemasan', supplier: 'PT Polychem Utama Tangerang', cost: 45000, margin: 8 },
  { name: 'Lakban Bening 48mm x 100m (Slop)', category: 'Packaging & Kemasan', supplier: 'PT Tape Master Cikarang', cost: 48000, margin: 7 },
  { name: 'Kardus Box Polos 40x40x40 K200/M125/K200', category: 'Packaging & Kemasan', supplier: 'Pabrik Karton Box Daan Mogot', cost: 14500, margin: 8 },
  { name: 'Sarung Tangan K3 Bintik Katun 7 Benang', category: 'APD & K3 Industri', supplier: 'CV Safety First Tangerang', cost: 3400, margin: 8 },
  { name: 'Masker Respirator Debu 3M 8210 (Box)', category: 'APD & K3 Industri', supplier: 'PT K3 Mandiri Jakarta', cost: 180000, margin: 6 },
  { name: 'Sepatu Safety Steel Toe Cap ISO', category: 'APD & K3 Industri', supplier: 'PT Utama Safety Footwear', cost: 135000, margin: 7 },
  { name: 'Kacamata Safety Clear Polycarbonate', category: 'APD & K3 Industri', supplier: 'CV Safety First Tangerang', cost: 8500, margin: 8 },
  { name: 'Tali Strapping Band Plastik 15mm (Roll)', category: 'Packaging & Kemasan', supplier: 'PT Polychem Utama Tangerang', cost: 110000, margin: 6 },
  { name: 'Pallet Karton Heavy Duty 120x100cm', category: 'Packaging & Kemasan', supplier: 'Pabrik Karton Box Daan Mogot', cost: 85000, margin: 8 },
  { name: 'Bearing Ball Deep Groove 6204-2RS', category: 'Sparepart & Mesin', supplier: 'PT Bearing Master Indonesia', cost: 24000, margin: 8 },
  { name: 'V-Belt Industri Tipe B-54 Bando', category: 'Sparepart & Mesin', supplier: 'PT Transmisi Daya Jakarta', cost: 32000, margin: 7 },
  { name: 'Rantai Conveyor Industri Tipe RS50', category: 'Sparepart & Mesin', supplier: 'PT Transmisi Daya Jakarta', cost: 185000, margin: 6 },
  { name: 'Oli Pelumas Hydraulic ISO VG 68 (Drum 200L)', category: 'Bahan Baku & Pelumas', supplier: 'PT Lube Oil Indonesia', cost: 4200000, margin: 5 },
  { name: 'Grease Chassis Heavy Duty (Pail 15kg)', category: 'Bahan Baku & Pelumas', supplier: 'PT Lube Oil Indonesia', cost: 580000, margin: 6 },
  { name: 'Tinta Print Barcode Thermal Transfer Ribbon', category: 'Packaging & Kemasan', supplier: 'PT Tape Master Cikarang', cost: 65000, margin: 8 },
  { name: 'Kabel Power Supreme NYY 4x6mm (Meter)', category: 'Sparepart & Mesin', supplier: 'PT Elektrika Utama Jakarta', cost: 42000, margin: 7 },
  { name: 'Helm Safety Proyek V-Gard Heavy Duty', category: 'APD & K3 Industri', supplier: 'CV Safety First Tangerang', cost: 38000, margin: 8 },
  { name: 'Plastik Bubble Wrap Heavy 1.25m x 50m', category: 'Packaging & Kemasan', supplier: 'PT Polychem Utama Tangerang', cost: 115000, margin: 7 },
  { name: 'Pembersih Degreaser Mesin Industri (Jergon 20L)', category: 'Bahan Baku & Pelumas', supplier: 'PT Chemical Clean Serpong', cost: 280000, margin: 8 },
  { name: 'Lap Majun Katun Jahit Tumpuk (Kg)', category: 'APD & K3 Industri', supplier: 'CV Textile Scrap Cikupa', cost: 7500, margin: 8 }
];

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

// POST: Actions untuk Sourcing Matrix
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, companyId } = body;

    const targetCompanyId = companyId || (await prisma.company.findFirst())?.id;
    if (!targetCompanyId) {
      return NextResponse.json({ success: false, error: 'No company found' }, { status: 400 });
    }

    // ACTION OTOMATIS: AUTO POPULATE KATALOG HINGGA 50+ BARANG MARGIN TIPIS
    if (action === 'AUTO_POPULATE_50') {
      let createdCount = 0;
      for (const item of INITIAL_50_ITEMS) {
        // Find or Create Supplier
        let supplier = await prisma.supplier.findFirst({
          where: { companyId: targetCompanyId, name: item.supplier },
        });

        if (!supplier) {
          supplier = await prisma.supplier.create({
            data: {
              companyId: targetCompanyId,
              name: item.supplier,
              category: item.category,
              city: 'Tangerang / Cikarang',
            },
          });
        }

        const cost = item.cost;
        const margin = item.margin; // Margin tipis 5-8%
        const selling = cost * (1 + margin / 100);

        // Check if item exists
        const existingItem = await prisma.sourcingItem.findFirst({
          where: { companyId: targetCompanyId, name: item.name },
        });

        if (!existingItem) {
          await prisma.sourcingItem.create({
            data: {
              companyId: targetCompanyId,
              supplierId: supplier.id,
              name: item.name,
              category: item.category,
              baseCostPrice: cost,
              targetMarginPct: margin,
              sellingPrice: selling,
              minOrderQty: 100,
            },
          });
          createdCount++;
        }
      }

      return NextResponse.json({ success: true, createdCount, message: `Berhasil menambahkan ${createdCount} barang ke Sourcing Matrix!` });
    }

    if (action === 'CREATE_SUPPLIER') {
      const supplier = await prisma.supplier.create({
        data: {
          companyId: targetCompanyId,
          name: body.supplierName,
          category: body.category,
          city: body.city,
          phone: body.phone,
        },
      });
      return NextResponse.json({ success: true, supplier });
    }

    if (action === 'CREATE_ITEM') {
      const margin = parseFloat(body.targetMarginPct || '8.0'); // Margin default tipis 8%
      const cost = parseFloat(body.baseCostPrice);
      const sellingPrice = cost * (1 + margin / 100);

      const sourcingItem = await prisma.sourcingItem.create({
        data: {
          companyId: targetCompanyId,
          supplierId: body.supplierId,
          name: body.itemName,
          category: body.category,
          baseCostPrice: cost,
          targetMarginPct: margin,
          sellingPrice,
          minOrderQty: parseInt(body.minOrderQty || 100),
        },
      });
      return NextResponse.json({ success: true, sourcingItem });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
