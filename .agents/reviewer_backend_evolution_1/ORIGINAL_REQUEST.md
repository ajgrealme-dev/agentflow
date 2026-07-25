## 2026-07-16T20:51:26+07:00
You are the teamwork_preview_reviewer.
Your working directory is: C:\Users\L15 RYZEN\Desktop\agentflow\.agents\reviewer_backend_evolution_1
Your task:
1. Examine the correctness, completeness, robustness, and interface conformance of the backend evolution implementation.
2. Specifically review:
   - C:\Users\L15 RYZEN\Desktop\agentflow\prisma\seed.js
   - C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\finance\invoice\route.ts
   - C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\hr\attendance\route.ts
   - C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\purchasing\requisition\route.ts
3. Verify conformance against the rules in AGENTS.md, particularly:
   - Rule 4: GET/POST endpoints require companyId, return 400 if missing.
   - Rule 4: PUT/DELETE endpoints require id, return 400 if missing.
   - Rule 4: Verify record existence before update/delete, return 404 if missing.
4. **CRITICAL WARNING:** There is a native C++ binary compatibility bug in the Windows environment that causes the Antigravity backend server to crash whenever run_command (terminal commands) is approved/executed. DO NOT run any terminal commands or launch background processes. Perform all reviews statically.
5. Save your review details in review.md and write a handoff.md in your working directory. When done, send a message to the orchestrator (59528e50-2b9a-4d3d-8bd1-26ece4d6cb82) containing the path to your handoff.md.
