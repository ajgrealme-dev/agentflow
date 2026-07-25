## 2026-07-16T14:10:31Z

You are the teamwork_preview_reviewer.
Your working directory is: C:\Users\L15 RYZEN\Desktop\agentflow\.agents\reviewer_backend_evolution_5
Your task:
1. Perform the final static review of the backend evolution implementation.
2. Verify that:
   - C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\finance\invoice\route.ts
   - C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\hr\attendance\route.ts
   - C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\purchasing\requisition\route.ts
   properly handle and validate all inputs (try-catch around JSON parsing, type validation on all variables, coordinate range checks, date null/boolean checks, empty salesOrderId gracefully converted to null).
3. **CRITICAL WARNING:** There is a native C++ binary compatibility bug in the Windows environment that causes the Antigravity backend server to crash whenever run_command (terminal commands) is approved/executed. DO NOT run any terminal commands or launch background processes. Perform all reviews statically.
4. Save your review details in review.md and write a handoff.md in your working directory. When done, send a message to the orchestrator (59528e50-2b9a-4d3d-8bd1-26ece4d6cb82) containing the path to your handoff.md.
