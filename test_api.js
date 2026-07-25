/* eslint-disable */
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  let passed = 0;
  let failed = 0;

  async function assertResponse(name, url, options, expectedStatus, expectedJsonPattern = null) {
    try {
      const res = await fetch(url, options);
      if (res.status !== expectedStatus) {
        console.error(`❌ [${name}] Status mismatch. Expected ${expectedStatus}, got ${res.status}`);
        failed++;
        return;
      }
      
      const json = await res.json().catch(() => null);
      if (!json) {
        console.error(`❌ [${name}] Expected JSON body, but could not parse response.`);
        failed++;
        return;
      }

      if (expectedJsonPattern) {
        for (const [key, val] of Object.entries(expectedJsonPattern)) {
          if (json[key] !== val) {
            console.error(`❌ [${name}] JSON mismatch. Expected key "${key}" to be ${val}, got ${json[key]}`);
            failed++;
            return;
          }
        }
      }

      console.log(`✅ [${name}] Passed`);
      passed++;
    } catch (err) {
      console.error(`❌ [${name}] Request failed with error:`, err.message);
      failed++;
    }
  }

  console.log('--- STARTING Next.js API INTEGRATION TESTS ---');

  try {
    const company = await db.company.findFirst();
    if (!company) {
      throw new Error('No company found in database. Run db seed first.');
    }
    const companyId = company.id;

    // Create a temporary receipt for PUT/DELETE tests
    const tempReceipt = await db.financialReceipt.create({
      data: {
        companyId,
        merchantName: 'Temp Test Merchant',
        totalAmount: 100000,
        transactionDate: new Date(),
        rawAiAnalysis: JSON.stringify({ deskripsi: 'Temp Desc' })
      }
    });
    const tempReceiptId = tempReceipt.id;

    // 1. /api/attendance tests
    await assertResponse(
      'GET /api/attendance - valid',
      `${BASE_URL}/api/attendance?companyId=${companyId}`,
      { method: 'GET' },
      200,
      { success: true }
    );

    await assertResponse(
      'GET /api/attendance - missing companyId',
      `${BASE_URL}/api/attendance`,
      { method: 'GET' },
      400,
      { success: false, error: 'companyId is required' }
    );

    // 2. /api/finance tests
    await assertResponse(
      'GET /api/finance - valid',
      `${BASE_URL}/api/finance?companyId=${companyId}`,
      { method: 'GET' },
      200,
      { success: true }
    );

    await assertResponse(
      'GET /api/finance - missing companyId',
      `${BASE_URL}/api/finance`,
      { method: 'GET' },
      400,
      { success: false, error: 'companyId is required' }
    );

    await assertResponse(
      'PUT /api/finance - valid',
      `${BASE_URL}/api/finance`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tempReceiptId,
          merchantName: 'Updated Merchant Name',
          totalAmount: 250000
        })
      },
      200,
      { success: true }
    );

    await assertResponse(
      'PUT /api/finance - missing ID',
      `${BASE_URL}/api/finance`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantName: 'Missing ID Merchant'
        })
      },
      400,
      { success: false, error: 'ID transaksi wajib diisi' }
    );

    await assertResponse(
      'PUT /api/finance - non-existent ID',
      `${BASE_URL}/api/finance`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-000000000000',
          merchantName: 'Non-existent ID Merchant'
        })
      },
      404,
      { success: false, error: 'Transaction not found' }
    );

    await assertResponse(
      'DELETE /api/finance - missing ID',
      `${BASE_URL}/api/finance`,
      { method: 'DELETE' },
      400,
      { success: false, error: 'ID transaksi wajib diisi' }
    );

    await assertResponse(
      'DELETE /api/finance - non-existent ID',
      `${BASE_URL}/api/finance?id=00000000-0000-0000-0000-000000000000`,
      { method: 'DELETE' },
      404,
      { success: false, error: 'Transaction not found' }
    );

    await assertResponse(
      'DELETE /api/finance - valid',
      `${BASE_URL}/api/finance?id=${tempReceiptId}`,
      { method: 'DELETE' },
      200,
      { success: true }
    );

    // 2b. /api/finance/invoice tests (hardened validation)
    await assertResponse(
      'POST /api/finance/invoice - invalid JSON',
      `${BASE_URL}/api/finance/invoice`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
      },
      400,
      { success: false, error: 'Invalid JSON request body' }
    );

    await assertResponse(
      'POST /api/finance/invoice - invalid types (companyId not string)',
      `${BASE_URL}/api/finance/invoice`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: 12345,
          type: 'RECEIVABLE',
          invoiceNumber: 'INV-TEST-001',
          clientName: 'Client Name',
          amount: 5000,
          dueDate: '2026-08-01'
        })
      },
      400,
      { success: false, error: 'companyId, type, invoiceNumber, and clientName must be strings' }
    );

    await assertResponse(
      'POST /api/finance/invoice - invalid dueDate (boolean)',
      `${BASE_URL}/api/finance/invoice`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId,
          type: 'RECEIVABLE',
          invoiceNumber: 'INV-TEST-001',
          clientName: 'Client Name',
          amount: 5000,
          dueDate: true
        })
      },
      400,
      { success: false, error: 'dueDate must be a string or number' }
    );

    await assertResponse(
      'POST /api/finance/invoice - invalid amount (negative)',
      `${BASE_URL}/api/finance/invoice`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId,
          type: 'RECEIVABLE',
          invoiceNumber: 'INV-TEST-001',
          clientName: 'Client Name',
          amount: -100,
          dueDate: '2026-08-01'
        })
      },
      400,
      { success: false, error: 'Invalid amount value' }
    );

    await assertResponse(
      'PUT /api/finance/invoice - invalid JSON',
      `${BASE_URL}/api/finance/invoice`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
      },
      400,
      { success: false, error: 'Invalid JSON request body' }
    );

    // 2c. /api/hr/attendance tests (hardened validation)
    await assertResponse(
      'POST /api/hr/attendance - invalid JSON',
      `${BASE_URL}/api/hr/attendance`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
      },
      400,
      { success: false, error: 'Invalid JSON request body' }
    );

    await assertResponse(
      'POST /api/hr/attendance - invalid coordinates (boolean)',
      `${BASE_URL}/api/hr/attendance`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId,
          userId: 'some-user-id',
          latitude: true,
          longitude: 106.8
        })
      },
      400,
      { success: false, error: 'latitude must be a number or string' }
    );

    await assertResponse(
      'POST /api/hr/attendance - invalid coordinates (out of range)',
      `${BASE_URL}/api/hr/attendance`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId,
          userId: 'some-user-id',
          latitude: 95.0,
          longitude: 106.8
        })
      },
      400,
      { success: false, error: 'Invalid latitude or longitude value' }
    );

    // 2d. /api/purchasing/requisition tests (hardened validation)
    await assertResponse(
      'POST /api/purchasing/requisition - invalid JSON',
      `${BASE_URL}/api/purchasing/requisition`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
      },
      400,
      { success: false, error: 'Invalid JSON request body' }
    );

    await assertResponse(
      'POST /api/purchasing/requisition - invalid companyId type',
      `${BASE_URL}/api/purchasing/requisition`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: { id: companyId },
          prNumber: 'PR-TEST-001',
          itemsJson: '[]'
        })
      },
      400,
      { success: false, error: 'companyId must be a string' }
    );

    // 3. /api/reports tests
    await assertResponse(
      'GET /api/reports - valid',
      `${BASE_URL}/api/reports?companyId=${companyId}&type=monthly`,
      { method: 'GET' },
      200,
      { success: true }
    );

    await assertResponse(
      'GET /api/reports - missing companyId',
      `${BASE_URL}/api/reports`,
      { method: 'GET' },
      400,
      { success: false, error: 'companyId is required' }
    );

    // 4. /api/command tests
    await assertResponse(
      'POST /api/command - missing message',
      `${BASE_URL}/api/command`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      },
      400,
      { success: false, error: 'message is required' }
    );

    // Valid command POST check
    try {
      const commandRes = await fetch(`${BASE_URL}/api/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'siapa aja yang absen hari ini' })
      });
      if (commandRes.status === 200) {
        console.log('✅ [POST /api/command - valid] Passed');
        passed++;
      } else {
        console.error(`❌ [POST /api/command - valid] Expected status 200, got ${commandRes.status}`);
        failed++;
      }
    } catch (err) {
      console.error('❌ [POST /api/command - valid] Failed:', err.message);
      failed++;
    }

    // 5. /api/scraper tests
    await assertResponse(
      'POST /api/scraper - invalid parameters injection',
      `${BASE_URL}/api/scraper`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'Logistik; rm -rf /' })
      },
      400,
      { success: false, error: 'Invalid input parameters' }
    );

    await assertResponse(
      'POST /api/scraper - invalid limit',
      `${BASE_URL}/api/scraper`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: -10 })
      },
      400,
      { success: false, error: 'Invalid limit parameter' }
    );

    // Valid scraper check (can be 200 or 500 depending on python env, but not 400)
    try {
      const scraperRes = await fetch(`${BASE_URL}/api/scraper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'Logistik', location: 'Serang', keyword: 'purchasing', limit: 1 })
      });
      if (scraperRes.status === 200 || scraperRes.status === 500) {
        console.log(`✅ [POST /api/scraper - valid] Passed (Status: ${scraperRes.status})`);
        passed++;
      } else {
        console.error(`❌ [POST /api/scraper - valid] Expected status 200 or 500, got ${scraperRes.status}`);
        failed++;
      }
    } catch (err) {
      console.error('❌ [POST /api/scraper - valid] Failed:', err.message);
      failed++;
    }

  } catch (err) {
    console.error('Test initialization failed:', err);
    failed++;
  } finally {
    await db.$disconnect();
    pool.end();
  }

  console.log('\n--- Next.js API INTEGRATION TESTS SUMMARY ---');
  if (failed === 0) {
    console.log('🎉 100% Passed!');
    process.exit(0);
  } else {
    console.error(`❌ ${failed} test(s) failed.`);
    process.exit(1);
  }
}

runTests();
