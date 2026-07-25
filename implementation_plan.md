# Implementation Plan — Database Migration, Mock Seeding, and API Scaffolding

This document outlines the step-by-step plan for performing the Prisma database migration, updating the mock data seeding script, and scaffolding the requested Next.js App Router API route handlers.

---

## 1. System Analysis & Current State

### Database Configuration & Status
- **Environment variables (`.env`):**
  - `DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"`
- **Environment variables (`.env.local`):**
  - `GEMINI_API_KEY=AIzaSyBQiEmraoxBI5OxZPkR7lEUp4hVhaWuqY8`
- **Database Server:**
  - Prisma Postgres dev server is configured but currently `not_running`.
  - There is a `default` local server defined under `npx prisma dev ls`.
- **Database Client:**
  - Configured in `src/lib/db.ts` using `PrismaPg` adapter and `pg` pool.

---

## 2. CRITICAL COMPLIANCE RULES (AGENTS.md)

All implementations must strictly follow the rules in `<RULE[AGENTS.md]>`:
1. **CRITICAL SYSTEM RULE: DO NOT RUN TERMINAL COMMANDS (`run_command`)**
   Due to a native C++ binary compatibility bug in the Windows environment, executing `run_command` via the agent may crash the backend server. **All terminal commands (e.g., database start, migration, seeding) must be explicitly presented to the USER to run manually in their shell.**
2. **Path Traversal Protection:**
   If any file download/upload or file system access is introduced, protect against traversal:
   ```typescript
   import path from 'path';
   const relative = path.relative(BASE_DIR, TARGET_PATH);
   if (relative.includes('..') || path.isAbsolute(relative)) {
     return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
   }
   ```
3. **HTTP Request Validation:**
   - Always validate parameters. If `companyId` (GET/POST) or `id` (PUT/DELETE) is missing, return HTTP `400 Bad Request` directly. Do NOT fall back to random/first records.
   - Always check for the record's existence in Prisma before executing `update` or `delete` operations, and return HTTP `404 Not Found` if missing.
4. **Backend-Enforced RBAC Middleware:**
   - Implement role/access validation in the API route handlers before interacting with the database.

---

## 3. Step-by-Step Implementation Steps

### Step 3.1: Database Server Initialization & Migration (Executed by User)

Since the dev database server is currently stopped and migrations are not yet initialized:

1. **Start the database server:**
   The user should open their terminal/PowerShell in the project root and run:
   ```bash
   npx prisma dev start default
   ```
   *Note: If port 51214 is not listening after starting the server, run:*
   ```bash
   npx prisma dev -P 51214 -d
   ```

2. **Run Schema Migration:**
   Generate the initial migration files and apply them to the local database:
   ```bash
   npx prisma migrate dev --name init
   ```

---

### Step 3.2: Update Mock Data Seeding (`prisma/seed.js`)

Modify `prisma/seed.js` to seed the database with complete mock data, including geographic coordinates for `Company`, PKWT contracts for `User`, and complete records for `Invoice`, `SalesOrder`, and `PurchaseRequisition`.

#### Proposed Changes in `prisma/seed.js`:

1. **Add clean-up logic for new models:**
   ```javascript
   // Near the top of main()
   await prisma.purchaseRequisition.deleteMany();
   await prisma.salesOrder.deleteMany();
   await prisma.invoice.deleteMany();
   ```

2. **Update `Company` creation:**
   Injectcoordinates for geofencing (centered around Serang, Banten):
   ```javascript
   const company = await prisma.company.create({
     data: {
       name: 'Aziz Tech Automation',
       geminiApiKey: process.env.GEMINI_API_KEY || '',
       officeLatitude: -6.1175,
       officeLongitude: 106.1502,
       officeRadius: 100.0, // 100 meters radius
     },
   });
   ```

