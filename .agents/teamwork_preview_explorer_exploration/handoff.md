# Codebase Exploration & Security Analysis Report

This report presents a read-only investigation of the Next.js API endpoints, the Telegram bot codebase, and database interactions within the AgentFlow project.

---

## 1. Observation

### Next.js API Endpoints

#### A. `src/app/api/attendance/route.ts`
- **Fallback Leakage**: If `companyId` is not provided in query parameters, it falls back to the first company in the database.
  *Line 29-35:*
  ```typescript
  if (!companyId) {
    const first = await db.company.findFirst();
    if (!first) {
      return NextResponse.json({ success: true, records: [], stats: {} });
    }
    companyId = first.id;
  }
  ```
- **Authentication**: There is no authentication or authorization checking on the incoming request. Anyone can view attendance logs for any `companyId`.

#### B. `src/app/api/finance/route.ts`
- **Lack of Authorization**: It contains GET, PUT, and DELETE handlers, none of which require authorization or authentication.
- **Fallback Leakage**: GET uses the same `db.company.findFirst()` fallback as above when `companyId` is omitted.
- **Cross-Tenant Data Exposure/Modification**: The PUT and DELETE handlers manipulate transactions solely using the transaction `id` parameter provided by the client, without verifying that the transaction belongs to the user's company or checking caller identities.
  *Line 96-98:*
  ```typescript
  const updated = await db.financialReceipt.update({
    where: { id },
    data: { ... }
  });
  ```
  *Line 121-123:*
  ```typescript
  await db.financialReceipt.delete({
    where: { id },
  });
  ```
- **Database Schema Leaks**: In the catch blocks, the database error is directly serialized into the response, which could expose database details to the frontend:
  *Line 107-109:*
  ```typescript
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
  ```

#### C. `src/app/api/reports/route.ts`
- **Authentication**: There is no session check or JWT verification.
- **Data Exposure**: Fetches all `financialReceipt`, `lead`, `absensi`, and `approval` data for any `companyId` passed in query parameters, falling back to the first company ID if omitted.

#### D. `src/app/api/command/route.ts`
- **Endpoint Protection**: No token or authentication header is checked. It connects to the Google Gemini API to parse commands.
- **Rate-Limiting**: Missing rate limiting on a path that performs downstream LLM generation.
- **Return Code Design**: If an error is caught in the global catch block, the handler returns 200 OK with an error message instead of a 4xx or 5xx code.

#### E. `src/app/api/scraper/route.ts`
- **No Auth**: Unprotected POST endpoint that spawns a python scraper.
- **Process Spawn & OS Dependency**: The subprocess is spawned using a hardcoded Windows path to the Python executable, which will fail if deployed on Unix/Linux-based production servers.
  *Line 14-16:*
  ```typescript
  const scraperDir = path.resolve(process.cwd(), '..', 'job-scraper-bot');
  const pythonExe = path.join(scraperDir, '.venv', 'Scripts', 'python.exe');
  const scriptPath = path.join(scraperDir, 'scraper_runner.py');
  ```
- **Argument Injection Risk**: While `child_process.spawn` does not use a shell by default, the incoming request JSON parameters (`industry`, `location`, `keyword`, `limit`) are fed directly as command arguments without validation, which might trigger parser issues or inject parameters into Python's `argparse` module.
- **Double Promise Resolve on Timeout**: On timeout, `proc.kill()` is invoked and the promise is resolved. However, when the process terminates, the `close` handler triggers a second `resolve(...)` call on the same promise (which is a logic/readability issue as promise states are settled once).

---

### Telegram Bot Codebase

#### A. `bot/bot.js`
- **Authorization Bypass in Callbacks**: In the `callback_query` listener, the bot retrieves `currentChatId` from `message.chat.id` (which is the chat where the message was posted), but never validates if the person who actually clicked the button (`callbackQuery.from.id`) has the authority to approve/reject cuti or receipts.
  *Line 675-681:*
  ```javascript
  bot.on('callback_query', async (callbackQuery) => {
    const actionData = callbackQuery.data;
    const message = callbackQuery.message;
    const currentChatId = message.chat.id.toString();

    const parts = actionData.split(':');
    const action = parts[0];
  ```
- **Path Traversal in `/slip`**: The month (`bulan`) and year (`tahun`) inputs are extracted via space splitting and directly passed to `path.join`. There is no verification that these strings contain only valid alphanumeric values, allowing an attacker to traverse the directory tree using `../`.
  *Line 477-492:*
  ```javascript
  bot.on('text', async (msg) => {
    ...
    if (lower.startsWith('/slip')) {
      const parts = text.split(' ');
      ...
      const bulan = parts[1].trim();
      const tahun = parts[2] ? parts[2].trim() : '2026';
      ...
      const payslipFileName = `${emp.id}_${bulan}_${tahun}.pdf`;
      const payslipPath = path.join(PAYSLIP_DIR, payslipFileName);
  ```
- **Uncapped File Downloads**: In both the `photo` and `document` event listeners, the bot downloads files using the Telegram File API into a memory buffer before performing user authentication checks.
- **Missing `/cocokkan` Implementation**: The bot advertises a `/cocokkan` command on startup, but there is no handler in `bot.on('text')` to process it. It falls through to Gemini text analysis, categorizing it as "faq" or "obrolan".
- **Uncaught Command Handler Exceptions**: Several database query operations and IO operations (e.g. `fs.writeFileSync` in `/slip`) are not wrapped in a `try...catch` block. If they throw an error, it results in an unhandled promise rejection that can crash the bot process.

