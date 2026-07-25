## Challenge Summary

**Overall risk assessment**: HIGH

The static verification of the backend API routes has revealed several critical security and stability flaws. While the routes implement basic validations, they are highly susceptible to type coercion bypasses, unhandled exception leaks (returning HTTP 500 instead of HTTP 400), and lack robust protection against empty or malformed `req.json()` payloads. In addition, there is a total lack of backend-enforced authentication/RBAC checks, leaving endpoints completely open to unauthorized multi-tenant data access.

---

## Challenges

### [High] Challenge 1: Unprotected `req.json()` Calls in Multiple POST/PUT Routes

- **Assumption challenged**: Assumed that clients will always send well-formed JSON payloads, or that wrapping the handler in a try-catch block is sufficient to handle malformed input.
- **Attack scenario**: An attacker sends a POST or PUT request with an empty body or a malformed JSON string (e.g. `{"companyId":`) to endpoints such as `/api/finance/invoice`, `/api/hr/attendance`, `/api/company`, `/api/finance`, `/api/leads`, `/api/ocr`, or `/api/settings`. 
- **Blast radius**: The call to `await req.json()` throws an unhandled `SyntaxError`. While the outer `try-catch` prevents a process crash, it catches the exception and returns an HTTP 500 Internal Server Error response containing raw parser details (e.g. `Unexpected end of JSON input`). This leaks internal implementation details, degrades API reliability, and triggers false alarms on server metrics.
- **Mitigation**: Wrap the `req.json()` call in a localized `try-catch` block and return an HTTP 400 Bad Request with a clear message, as successfully done in `/api/purchasing/requisition`.
  ```typescript
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON request body' }, { status: 400 });
  }
  ```

### [High] Challenge 2: Type Coercion Bypass for Non-String Types (Prisma Validation Crash)

- **Assumption challenged**: Assumed that JS truthy checks (`!companyId`, `!id`, etc.) are sufficient to validate that parameters are valid strings.
- **Attack scenario**: A client sends a POST/PUT request with parameter values containing non-string types (e.g., `companyId: true`, `id: {}`, or `userId: 123`). Because these values are truthy, they bypass the presence checks (`if (!companyId) ...`). 
- **Blast radius**: When these non-string values are passed directly to database queries via the Prisma client (e.g., `db.company.findUnique({ where: { id: companyId } })`), Prisma throws a `PrismaClientValidationError`. This database-level runtime error is caught by the global catch block, returning a generic HTTP 500 Internal Server Error and exposing system details instead of failing gracefully with HTTP 400.
- **Mitigation**: Enforce strict type validation checks for all ID fields and identifiers:
  ```typescript
  if (typeof companyId !== 'string') {
    return NextResponse.json({ success: false, error: 'companyId must be a string' }, { status: 400 });
  }
  ```

### [Medium] Challenge 3: Inadequate Date and Float Validation (Type Coercion Bypasses)

- **Assumption challenged**: Assumed that `new Date(dueDate)` and `parseFloat(amount)` checks will reject all invalid formats.
- **Attack scenario**: 
  1. An attacker passes `dueDate: true` to `/api/finance/invoice`. In JavaScript, `new Date(true)` evaluates to a valid date object (`1970-01-01T00:00:00.001Z`), bypassing the `isNaN(dueDateObj.getTime())` validation.
  2. An attacker passes `amount: [150000]` or `amount: ["150000", "abc"]`. `parseFloat` successfully parses these as `150000`, bypassing strict number constraints.
- **Blast radius**: Dirty, malformed, or nonsensical data (e.g. dates set to epoch milliseconds) is persisted in the database, potentially breaking frontend logic or reporting systems.
- **Mitigation**: Add strict type-checking before parsing:
  ```typescript
  if (typeof dueDate !== 'string' || isNaN(Date.parse(dueDate))) {
    return NextResponse.json({ success: false, error: 'dueDate must be a valid date string' }, { status: 400 });
  }
  if (typeof amount !== 'number' && (typeof amount !== 'string' || isNaN(Number(amount)))) {
    return NextResponse.json({ success: false, error: 'amount must be a numeric value' }, { status: 400 });
  }
  ```

### [High] Challenge 4: Zero Authorization & Session Checks on Sensitive Data Endpoints

- **Assumption challenged**: Assumed that client-side RBAC validation (e.g. simulated roles in `localStorage` in `/login`) is sufficient to secure the backend API.
- **Attack scenario**: A user with standard employee access or an unauthenticated third-party directly queries `/api/finance/invoice?companyId=<target_company_id>` or `/api/hr/attendance?companyId=<target_company_id>`. Since the backend lacks any authentication/RBAC middleware, the data is served without verification.
- **Blast radius**: Complete data leakage of financial invoices, employee attendance records, purchase requisitions, and organizational metadata across tenants. Users can perform unauthorized write/update/delete operations directly on database records.
- **Mitigation**: Implement a backend authentication and middleware/RBAC check using session tokens (JWT, cookie, or authorization headers) to authenticate requests and restrict access based on the verified tenant company ID and user role before executing database operations.

---

## Stress Test Results

| Target Route & Method | Input Payload / Scenario | Expected Behavior | Actual/Predicted Behavior | Result |
|---|---|---|---|---|
| `/api/finance/invoice` (POST) | Empty request body | HTTP 400 Bad Request | HTTP 500 Internal Server Error (`SyntaxError`) | **FAIL** |
| `/api/finance/invoice` (POST) | Malformed JSON: `{"companyId":` | HTTP 400 Bad Request | HTTP 500 Internal Server Error (`SyntaxError`) | **FAIL** |
| `/api/finance/invoice` (POST) | `companyId: true` (boolean) | HTTP 400 Bad Request | HTTP 500 Internal Server Error (`PrismaClientValidationError`) | **FAIL** |
| `/api/finance/invoice` (POST) | `dueDate: true` (boolean) | HTTP 400 Bad Request | HTTP 201 Created (persisted as `1970-01-01T00:00:00.001Z`) | **FAIL** |
| `/api/hr/attendance` (POST) | Empty request body | HTTP 400 Bad Request | HTTP 500 Internal Server Error (`SyntaxError`) | **FAIL** |
| `/api/hr/attendance` (POST) | `companyId: {}` (object) | HTTP 400 Bad Request | HTTP 500 Internal Server Error (`PrismaClientValidationError`) | **FAIL** |
| `/api/purchasing/requisition` (POST) | Empty request body | HTTP 400 Bad Request | HTTP 400 Bad Request (`Invalid JSON request body`) | **PASS** |
| `/api/purchasing/requisition` (POST) | `companyId: true` (boolean) | HTTP 400 Bad Request | HTTP 500 Internal Server Error (`PrismaClientValidationError`) | **FAIL** |

---

## Unchallenged Areas

- **Database-Level Isolation**: We assume the database handles foreign keys and cascades correctly.
- **Frontend Components**: Frontend validation flow and UI layout compatibility (review is purely backend-focused).
