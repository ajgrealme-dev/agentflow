## Challenge Summary

**Overall risk assessment**: CRITICAL

This review assesses the newly scaffolded Next.js API route handlers: `/api/finance/invoice`, `/api/hr/attendance`, and `/api/purchasing/requisition`.
While the handlers successfully implement basic CRUD and follow the workspace rule of checking data existence (returning 400 for missing fields, 404 for missing records on update/delete), they contain severe security vulnerabilities and logic edge cases that could lead to data corruption, tenant cross-talk, geofencing bypasses, and unauthorized data access.

---

## Attack Surface

### Hypotheses Tested
- **Hypothesis 1**: The API handlers enforce session/role authorization. (Result: **DISPROVED** - there is no middleware or custom token check in the endpoints).
- **Hypothesis 2**: The database constraints prevent multi-tenant numbering conflicts. (Result: **DISPROVED** - `@unique` is global, which causes numbering conflicts between different companies/tenants).
- **Hypothesis 3**: Input validation correctly handles non-standard values (e.g. `null` or invalid strings). (Result: **DISPROVED** - `latitude: null` passes verification checks and causes uncaught 500 errors).

### Vulnerabilities Found
- **Lack of Authorization Middleware**: Open API endpoints permitting anyone to GET/POST/PUT/DELETE all database records.
- **Global Unique Key Leakage**: Tenants can block other tenants from using standard invoice/PR numbers.
- **Geofencing Bypass**: Absence of office coordinates on a Company record allows arbitrary check-ins from any coordinates to be logged as "Hadir" (present).
- **Float/Date Parsing Crashing (500 Error)**: Invoices and Attendance API handlers crash with 500 Internal Server Error when parsing invalid inputs (NaN or null) and sending them to Prisma.

### Untested Angles
- **Runtime behavior under load**: Since running terminal commands or starting local servers is prohibited, runtime-specific resource usage, concurrency race conditions, and network latency effects remain untested.

---

## Challenges

### [Critical] Challenge 1: Absence of Backend Session/RBAC Access Controls
- **Assumption challenged**: Client-side authorization is sufficient to protect backend endpoints, or endpoints are internally protected.
- **Attack scenario**: An attacker inspects client code, obtains the endpoint URLs (e.g. `/api/finance/invoice`), and triggers requests (GET, POST, PUT, DELETE) with arbitrary `companyId` or `id` parameters. The backend processes the request and mutates the database without validating the caller's session, identity, or role.
- **Blast radius**: Complete data leak, modification, and deletion across all tenants.
- **Mitigation**: Implement backend session validation (e.g., checking cookie sessions, JWT verification, or NextAuth hooks) and verify that the user's role and `companyId` match the requested data before executing queries/mutations.

### [High] Challenge 2: Globally Unique Numbering Constraints in Multi-Tenant Schema
- **Assumption challenged**: Invoice numbers and purchase requisition numbers are unique across the entire system.
- **Attack scenario**: Company A registers an invoice with invoice number `INV-2026-001`. Company B later attempts to register an invoice with `INV-2026-001`. Since `invoiceNumber` is `@unique` in the database, Company B's request is rejected with `400 Bad Request` or fails with a 500 database error.
- **Blast radius**: Information disclosure (tenants can probe for existing invoice numbers) and operational deadlock (tenants cannot use overlapping invoice schemes).
- **Mitigation**: Remove the `@unique` constraint on `invoiceNumber` and `prNumber` fields, and replace them with composite unique constraints per tenant: `@@unique([companyId, invoiceNumber])` and `@@unique([companyId, prNumber])`.

