# Handoff Report

## 1. Observation

During the static analysis of the Next.js API routes and database schema in the workspace, the following code structures were directly observed:

### Observation 1.1: Missing Route Authorization / RBAC checks
None of the Next.js API routes (`/api/finance/invoice/route.ts`, `/api/hr/attendance/route.ts`, `/api/purchasing/requisition/route.ts`, `/api/finance/route.ts`, `/api/leads/route.ts`, `/api/settings/route.ts`, and `/api/scraper/route.ts`) implement backend session validation or access control middleware. They process queries and modifications directly based on user-supplied query/body variables (`companyId`, `id`).

### Observation 1.2: Fallback to first company in database (Violation of AGENTS.md Rule 4)
In multiple API routes, if `companyId` is omitted, the code queries `db.company.findFirst()` as a fallback instead of rejecting the request:
- **`src/app/api/settings/route.ts` (lines 9-15):**
  ```typescript
      if (!companyId) {
        const firstCompany = await db.company.findFirst();
        if (!firstCompany) {
          return NextResponse.json({ error: "Perusahaan tidak ditemukan. Harap jalankan seeding database." }, { status: 404 });
        }
        companyId = firstCompany.id;
      }
  ```
- **`src/app/api/leads/route.ts` (lines 79-87):**
  ```typescript
      if (!companyId) {
        // Fallback ke perusahaan pertama di database untuk kemudahan demo
        const firstCompany = await db.company.findFirst();
        ...
        companyId = firstCompany.id;
      }
  ```
- **`src/app/api/dashboard-stats/route.ts` (lines 9-24):**
  ```typescript
      if (!companyId) {
        const firstCompany = await db.company.findFirst();
        ...
        companyId = firstCompany.id;
      }
  ```
- **`src/app/api/ocr/route.ts` (lines 96-102):**
  ```typescript
        let companyId = req.headers.get("x-company-id") || body.companyId;
        if (!companyId) {
          const firstCompany = await db.company.findFirst();
          if (firstCompany) {
            companyId = firstCompany.id;
          }
        }
  ```

### Observation 1.3: Missing existence checks before modification (Violation of AGENTS.md Rule 4)
- **`src/app/api/settings/route.ts` (lines 41-48):**
  The endpoint attempts to execute `db.company.update` directly on the parsed `companyId` without checking its existence using `findUnique` first.
  ```typescript
      const updated = await db.company.update({
        where: { id: companyId },
        data: {
          name,
          geminiApiKey: geminiApiKey || null,
          telegramBotToken: telegramBotToken || null
        }
      });
  ```

### Observation 1.4: Missing coordinate verification and null/type safety in `/api/hr/attendance` POST
In `src/app/api/hr/attendance/route.ts` (lines 56-59), the inputs `latitude` and `longitude` are checked only for `undefined`:
```typescript
    // Strict validation
    if (!companyId || !userId || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, error: 'companyId, userId, latitude, and longitude are required' }, { status: 400 });
    }
```
There is no conversion via `parseFloat` or numeric validation. Furthermore, there is no validation for `null` coordinate values or coordinate range check ($[-90, 90]$ for latitude and $[-180, 180]$ for longitude).

### Observation 1.5: Global Uniqueness Constraints for Multi-Tenant Schema
In `prisma/schema.prisma` (lines 146, 160, 173):
```prisma
model Invoice {
  ...
  invoiceNumber     String    @unique
}
model SalesOrder {
  ...
  soNumber          String    @unique
}
model PurchaseRequisition {
  ...
  prNumber          String    @unique
}
```
These fields are globally unique across all records in the database, rather than unique within a specific tenant (`companyId`).

### Observation 1.6: Missing Offline Fallback Parser in `/api/ocr` (Violation of AGENTS.md Rule 6)
In `src/app/api/ocr/route.ts` (lines 67-71), if Gemini API fails or returns rate limit 429, the route immediately terminates and returns an error without any offline fallback:
```typescript
    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API error:', err);
      return NextResponse.json({ error: 'Gemini API gagal', detail: err }, { status: 502 });
    }
```

