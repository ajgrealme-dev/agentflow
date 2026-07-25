# Backend Evolution Implementation - Static Code Review Report

## PART 1: QUALITY REVIEW

### Review Summary
**Verdict**: REQUEST_CHANGES
The newly added backend files (`seed.js`, `invoice/route.ts`, `attendance/route.ts`, `requisition/route.ts`) correctly implement the core database operations, relationships, and validation logic. However, changes are requested due to:
1. **Lax Request Validation (Robustness)**: Lack of type validation/parsing for geographic coordinates in `hr/attendance/route.ts` POST handler (leading to silent failures or unexpected status when strings are passed).
2. **Missing Backend RBAC Middleware (Conformance - Rule 7)**: No backend authentication or role-based access control (RBAC) middleware is implemented to secure the Next.js API routes. All endpoints are open to unauthenticated access if the `companyId` is known, relying entirely on client-side simulation.
3. **Severe Conformance Gaps in Legacy Files (Coverage Gaps - Rule 4 & 6)**: The wider API codebase violates several rules in `AGENTS.md` (e.g., fallback to random records via `findFirst` in `ocr/route.ts`, `settings/route.ts`, `dashboard-stats/route.ts`, and `leads/route.ts`; and missing offline fallback parser in `ocr/route.ts`).

---

### Findings

#### [Major] Finding 1: Lack of Backend RBAC Middleware (Rule 7 Conformance)
- **What**: There is no authentication or session validation middleware in the Next.js API routes.
- **Where**:
  - `src/app/api/finance/invoice/route.ts`
  - `src/app/api/hr/attendance/route.ts`
  - `src/app/api/purchasing/requisition/route.ts`
- **Why**: Anyone can make HTTP requests to perform reads, writes, updates, and deletes on company invoices, attendance logs, and purchase requisitions without proving their identity or roles. This violates **Rule 7 (AI RBAC Middleware)** of `AGENTS.md` which states: *"Validasi sesi dan peran (role) pengguna harus diperiksa secara keras di backend menggunakan kode pemrograman (middleware) sebelum memanggil database..."*
- **Suggestion**: Implement a session validation helper or a Next.js middleware file (`src/middleware.ts`) that extracts user session token/headers and verifies user role and company ID association before routing calls to the handlers.

#### [Medium] Finding 2: Missing Coordinate Type Verification (Robustness)
- **What**: Geographic coordinates (`latitude` and `longitude`) are not validated or parsed to ensure they are numeric.
- **Where**: `src/app/api/hr/attendance/route.ts` (Lines 54–59, 84–89)
- **Why**: The POST request handler destructures `latitude` and `longitude` directly from the request body and passes them to `calculateDistance`. If a client passes strings (e.g., `"abc"` or `""`), it will result in `NaN` during mathematical calculations, causing the geofence calculation to fail silently and mark attendance status as `Ditolak` instead of returning a proper `400 Bad Request` or parsing it safely.
- **Suggestion**: Cast/parse coordinates using `parseFloat()` or validate via type checks (e.g., `typeof latitude === 'number' && !isNaN(latitude)`).

---

### Verified Claims

- **Seed script execution safety** → verified via static inspection of model delete dependency sequence in `prisma/seed.js` → **PASS** (Child tables are deleted before parents: `PurchaseRequisition` -> `SalesOrder` -> `Invoice` -> `Absensi` -> `AuditLog` -> `Approval` -> `InventoryItem` -> `FinancialReceipt` -> `Lead` -> `User` -> `Company`).
- **Geofencing Haversine Accuracy** → verified via formula tracing in `src/app/api/hr/attendance/route.ts` → **PASS** (Correct Earth radius of `6371e3` meters and math calculations).
- **PR items JSON verification** → verified via try/catch JSON parsing block in `src/app/api/purchasing/requisition/route.ts` → **PASS** (Ensures `itemsJson` is valid JSON format before creation/update).
- **Unique PR and Invoice Number checks** → verified via unique database index lookups in both routes → **PASS** (Checks unique `invoiceNumber` and `prNumber` and returns 400 if already exists).

---

### Coverage Gaps

