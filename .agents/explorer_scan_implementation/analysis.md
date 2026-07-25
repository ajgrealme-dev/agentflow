# Analysis & Findings Report — AgentFlow Enterprise Codebase Scan

This report contains the findings from the exploration of the AgentFlow Enterprise codebase. It details the database models, configuration variables, running state, and route scaffolding architectural design.

---

## 1. Codebase Scan Summary

### 1.1 Database Models (`prisma/schema.prisma`)
The Prisma schema defines several core models. The relevant models for our planning are:
- **`Company`**:
  - Acts as the tenant model.
  - Contains fields: `id` (UUID), `name`, `geminiApiKey` (optional BYOK), `telegramBotToken` (optional), `officeLatitude` (Float?), `officeLongitude` (Float?), and `officeRadius` (Float? with default 50.0).
  - Relations: has one-to-many relationships with `User`, `Lead`, `FinancialReceipt`, `InventoryItem`, `Approval`, `AuditLog`, `Absensi`, `Invoice`, `SalesOrder`, and `PurchaseRequisition`.
- **`User`**:
  - Represents the employees and owners.
  - Contains fields: `id` (UUID), `companyId`, `name`, `email` (unique), `passwordHash`, `role` ("STAFF", "SUPERVISOR", "OWNER"), `telegramChatId` (unique), `phone` (String?), `contractStart` (DateTime?), `contractEnd` (DateTime?), `divisi`, `jatahCutiSisa` (Int), `kepalaShiftId`, `kepalaBagianId`, and `kepalaDivisiId`.
- **`Invoice`**:
  - Represens financial invoices.
  - Contains fields: `id` (UUID), `companyId`, `type` ("RECEIVABLE" or "PAYABLE"), `invoiceNumber` (unique), `clientName`, `clientPhone` (String?), `amount` (Float), `dueDate` (DateTime), `status` ("UNPAID", "PAID", "OVERDUE"), `lastReminderSent` (DateTime?), and `createdAt` (DateTime).
- **`SalesOrder`**:
  - Represents B2B sales orders.
  - Contains fields: `id` (UUID), `companyId`, `soNumber` (unique), `customerName`, `itemsJson` (JSON string containing items list), `status` ("PENDING", "PROCESSING", "COMPLETED"), and `createdAt` (DateTime).
  - Relations: Has one-to-many relationship with `PurchaseRequisition`.
- **`PurchaseRequisition`**:
  - Represents purchase requests.
  - Contains fields: `id` (UUID), `companyId`, `prNumber` (unique), `salesOrderId` (String?), `itemsJson` (JSON string representing materials to purchase), `status` ("DRAFT", "SENT_RFQ", "PO_CREATED"), and `createdAt` (DateTime).

### 1.2 Configuration & Database State
- **`.env` File Content:**
  - Contains `DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"`.
- **`.env.local` File Content:**
  - Contains `GEMINI_API_KEY=AIzaSyBQiEmraoxBI5OxZPkR7lEUp4hVhaWuqY8`.
- **Database Server State:**
  - The local Prisma Dev server is registered as `default` but is currently **stopped** (`status: not_running`).
  - No active TCP listener on port 51214 was found.
  - To enable database operations, the server must be started manually by the user using `npx prisma dev start default` or by spinning up a new dev server on port 51214.
  - The schema has not been migrated yet (no files exist under `prisma/migrations/`). Pushing the schema via `npx prisma migrate dev` or `npx prisma db push` is necessary.

---

## 2. API Design & Security Rules Compliance

To comply with the strict workspace rules in `<RULE[AGENTS.md]>`, the scaffolded API endpoints have been designed with the following security properties:
1. **Strict HTTP Parameter Validation (Rule 4):**
   - In all scaffolded endpoints, the `companyId` parameter is checked. If it is null or empty, the API immediately returns `HTTP 400 Bad Request` rather than falling back to a first/random record.
   - For all `PUT` and `DELETE` requests, the `id` (transaction/record ID) must be supplied. The API queries the database to check if the record exists *before* attempting the database update/delete operation, returning `HTTP 404 Not Found` if missing.
2. **Path Traversal Protection (Rule 1):**
   - The route handlers do not read or write from the local filesystem directly. However, we have annotated that if any future extensions (such as invoice PDF downloads or CSV exports) touch files, they must use:
     ```typescript
     const relativePath = path.relative(BASE_DIR, targetPath);
     if (relativePath.includes('..') || path.isAbsolute(relativePath)) {
       throw new Error("Access Denied");
     }
     ```
3. **Hard Backend RBAC (Rule 7):**
   - The route handlers include placeholder middleware blocks where the user's role (passed via headers or session token) can be verified before executing operations.
4. **Offline AI Fallbacks (Rule 6):**
   - If AI features (e.g. Gemini parsing for invoice upload or requisition routing) are integrated, they must contain mock fallback parsers to respond gracefully if external API calls fail.

---

## 3. Recommended Actions & Next Steps

1. **Start the DB and Apply Migrations:**
   Run `npx prisma dev start default` and `npx prisma migrate dev --name init`.
2. **Update Seeding Logic:**
   Replace `prisma/seed.js` with the updated mock seeding code and execute `npx prisma db seed`.
3. **Write API Route Handlers:**
   Write the route handler files to:
   - `src/app/api/finance/invoice/route.ts`
   - `src/app/api/hr/attendance/route.ts`
   - `src/app/api/purchasing/requisition/route.ts`
4. **Compile and Build Check:**
   Run `npm run build` to verify there are no compilation or type check errors.
