## Forensic Audit Report

**Work Product**: Database Seeding and Next.js App Router API Routes for Finance, HR, and Purchasing modules
- `prisma/seed.js`
- `src/app/api/finance/invoice/route.ts`
- `src/app/api/hr/attendance/route.ts`
- `src/app/api/purchasing/requisition/route.ts`
**Profile**: General Project
**Verdict**: CLEAN

### Phase Results
- **Hardcoded Output Detection**: PASS — No hardcoded test results, mock verification logs, or bypass codes were found in the implementation of the seed script or the API routes.
- **Facade Detection**: PASS — All implemented methods (GET, POST, PUT, DELETE) in the API routes contain genuine, functional business logic, including validations, data checks, and calculations.
- **Pre-populated Artifact Detection**: PASS — No pre-populated log files, fake reports, or mock verification outputs exist within the agent's metadata directories or codebase before testing.
- **Database Client Connection**: PASS — The implementation properly instantiates and connects to the PostgreSQL database via Prisma client and pools in both Next.js app context and the standalone seed script.
- **API Request Validation and Error Handling**: PASS — API routes perform strict validation on incoming parameters (returning HTTP 400 on missing key parameters like `companyId` or transaction `id`), verify record existence prior to updates/deletions (returning HTTP 404), and gracefully wrap execution in try-catch blocks returning HTTP 500 on database failure, ensuring robustness.

### Evidence

#### 1. Database Seeding (`prisma/seed.js`)
The seed script directly invokes Prisma client methods to delete and recreate company data, users, invoice, attendance, and requisition records, using appropriate schema relationships:
```javascript
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ...
  await prisma.purchaseRequisition.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.invoice.deleteMany();
  // ...
  const company = await prisma.company.create({
    data: {
      name: 'Aziz Tech Automation',
      officeLatitude: -6.1175,
      officeLongitude: 106.1502,
      officeRadius: 100.0,
    },
  });
  // ...
}
```

#### 2. Finance Invoice API Route (`src/app/api/finance/invoice/route.ts`)
The endpoint integrates fully with Prisma and validates both transaction existence and ID parameters before running query or command operations:
```typescript
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, type, clientName, clientPhone, amount, dueDate, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID transaksi wajib diisi' }, { status: 400 });
    }

    const existing = await db.invoice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    const updated = await db.invoice.update({
      where: { id },
      data: { ... }
    });
    return NextResponse.json({ success: true, invoice: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
```

#### 3. HR Attendance Geofencing API Route (`src/app/api/hr/attendance/route.ts`)
Uses the standard Haversine formula to compute geodesic distances between client coordinates and seeded company coordinates to enforce geofenced attendance check-ins:
```typescript
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}
```

#### 4. Purchasing Requisition API Route (`src/app/api/purchasing/requisition/route.ts`)
Converts Sales Orders into Purchase Requisitions, checks inputs JSON formats, and queries the database client dynamically:
```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, prNumber, salesOrderId, itemsJson, status } = body;

    if (!companyId || !prNumber || !itemsJson) {
      return NextResponse.json({ success: false, error: 'companyId, prNumber, and itemsJson are required' }, { status: 400 });
    }

    try {
      JSON.parse(itemsJson);
    } catch {
      return NextResponse.json({ success: false, error: 'itemsJson must be a valid JSON string' }, { status: 400 });
    }
    // ...
    const newRequisition = await db.purchaseRequisition.create({
      data: { companyId, prNumber, salesOrderId, itemsJson, status: status || 'DRAFT' }
    });
    return NextResponse.json({ success: true, requisition: newRequisition }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
```
