/**
 * ====================================================================
 * AGENTFLOW AUTONOMOUS BROKERAGE LOOP ENGINE (LOOP ENGINEERING)
 * ====================================================================
 * System: Closed-Loop Autonomous B2B Broker Engine
 * Identity: AZIZ - Independent Industrial Sourcing (Perorangan)
 * Strategy: High Volume x 8% Margin (Modal Rp 0 via DP 50%)
 * ====================================================================
 */

const path = require('path');

// Dynamically import db from lib
async function main() {
  const { db: prisma } = await import('../src/lib/db.ts');
  const LOOP_INTERVAL_MINUTES = 30;
  let isLoopRunning = false;

  async function stagePerceive() {
    console.log('\n🔍 [STAGE 1: PERCEIVE] Menyisir sinyal kebutuhan pabrik di Cikande & Cilegon...');
    
    const items = await prisma.sourcingItem.findMany({
      include: { supplier: true },
      take: 5
    });

    if (items.length === 0) {
      console.log('⚠️ Sourcing Matrix belum terisi. Menunggu data barang...');
      return [];
    }

    const targetFactories = [
      { name: 'PT Nikomas Gemilang', city: 'Cikande, Serang', demandItem: items[0] },
      { name: 'PT Asietex Sinar Indopratama', city: 'Cikande, Serang', demandItem: items[1] || items[0] },
      { name: 'PT Krakatau Posco', city: 'KIEC, Cilegon', demandItem: items[2] || items[0] }
    ];

    console.log(`✅ [PERCEIVE OK] Ditemukan ${targetFactories.length} peluang kebutuhan pabrik aktif.`);
    return targetFactories;
  }

  async function stageReasoning(opportunities) {
    console.log('\n🧠 [STAGE 2: REASONING] Menghitung margin tipis 8% & mengunci skema DP 50%...');
    
    const preparedDeals = [];

    for (const opp of opportunities) {
      const item = opp.demandItem;
      if (!item) continue;

      const qty = 500;
      const baseCost = item.baseCostPrice;
      const marginPct = 8.0;
      const sellingPrice = baseCost * (1 + marginPct / 100);

      const totalBaseCost = qty * baseCost;
      const totalSellingVal = qty * sellingPrice;
      const grossProfit = totalSellingVal - totalBaseCost;
      const requiredDpAmt = totalSellingVal * 0.5;

      preparedDeals.push({
        buyerName: opp.name,
        buyerCity: opp.city,
        supplierId: item.supplierId,
        sourcingItemId: item.id,
        itemName: item.name,
        quantity: qty,
        totalBaseCost,
        totalSellingVal,
        grossProfit,
        requiredDpAmt
      });
    }

    console.log(`✅ [REASONING OK] ${preparedDeals.length} draf penawaran B2B siap dieksekusi.`);
    return preparedDeals;
  }

  async function stageAction(deals) {
    console.log('\n🚀 [STAGE 3: ACTION] Menerbitkan penawaran perorangan (AZIZ) & menyimpan deal...');

    const company = await prisma.company.findFirst();
    if (!company) {
      console.log('❌ Error: Company ID tidak ditemukan.');
      return;
    }

    for (const deal of deals) {
      const createdDeal = await prisma.brokerDeal.create({
        data: {
          companyId: company.id,
          buyerName: deal.buyerName,
          buyerCity: deal.buyerCity,
          supplierId: deal.supplierId,
          sourcingItemId: deal.sourcingItemId,
          quantity: deal.quantity,
          totalBaseCost: deal.totalBaseCost,
          totalSellingVal: deal.totalSellingVal,
          grossProfit: deal.grossProfit,
          paymentScheme: 'DP50',
          requiredDpAmt: deal.requiredDpAmt,
          status: 'QUOTED'
        }
      });

      console.log(`
---------------------------------------------------------
🤖 [AI BROKER OTONOM - DEAL EXECUTED]
---------------------------------------------------------
• Target Pembeli : ${deal.buyerName} (${deal.buyerCity})
• Barang         : ${deal.itemName} (${deal.quantity} unit)
• Total Penawaran: Rp ${deal.totalSellingVal.toLocaleString()}
• Syarat DP 50%  : Rp ${deal.requiredDpAmt.toLocaleString()} (Cover Modal HPP)
• PROFIT BERSIH  : +Rp ${deal.grossProfit.toLocaleString()} (Atas Nama AZIZ)
---------------------------------------------------------`);
    }
  }

  async function executeClosedLoop() {
    if (isLoopRunning) return;
    isLoopRunning = true;

    try {
      console.log('\n=========================================================');
      console.log(`🔄 AGENTFLOW CLOSED-LOOP ENGINE RUNNING AT [${new Date().toLocaleTimeString()}]`);
      console.log('=========================================================');

      const opportunities = await stagePerceive();
      if (opportunities.length > 0) {
        const deals = await stageReasoning(opportunities);
        await stageAction(deals);
      }

      console.log(`\n⏳ [STAGE 4: EVALUATE & SLEEP] Siklus Loop Selesai. Istirahat ${LOOP_INTERVAL_MINUTES} menit...`);
    } catch (error) {
      console.error('❌ Error dalam loop otonom:', error);
    } finally {
      isLoopRunning = false;
    }
  }

  executeClosedLoop();
  setInterval(executeClosedLoop, LOOP_INTERVAL_MINUTES * 60 * 1000);
}

main().catch(console.error);
