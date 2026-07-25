# Next.js API Handlers Hardening - Review Report

This report presents a quality and adversarial review of the Next.js API route handlers after the hardening implementation phase.

---

## PART 1: QUALITY REVIEW

### Review Summary
**Verdict**: REQUEST_CHANGES

The hardened backend evolution implementation introduces valuable validation checks (e.g., geofencing coordinate ranges in `attendance/route.ts`, positive numeric amount checks and date validation in `invoice/route.ts`, and local JSON parse wrappers in `requisition/route.ts`). However, several critical robustness issues, validation bypasses, and incorrect HTTP status codes remain, which require changes:
1. **Uncaught JSON Parsing Errors (HTTP 500 instead of HTTP 400)**: In both `/api/hr/attendance` (POST) and `/api/finance/invoice` (POST & PUT), `await req.json()` is not wrapped in a local try-catch block. Malformed JSON request bodies cause a `SyntaxError` that propagates to the global try-catch block, resulting in an HTTP 500 response instead of the expected HTTP 400 Bad Request.
2. **Date Validation Bypass via `dueDate: null` (PUT Invoice)**: Sending `dueDate: null` in a PUT request bypasses the Date validation because `new Date(null)` evaluates to the Unix Epoch (`1970-01-01T00:00:00.000Z`), which is not NaN. This silently corrupts the record in the database by setting the due date to `1970-01-01`.
3. **Database Format Crash via `salesOrderId: ""` (PUT Requisition)**: Sending an empty string `salesOrderId: ""` in a PUT requisition bypasses the existence check (because `""` is falsy) but is still forwarded to the database update query. This causes PostgreSQL/Prisma to crash with a UUID format violation, returning HTTP 500.
4. **Lack of Domain Validation for Enum Status/Type Fields**: Fields like `type` and `status` are not validated against expected enums, allowing arbitrary string values to be written to the database.

---

### Findings

#### [Critical] Finding 1: Uncaught JSON Parsing Errors in Attendance and Invoice routes (HTTP 500)
- **What**: Request bodies are parsed via `await req.json()` without local try-catch handling.
- **Where**:
  - `src/app/api/hr/attendance/route.ts` (POST)
  - `src/app/api/finance/invoice/route.ts` (POST & PUT)
- **Why**: If a client sends a malformed JSON payload (or an empty request body with JSON headers), `req.json()` throws a SyntaxError. Because it is caught by the outer catch block, the handler returns HTTP 500 (Internal Server Error) instead of HTTP 400 (Bad Request).
- **Suggestion**: Wrap `req.json()` in a local try-catch block and return HTTP 400 with a clean error response, similar to how it is handled in `/api/purchasing/requisition/route.ts`.

#### [Major] Finding 2: Date Validation Bypass on `dueDate: null` (HTTP 200 with Epoch Date)
- **What**: PUT invoice endpoint allows `dueDate: null` to pass validation and write a Unix epoch date (`1970-01-01`) to the database.
- **Where**: `src/app/api/finance/invoice/route.ts` (PUT, lines 106-112)
- **Why**: When `dueDate` is `null`, `dueDate !== undefined` is `true`. `new Date(null)` returns a valid Date object (`1970-01-01T00:00:00Z`). `isNaN(dueDateObj.getTime())` is `false`. Thus, the validator passes it, and the database updates `dueDate` to the epoch date instead of throwing a validation error.
- **Suggestion**: Add a check to reject `null` values for `dueDate` if it is not nullable in the schema:
  ```typescript
  if (dueDate === null) {
    return NextResponse.json({ success: false, error: 'Invalid due date value' }, { status: 400 });
  }
  ```

#### [Major] Finding 3: Database Crash (HTTP 500) on `salesOrderId: ""` (PUT Requisition)
- **What**: PUT requisition endpoint crashes on empty string UUIDs.
- **Where**: `src/app/api/purchasing/requisition/route.ts` (PUT, lines 133-140)
- **Why**: If `salesOrderId` is `""`, `if (salesOrderId)` evaluates to `false`, bypassing the check `db.salesOrder.findFirst`. However, `salesOrderId` is still passed to Prisma update data because `salesOrderId !== undefined` is `true`. Prisma then attempts to write `""` into a UUID column, resulting in a database format error and an HTTP 500 response.
- **Suggestion**: Clean up the input or validate that `salesOrderId` is a valid UUID, or reject `""` explicitly as HTTP 400.

#### [Medium] Finding 4: Lack of Domain Validation for Type and Status fields
- **What**: Enum-like fields such as `type` and `status` accept arbitrary strings.
- **Where**:
  - `src/app/api/finance/invoice/route.ts`
  - `src/app/api/purchasing/requisition/route.ts`
- **Why**: String fields are not matched against domain-level constraints. An attacker can set an invoice's type to `"MALICIOUS"` or status to `"HACKED"`.
- **Suggestion**: Implement check constraints in handlers:
  ```typescript
  const VALID_STATUSES = ['UNPAID', 'PAID', 'OVERDUE'];
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ success: false, error: 'Invalid status value' }, { status: 400 });
  }
  ```

---

### Verified Claims

