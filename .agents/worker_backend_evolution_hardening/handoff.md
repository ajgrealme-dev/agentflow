# Handoff Report - Next.js API Handlers Hardening

## 1. Observation
We examined three newly scaffolded API route handler files:
- **Attendance Route Handler**: `C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\hr\attendance\route.ts`
  - In `POST` method: raw `latitude` and `longitude` fields from request body were passed to calculation and db creation without validation.
- **Invoice Route Handler**: `C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\finance\invoice\route.ts`
  - In `POST` and `PUT` methods: `amount` and `dueDate` were used/updated but without validation checking if they parsed to valid non-negative numbers or valid dates.
- **Requisition Route Handler**: `C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\purchasing\requisition\route.ts`
  - In `POST` and `PUT` methods: `req.json()` was executed outside of a local try-catch block, resulting in HTTP 500 on malformed JSON bodies rather than HTTP 400.

## 2. Logic Chain
- For **attendance/route.ts**:
  - We added `const latNum = parseFloat(latitude)` and `const lonNum = parseFloat(longitude)`.
  - We validate that `isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180` evaluates to true, in which case we immediately return HTTP 400 with `{ success: false, error: 'Invalid latitude or longitude value' }`.
  - We used `latNum` and `lonNum` in the geofence check and database `create` operation to guarantee correct type coercion.
- For **invoice/route.ts**:
  - In `POST`, we parse `amount` to `amountNum` and check `isNaN(amountNum) || amountNum < 0` to ensure it is a non-negative number.
  - In `POST`, we parse `dueDate` to `dueDateObj` and check `isNaN(dueDateObj.getTime())` to ensure it is a valid date.
  - In `PUT`, we perform identical parsing and checks on `amount` and `dueDate` only if they are provided, returning HTTP 400 if validation fails.
- For **requisition/route.ts**:
  - We wrapped `await req.json()` in a try-catch block in both `POST` and `PUT` handlers to return HTTP 400 with `{ success: false, error: 'Invalid JSON request body' }` when parsing fails.
  - We added explicit `typeof itemsJson !== 'string'` validation if `itemsJson` is provided to ensure type safety before calling `JSON.parse`.

## 3. Caveats
- No build or test commands were run in the terminal workspace due to the warning: "There is a native C++ binary compatibility bug in the Windows environment that causes the Antigravity backend server to crash whenever run_command (terminal commands) is approved/executed." All correctness assessments are based on visual analysis and syntax checks.

## 4. Conclusion
All Next.js API route handlers specified in the user request have been successfully hardened against type coercion crashes and return HTTP 400 Bad Request on failure.

## 5. Verification Method
1. Inspect the modified files visually:
   - `src/app/api/hr/attendance/route.ts`
   - `src/app/api/finance/invoice/route.ts`
   - `src/app/api/purchasing/requisition/route.ts`
2. Test the endpoints using API clients (e.g., Postman or curl):
   - **Invalid attendance**: `POST /api/hr/attendance` with body `{ "companyId": "...", "userId": "...", "latitude": "invalid", "longitude": 100 }` should return HTTP 400.
   - **Invalid invoice**: `POST /api/finance/invoice` with body `{ "companyId": "...", "type": "...", "invoiceNumber": "...", "clientName": "...", "amount": -10, "dueDate": "invalid-date" }` should return HTTP 400.
   - **Malformed requisition**: `POST /api/purchasing/requisition` with non-JSON string or malformed JSON should return HTTP 400.