3. **Update `User` creation:**
   Add phone and contract parameters:
   ```javascript
   const owner = await prisma.user.create({
     data: {
       companyId: company.id,
       name: 'Aziz Maulana',
       email: 'aziz@example.com',
       passwordHash: '$2b$10$EPf52dx.Rk4v67.E/R16.uQJ75pCgqQvIpxLhC3Uq.YtqD/pG5sWq',
       role: 'OWNER',
       telegramChatId: '7618497952',
       phone: '+6281298765432',
       contractStart: new Date('2025-01-01T00:00:00Z'),
       contractEnd: new Date('2027-12-31T23:59:59Z'),
       divisi: 'Manajemen',
       jatahCutiSisa: 12,
     },
   });

   const supervisor = await prisma.user.create({
     data: {
       companyId: company.id,
       name: 'Eko Supervisor',
       email: 'eko@example.com',
       passwordHash: '$2b$10$EPf52dx.Rk4v67.E/R16.uQJ75pCgqQvIpxLhC3Uq.YtqD/pG5sWq',
       role: 'SUPERVISOR',
       phone: '+6281234567890',
       contractStart: new Date('2025-06-01T00:00:00Z'),
       contractEnd: new Date('2026-06-01T00:00:00Z'),
       divisi: 'Finance',
       jatahCutiSisa: 12,
     },
   });
   ```

4. **Seed `Invoice` (Mock Finance Data):**
   ```javascript
   console.log('Seeding invoices...');
   await prisma.invoice.createMany({
     data: [
       {
         companyId: company.id,
         type: 'RECEIVABLE',
         invoiceNumber: 'INV-2026-001',
         clientName: 'PT Global Distribusi',
         clientPhone: '+628122223333',
         amount: 15000000.0,
         dueDate: new Date('2026-08-01T00:00:00Z'),
         status: 'UNPAID',
       },
       {
         companyId: company.id,
         type: 'PAYABLE',
         invoiceNumber: 'INV-2026-002',
         clientName: 'CV Media Utama',
         clientPhone: '+628133334444',
         amount: 4500000.0,
         dueDate: new Date('2026-07-10T00:00:00Z'), // Past due date
         status: 'OVERDUE',
       },
       {
         companyId: company.id,
         type: 'RECEIVABLE',
         invoiceNumber: 'INV-2026-003',
         clientName: 'PT Sentosa Abadi',
         clientPhone: '+628144445555',
         amount: 25000000.0,
         dueDate: new Date('2026-07-20T00:00:00Z'),
         status: 'PAID',
       }
     ]
   });
   ```

5. **Seed `SalesOrder` & `PurchaseRequisition` (Mock Purchasing/Warehouse Data):**
   ```javascript
   console.log('Seeding sales orders...');
   const so1 = await prisma.salesOrder.create({
     data: {
       companyId: company.id,
       soNumber: 'SO-2026-001',
       customerName: 'PT Delta Steel',
       itemsJson: JSON.stringify([
         { sku: 'BRG-001', name: 'Kertas A4 Sinar Dunia', qty: 20, price: 55000 }
       ]),
       status: 'COMPLETED',
     }
   });

   const so2 = await prisma.salesOrder.create({
     data: {
       companyId: company.id,
       soNumber: 'SO-2026-002',
       customerName: 'PT Jaya Paper',
       itemsJson: JSON.stringify([
         { sku: 'BRG-001', name: 'Kertas A4 Sinar Dunia', qty: 10, price: 55000 },
         { sku: 'BRG-002', name: 'Tinta Printer Epson L3110', qty: 5, price: 95000 }
       ]),
       status: 'PENDING',
     }
   });

   console.log('Seeding purchase requisitions...');
   await prisma.purchaseRequisition.createMany({
     data: [
       {
         companyId: company.id,
         prNumber: 'PR-2026-001',
         salesOrderId: null,
         itemsJson: JSON.stringify([
           { name: 'Raw Pulp Material', qty: 500, unit: 'kg' }
         ]),
         status: 'DRAFT',
       },
       {
         companyId: company.id,
         prNumber: 'PR-2026-002',
         salesOrderId: so2.id,
         itemsJson: JSON.stringify([
           { name: 'Epson Printer Ink Refill', qty: 5, unit: 'pcs' }
         ]),
         status: 'SENT_RFQ',
       }
     ]
   });
   ```

6. **Running the Seeding script (Executed by User):**
   After updating `prisma/seed.js`, the user must run:
   ```bash
   npx prisma db seed
   ```

---

### Step 3.3: API Endpoints Scaffolding

Implement Next.js Route Handlers with full parameters validation, Prisma record checks, and robust error handlers.