- **Legacy/Adjacent Endpoints** — risk level: **HIGH** — recommendation: **INVESTIGATE & REFRACTOR**
  - **Rule 4 Violations (Auto-fallback to first record)**:
    - `src/app/api/settings/route.ts` (GET/POST fall back to first company)
    - `src/app/api/dashboard-stats/route.ts` (GET falls back to first company)
    - `src/app/api/leads/route.ts` (GET falls back to first company)
    - `src/app/api/ocr/route.ts` (POST falls back to first company)
    These endpoints violate Rule 4 by defaulting to `db.company.findFirst()` when `companyId` is omitted, potentially causing data leakage or corruption across different tenants in a multi-tenant setup.
  - **Rule 6 Violations (Missing Offline Fallback Parser)**:
    - `src/app/api/ocr/route.ts` (Calls external Gemini API directly but does not implement any offline mock parser when rate-limited or failed, returning a raw 502 error instead).
- **Telegram Bot Callback Clicker Security** — risk level: **LOW** — recommendation: **ACCEPT RISK**
  - Checked `bot/bot.js` callback query handlers. Clicker ID (`callbackQuery.from.id`) and roles are dynamically queried and verified against database records. Conforms fully to Rule 3.

---

### Unverified Items

- **Runtime API behavior (database migrations & network responses)** — reason not verified: Terminal commands were not run to adhere to the Windows environment C++ compatibility constraint.

---
---

## PART 2: ADVERSARIAL REVIEW

### Challenge Summary
**Overall risk assessment**: HIGH
The main system risks revolve around **tenant data isolation** and **input data sanity**. Because there is no cryptographic session authorization at the backend layer, the multi-tenant architecture relies entirely on the client providing a correct `companyId`.

---

### Challenges

#### [Critical] Challenge 1: Tenant Impersonation & Data Leakage
- **Assumption challenged**: The system assumes the client `companyId` passed in query parameters or request bodies belongs to the authenticated user.
- **Attack scenario**: A malicious user registered under Company A can query or modify resources (invoices, attendance, requisitions) of Company B simply by changing the `companyId` or transaction `id` parameters to those of Company B.
- **Blast radius**: Full exposure, modification, and deletion of invoices, purchase requisitions, and HR attendance records across all tenants.
- **Mitigation**: Authenticate all incoming HTTP requests using a cryptographically signed cookie or JWT, and ensure the requested `companyId` matches the company bound to the authenticated user's session.

#### [High] Challenge 2: Silenced Geolocation Failures
- **Assumption challenged**: The geofencing logic assumes the client sends clean float/number inputs.
- **Attack scenario**: An employee sends `" -6.1175"` or `"abc"` as `latitude` in their request. The backend fails to parse this explicitly, causing the math function to produce `NaN` and mark the check-in status as `Ditolak` (rejected). The user will be rejected due to a data format issue rather than because they were actually outside the geofence.
- **Blast radius**: HR reports will register false rejections (GPS luar area) due to formatting bugs, leading to incorrect payroll calculations.
- **Mitigation**: Perform explicit type casting (`Number(latitude)`) and verification (`!isNaN(latitude)`) and return a `400 Bad Request` if coordinates are invalid.

#### [Medium] Challenge 3: Lack of Input Sanitization on JSON strings
- **Assumption challenged**: The database assumes `itemsJson` is a well-formatted string, but structure is not enforced.
- **Attack scenario**: An attacker sends a valid JSON string but with arbitrary structure (e.g., `{"malicious_key": true}` instead of raw material attributes) inside `requisition/route.ts`. The schema accepts it since it's valid JSON text.
- **Blast radius**: Corruption of database records causing front-end components to crash when parsing unexpected keys.
- **Mitigation**: Validate the parsed JSON schema (using Zod or simple schema check) before saving `itemsJson` to the database.

---

### Stress Test Results

- **String inputs for numeric fields (e.g., amount, latitude)** → String numbers like `"15000"` are parsed correctly via `parseFloat`. Non-numeric strings (like `"abc"`) result in `NaN` or invalid inputs. For `latitude`/`longitude`, they fail to `NaN` and reject the attendance. → **FAIL** (Should reject request with `400` instead of saving or processing `NaN`).
- **Accessing non-existent resources (invoices, requisitions)** → Returns `404 Transaction not found` before performing database edits. → **PASS**
- **Overlapping/Duplicate unique fields** → Unique constraints are verified (e.g., `invoiceNumber` uniqueness check in invoice POST). → **PASS**

---

### Unchallenged Areas

- **AI Model behavior under heavy stress** — reason not challenged: The Gemini API could not be tested with concurrent requests due to terminal constraints and rate-limit safeguards.
