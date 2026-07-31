# 🏗️ SYSTEM DESIGN DOCUMENT (SDD)
## AGENTFLOW B2B AUTOMATED BROKERAGE ENGINE
## Versi: 2.0.0 | Status: APPROVED (SECOND BRAIN & SCHEDULE INTEGRATED)

---

## 🏛️ 1. ARSITEKTUR BACKEND & MODEL DATABASE (SECOND BRAIN PRISMA SCHEMA)

```prisma
model AgentMemoryLog {
  id          String   @id @default(uuid())
  companyId   String
  entityType  String   // BUYER atau SUPPLIER
  entityName  String   // Nama Pabrik atau Supplier
  memoryType  String   // PREFERENCE, PAYMENT_SPEED, DISPOSAL_REPUTATION
  content     String   @db.Text // Teks ingatan jangka panjang AI
  weight      Float    @default(1.0) // Bobot pentingnya ingatan
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model KnowledgeGraphItem {
  id          String   @id @default(uuid())
  companyId   String
  itemName    String   // Nama barang yang ditemukan mandiri oleh AI
  category    String
  estBaseCost Float
  marginPct   Float    @default(8.0)
  autoSourced Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model Supplier {
  id              String         @id @default(uuid())
  companyId       String
  name            String         // Nama Master Stockist (misal: PT Polychem Utama)
  category        String         // Packaging, APD, Sparepart, Pelumas
  city            String?        // Tangerang, Cikarang, Jakarta
  sourcingItems   SourcingItem[]
  deals           BrokerDeal[]
}

model SourcingItem {
  id              String         @id @default(uuid())
  supplierId      String
  name            String
  category        String
  baseCostPrice   Float
  targetMarginPct Float          @default(8.0) // Margin tipis 8%
  sellingPrice    Float
  minOrderQty     Int            @default(100)
}

model BrokerDeal {
  id              String         @id @default(uuid())
  buyerName       String
  buyerCity       String?
  quantity        Int
  totalBaseCost   Float
  totalSellingVal Float
  grossProfit     Float          // Profit Bersih AZIZ
  paymentScheme   String         @default("DP50")
  requiredDpAmt   Float          // Nominal Uang DP 50%
  status          String         @default("QUOTED")
}
```

---

## 🔌 2. KONTRAK INTERFACE API & SECOND BRAIN ROUTING

1. **`GET /api/sourcing-matrix`**: Mengambil katalog supplier, deal transaksi, dan catatan ingatan Second Brain.
2. **`POST /api/sourcing-matrix`**: Menambah supplier atau barang baru dengan kalkulasi margin tipis 8%.
3. **`POST /api/brokerage/run-loop`**: Memicu siklus Loop Engineering otonom berdasar *Schedule/Cron*.
4. **`GET/POST /api/agent-memory`**: Membaca dan menulis catatan ingatan jangka panjang AI (Second Brain).

---

## 🔄 3. CLOSED-LOOP DAEMON ENGINE & AUTOMATED SCHEDULE ARCHITECTURE
* **File Service:** `scripts/brokerage-engine.js` (Mengadopsi timer *Schedule/Cron* 24/7).
* **PM2 Config:** `ecosystem.config.js` (`name: "agentflow-broker-engine"`, `instances: 1`, `exec_mode: "fork"`).
