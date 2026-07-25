## 2026-07-16T14:10:31Z
You are the teamwork_preview_reviewer.
Your working directory is: C:\Users\L15 RYZEN\Desktop\agentflow\.agents\reviewer_backend_evolution_6
Your task:
1. Perform the final independent review of correctness, completeness, robustness, and conformance of the backend evolution implementation.
2. Inspect validation blocks, error response codes (HTTP 400 Bad Request on malformed inputs/missing fields, HTTP 404 on missing records).
3. **CRITICAL WARNING:** There is a native C++ binary compatibility bug in the Windows environment that causes the Antigravity backend server to crash whenever run_command (terminal commands) is approved/executed. DO0 NOT run any terminal commands or launch background processes. Perform all reviews statically.
4. Save your review details in review.md and write a handoff.md in your working directory. When done, send a message to the orchestrator (59528e50-2b9a-4d3d-8bd1-26ece4d6cb82) containing the path to your handoff.md.
