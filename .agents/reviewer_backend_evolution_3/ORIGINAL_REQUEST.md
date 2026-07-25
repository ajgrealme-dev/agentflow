## 2026-07-16T21:02:53+07:00
You are the teamwork_preview_reviewer.
Your working directory is: C:\Users\L15 RYZEN\Desktop\agentflow\.agents\reviewer_backend_evolution_3
Your task:
1. Examine the correctness, completeness, robustness, and interface conformance of the hardened backend evolution implementation.
2. Verify that the changes in:
   - C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\finance\invoice\route.ts
   - C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\hr\attendance\route.ts
   - C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\purchasing\requisition\route.ts
   properly handle and validate all inputs (amount numeric validation, dueDate date format validation, geofencing coordinate parseFloat and range validation, requisition JSON try-catch syntax validation).
3. **CRITICAL WARNING:** There is a native C++ binary compatibility bug in the Windows environment that causes the Antigravity backend server to crash whenever run_command (terminal commands) is approved/executed. DO NOT run any terminal commands or launch background processes. Perform all reviews statically.
4. Save your review details in review.md and write a handoff.md in your working directory. When done, send a message to the orchestrator (59528e50-2b9a-4d3d-8bd1-26ece4d6cb82) containing the path to your handoff.md.