### [Medium] Challenge 3: Type Coercion and Uncaught Prisma Validation Failures
- **Assumption challenged**: The check `latitude === undefined` is sufficient to validate the existence and format of coordinate variables.
- **Attack scenario**: A client POSTs check-in coordinates with `latitude: null`. Since `null !== undefined`, the payload bypasses the validator. In `calculateDistance`, `lat1` (null) is coerced to `0`, making the geofence calculation run against coordinates (0,0). During the Prisma create query, Prisma throws a schema validation error because the database `latitude` field is a non-nullable Float. This results in a `500 Internal Server Error` response instead of a clean `400 Bad Request`. Similar behavior occurs if `amount` or `dueDate` in the Invoice API is passed as a malformed string (e.g., `"abc"`).
- **Blast radius**: API instability, uncaught database errors, and potential exposure of database internals via error responses.
- **Mitigation**: Implement robust type-checking on numbers and dates:
  ```typescript
  if (typeof latitude !== 'number' || isNaN(latitude) || typeof longitude !== 'number' || isNaN(longitude)) {
    return NextResponse.json({ success: false, error: 'latitude and longitude must be valid numbers' }, { status: 400 });
  }
  ```
  Check `isNaN(parseFloat(amount))` and `isNaN(new Date(dueDate).getTime())` for invoice parameters.

### [Medium] Challenge 4: Geofencing Security Bypass via Missing Company Coordinates
- **Assumption challenged**: Falling back to marking check-in as 'Hadir' (present) when office coordinates are not configured is a safe backward-compatibility fallback.
- **Attack scenario**: A tenant company fails to configure `officeLatitude` and `officeLongitude` (leaving them as `null` in the database). The attendance POST handler defaults to logging any coordinates as `statusKehadiran: 'Hadir'`. Users can check in from any location (even outside office hours or from home) and bypass the geofence restriction.
- **Blast radius**: Geofencing rules are silently bypassed without warning, permitting fraudulent check-ins.
- **Mitigation**: Reject check-ins or flag them as `Belum Terverifikasi` (Unverified) or `Ditolak` if the company has not configured geofencing parameters.

### [Low] Challenge 5: Lack of Schema Validation for `itemsJson` in Purchase Requisitions
- **Assumption challenged**: Checking that `itemsJson` is a valid JSON string is sufficient to guarantee data integrity.
- **Attack scenario**: A user sends an empty array `[]` or a dictionary without the expected raw materials fields (e.g. `{"corrupted": true}`). The API parses and stores it. When downstream modules parse `itemsJson` to create Purchase Orders or render on the UI, they crash.
- **Blast radius**: Downstream and frontend UI crashes due to malformed JSON payloads.
- **Mitigation**: Validate the structure of parsed `itemsJson` using a schema validator (like `zod`) before writing to the database.

---

## Stress Test Results

| Test ID | Scenario | Expected Behavior | Predicted Behavior | Pass/Fail |
|---|---|---|---|---|
| TS-001 | GET invoice request missing `companyId` | Returns status 400 | Returns status 400 | PASS |
| TS-002 | POST invoice request with missing `dueDate` | Returns status 400 | Returns status 400 | PASS |
| TS-003 | POST invoice request with duplicate `invoiceNumber` | Returns status 400 | Returns status 400 | PASS |
| TS-004 | POST invoice request with `amount` set to `"invalid-amount"` | Returns status 400 | Returns status 500 (Prisma parser error) | **FAIL** |
| TS-005 | PUT invoice request with a non-existent invoice `id` | Returns status 404 | Returns status 404 | PASS |
| TS-006 | POST attendance check-in with `latitude: null` | Returns status 400 | Returns status 500 (Prisma schema validation error) | **FAIL** |
| TS-007 | POST attendance check-in with company coordinates set to `null` | Rejects/flags check-in | Returns status 200 with statusKehadiran "Hadir" | **FAIL** |
| TS-008 | POST purchase requisition with invalid JSON for `itemsJson` | Returns status 400 | Returns status 400 | PASS |
| TS-009 | POST purchase requisition with empty JSON array `[]` but missing required schema fields | Returns status 400 | Returns status 201 | **FAIL** |
| TS-010 | Unauthenticated HTTP POST request to create an invoice | Returns status 401/403 | Returns status 201 (No auth check) | **FAIL** |

---

## Unchallenged Areas

- **Concurrency & Race Conditions**: We did not challenge concurrent check-ins or race conditions on invoice number reservations under high load because runtime verification is prohibited.
- **IP Address & Device Spoofing**: Spoofing of headers (IP or user-agents) is not checked because no device fingerprinting or network-level validation is present in the attendance routes.