---

## 2. Logic Chain

1. **Lack of authorization checks in routes (Observation 1.1) → Authentication bypass:** Anyone who can access the Next.js server can invoke the API routes directly with arbitrary parameters. Because the database logic doesn't verify the caller's identity or role, an unauthenticated client can retrieve and modify data across all tenants.
2. **Global `@unique` constraints in multi-tenant schema (Observation 1.5) → Collision and Denial of Service:** When Company A creates invoice `INV-2026-001`, that value is occupied globally. If Company B tries to create `INV-2026-001`, Prisma throws a database level unique constraint violation. Because the route handler `/api/finance/invoice/route.ts` does not catch this specific constraint collision, it crashes with a `500 Internal Server Error` instead of a validation warning.
3. **Weak coordinate validation (Observation 1.4) → DB constraint crash / invalid calculation:**
   - If a client supplies `latitude: null`, it passes the `latitude === undefined` validation. Prisma tries to insert `null` into a required database column, throwing a constraint violation.
   - If a client supplies `latitude: "not-a-number"`, the Haversine formula calculation results in `NaN`. When writing `NaN` to the database float field, Prisma throws a validation/type error, resulting in a `500 Internal Server Error` instead of `400 Bad Request`.
4. **Fallback to random company and missing existence checks (Observations 1.2, 1.3) → Violations of AGENTS.md Rule 4:**
   - The fallback to `db.company.findFirst()` allows requests that lack a `companyId` to access the first tenant's data, causing cross-tenant data exposure.
   - The lack of check on company existence before update in `/api/settings` POST causes Prisma to crash with record not found on invalid IDs.

---

## 3. Caveats

- **Active execution constraints:** Due to a native C++ binary compatibility bug in the Windows environment, terminal commands (`run_command`) and background processes were strictly avoided. All code and design reviews were conducted using static analysis and logical deduction.
- **Frontend/Client verification:** The frontend components (e.g. settings page, invoice dashboard) were not investigated. It is assumed the frontend passes parameters properly, but backend validation was verified to be insufficient.

---

## 4. Conclusion

The Next.js API routes and database schema contain critical security, isolation, and stability vulnerabilities.
1. **Critical:** API routes lack authentication, RBAC authorization, and tenant ownership checks, allowing unauthorized cross-tenant data operations.
2. **High:** Invoice, PR, and SO numbers have global `@unique` constraints in Prisma. This causes numbering collisions between tenants, crashing operations with `500` errors.
3. **Medium:** Multiple API routes violate `AGENTS.md` Rule 4 by falling back to `findFirst()` when `companyId` is omitted, or by failing to verify record existence before running `update`.
4. **Medium:** `/api/hr/attendance` is susceptible to crash on invalid/null coordinates due to lack of range verification, `null` checks, and coordinate parsing.
5. **Medium:** `/api/ocr` violates `AGENTS.md` Rule 6 by not providing an offline fallback parser when the Gemini API fails.

---

## 5. Verification Method

To verify these findings statically (or in the shell when C++ compatibility issues are resolved):

1. **Verify Route Authorization & Fallback Behavior:**
   Review the Next.js API files:
   - `src/app/api/settings/route.ts` (lines 9-15)
   - `src/app/api/leads/route.ts` (lines 79-87)
   - `src/app/api/dashboard-stats/route.ts` (lines 9-24)
   - `src/app/api/ocr/route.ts` (lines 96-102)
   Verify that they fallback to `findFirst()` instead of returning a `400 Bad Request`.

2. **Verify Database Schema Constraints:**
   Inspect `prisma/schema.prisma` and check that `invoiceNumber`, `soNumber`, and `prNumber` have global `@unique` modifiers on their fields instead of composite constraints.

3. **Verify Geofencing Coordinate Validation:**
   Inspect `src/app/api/hr/attendance/route.ts` (lines 56-59) to confirm it checks only `latitude === undefined` and `longitude === undefined`, lacking numeric checks, `null` validation, and range checks.
