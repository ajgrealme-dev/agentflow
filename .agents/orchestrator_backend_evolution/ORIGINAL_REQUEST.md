# Original User Request

## 2026-07-16T13:44:40Z

You are the Project Orchestrator for the AgentFlow Enterprise project.
Your identity:
- Archetype: orchestrator
- Working directory: C:\Users\L15 RYZEN\Desktop\agentflow\.agents\orchestrator_backend_evolution
- Parent: main agent

Your task is to execute the full backend evolution as detailed in the ORIGINAL_REQUEST.md:
1. Database Migration & Environment: Start the local Prisma development database (if not running) using `npx prisma dev` (in the background). Run the necessary Prisma commands (`npx prisma db push` or `npx prisma migrate dev`) to apply the schema changes in `prisma/schema.prisma` to the local PostgreSQL database.
2. Mock Data Seeding: Create a robust seed script (`prisma/seed.ts` or `seed.js`) to populate the database with mock data. It must seed Company (with officeLatitude, officeLongitude, officeRadius), User (with phone, contractStart, contractEnd), Mock Invoice, Mock SalesOrder, and PurchaseRequisition records. Ensure package.json seed command points to this script and run it.
3. API Endpoints Scaffolding: Create Next.js App Router API route handlers for Finance (`/api/finance/invoice`), HR (`/api/hr/attendance`), and Purchasing (`/api/purchasing/requisition`).

Note: If implementation_plan.md does not exist yet, you should first scan the codebase (using an explorer) to create/verify implementation_plan.md in the project root before executing.

Please decompose the tasks, create plan.md and progress.md in your working directory, and dispatch tasks to your specialists. Maintain progress updates in progress.md.
