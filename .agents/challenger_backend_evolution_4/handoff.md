# Handoff Report

## 1. Observation

Static review of the codebase (specifically directories under `src/app/api/`) reveals the following implementations:

### A. Unprotected `req.json()` calls
In `src/app/api/finance/invoice/route.ts` (lines 32-35):
```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
```
And in `src/app/api/hr/attendance/route.ts` (lines 50-54):
```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
```
Both routes catch errors globally at the bottom of the handler, e.g. in `src/app/api/finance/invoice/route.ts` (lines 78-80):
```typescript
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
```
This is also observed in POST/PUT routes for `company`, `finance`, `leads`, `ocr`, and `settings`.

### B. Correctly Protected `req.json()` calls
In `src/app/api/purchasing/requisition/route.ts` (lines 35-42):
```typescript
export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON request body' }, { status: 400 });
    }
```

### C. Type Coercion presence checks
In `src/app/api/finance/invoice/route.ts` (lines 38-40):
```typescript
    if (!companyId || !type || !invoiceNumber || !clientName || amount === undefined || !dueDate) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
```
And in `src/app/api/hr/attendance/route.ts` (lines 56-59):
```typescript
    if (!companyId || !userId || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, error: 'companyId, userId, latitude, and longitude are required' }, { status: 400 });
    }
```
No `typeof` checks are present for `companyId`, `userId`, or `prNumber` string parameters.

### D. Date Parser checks
In `src/app/api/finance/invoice/route.ts` (lines 47-50):
```typescript
    const dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid due date value' }, { status: 400 });
    }
```

---

## 2. Logic Chain

1. **SyntaxError leading to HTTP 500**: When a client issues a POST/PUT request with an empty body or malformed JSON, the JS engine execution of `await req.json()` fails. Because it is not locally caught in most API routes, the exception triggers the main handler's `catch` block. The handler catches this error and returns it with status `500` (e.g. `SyntaxError: Unexpected end of JSON input`), violating the principle of returning `400` for client errors.
2. **Prisma Client Crash on Type Coercion**: JS presence checks (`!companyId`) evaluate to `false` for any truthy values (e.g. `companyId: true` or `companyId: {}`). When such values bypass validation and are queried in database operations (e.g. `db.company.findUnique({ where: { id: companyId } })`), the Prisma Client throws a `PrismaClientValidationError` because it strictly expects a string. The catch block intercepts this error and yields an HTTP 500 error instead of HTTP 400.
3. **Date parsing flaw**: Passing `dueDate: true` to the date constructor `new Date(true)` evaluates to the epoch timestamp `1970-01-01T00:00:00.001Z`. Since this date is valid, `isNaN(dueDateObj.getTime())` is false, and the date validation is bypassed. The date is successfully persisted in the database as `1970-01-01`.
4. **Lack of Backend RBAC**: A review of all route handler files reveals that no route validates session cookies, headers, or tokens. Any client can access, modify, or delete any company's data simply by guessing or passing its `companyId`.

---

## 3. Caveats

- **No Runtime Testing**: Per the user's critical warning, running terminal commands causes native C++ binary compatibility crashes on this Windows host. Verification was performed statically via source code inspection rather than dynamic fuzzing.
- **External authentication integrations**: We did not verify authentication if it is performed via third-party systems external to the Next.js App Router (e.g. an API gateway or proxies), but we validated that no code-level RBAC is currently enforced within the Next.js routes.

---

## 4. Conclusion

The Next.js App Router API routes are poorly protected against malformed payloads and type coercion bypasses.
- Calling `req.json()` directly inside general try-catch blocks leaks HTTP 500 errors on invalid client payloads.
- Lack of strict type verification (`typeof field !== 'string'`) allows invalid values to bypass validation and throw Prisma type check exceptions (yielding HTTP 500) or corrupt data fields (e.g. setting `dueDate` to `1970-01-01`).
- The backend lacks authorization verification, violating multi-tenant isolation rules.

---

## 5. Verification Method

To verify these vulnerabilities dynamically once the backend environment issues are resolved:

1. **Verify Malformed Payload Handling**:
   Send an empty POST request to `/api/finance/invoice`:
   ```bash
   curl -X POST http://localhost:3000/api/finance/invoice -H "Content-Type: application/json" -d ""
   ```
   *Expected*: HTTP 400 Bad Request
   *Observed/Predicted*: HTTP 500 Internal Server Error (`Unexpected end of JSON input`)

2. **Verify Type Coercion Bypass**:
   Send a POST request with a boolean `companyId` value:
   ```bash
   curl -X POST http://localhost:3000/api/finance/invoice -H "Content-Type: application/json" -d "{\"companyId\": true, \"type\": \"RECEIVABLE\", \"invoiceNumber\": \"INV-TEST-01\", \"clientName\": \"Test\", \"amount\": 100000, \"dueDate\": \"2026-08-01\"}"
   ```
   *Expected*: HTTP 400 Bad Request
   *Observed/Predicted*: HTTP 500 Internal Server Error (`PrismaClientValidationError`)

3. **Verify Date Validation Bypass**:
   Send a POST request with `dueDate: true`:
   ```bash
   curl -X POST http://localhost:3000/api/finance/invoice -H "Content-Type: application/json" -d "{\"companyId\": \"<valid_company_uuid>\", \"type\": \"RECEIVABLE\", \"invoiceNumber\": \"INV-TEST-02\", \"clientName\": \"Test\", \"amount\": 100000, \"dueDate\": true}"
   ```
   *Expected*: HTTP 400 Bad Request
   *Observed/Predicted*: HTTP 201 Created (with `dueDate` set to `1970-01-01T00:00:00.001Z`)
