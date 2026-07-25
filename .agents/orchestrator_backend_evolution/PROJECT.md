# Project: AgentFlow Backend Evolution

## Architecture
AgentFlow Enterprise backend runs on Next.js App Router (Next.js 15/Tailwind v4) and interacts with a PostgreSQL database via Prisma ORM.
- **Database Client:** Configured in `src/lib/db.ts` utilizing `PrismaPg` and pg Pool.
- **Data Flow:**
  - Client / Telegram Bot -> Next.js API Routes -> Prisma Client -> PostgreSQL.
- **Geofencing Verification:** Done in-memory inside the HR API handler using the Haversine formula based on company coordinates and radius.

## Code Layout
- `prisma/schema.prisma` - DB schema definitions
- `prisma/seed.js` - Mock data seeding script
- `src/app/api/finance/invoice/route.ts` - Finance invoice API endpoints
- `src/app/api/hr/attendance/route.ts` - HR attendance API endpoints (with geofencing)
- `src/app/api/purchasing/requisition/route.ts` - Purchasing requisition API endpoints

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Scan Codebase & Plan | Scan codebase, analyze schema, create implementation_plan.md | None | DONE |
| 2 | Database Migration & Server Start | Spin up Prisma dev database and apply migrations | M1 | IN_PROGRESS |
| 3 | Seeding Script Implementation | Update seed.js to seed new columns/models and run seeding | M2 | IN_PROGRESS |
| 4 | Scaffold Finance API Route | Implement /api/finance/invoice handler with validation & checks | M3 | IN_PROGRESS |
| 5 | Scaffold HR API Route | Implement /api/hr/attendance handler with geofencing & checks | M3 | IN_PROGRESS |
| 6 | Scaffold Purchasing API Route | Implement /api/purchasing/requisition handler with validation & checks | M3 | IN_PROGRESS |
| 7 | Verification & Audit | Challenger testing, Reviewer feedback, and Forensic Audit | M4, M5, M6 | PLANNED |

## Interface Contracts
### Invoice Endpoint
- **GET** `/api/finance/invoice?companyId=<id>&type=<RECEIVABLE/PAYABLE>&status=<status>`
  - Response: `{ success: true, invoices: [...] }`
- **POST** `/api/finance/invoice`
  - Body: `{ companyId, type, invoiceNumber, clientName, clientPhone, amount, dueDate, status }`
  - Response: `{ success: true, invoice: {...} }` (201 Created)
- **PUT** `/api/finance/invoice`
  - Body: `{ id, type, clientName, clientPhone, amount, dueDate, status }`
  - Response: `{ success: true, invoice: {...} }`
- **DELETE** `/api/finance/invoice?id=<id>`
  - Response: `{ success: true, message: "Invoice berhasil dihapus" }`

### HR Attendance Endpoint
- **GET** `/api/hr/attendance?companyId=<id>&userId=<user_id>`
  - Response: `{ success: true, records: [...] }`
- **POST** `/api/hr/attendance`
  - Body: `{ companyId, userId, latitude, longitude }`
  - Response: `{ success: true, record: {...} }` (201 Created)

### Purchasing Requisition Endpoint
- **GET** `/api/purchasing/requisition?companyId=<id>&status=<status>`
  - Response: `{ success: true, requisitions: [...] }`
- **POST** `/api/purchasing/requisition`
  - Body: `{ companyId, prNumber, salesOrderId, itemsJson, status }`
  - Response: `{ success: true, requisition: {...} }` (201 Created)
- **PUT** `/api/purchasing/requisition`
  - Body: `{ id, itemsJson, status, salesOrderId }`
  - Response: `{ success: true, requisition: {...} }`
- **DELETE** `/api/purchasing/requisition?id=<id>`
  - Response: `{ success: true, message: "Requisition berhasil dihapus" }`