#### B. `bot/utils/gemini.js`
- **Forced JSON Parsing**: The `analyzeWithGemini` utility always cleans the LLM response and attempts to parse it as JSON.
  *Line 86-90:*
  ```javascript
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  return JSON.parse(cleaned);
  ```
  However, in `bot.js`, the `/faq` handler expects the Gemini output to be plain text:
  *Line 627-631:*
  ```javascript
  Pertanyaan Karyawan: "${text}"
  Jawab dalam Bahasa Indonesia yang baik dan profesional:`;

  const responseText = await analyzeWithGemini(faqPrompt, null, customApiKey);
  ```
  Because the output is raw Indonesian text, `JSON.parse` will throw a syntax error. The retry loop will then run through all fallback models, calling `fetch` on each model until it exhausts all of them, and then throws a final error. As a result, the FAQ Helpdesk is completely broken and rapidly depletes Gemini API quotas.

#### C. `bot/utils/db.js`
- **CSV Injection**: The `exportReceiptsToCSV` function manually constructs a CSV string. It replaces quotes in the description field, but fails to sanitize the `r.merchantName` and `uploader` fields, allowing potential CSV Injection (e.g. executing commands or tampering with spreadsheet formula execution if opened in Excel).
  *Line 237:*
  ```javascript
  csvContent += `"${r.id}","${dateStr}","${r.merchantName || '-'}","${r.totalAmount || 0}","${desc.replace(/"/g, '""')}","${uploader}"\n`;
  ```
- **Invalid Date Conversion**: In `parseDate(dateStr)`, if the string is split by `-` but contains non-integers, `parseInt` returns `NaN`. `new Date(NaN, NaN, NaN)` creates an `Invalid Date` object, which is then sent to Prisma `create` in `saveInvoiceReceipt`. This results in a database write rejection, throwing an unhandled exception inside the bot's `callback_query` listener and crashing the bot.

---

## 2. Logic Chain

1. **Broken Access Control on API Routes**:
   - *Observation*: API endpoints do not require authorization headers and perform fallback lookups if `companyId` is not sent.
   - *Inference*: A malicious actor can view, alter, or delete database records belonging to any company by guessing/providing UUID parameters.

2. **Broken Telegram Approval Security**:
   - *Observation*: The callback query handler extracts data parameters (employee ID, duration, and requester chat ID) but does not compare `callbackQuery.from.id` against authorized supervisor/admin IDs.
   - *Inference*: Any user (even an unregistered guest or another company's employee) who knows the inline button `callback_data` format can approve cuti or receipts.

3. **Arbitrary File Access via Path Traversal**:
   - *Observation*: The `/slip` command handler does not restrict or sanitize relative directory characters in the month and year arguments before constructing `payslipPath`.
   - *Inference*: Users can read arbitrary files on the hosting system that match the suffix format or write files outside of the `data/payslips/` directory.

4. **Quotas Depletion & FAQ Crashing**:
   - *Observation*: The `/faq` handler calls `analyzeWithGemini` requesting a conversational answer. However, `analyzeWithGemini` systematically runs `JSON.parse(cleaned)`.
   - *Inference*: The JSON parser will always throw on non-JSON chatbot replies. The loop will retry all models, exhausting the API key, and then reject with an error. The user will never receive a response to their FAQ.

---

## 3. Caveats

- **External Scraper Code**: The file `C:\Users\L15 RYZEN\Desktop\job-scraper-bot\scraper_runner.py` was inspected. The scraper queries Bing search pages and extracts details using `requests` with disabled SSL verification (`verify=False`). We did not test real-time scraping outputs since it depends on active network requests which are blocked in the current environment.
- **Prisma Schema Constraints**: The SQLite database `dev.db` was noticed in the folder directory, although the Prisma schema lists `provider = "postgresql"`. It is assumed that PostgreSQL is used in production.

---

## 4. Conclusion

The AgentFlow Next.js APIs and Telegram Bot exhibit critical security and operational vulnerabilities that must be resolved before deployment:

| Category | Vulnerability | Severity | Target File | Impact |
| --- | --- | --- | --- | --- |
| Authorization | Lack of Callback Validation | Critical | `bot/bot.js` | Anyone can approve/reject leaves or invoices. |
| Access Control | Unauthenticated Tenant APIs | High | `src/app/api/...` | Cross-tenant data leak, unauthorized writes/deletes. |
| Security | Path Traversal | High | `bot/bot.js` | Arbitrary file access and write options. |
| Logic Bug | JSON Parse Failure in FAQ | High | `bot/utils/gemini.js` | FAQ feature completely broken, wastes Gemini API quotas. |
| Stability | Unhandled Promise Rejections | Medium | `bot/bot.js` | Uncaught DB/IO errors crash the bot process. |
| Compliance | Platform Dependency | Medium | `src/app/api/scraper/route.ts` | Server crashes on Linux/Mac hosts. |
| Security | CSV Injection | Low | `bot/utils/db.js` | Formula execution vulnerability in CSV downloads. |

---

## 5. Verification Method

To verify these issues independently:

1. **Verify API Access Control**:
   Send a GET request to `http://localhost:3000/api/attendance?companyId=<target-company-id>` without any authentication headers and confirm that the API returns the company's full attendance history.

2. **Verify Path Traversal**:
   Trigger `/slip ../../.env` or `/slip ../../../package.json` in the Telegram Bot and check if the bot sends back/attempts to read files from outside the payslips folder.

3. **Verify FAQ JSON Parsing Bug**:
   Send a text message like `Tanya baju seragam` to the bot. Confirm that it logs multiple `[Gemini Fallback]` warnings in the terminal (as it cycles through all models) before responding with a crash message.

4. **Verify Callback Query Click**:
   Send a callback query message to the bot simulating a supervisor click (e.g. `div_app:some-employee-id:5:some-requester-chat-id`) from an unauthorized account, and check if the database approval record changes to `APPROVED`.
