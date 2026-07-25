## Challenge Summary

**Overall risk assessment**: HIGH

The backend evolution implementation is functional but has critical gaps in authorization, multi-tenant isolation, input validation, and compliance with workspace rules defined in `AGENTS.md`. Key findings include missing RBAC checks, global uniqueness conflicts in a multi-tenant DB schema, lack of coordinate range validation for geofencing, and validation fallbacks that violate the system rules.

---

## Challenges

### [Critical] Challenge 1: Absence of Authentication and Role-Based Access Control (RBAC) in API Routes
- **Assumption challenged**: Assumed that Next.js API routes are secure by default or that frontend client requests are implicitly trusted.
- **Attack scenario**: API routes `/api/finance/invoice`, `/api/hr/attendance`, `/api/purchasing/requisition`, `/api/finance`, `/api/leads`, `/api/scraper`, `/api/settings` do not perform any user authentication or role-based access checks. Any user (including an anonymous client) can read, create, update, or delete sensitive data (invoices, attendance, PRs) by simply guessing or providing a `companyId` (UUID) or transaction `id`. Additionally, the `/api/scraper` route can be triggered by anyone to spawn a Python scraping process on the server without any authentication or company scoping.
- **Blast radius**: Complete data leakage, unauthorized modification or deletion across tenants, and potential Denial of Service (DoS) through resource exhaustion by repeatedly invoking `/api/scraper`.
- **Mitigation**: Implement a backend middleware or session validation utility that extracts user session tokens, validates that the user is authenticated, checks that they belong to the `companyId` being accessed (Multi-tenant isolation), and verifies their role (e.g. `OWNER`, `SUPERVISOR`, `STAFF`) before executing database queries or launching subprocesses.

### [High] Challenge 2: Global Uniqueness Constraints in Multi-Tenant Database Schema
- **Assumption challenged**: Assumed that `invoiceNumber`, `prNumber`, and `soNumber` must be unique across the entire database.
- **Attack scenario**: In `prisma/schema.prisma`, the fields `Invoice.invoiceNumber`, `PurchaseRequisition.prNumber`, and `SalesOrder.soNumber` have `@unique` constraints. This enforces global uniqueness. If Company A creates invoice `INV-2026-001`, Company B cannot create an invoice with that same number. Any attempt by Company B to do so will fail with a database constraint violation (Prisma P2002), resulting in a `500 Internal Server Error` (or `400 Bad Request` if caught).
- **Blast radius**: Multi-tenant collision. Tenants cannot define their own invoice or requisition numbering systems independently. It also creates a vector for cross-tenant enumeration/information leakage.
- **Mitigation**: Remove the global `@unique` constraints on these fields and use composite unique keys, e.g., `@@unique([companyId, invoiceNumber])`, `@@unique([companyId, prNumber])`, and `@@unique([companyId, soNumber])`.

### [Medium] Challenge 3: Inadequate Input Validation in Geofencing `/api/hr/attendance` POST
- **Assumption challenged**: Assumed that client-provided `latitude` and `longitude` values are always valid, non-null numbers.
- **Attack scenario**: 
  1. If a client sends `latitude: null` or `longitude: null`, the validation check `latitude === undefined` evaluates to `false`. The endpoint proceeds to pass `null` values into `db.absensi.create`. Since `latitude` and `longitude` are required `Float` fields in the schema, Prisma will throw a database type/not-null constraint error, returning a `500 Internal Server Error` instead of a `400 Bad Request`.
  2. If they are strings like `"not-a-number"`, `calculateDistance` returns `NaN`. Prisma will fail to insert a non-numeric string into the Float field, causing another `500 Internal Server Error`.
  3. No latitude range $[-90, 90]$ or longitude range $[-180, 180]$ check is performed.
- **Blast radius**: API crashes (500) and database level integrity exceptions.
- **Mitigation**: Parse and strictly validate coordinates in the handler:
  ```typescript
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
    return NextResponse.json({ success: false, error: 'Invalid latitude or longitude coordinates' }, { status: 400 });
  }
  ```