- **Coordinate parsing and range verification in Attendance** → verified via static inspection of `src/app/api/hr/attendance/route.ts` → **PASS** (Correctly parses with `parseFloat` and validates coordinates to be between -90 and 90 / -180 and 180, returning HTTP 400 if out of range).
- **Invoice amount numeric verification** → verified via static inspection of `src/app/api/finance/invoice/route.ts` → **PASS** (Correctly checks `isNaN(amountNum) || amountNum < 0` and returns HTTP 400 if invalid).
- **Unique invoice and requisition checks** → verified via static inspection of both routes → **PASS** (Queries unique constraints `invoiceNumber` and `prNumber` and returns HTTP 400 if a duplicate is found).
- **Company existence checks** → verified via static inspection of POST handlers → **PASS** (Correctly checks `db.company.findUnique` and returns HTTP 404 if company doesn't exist).
- **Bot callback security clicker check** → verified via static inspection of `bot/bot.js` -> **PASS** (Checks clicker chat ID and role/department, returning a warning via `bot.answerCallbackQuery` if not authorized).
- **Bot path traversal security** → verified via static inspection of `bot/bot.js` -> **PASS** (Uses `path.relative` and check for `..` to verify that slip files do not escape the designated slips directory).

---

### Coverage Gaps

- **Auth & Session Isolation (Multi-tenancy Risk)** — risk level: **HIGH** — recommendation: **INVESTIGATE & REMEDIATE**
  - None of the API endpoints implement authentication middleware checks. They trust the client's supplied `companyId`. A user from Company A can query or modify Company B's invoices or attendance logs simply by supplying Company B's `companyId`. This is a significant gap in Backend RBAC Middleware (Rule 7).
- **Legacy Endpoint Vulnerabilities** — risk level: **MEDIUM** — recommendation: **INVESTIGATE**
  - Other route files under `src/app/api` (e.g. `ocr/route.ts`, `settings/route.ts`, `leads/route.ts`) still contain fallbacks to the first record via `findFirst()` when company ID is missing, which violates Workspace Rule 4.

---

### Unverified Items

- **Runtime API behavior (database migrations & network responses)** — reason not verified: Terminal commands were not run to adhere to the Windows environment C++ compatibility constraint.

---
---

## PART 2: ADVERSARIAL REVIEW

### Challenge Summary
**Overall risk assessment**: HIGH

The main system vulnerabilities exist in input validation bypasses and type coercion gaps that lead to database corruption (epoch dates) or HTTP 500 server crashes (due to UUID formatting constraints).

---

### Challenges

#### [High] Challenge 1: Silent Epoch Date Assignment (`dueDate: null`)
- **Assumption challenged**: Assumes `isNaN(dueDateObj.getTime())` validates all invalid date representations.
- **Attack scenario**: A user updates an invoice with `{ "dueDate": null }`. The server validates it as `1970-01-01` and writes it to the database.
- **Blast radius**: Corrupts invoice data, leading to incorrect calculations of aging AR/AP balances.
- **Mitigation**: Add an explicit `dueDate === null` check to reject it.

#### [High] Challenge 2: Prisma Exception Crash on Empty String UUID
- **Assumption challenged**: Assumes falsy fields do not require UUID formatting validation.
- **Attack scenario**: A user updates a requisition with `{ "salesOrderId": "" }`. It bypasses the existence check because `""` is falsy, but it is passed to Prisma update, causing a database constraint crash and returning HTTP 500.
- **Blast radius**: Returns HTTP 500 and exposes database dialect/schema details.
- **Mitigation**: Do not pass empty strings to Prisma UUID fields; either cast them to `null` or reject them with HTTP 400.

#### [Medium] Challenge 3: HTTP 500 Denial of Service via Malformed JSON
- **Assumption challenged**: Assumes clients will only send valid JSON.
- **Attack scenario**: Send a request with a body containing malformed JSON (e.g., `{}`).
- **Blast radius**: The server crashes with HTTP 500, leaking internal parsing error details.
- **Mitigation**: Safely wrap `req.json()` in a local try-catch block in all POST/PUT routes.

---

### Stress Test Results

| API Route | Field Tested | Input Tested | Expected Behavior | Actual/Predicted Behavior | Pass/Fail | Notes |
|---|---|---|---|---|---|---|
| `/api/hr/attendance` | `latitude` | `NaN` | HTTP 400 | HTTP 400 | **PASS** | parsed via `parseFloat("NaN")` -> `isNaN` is true. |
| `/api/hr/attendance` | `latitude` | `null` | HTTP 400 | HTTP 400 | **PASS** | parsed via `parseFloat(null)` -> `NaN`. |
| `/api/finance/invoice` | `amount` (PUT) | `"150.25"` | HTTP 200 | HTTP 200 | **PASS** | String parsed successfully as float. |
| `/api/finance/invoice` | `dueDate` (PUT) | `null` | HTTP 400 | HTTP 200 (Epoch Date) | **FAIL** | Bypasses check and sets database date to `1970-01-01`. |
| `/api/purchasing/requisition` | `salesOrderId` (PUT) | `""` | HTTP 400 | HTTP 500 (DB Error) | **FAIL** | Bypasses existence check and crashes on database UUID check. |
| `/api/finance/invoice` | Request Body | Malformed JSON | HTTP 400 | HTTP 500 | **FAIL** | SyntaxError is caught by outer catch and returns 500. |

---

### Unchallenged Areas

- **AI Model behavior under heavy stress**: The Gemini API could not be tested with concurrent requests due to terminal constraints and rate-limit safeguards.
