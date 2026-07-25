## 2026-07-13T12:54:52Z
You are the developer/worker for the Next.js API endpoints and Telegram bot.
Your working directory is: C:\Users\L15 RYZEN\Desktop\agentflow\.agents\teamwork_preview_worker_implementation
Workspace Root: C:\Users\L15 RYZEN\Desktop\agentflow

Tasks to perform:

1. Create a Next.js API test runner and automated test suite in C:\Users\L15 RYZEN\Desktop\agentflow\test_api.js:
   - Must validate API endpoints: /api/finance, /api/attendance, /api/reports, /api/scraper, /api/command.
   - Use Node.js native fetch and Prisma client (imported from src/lib/db or initialized inline using DATABASE_URL) to query real records dynamically (e.g. dynamically get a valid companyId, financialReceipt id, etc. to run valid tests, and run empty/invalid inputs for invalid tests).
   - Verify that all endpoints return correct status codes (e.g. 200 for valid, 400 for missing/invalid input, 404 for not found, 500 for internal errors) and expected JSON payload structure.
   - Print a clean, formatted report in the terminal with "100% Passed" when all tests pass.
   - Ensure the test suite itself is self-contained and runs with exit code 0 on success, 1 on failure.

2. Audit and fix the following bugs/edge-cases in the Next.js API endpoints:
   - src/app/api/attendance/route.ts, src/app/api/finance/route.ts, src/app/api/reports/route.ts:
     * Remove the unsafe fallback behavior that queries the first company in the database when companyId is missing. Instead, return a 400 Bad Request with a clear message: "companyId is required".
     * For PUT and DELETE in src/app/api/finance/route.ts: verify if the transaction ID exists. If not found, return 404 Not Found instead of letting Prisma query throw database errors.
   - src/app/api/command/route.ts:
     * In the global catch block, return a 500 status code with the error instead of returning 200 OK with an error reply.
     * Validate that `message` is present in the payload (400 if missing).
   - src/app/api/scraper/route.ts:
     * Make the Python process spawner cross-platform (check process.platform: if win32 use .venv/Scripts/python.exe, else .venv/bin/python).
     * Fix the promise resolution logic to avoid resolving multiple times (e.g., ensure it doesn't resolve in both timeout and process close handlers).
     * Validate input payload parameters (industry, location, keyword, limit) to ensure they are valid and prevent arguments/parameters command injection risks.

3. Audit and fix the Telegram bot code:
   - bot/utils/gemini.js:
     * Fix the JSON parsing bug in `analyzeWithGemini`. If `JSON.parse(cleaned)` throws an error, return the raw `cleaned` text instead of looping through all models and failing. This is crucial for /faq (which expects raw text response).
   - bot/bot.js:
     * In the callback_query handler, ensure callback query is authenticated by verifying that the clicking user (callbackQuery.from.id) is authorized (e.g. comparing it to the supervisor/admin ID, or validating their role/authority).
     * Fix path traversal vulnerability in the `/slip` command: validate the month (bulan) and year (tahun) input arguments, ensuring they only contain safe alphanumeric characters (no `/`, `\`, `..`, etc.).
     * Add try-catch blocks to all command handlers, callbacks, and database queries in bot.js to prevent unhandled promise rejections or database errors from crashing the bot process.
     * In bot.js, conditionally disable real Telegram polling if process.env.NODE_ENV === 'test' so we can run mock resilience tests in-memory.
   - bot/utils/db.js:
     * Fix CSV injection vulnerability in `exportReceiptsToCSV`: sanitize all fields (like merchantName, description, uploader) to prevent formula execution (i.e. escape leading '=', '+', '-', '@' characters).
     * Fix date parsing in `parseDate`: handle invalid formats gracefully to avoid throwing unhandled database errors during save.

4. Create bot resilience test suite in C:\Users\L15 RYZEN\Desktop\agentflow\bot\test_bot_resilience.js:
   - Under process.env.NODE_ENV === 'test', load bot.js and trigger mock events on the bot:
     * Send spam messages.
     * Send invalid file types (photos/documents with missing parameters).
     * Send messages from unauthorized chat IDs.
     * Send path traversal slips.
     * Send unauthorized callback queries.
   - Assert that the bot processes all inputs gracefully without crashing (0 crashes, no exits).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When complete, write a detailed handoff report in C:\Users\L15 RYZEN\Desktop\agentflow\.agents\teamwork_preview_worker_implementation\handoff.md with all modifications made, test command instructions, and results. Then send a message back to the orchestrator (conversation ID: c75ca908-24a7-4af3-a2f2-6ede14004e59) claiming completion.