### [Medium] Challenge 4: API Fallbacks to Random Companies (Violation of AGENTS.md Rule 4)
- **Assumption challenged**: Assumed that falling back to the first company in the database (`db.company.findFirst()`) is acceptable for ease of demoing.
- **Attack scenario**:
  - In `/api/settings` (GET and POST), `/api/ocr` (POST), `/api/leads` (GET), and `/api/dashboard-stats` (GET), if `companyId` is omitted, the code queries `db.company.findFirst()` and uses its ID.
  - This directly violates AGENTS.md Rule 4, which forbids fallback to random records on missing parameters: "jika parameter wajib (seperti companyId atau id transaksi) tidak disertakan, langsung return HTTP 400 (Bad Request), alih-alih mencoba melakukan pencarian otomatis (fallback) ke record acak yang dapat merusak integritas data."
- **Blast radius**: Non-compliance with project safety guidelines, cross-tenant data leaks (exposing company stats or leads to other users), and data corruption.
- **Mitigation**: Return HTTP 400 Bad Request immediately if `companyId` is not provided in the parameters.

### [Medium] Challenge 5: Missing Pre-Modification Existence Checks (Violation of AGENTS.md Rule 4)
- **Assumption challenged**: Assumed that Prisma will handle non-existent updates gracefully.
- **Attack scenario**:
  - In `/api/settings` POST (which performs a company update), there is no check to see if the target company exists prior to running `db.company.update`. If the company does not exist, Prisma throws a `RecordNotFound` error, crashing the request into a `500 Internal Server Error`.
  - This violates AGENTS.md Rule 4: "Selalu lakukan pengecekan keberadaan data (cek null) dan return HTTP 404 (Not Found) sebelum menjalankan operasi modifikasi (UPDATE) atau penghapusan (DELETE) pada database Prisma."
- **Blast radius**: Non-compliance with safety rules and server crashes on invalid IDs.
- **Mitigation**: Query `db.company.findUnique` first and return a `404 Not Found` if the company is missing.

### [Medium] Challenge 6: Missing Offline Fallback Parser in `/api/ocr` (Violation of AGENTS.md Rule 6)
- **Assumption challenged**: Assumed that standard error response is sufficient for external Gemini API errors.
- **Attack scenario**: If Gemini API returns a 429 (Rate Limit) or fails, `/api/ocr` returns `502 Bad Gateway` with the error detail. It has no offline mock parser.
- **Blast radius**: Violates AGENTS.md Rule 6: "Setiap API Route yang menghubungkan layanan AI eksternal (seperti Gemini API) wajib memiliki penanganan kesalahan/fallback lokal (offline fallback parser)... mengembalikan JSON terstruktur tiruan (mock) yang ramah dan kontekstual..."
- **Mitigation**: Add a local mock response parser in `/api/ocr` that extracts basic mock details if the external API is unreachable or rate-limited.

---

## Stress Test Results

- **Multiple parallel POSTs with identical `invoiceNumber` or `prNumber`** → Expected behavior: Database unique constraint protects integrity; API should catch validation/collision and return `400 Bad Request` gracefully. → Actual behavior: One request succeeds, the other fails with a `500 Internal Server Error` due to uncaught Prisma unique constraint error. → **FAIL**
- **POST `/api/hr/attendance` with `latitude: null` or `longitude: null`** → Expected behavior: API returns `400 Bad Request` because coordinates must be valid numbers. → Actual behavior: API passes `null` to database, causing a database level required field violation and crashes with `500 Internal Server Error`. → **FAIL**
- **POST `/api/settings` with invalid/non-existent company ID** → Expected behavior: API checks company existence first and returns `404 Not Found`. → Actual behavior: API attempts direct update, Prisma throws record not found, crashes with `500 Internal Server Error`. → **FAIL**
- **GET `/api/settings` without `companyId` parameter** → Expected behavior: API returns `400 Bad Request` as per AGENTS.md Rule 4. → Actual behavior: API queries `findFirst()` and returns stats for the first company in the database. → **FAIL**
- **GET `/api/finance/invoice` with incorrect `companyId`** → Expected behavior: Denied access or `404` depending on auth state. → Actual behavior: Returns empty invoices list or queries matching UUID without verification of user's access rights. → **FAIL**

---

## Unchallenged Areas

- **Frontend Pages** — The React/Next.js UI components and page routing were not audited because they were out of scope.
- **Physical file download verification** — Not challenged under active execution due to the strict constraint prohibiting terminal command runs.
