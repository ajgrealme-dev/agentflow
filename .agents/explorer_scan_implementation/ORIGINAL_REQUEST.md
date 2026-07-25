## 2026-07-16T13:45:22Z
You are the teamwork_preview_explorer.
Your working directory is: C:\Users\L15 RYZEN\Desktop\agentflow\.agents\explorer_scan_implementation
Your task:
1. Scan the AgentFlow Enterprise codebase, in particular:
   - prisma/schema.prisma to understand the database models (Company, User, Mock Invoice, Mock SalesOrder, PurchaseRequisition, etc.)
   - src/ and app structure (Next.js App Router)
   - package.json to see scripts and dependencies
   - existing files in prisma/ and any existing seed scripts or mock files.
2. Determine if the database is running or what config/variables are in .env / .env.local.
3. Formulate a comprehensive plan to perform:
   - Database Migration: running background postgres/prisma (if database needs schema update)
   - Mock Data Seeding: creating/updating prisma/seed.ts or seed.js to seed:
     * Company (with officeLatitude, officeLongitude, officeRadius)
     * User (with phone, contractStart, contractEnd)
     * Mock Invoice
     * Mock SalesOrder
     * PurchaseRequisition
     Ensure package.json has a command for prisma seed that points to it, and runs successfully.
   - API Endpoints Scaffolding: Next.js App Router API route handlers for:
     * Finance: /api/finance/invoice
     * HR: /api/hr/attendance
     * Purchasing: /api/purchasing/requisition
     Make sure to implement these route handlers in compliance with AGENTS.md workspace rules (e.g. path traversal protection, valid checks, error handlers).
4. Draft the implementation_plan.md in the project root (C:\Users\L15 RYZEN\Desktop\agentflow\implementation_plan.md) with all files to create/modify, step-by-step migration, seeding, and scaffolding instructions.
5. Save your findings in analysis.md and write a handoff.md in your working directory.
When done, send a message to the orchestrator (59528e50-2b9a-4d3d-8bd1-26ece4d6cb82) containing the path to your handoff.md.
