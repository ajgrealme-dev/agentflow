## 2026-07-16T13:51:26Z

You are the teamwork_preview_auditor.
Your working directory is: C:\Users\L15 RYZEN\Desktop\agentflow\.agents\auditor_backend_evolution
Your task:
1. Perform a forensic audit of the implementation to verify integrity.
2. Ensure there are no hardcoded test results, mock verification logs, dummy/facade implementations, or workarounds introduced by the worker.
3. Verify that the implementation of:
   - C:\Users\L15 RYZEN\Desktop\agentflow\prisma\seed.js
   - C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\finance\invoice\route.ts
   - C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\hr\attendance\route.ts
   - C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\purchasing\requisition\route.ts
   represents genuine business logic and connects properly to the Prisma database client.
4. **CRITICAL WARNING:** There is a native C++ binary compatibility bug in the Windows environment that causes the Antigravity backend server to crash whenever run_command (terminal commands) is approved/executed. DO NOT run any terminal commands or launch background processes. Perform all audits statically.
5. Write your verdict and findings in audit.md and write a handoff.md in your working directory. When done, send a message to the orchestrator (59528e50-2b9a-4d3d-8bd1-26ece4d6cb82) containing the path to your handoff.md.
