## 2026-07-16T14:07:37Z

You are the teamwork_preview_worker.
Your working directory is: C:\Users\L15 RYZEN\Desktop\agentflow\.agents\worker_backend_evolution_hardening_final
Your task:
1. Hardened JSON parsing error handling:
   - In C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\finance\invoice\route.ts
   - In C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\hr\attendance\route.ts
   Wrap the `await req.json()` call in a local `try/catch` block that returns HTTP 400 Bad Request with { success: false, error: 'Invalid JSON request body' } if parsing fails.
2. Hardened string/date/coordinates validation:
   - In C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\finance\invoice\route.ts POST/PUT:
     * Check if `companyId`, `type`, `invoiceNumber`, `clientName` are of type string.
     * Validate that `dueDate` is either of type string or number. Reject null, true, or other types with HTTP 400.
     * Parse and validate `amount` to ensure it is a valid non-negative float.
   - In C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\hr\attendance\route.ts POST:
     * Check if `companyId` and `userId` are of type string.
     * Parse `latitude` and `longitude` to float, validate they are not NaN and fall in ranges: latitude [-90, 90] and longitude [-180, 180]. Reject if they are not numbers (e.g. null, boolean, or objects) with HTTP 400.
   - In C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\purchasing\requisition\route.ts PUT/POST:
     * Check if `companyId`, `prNumber`, `salesOrderId` are strings (if provided).
     * In PUT handler: if `salesOrderId` is passed as `""` or `null`, convert it to `null` to gracefully disconnect the sales order relation instead of crashing Prisma database. If `salesOrderId` is a non-empty string, verify it exists in the database.
3. **CRITICAL WARNING:** There is a native C++ binary compatibility bug in the Windows environment that causes the Antigravity backend server to crash whenever run_command (terminal commands) is approved/executed. DO NOT run any terminal commands or launch background processes. Perform all edits using file-based tools.
4. Write your handoff.md in your working directory. When done, send a message to the orchestrator (59528e50-2b9a-4d3d-8bd1-26ece4d6cb82) containing the path to your handoff.md.
