# Handoff Report - Hardened Backend Evolution Review

## 1. Observation
We performed a static analysis of the hardened Next.js API route handlers and verified the following:
* **JSON Parse Failures**: In `src/app/api/hr/attendance/route.ts` line 53 and `src/app/api/finance/invoice/route.ts` lines 34 and 86:
  `const body = await req.json();`
  is executed without a local `try/catch` block.
* **Epoch Date Bypass**: In `src/app/api/finance/invoice/route.ts` lines 107-112:
  ```typescript
  let dueDateObj: Date | undefined = undefined;
  if (dueDate !== undefined) {
    dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid due date value' }, { status: 400 });
    }
  }
  ```
  If `dueDate` is `null`, `new Date(null)` evaluates to a valid Date object representing `1970-01-01`, which bypasses the `isNaN` check and gets written to the database.
* **Empty UUID Crash**: In `src/app/api/purchasing/requisition/route.ts` lines 133-140:
  ```typescript
  if (salesOrderId) {
    const soExists = await db.salesOrder.findFirst({
      where: { id: salesOrderId, companyId: existing.companyId }
    });
    ...
  }
  ```
  If `salesOrderId` is `""` (empty string), `if (salesOrderId)` is falsy. The existence check is skipped, but `salesOrderId: ""` is still passed to Prisma on line 147, causing PostgreSQL/Prisma to crash with a UUID formatting error.

## 2. Logic Chain
* **Uncaught SyntaxError**: If the request body is not valid JSON, `await req.json()` throws a SyntaxError. In the attendance and invoice handlers, this propagates to the global try-catch block where it returns HTTP 500 (`{ success: false, error: err.message }`) instead of the expected HTTP 400 Bad Request.
* **Database State Corruption**: `new Date(null)` evaluates to epoch time (`0` milliseconds). Since `isNaN(0)` is false, the validator fails to reject the null input, and the Prisma update query executes, writing `1970-01-01` to a non-nullable `dueDate` column in the database.
* **Postgres Error Leaks**: Passing `""` to a PostgreSQL UUID field causes the query engine to throw a parsing error. Because the requisition PUT route does not validate that `salesOrderId` is a valid UUID before sending it to the database, a client sending `""` triggers an internal exception, producing an HTTP 500 error page.

## 3. Caveats
* **Static Analysis Only**: No terminal commands or runtime tests were run in the workspace to prevent server/system crashes due to the native C++ binary compatibility bug in the Windows environment (`run_command` is prohibited). All logic is inferred through visual inspection of code and TypeScript definitions.
* **Multi-tenancy Security**: This review only focuses on input validation and response codes for the three specified routes. Overall multi-tenancy isolation (the risk of a client spoofing `companyId`) remains unmitigated at the backend layer.

## 4. Conclusion
The implementation does not fully satisfy the hardening criteria. The verdict is **REQUEST_CHANGES** due to:
1. Malformed JSON request bodies causing HTTP 500 instead of HTTP 400 in `/api/hr/attendance` and `/api/finance/invoice`.
2. `dueDate: null` silently resolving to the Unix epoch date (`1970-01-01`) in PUT `/api/finance/invoice`.
3. Empty UUID string `salesOrderId: ""` triggering a database format error and HTTP 500 in PUT `/api/purchasing/requisition`.

## 5. Verification Method
Verify the findings by inspecting the source files:
* `src/app/api/hr/attendance/route.ts` - Check if `req.json()` on line 53 has local error handling.
* `src/app/api/finance/invoice/route.ts` - Check if `req.json()` on lines 34 and 86 has local error handling, and if `dueDate` on line 107 checks for `null`.
* `src/app/api/purchasing/requisition/route.ts` - Check if line 133 accepts `""` without converting to `null` or rejecting it with HTTP 400.