#### 1. Finance Route Handler: `/api/finance/invoice`
Create `src/app/api/finance/invoice/route.ts` with the following implementation:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    const body = await req.json();
    const { companyId, type, invoiceNumber, clientName, clientPhone, amount, dueDate, status } = body;

    // Strict validation
    if (!companyId || !type || !invoiceNumber || !clientName || amount === undefined || !dueDate) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
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
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
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
      data: {
        type: type !== undefined ? type : undefined,
        clientName: clientName !== undefined ? clientName : undefined,
        clientPhone: clientPhone !== undefined ? clientPhone : undefined,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        dueDate: dueDate !== undefined ? new Date(dueDate) : undefined,
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
```

#### 2. HR Route Handler: `/api/hr/attendance`
Create `src/app/api/hr/attendance/route.ts` with the following implementation:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Haversine formula to compute distance in meters between two coordinates
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

// GET: Fetch attendance logs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const userId = searchParams.get('userId');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
    }

    const whereClause: any = { companyId };
    if (userId) whereClause.userId = userId;

    const attendanceRecords = await db.absensi.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, divisi: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, records: attendanceRecords });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Log attendance (Check-in) with geofencing validation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, userId, latitude, longitude } = body;

    // Strict validation
    if (!companyId || !userId || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, error: 'companyId, userId, latitude, and longitude are required' }, { status: 400 });
    }

    // Verify company and fetch office location/radius
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { officeLatitude: true, officeLongitude: true, officeRadius: true }
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    // Verify user exists and belongs to the company
    const user = await db.user.findFirst({
      where: { id: userId, companyId }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found in this company' }, { status: 404 });
    }

    let statusKehadiran = 'Ditolak';

    // Perform geofencing calculation if office coordinates are configured
    if (company.officeLatitude !== null && company.officeLongitude !== null) {
      const distance = calculateDistance(
        latitude,
        longitude,
        company.officeLatitude,
        company.officeLongitude
      );
      const allowedRadius = company.officeRadius ?? 50.0;
      if (distance <= allowedRadius) {
        statusKehadiran = 'Hadir';
      }
    } else {
      // Default fallback if no coordinates configured on company (for backward compatibility / safety)
      statusKehadiran = 'Hadir';
    }

    const record = await db.absensi.create({
      data: {
        companyId,
        userId,
        latitude,
        longitude,
        statusKehadiran
      },
      include: {
        user: { select: { name: true, divisi: true } }
      }
    });

    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
```

#### 3. Purchasing Route Handler: `/api/purchasing/requisition`
Create `src/app/api/purchasing/requisition/route.ts` with the following implementation:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    const body = await req.json();
    const { companyId, prNumber, salesOrderId, itemsJson, status } = body;

    // Strict validation
    if (!companyId || !prNumber || !itemsJson) {
      return NextResponse.json({ success: false, error: 'companyId, prNumber, and itemsJson are required' }, { status: 400 });
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
        salesOrderId,
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
    const body = await req.json();
    const { id, itemsJson, status, salesOrderId } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID transaksi wajib diisi' }, { status: 400 });
    }

    // Validate existence
    const existing = await db.purchaseRequisition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    // Validate itemsJson format if provided
    if (itemsJson !== undefined) {
      try {
        JSON.parse(itemsJson);
      } catch {
        return NextResponse.json({ success: false, error: 'itemsJson must be a valid JSON string' }, { status: 400 });
      }
    }

    // Verify sales order if changed
    if (salesOrderId) {
      const soExists = await db.salesOrder.findFirst({
        where: { id: salesOrderId, companyId: existing.companyId }
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
        salesOrderId: salesOrderId !== undefined ? salesOrderId : undefined,
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
```

---

## 4. Verification & Testing Instructions (For the User)

Since the agent cannot execute terminal commands, the user is required to run the following checks manually:

1. **Verify Seeding:**
   Run:
   ```bash
   npx prisma db seed
   ```
   Check if the database displays seed success outputs, and that the coordinates for the company and contract dates are written correctly.

2. **Verify Next.js Routes Building:**
   Run:
   ```bash
   npm run build
   ```
   Confirm that the Next.js App Router successfully builds the route segments under `/api/finance/invoice`, `/api/hr/attendance`, and `/api/purchasing/requisition`.

3. **Verify API Requests (e.g., using curl or local script):**
   Run the dev server:
   ```bash
   npm run dev
   ```
   Test GET endpoints:
   - Invoice: `http://localhost:3000/api/finance/invoice?companyId=<seeded_company_id>`
   - Attendance: `http://localhost:3000/api/hr/attendance?companyId=<seeded_company_id>`
   - Requisition: `http://localhost:3000/api/purchasing/requisition?companyId=<seeded_company_id>`
   Verify that all requests return status `200` with the corresponding records, and return status `400` when `companyId` is omitted.
