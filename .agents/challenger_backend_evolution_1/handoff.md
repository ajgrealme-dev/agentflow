# Handoff Report — 2026-07-16T20:56:00+07:00

## 1. Observation

During static code review, the following exact paths and code snippets were inspected:

### A. Invoice API Route (`src/app/api/finance/invoice/route.ts`)
1. **POST required parameter validation and parsing (Lines 35, 61-62)**:
   ```typescript
   const { companyId, type, invoiceNumber, clientName, clientPhone, amount, dueDate, status } = body;
   ...
   amount: parseFloat(amount),
   dueDate: new Date(dueDate),
   ```
2. **PUT required parameter validation and parsing (Lines 77-80, 94-95)**:
   ```typescript
   const { id, type, clientName, clientPhone, amount, dueDate, status } = body;
   if (!id) {
     return NextResponse.json({ success: false, error: 'ID transaksi wajib diisi' }, { status: 400 });
   }
   ...
   amount: amount !== undefined ? parseFloat(amount) : undefined,
   dueDate: dueDate !== undefined ? new Date(dueDate) : undefined,
   ```
3. **Database unique check and mutation (Lines 48-52, 83-86, 116-119)**:
   ```typescript
   const existingInvoice = await db.invoice.findUnique({ where: { invoiceNumber } });
   if (existingInvoice) {
     return NextResponse.json({ success: false, error: 'Invoice number already exists' }, { status: 400 });
   }
   ```
   For PUT:
   ```typescript
   const existing = await db.invoice.findUnique({ where: { id } });
   if (!existing) {
     return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
   }
   ```
   For DELETE:
   ```typescript
   const existing = await db.invoice.findUnique({ where: { id } });
   if (!existing) {
     return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
   }
   ```

### B. Attendance API Route (`src/app/api/hr/attendance/route.ts`)
1. **POST validation of coordinates (Lines 57-59)**:
   ```typescript
   if (!companyId || !userId || latitude === undefined || longitude === undefined) {
     return NextResponse.json({ success: false, error: 'companyId, userId, latitude, and longitude are required' }, { status: 400 });
   }
   ```
2. **Geofencing validation condition (Lines 83-97)**:
   ```typescript
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
   ```
3. **Attendance database write (Lines 99-106)**:
   ```typescript
   const record = await db.absensi.create({
     data: {
       companyId,
       userId,
       latitude,
       longitude,
       statusKehadiran
     },
   ```

### C. Purchasing Requisition API Route (`src/app/api/purchasing/requisition/route.ts`)
1. **JSON parsing check (Lines 46-50, 107-113)**:
   ```typescript
   try {
     JSON.parse(itemsJson);
   } catch {
     return NextResponse.json({ success: false, error: 'itemsJson must be a valid JSON string' }, { status: 400 });
   }
   ```
2. **Uniqueness check of PR number (Lines 69-72)**:
   ```typescript
   const existingPR = await db.purchaseRequisition.findUnique({ where: { prNumber } });
   if (existingPR) {
     return NextResponse.json({ success: false, error: 'PR number already exists' }, { status: 400 });
   }
   ```

### D. Database Schema (`prisma/schema.prisma`)
1. **Invoice schema definition (Lines 145-146, 149-150)**:
   ```prisma
   type              String    // "RECEIVABLE" (AR) atau "PAYABLE" (AP)
   invoiceNumber     String    @unique
   ...
   amount            Float
   dueDate           DateTime
   ```
2. **Absensi schema definition (Lines 135-137)**:
   ```prisma
   latitude        Float
   longitude       Float
   statusKehadiran String   // Hadir, Ditolak
   ```
3. **Purchase Requisition schema definition (Line 173)**:
   ```prisma
   prNumber          String    @unique
   ```

---

## 2. Logic Chain

1. **Lack of Authenticated Authorization**:
   - *Observation*: None of the API endpoints (/api/finance/invoice, /api/hr/attendance, /api/purchasing/requisition) call verifySession, use middleware, or inspect auth tokens/headers.
   - *Reasoning*: Without session validation, the API relies entirely on the client providing IDs. An attacker can craft HTTP requests directly and perform CRUD operations across any company.
   - *Conclusion*: Critical vulnerability where any user/attacker can modify, delete, or fetch records from other companies.

2. **Global Unique Key Tenant Leakage**:
   - *Observation*: `invoiceNumber` and `prNumber` are marked `@unique` in `schema.prisma`.
   - *Reasoning*: Database-level `@unique` constraints are global across the table. In a multi-tenant model (where multiple companies are supported), multiple companies will inevitably want to use overlapping sequences (e.g. `INV-001`). Because of `@unique`, only one company in the entire database can use `INV-001`.
   - *Conclusion*: High design flaw that leaks naming state between tenants and causes database insertion failures.

3. **Geofencing Bypass via Missing Coordinates**:
   - *Observation*: If `officeLatitude` or `officeLongitude` is null on the `Company` record, `statusKehadiran` defaults to `'Hadir'`.
   - *Reasoning*: The attendance logic falls back to success instead of warning or rejecting the check-in when coordinates are not configured.
   - *Conclusion*: An employee can check in from any location in the world and be marked present as long as coordinates are unset in the database.

4. **Float & Date Coercion Uncaught Crashes (500 Error)**:
   - *Observation*: `latitude` and `longitude` are required `Float` fields in the `Absensi` schema. In the handler, the strict validation only checks `latitude === undefined`. If `latitude` is `null`, it bypasses the validator. `calculateDistance(null, ...)` coerces it to `0`. Then `db.absensi.create({ data: { latitude: null } })` is executed.
   - *Reasoning*: Prisma does not accept `null` for a required `Float` field and throws a validation error. The catch block returns a `500 Internal Server Error` instead of a `400 Bad Request`. The same occurs when parsing invalid amount floats or malformed dates.
   - *Conclusion*: Insufficient validation of input types causes the backend to crash internally (500 status code) instead of returning 400 Bad Request.

---

## 3. Caveats

- **No Runtime Testing**: Due to the C++ binary compatibility bug in the Windows environment, executing any terminal commands or running the server locally was prohibited. All observations and logic flows are derived from static code analysis.
- **Upstream Middleware**: It is assumed that there is no hidden Next.js middleware covering these routes, as `middleware.ts` was not found in the source directory.

---

## 4. Conclusion

The Next.js API handlers conform to simple CRUD requirements and have basic 400/404 return codes. However, they lack access controls (Authentication/RBAC), suffer from multi-tenant unique numbering conflicts (`invoiceNumber` and `prNumber` should be unique per company rather than globally), permit coordinate-based geofence bypasses when company coordinates are missing, and crash with 500 errors on invalid inputs (like `null` coordinates, `NaN` amounts, or invalid dates).

---

## 5. Verification Method

To verify these findings statically or dynamically in a safe sandbox environment:
1. **Auth/RBAC Leak**: Send a POST request to `/api/finance/invoice` with arbitrary payload without headers. It will succeed (201 Created) instead of returning 401/403.
2. **Multi-Tenant Constraint Collision**:
   - Create Company A and Company B.
   - POST an invoice with `invoiceNumber: "INV-TEST-999"` for Company A (Returns 201).
   - POST an invoice with `invoiceNumber: "INV-TEST-999"` for Company B (Returns 400/500).
3. **Null Coordinates Crash**:
   - POST to `/api/hr/attendance` with `latitude: null`. The API will return `500 Internal Server Error` with a Prisma validation message.
4. **Invalid Amount Crash**:
   - POST to `/api/finance/invoice` with `amount: "abc"`. The API will return `500` instead of `400`.
