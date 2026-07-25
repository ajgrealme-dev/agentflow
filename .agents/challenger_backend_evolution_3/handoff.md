# Handoff Report

## 1. Observation

Static analysis was performed on the Next.js API route handlers in the `src/app/api/` directory:
- `/api/finance/invoice/route.ts`
- `/api/hr/attendance/route.ts`
- `/api/purchasing/requisition/route.ts`

### Observation A: `/api/finance/invoice/route.ts`
At line 84-129, the `PUT` handler is defined as:
```typescript
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, type, clientName, clientPhone, amount, dueDate, status } = body;
    ...
    let dueDateObj: Date | undefined = undefined;
    if (dueDate !== undefined) {
      dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid due date value' }, { status: 400 });
      }
    }
```
And at line 32-40, the `POST` handler is defined as:
```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, type, invoiceNumber, clientName, clientPhone, amount, dueDate, status } = body;

    // Strict validation
    if (!companyId || !type || !invoiceNumber || !clientName || amount === undefined || !dueDate) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
```

### Observation B: `/api/purchasing/requisition/route.ts`
At line 100-149, the `PUT` handler is defined as:
```typescript
export async function PUT(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON request body' }, { status: 400 });
    }
    const { id, itemsJson, status, salesOrderId } = body;
    ...
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
```

### Observation C: `/api/hr/attendance/route.ts`
At line 51-66, the `POST` handler contains:
```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, userId, latitude, longitude } = body;

    // Strict validation
    if (!companyId || !userId || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, error: 'companyId, userId, latitude, and longitude are required' }, { status: 400 });
    }

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return NextResponse.json({ success: false, error: 'Invalid latitude or longitude value' }, { status: 400 });
    }
```

---

## 2. Logic Chain

### Logic Chain A: Malformed Request Body
1. Under Observation A (Invoice route) and Observation C (Attendance route), the raw request body is parsed via `await req.json()` inside a global `try/catch` block that returns HTTP 500 on failure.
2. If a client transmits a malformed JSON string (e.g. `{`), `req.json()` throws a syntax error.
3. This error propagates directly to the global catch block, resulting in the server returning `HTTP 500` instead of `HTTP 400`.

### Logic Chain B: Null Date in Invoice PUT
1. Under Observation A, if the client sends `{ "dueDate": null }` in a `PUT` request, `dueDate !== undefined` is `true`.
2. The code runs `new Date(null)`.
3. In JS/TS, `new Date(null)` evaluates to the epoch date (`1970-01-01T00:00:00.000Z`) with a timestamp value of `0`.
4. `isNaN(dueDateObj.getTime())` (which is `isNaN(0)`) returns `false`.
5. The code bypasses the validation and updates the database, setting the invoice `dueDate` to the Unix epoch.

### Logic Chain C: Empty String `salesOrderId` in Requisition PUT
1. Under Observation B, if the client sends `{ "salesOrderId": "" }` in a `PUT` request, the condition `if (salesOrderId)` is evaluated.
2. Since `""` is falsy in JavaScript, `if (salesOrderId)` evaluates to `false`.
3. The existence check `db.salesOrder.findFirst` is skipped.
4. When `db.purchaseRequisition.update` is called, `salesOrderId !== undefined ? salesOrderId : undefined` evaluates to `""`.
5. PostgreSQL expects a valid UUID format or `null` for foreign keys. Passing `""` causes a database syntax/format exception.
6. The global `catch` block catches this exception and returns `HTTP 500`.

---

## 3. Caveats

- **No Runtime Testing**: As instructed by the critical warning, due to a native C++ binary compatibility bug in the Windows environment, no terminal commands or background servers were executed. All findings were identified and verified strictly via static analysis and code tracing.
- **Database Schema Assumptions**: Assumed the PostgreSQL database enforces standard UUID formatting constraints on foreign key columns, causing the empty string insert to fail at the database level.

---

## 4. Conclusion

While the Next.js API route handlers (/api/finance/invoice, /api/hr/attendance, and /api/purchasing/requisition) have been hardened against coordinate NaN/null inputs, out-of-range coordinates, string amount parsing, and invalid date formats, three validation gaps remain:
1. Malformed JSON request bodies in `/api/finance/invoice` and `/api/hr/attendance` yield `HTTP 500` instead of `HTTP 400`.
2. Sending a `null` due date in `PUT /api/finance/invoice` bypasses validation and corrupts the record with a `1970-01-01` date.
3. Sending an empty string `""` for `salesOrderId` in `PUT /api/purchasing/requisition` bypasses validation and causes a PostgreSQL format exception, returning `HTTP 500`.

---

## 5. Verification Method

To verify these findings manually once the backend environment is active:
1. **Verify Malformed JSON**: Send a `POST` request to `/api/finance/invoice` with a malformed payload (e.g. `{`). Assert that the response code is `500` instead of `400`.
2. **Verify Null Date**: Send a `PUT` request to `/api/finance/invoice` with `{ "id": "<valid-id>", "dueDate": null }`. Assert that the invoice's due date in the database is set to `1970-01-01T00:00:00.000Z` instead of being rejected.
3. **Verify Empty UUID**: Send a `PUT` request to `/api/purchasing/requisition` with `{ "id": "<valid-id>", "salesOrderId": "" }`. Assert that the API crashes and returns `HTTP 500` instead of `HTTP 400` or gracefully setting the field to `null`.
