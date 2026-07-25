## 2026-07-22T16:12:06Z
<USER_REQUEST>
You are the Worker subagent to fix Next.js production build prerendering issues in AgentFlow.
Your working directory is: c:\Users\L15 RYZEN\Desktop\agentflow\.agents\teamwork_preview_worker_fix

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Context & Task:
Reviewer 1 found that `npm run build` failed during static page generation / route export because API routes `src/app/api/tasks/route.ts` and `src/app/api/admin/sync-tools/route.ts` (and any other API routes accessing dynamic request headers/cookies/searchParams) were missing `export const dynamic = 'force-dynamic';`.

Tasks:
1. Inspect `src/app/api/tasks/route.ts`, `src/app/api/admin/sync-tools/route.ts`, and all API route handlers in `src/app/api/`. Add `export const dynamic = 'force-dynamic';` where required so Next.js does not attempt static prerendering on dynamic API endpoints.
2. Run `npm run build` and ensure the build completes with 0 errors, 0 warnings, and successful static page generation across all routes.
3. Write your handoff report to `c:\Users\L15 RYZEN\Desktop\agentflow\.agents\teamwork_preview_worker_fix\handoff.md`.
4. Send a message back to the main orchestrator (conversation ID: b84d5558-6acc-470e-9312-128635fe762c).

</USER_REQUEST>
