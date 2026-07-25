## Challenge Summary

**Overall risk assessment**: MEDIUM

Static analysis of the Next.js API route handlers (/api/finance/invoice, /api/hr/attendance, and /api/purchasing/requisition) shows that the handlers have robust validation for coordinate NaN inputs, null latitude/longitude, out-of-range coordinates, and string amount parsing. However, a few edge-case vulnerabilities exist where input validation can be bypassed, leading to database corruption (epoch dates) or HTTP 500 server crashes (due to UUID parsing errors or global try-catch handler limitations on JSON parsing).

---

## Challenges

### [Medium] Challenge 1: Invalid JSON Request Body causes HTTP 500

- **Assumption challenged**: Assumes that incoming HTTP request bodies are always well-formed JSON or that returning HTTP 500 is acceptable for malformed bodies.
- **Attack scenario**: A client sends a malformed JSON body (e.g. `{malformed`) or an empty body to `POST /api/finance/invoice` or `POST /api/hr/attendance`.
  - Inside the handler, `const body = await req.json();` is executed.
  - Since the body is invalid, `req.json()` throws a `SyntaxError`.
  - The outer `try/catch` catches the error and returns:
    `NextResponse.json({ success: false, error: err.message }, { status: 500 })`
- **Blast radius**: The server returns an HTTP 500 (Internal Server Error) response instead of HTTP 400 (Bad Request), violating REST API design principles and exposing internal parsing details.
- **Mitigation**: Safely wrap `req.json()` in a local `try/catch` block that returns HTTP 400 on error, exactly as is done in `/api/purchasing/requisition/route.ts`.
  ```typescript
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON request body' }, { status: 400 });
  }
  ```

### [Medium] Challenge 2: `dueDate: null` in PUT Invoice bypasses Date Validation

- **Assumption challenged**: Assumes that checking `dueDate !== undefined` and `isNaN(dueDateObj.getTime())` is sufficient to prevent invalid date assignments.
- **Attack scenario**: A client sends a PUT request to `/api/finance/invoice` with `dueDate: null`.
  - The check `if (dueDate !== undefined)` evaluates to `true`.
  - `dueDateObj = new Date(null)` is executed.
  - In JavaScript, `new Date(null)` evaluates to a valid date object representing the Unix epoch (`1970-01-01T00:00:00.000Z`).
  - `dueDateObj.getTime()` returns `0`.
  - `isNaN(0)` is `false`, so the validation is bypassed.
  - The invoice record is updated in the database with a due date of `1970-01-01`.
- **Blast radius**: Silent database corruption where invoice due dates are set to the Unix epoch.
- **Mitigation**: Add a null check:
  ```typescript
  if (dueDate !== undefined) {
    if (dueDate === null) {
      return NextResponse.json({ success: false, error: 'Invalid due date value' }, { status: 400 });
    }
    dueDateObj = new Date(dueDate);
    ...
  }
  ```

### [Medium] Challenge 3: `salesOrderId: ""` (empty string) in PUT Requisition causes Database Crash (HTTP 500)

- **Assumption challenged**: Assumes that falsy values for nullable relation IDs do not need validation and are safe to pass to database updates.
- **Attack scenario**: A client sends a PUT request to `/api/purchasing/requisition` with `salesOrderId: ""`.
  - The validation check `if (salesOrderId)` evaluates to `false` because `""` is falsy.
  - Thus, the existence check `db.salesOrder.findFirst` is skipped.
  - However, in the database update data:
    `salesOrderId: salesOrderId !== undefined ? salesOrderId : undefined`
    evaluates to `""`.
  - Prisma attempts to update the nullable relation ID to `""`.
  - Since `""` is not a valid UUID format, PostgreSQL/Prisma throws an error, resulting in an HTTP 500 error returned by the server.
- **Blast radius**: The server crashes with HTTP 500 and exposes raw database format errors to clients.
- **Mitigation**: Check if `salesOrderId` is an empty string, and either reject it as an invalid format or convert it to `null`.
  ```typescript
  let formattedSalesOrderId = salesOrderId;
  if (salesOrderId === "") {
    formattedSalesOrderId = null; // or return 400 error
  }
  ```

### [Low] Challenge 4: Lack of Domain Enum Validation on `status` and `type` Fields

- **Assumption challenged**: Assumes client requests will only provide valid business-level status/type values (e.g. `RECEIVABLE`/`PAYABLE`, `UNPAID`/`PAID`, etc.).
- **Attack scenario**: A client registers an invoice with type `"DUMMY_TYPE"` or status `"INVALID_STATUS"`.
  - The API does not check whether these fields match the expected domain constants.
  - The database records are created or updated with invalid values since they are typed as simple `String` fields in Prisma.
- **Blast radius**: Inconsistent database records that break application logic down the line.
- **Mitigation**: Add array checks (e.g., `if (type && !['RECEIVABLE', 'PAYABLE'].includes(type)) return 400`).

---

## Stress Test Results

| API Route | Field Tested | Input Tested | Expected Behavior | Actual/Predicted Behavior | Pass/Fail | Notes |
|---|---|---|---|---|---|---|
| `/api/hr/attendance` | `latitude` | `NaN` | HTTP 400 | HTTP 400 | **PASS** | Evaluated via `parseFloat("NaN")` -> `isNaN` is true. |
| `/api/hr/attendance` | `latitude` | `null` | HTTP 400 | HTTP 400 | **PASS** | Evaluated via `parseFloat(null)` -> `NaN`. |
| `/api/hr/attendance` | `latitude` | `-90.1` | HTTP 400 | HTTP 400 | **PASS** | Out-of-range latitude triggers `< -90`. |
| `/api/hr/attendance` | `longitude` | `180.1` | HTTP 400 | HTTP 400 | **PASS** | Out-of-range longitude triggers `> 180`. |
| `/api/finance/invoice` | `amount` (POST/PUT) | `"150.25"` | HTTP 201/200 | HTTP 201/200 | **PASS** | String parsed successfully as Float `150.25`. |
| `/api/finance/invoice` | `amount` (POST/PUT) | `"invalid"` | HTTP 400 | HTTP 400 | **PASS** | Evaluated via `parseFloat("invalid")` -> `NaN`. |
| `/api/finance/invoice` | `dueDate` (POST) | `null` | HTTP 400 | HTTP 400 | **PASS** | `!dueDate` catches `null` and rejects it. |
| `/api/finance/invoice` | `dueDate` (PUT) | `null` | HTTP 400 | HTTP 200 (Epoch Date) | **FAIL** | Bypasses check and sets database date to `1970-01-01`. |
| `/api/finance/invoice` | `dueDate` (PUT) | `"invalid"` | HTTP 400 | HTTP 400 | **PASS** | Evaluated via `new Date("invalid").getTime()` -> `NaN`. |
| `/api/purchasing/requisition` | `salesOrderId` (PUT) | `""` | HTTP 400 | HTTP 500 (DB Error) | **FAIL** | Bypasses `if` check and crashes on Postgres UUID check. |
| `/api/finance/invoice` | Request Body | Malformed JSON | HTTP 400 | HTTP 500 | **FAIL** | SyntaxError is caught by outer catch and returns 500. |

---

## Unchallenged Areas

- **Database Connection Failures**: Did not test database downtime scenarios as the focus is on validation correctness under standard operational states.
- **Authentication/Session Checks**: Route handlers do not currently implement RBAC middleware checks internally, which was omitted from the specific request details but is a known constraint under `AGENTS.md`.
