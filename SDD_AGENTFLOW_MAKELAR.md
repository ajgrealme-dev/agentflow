# 🏗️ SYSTEM DESIGN DOCUMENT (SDD)
## AGENTFLOW B2B AUTOMATED BROKERAGE ENGINE
## Versi: 1.0.0 | Status: APPROVED

---

## 🏛️ 1. ARSITEKTUR BACKEND & MODEL DATABASE (PRISMA SCHEMA)

```prisma
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
  name            String         // Nama Barang (misal: Stretch Film 500mm 17mic)
  category        String
  baseCostPrice   Float          // Modal HPP dari Supplier
  targetMarginPct Float          @default(8.0) // Margin tipis 8%
  sellingPrice    Float          // Harga Penawaran ke Pembeli
  minOrderQty     Int            @default(100)
}

model BrokerDeal {
  id              String         @id @default(uuid())
  buyerName       String         // Nama Pabrik Target (misal: PT Nikomas Gemilang)
  buyerCity       String?        // Cikande, Serang
  quantity        Int
  totalBaseCost   Float          // Modal HPP Total
  totalSellingVal Float          // Total Penawaran
  grossProfit     Float          // Profit Bersih AZIZ
  paymentScheme   String         @default("DP50")
  requiredDpAmt   Float          // Nominal Uang DP 50%
  status          String         @default("QUOTED") // DRAFT, QUOTED, PO_RECEIVED, DP_PAID, SHIPPED, COMPLETED
}
```

---

## 🔌 2. KONTRAK INTERFACE API & ROUTING

1. **`GET /api/sourcing-matrix`**: Mengambil katalog supplier & deal transaksi makelar.
2. **`POST /api/sourcing-matrix`**:
   - `action: "AUTO_POPULATE_50"`: Menyuntikkan 50+ barang otonom dengan margin 8%.
   - `action: "CREATE_ITEM"`: Menambah barang baru secara manual.
3. **`POST /api/brokerage/run-loop`**: Memicu siklus Loop Engineering (Perceive → Reason → Act → Evaluate).

---

## 🔄 3. CLOSED-LOOP DAEMON ENGINE ARCHITECTURE
* **File Service:** `scripts/brokerage-engine.js`
* **PM2 Config:** `ecosystem.config.js` (`name: "agentflow-broker-engine"`, `instances: 1`, `exec_mode: "fork"`).
