## 2026-07-16T13:49:16Z
You are the teamwork_preview_worker.
Your working directory is: C:\Users\L15 RYZEN\Desktop\agentflow\.agents\worker_backend_evolution
Your task:
1. Update C:\Users\L15 RYZEN\Desktop\agentflow\prisma\seed.js to:
   - Clean up existing records for new models: Invoice, SalesOrder, PurchaseRequisition before seeding.
   - Seed Company with officeLatitude = -6.1175, officeLongitude = 106.1502, officeRadius = 100.0.
   - Seed Users (owner, supervisor, staff, staffSales) with phone, contractStart, and contractEnd fields.
   - Seed Mock Invoice (RECEIVABLE/PAYABLE), Mock SalesOrder, and PurchaseRequisition records.
   - Follow the detailed implementation plan in C:\Users\L15 RYZEN\Desktop\agentflow\implementation_plan.md.
2. Scaffold API route handlers for Finance, HR, and Purchasing. Create the following Next.js App Router API endpoints in TypeScript:
   - C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\finance\invoice\route.ts
   - C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\hr\attendance\route.ts
   - C:\Users\L15 RYZEN\Desktop\agentflow\src\app\api\purchasing\requisition\route.ts
   Ensure you strictly follow AGENTS.md rules, especially:
   - Rule 4: If mandatory parameters (e.g. companyId for GET/POST, id for PUT/DELETE) are missing, immediately return HTTP 400.
   - Rule 4: Always check database record existence and return 404 if not found before update/delete operations.
   - Rule 1: DO NOT RUN TERMINAL COMMANDS (run_command) since it crashes the backend. Do not try to run any terminal commands.
3. Write your handoff.md in your working directory summarizing the modifications and additions.
When done, send a message to the orchestrator (59528e50-2b9a-4d3d-8bd1-26ece4d6cb82) containing the path to your handoff.md.
