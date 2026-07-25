## 2026-07-16T14:01:09Z
You are the teamwork_preview_worker.
Your working directory is: C:\Users\L15 RYZEN\Desktop\agentflow\.agents\worker_backend_evolution_hardening
Your task is to harden the newly scaffolded Next.js API route handlers to prevent type coercion crashes (500 errors) and return HTTP 400 Bad Request instead.
Specifically:
1. In C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\hr\attendance\route.ts:
   - In POST handler: parse latitude and longitude using parseFloat.
   - Validate that latitude and longitude are not NaN, and that latitude is between -90 and 90, and longitude is between -180 and 180.
   - If validation fails, return HTTP 400 with a clean JSON error response, e.g., { success: false, error: 'Invalid latitude or longitude value' }.
2. In C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\finance\invoice\route.ts:
   - In POST handler: parse amount using parseFloat and validate that it is a positive number (amountNum >= 0). Parse dueDate and validate that it is a valid date (isNaN(new Date(dueDate).getTime()) is false). If validation fails, return HTTP 400.
   - In PUT handler: if amount is provided, parse and validate it. If dueDate is provided, parse and validate it. If validation fails, return HTTP 400.
3. In C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\purchasing\requisition\route.ts:
   - Ensure all input JSON string parses correctly and returns 400 on error.
4. **CRITICAL WARNING:** There is a native C++ binary compatibility bug in the Windows environment that causes the Antigravity backend server to crash whenever run_command (terminal commands) is approved/executed. DO NOT run any terminal commands or launch background processes. Perform all edits using file-based tools.
5. Write your handoff.md in your working directory. When done, send a message to the orchestrator (59528e50-2b9a-4d3d-8bd1-26ece4d6cb82) containing the path to your handoff.md.
