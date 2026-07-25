# Handoff Report - Backend Evolution Review

## 1. Observation
During the static code review of the backend evolution implementation, the following code behaviors and segments were observed:

- **Missing Authentication/RBAC Middleware (Conformance - Rule 7)**:
  - In `src/app/api/finance/invoice/route.ts`, GET (Line 5) and POST (Line 32) accept parameters without session or credential headers check:
    ```typescript
    export async function GET(req: NextRequest) {
    ...
    export async function POST(req: NextRequest) {
    ```
  - In `src/app/api/hr/attendance/route.ts`, GET (Line 21) and POST (Line 51) accept parameters and log attendance without checking credentials or authenticating the user session:
    ```typescript
    export async function GET(req: NextRequest) {
    ...
    export async function POST(req: NextRequest) {
    ```
  - In `src/app/api/purchasing/requisition/route.ts`, GET (Line 5) and POST (Line 35) accept parameters and perform requisition actions with no session validation.
  - The login system in `src/app/login/page.tsx` simulates login using client-side storage:
    ```typescript
    setTimeout(() => {
      localStorage.setItem('user_role', role);
      setLoading(false);
      router.push('/');
    }, 800);
    ```

- **Unverified Input Types on Geographic Coordinates (Robustness)**:
  - In `src/app/api/hr/attendance/route.ts` (Lines 54-58), incoming body coordinates are validated only for presence:
    ```typescript
    const body = await req.json();
    const { companyId, userId, latitude, longitude } = body;

    // Strict validation
    if (!companyId || !userId || latitude === undefined || longitude === undefined) {
    ```
  - In `src/app/api/hr/attendance/route.ts` (Lines 84-89), variables `latitude` and `longitude` are directly passed into `calculateDistance` without validation or numeric conversion, which leads to `NaN` calculations and silent failures if invalid string types are passed.

- **Cross-tenant Data Leakage Violations (Conformance - Rule 4)**:
  - Several legacy/adjacent API files fall back to the first company using `db.company.findFirst()` if `companyId` is not provided, rather than immediately returning a `400 Bad Request`.
  - In `src/app/api/settings/route.ts` (Lines 9-15):
    ```typescript
    if (!companyId) {
      const firstCompany = await db.company.findFirst();
      if (!firstCompany) {
        return NextResponse.json({ error: "Perusahaan tidak ditemukan. Harap jalankan seeding database." }, { status: 404 });
      }
      companyId = firstCompany.id;
    }
    ```
  - In `src/app/api/dashboard-stats/route.ts` (Lines 9-24):
    ```typescript
    if (!companyId) {
      const firstCompany = await db.company.findFirst();
      ...
      companyId = firstCompany.id;
    }
    ```
  - In `src/app/api/leads/route.ts` (Lines 80-87):
    ```typescript
    if (!companyId) {
      // Fallback ke perusahaan pertama di database untuk kemudahan demo
      const firstCompany = await db.company.findFirst();
      ...
      companyId = firstCompany.id;
    }
    ```
  - In `src/app/api/ocr/route.ts` (Lines 96-102):
    ```typescript
    let companyId = req.headers.get("x-company-id") || body.companyId;
    if (!companyId) {
      const firstCompany = await db.company.findFirst();
      if (firstCompany) {
        companyId = firstCompany.id;
      }
    }
    ```

- **Missing OCR Offline Fallback Parser (Conformance - Rule 6)**:
  - In `src/app/api/ocr/route.ts` (Lines 67-71), failures in contacting the Gemini API directly return a 502 Bad Gateway response without falling back to a mockup response:
    ```typescript
    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API error:', err);
      return NextResponse.json({ error: 'Gemini API gagal', detail: err }, { status: 502 });
    }
    ```

- **Telegram Bot Strict Authorized Clicks Check (Conformance - Rule 3)**:
  - In `bot/bot.js` (Lines 703-731), the clicker identity `callbackQuery.from.id` is correctly cross-referenced with role hierarchies and records:
    ```javascript
    const clickerChatId = callbackQuery.from.id.toString();
    const clicker = await getUserByTelegramChatId(clickerChatId);
    ...
    ```

- **Seed Script Robustness**:
  - In `prisma/seed.js`, all database drops (`deleteMany()`) are correctly sequenced, preventing foreign key constraint violations.

## 2. Logic Chain
1. Based on the observation of `bot/bot.js`, the Telegram Bot correctly implements the required `try-catch` event handler wrappers, directory traversal checks on PDF slip downloads, and inline keyboard clicker identity checks (Rule 1, 2, 3 compliance).
2. Based on the observation of `invoice/route.ts`, `attendance/route.ts`, and `requisition/route.ts`, these new routes do not contain any file downloading operations, making directory traversal attacks inapplicable.
3. Based on the observation of the code in these routes, they require `companyId` and `id` parameters explicitly and return `400 Bad Request` or `404 Not Found` if missing or not found in the database. This satisfies the request validation rules of Rule 4.
4. However, the logic in `attendance/route.ts` lacks validation of geographic coordinate input types. Destructuring variables directly from the untyped json body of the request without parsing them via `parseFloat()` or validating them leads to `NaN` outputs in the Haversine formula, resulting in silent HR failures.
5. In addition, Rule 7 is violated because Next.js routes operate with no backend authentication middleware. Anyone can access and modify database objects by hitting these public paths with a guessable `companyId` or uuid.
6. Crucially, Rule 4 is violated by legacy routes (`settings`, `dashboard-stats`, `leads`, `ocr`) which query the first available company database record using `db.company.findFirst()` when a company parameter is omitted.
7. Furthermore, Rule 6 is violated by `ocr/route.ts` which has no offline mock fallback parser when the Gemini API connection fails or returns rate-limits.

## 3. Caveats
- Reviews were conducted statically without running integration tests because of the native C++ binary compatibility bug in the Windows environment that causes the Antigravity backend server to crash.
- Did not verify actual Prisma connection behavior or environment variables loading during runtime.

## 4. Conclusion
The backend evolution implementation is functionally complete and correct in terms of database seeding and resource mapping. However, the verdict is **REQUEST_CHANGES** due to:
- Gaps in API Route authorization (Rule 7).
- Lack of type checking on geographic coordinates inside the attendance logging endpoint.
- Direct violations of Rule 4 (first company fallback query) and Rule 6 (no offline mock parser in OCR route) in surrounding codebase files.

## 5. Verification Method
- **Static Verification**:
  - Open `src/app/api/hr/attendance/route.ts` and inspect lines 54-58 and 84-89 to verify if `latitude` and `longitude` are checked for their types or parsed.
  - Open `src/app/api/ocr/route.ts`, `src/app/api/settings/route.ts`, `src/app/api/dashboard-stats/route.ts`, and `src/app/api/leads/route.ts` to inspect the `db.company.findFirst()` fallback usage when `companyId` is empty.
  - Inspect Next.js routes folder structure to verify the complete absence of `src/middleware.ts` or authorization headers check.
- **Dynamic Verification (On a safe non-Windows or repaired env)**:
  - Launch server: `npm run dev`
  - Run the integration test suite: `node test_api.js` (Verify output status codes).
  - Test tenant isolation: Submit a POST request to `/api/finance/invoice` using an existing invoice ID but with a foreign company's `companyId` in the body, verifying if it is accepted or blocked.
