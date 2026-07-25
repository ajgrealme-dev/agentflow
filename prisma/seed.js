const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database dengan data demo lengkap & Parsing jobdesc.html...');

  // Clean up existing data
  await prisma.aIAgentStep.deleteMany();
  await prisma.aIAgentTask.deleteMany();
  await prisma.aIAgent.deleteMany();
  await prisma.purchaseRequisition.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.absensi.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.financialReceipt.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // 1. Create Company
  const company = await prisma.company.create({
    data: {
      name: 'Aziz Tech Automation',
      geminiApiKey: process.env.GEMINI_API_KEY || '',
      officeLatitude: -6.1175,
      officeLongitude: 106.1502,
      officeRadius: 100.0,
    },
  });

  // 2. Create Users (Human Supervisors)
  const owner = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Aziz Maulana',
      email: 'aziz@example.com',
      passwordHash: '$2b$10$EPf52dx.Rk4v67.E/R16.uQJ75pCgqQvIpxLhC3Uq.YtqD/pG5sWq',
      role: 'OWNER',
      telegramChatId: '7618497952',
      phone: '+6281298765432',
      contractStart: new Date('2025-01-01T00:00:00Z'),
      contractEnd: new Date('2027-12-31T23:59:59Z'),
      divisi: 'Manajemen',
      jatahCutiSisa: 12,
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Eko Supervisor',
      email: 'eko@example.com',
      passwordHash: '$2b$10$EPf52dx.Rk4v67.E/R16.uQJ75pCgqQvIpxLhC3Uq.YtqD/pG5sWq',
      role: 'SUPERVISOR',
      phone: '+6281234567890',
      contractStart: new Date('2025-06-01T00:00:00Z'),
      contractEnd: new Date('2026-06-01T00:00:00Z'),
      divisi: 'Finance',
      jatahCutiSisa: 12,
    },
  });

  const staff = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Budi Santoso',
      email: 'budi@example.com',
      passwordHash: '$2b$10$EPf52dx.Rk4v67.E/R16.uQJ75pCgqQvIpxLhC3Uq.YtqD/pG5sWq',
      role: 'STAFF',
      phone: '+6285678901234',
      contractStart: new Date('2025-01-01T00:00:00Z'),
      contractEnd: new Date('2026-01-01T00:00:00Z'),
      divisi: 'Finance',
      jatahCutiSisa: 10,
      kepalaShiftId: supervisor.id,
      kepalaBagianId: supervisor.id,
      kepalaDivisiId: owner.id,
    },
  });

  const staffSales = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Siti Rahayu',
      email: 'siti@example.com',
      passwordHash: '$2b$10$EPf52dx.Rk4v67.E/R16.uQJ75pCgqQvIpxLhC3Uq.YtqD/pG5sWq',
      role: 'STAFF',
      phone: '+6285789012345',
      contractStart: new Date('2025-02-01T00:00:00Z'),
      contractEnd: new Date('2026-02-01T00:00:00Z'),
      divisi: 'Sales',
      jatahCutiSisa: 12,
      kepalaShiftId: supervisor.id,
      kepalaBagianId: supervisor.id,
      kepalaDivisiId: owner.id,
    },
  });

  // 3. Inventory Items
  await prisma.inventoryItem.createMany({
    data: [
      { companyId: company.id, sku: 'BRG-001', name: 'Kertas A4 Sinar Dunia', quantity: 150, location: 'Rak A1' },
      { companyId: company.id, sku: 'BRG-002', name: 'Tinta Printer Epson L3110', quantity: 24, location: 'Rak B3' },
      { companyId: company.id, sku: 'BRG-003', name: 'Kardus Packing Polos', quantity: 500, location: 'Gudang Belakang' },
    ],
  });

  // 4. Financial Receipts
  await prisma.financialReceipt.createMany({
    data: [
      { companyId: company.id, merchantName: 'Indomaret Ciruas', totalAmount: 125000, transactionDate: new Date('2026-07-15T08:30:00Z'), uploadedById: staff.id },
      { companyId: company.id, merchantName: 'SPBU Pertamina Serang', totalAmount: 350000, transactionDate: new Date('2026-07-16T17:45:00Z'), uploadedById: staff.id },
      { companyId: company.id, merchantName: 'Toko Alat Tulis Jaya', totalAmount: 500000, transactionDate: new Date('2026-07-16T11:00:00Z'), uploadedById: staff.id },
      { companyId: company.id, merchantName: 'Solaria Mall Serang', totalAmount: 220000, transactionDate: new Date('2026-07-14T19:30:00Z'), uploadedById: staffSales.id },
      { companyId: company.id, merchantName: 'Grab Indonesia (Reimburse)', totalAmount: 85000, transactionDate: new Date('2026-07-15T14:15:00Z'), uploadedById: staffSales.id },
      { companyId: company.id, merchantName: 'Toko Buku Gramedia', totalAmount: 180000, transactionDate: new Date('2026-07-13T10:00:00Z'), uploadedById: staff.id },
      { companyId: company.id, merchantName: 'Kopi Kenangan Rest Area', totalAmount: 95000, transactionDate: new Date('2026-07-14T07:45:00Z'), uploadedById: staffSales.id },
      { companyId: company.id, merchantName: 'Alfamart Kramatwatu', totalAmount: 145000, transactionDate: new Date('2026-07-15T13:20:00Z'), uploadedById: staff.id },
      { companyId: company.id, merchantName: 'Bhinneka Mandiri (Atk)', totalAmount: 280000, transactionDate: new Date('2026-07-16T15:30:00Z'), uploadedById: staff.id },
    ],
  });

  // 5. Leads B2B (CRM)
  await prisma.lead.createMany({
    data: [
      { companyId: company.id, source: 'Upwork', title: 'Data Entry & Spreadsheet Specialist for Logistics Firm', companyName: 'LogiTrans USA', description: 'Looking for a virtual administrator who can input 200+ shipping manifests daily into a Google Sheet with 100% accuracy.', url: 'https://upwork.com/jobs/1', aiScore: 92, status: 'NEW' },
      { companyId: company.id, source: 'LinkedIn', title: 'B2B Supplier for Premium Pulp & Paper Products', companyName: 'Global Packaging Corp', description: 'Procurement manager post seeking new verified suppliers of kraft paper and corrugated boxes in Southeast Asia.', url: 'https://linkedin.com/feed/2', aiScore: 88, status: 'CONTACTED' },
      { companyId: company.id, source: 'Upwork', title: 'Automation Developer (Node.js & AI API Integration)', companyName: 'TechFlow Europe', description: 'Need an expert to build a Telegram Bot connected to OpenAI/Gemini to automate document sorting.', url: 'https://upwork.com/jobs/3', aiScore: 95, status: 'NEW' },
      { companyId: company.id, source: 'JobStreet', title: 'Warehouse Administrator (Serang Area)', companyName: 'PT Indah Logistik', description: 'Staff administrasi gudang bertugas mencatat barang keluar masuk, surat jalan, dan koordinasi pengiriman.', url: 'https://jobstreet.com/jobs/4', aiScore: 78, status: 'NEW' },
      { companyId: company.id, source: 'LinkedIn', title: 'Pulp Material Sourcing Manager', companyName: 'Asia Pulp Group', description: 'Looking to connect with raw pulp distributors for high-speed manufacturing plants.', url: 'https://linkedin.com/feed/5', aiScore: 84, status: 'NEW' },
    ],
  });

  // 6. Absensi Logs (GPS Geofencing)
  const absRecord = [
    { user: supervisor, status: 'Hadir', lat: -6.1176, lng: 106.1501 },
    { user: staff, status: 'Hadir', lat: -6.1174, lng: 106.1503 },
    { user: staffSales, status: 'Ditolak', lat: -6.1523, lng: 106.1842 },
  ];

  for (const a of absRecord) {
    const hoursAgo = Math.floor(Math.random() * 48) + 1;
    const time = new Date(); time.setHours(time.getHours() - hoursAgo);
    await prisma.absensi.create({
      data: {
        companyId: company.id,
        userId: a.user.id,
        latitude: a.lat,
        longitude: a.lng,
        statusKehadiran: a.status,
        createdAt: time,
      },
    });
  }

  // 7. Approvals
  await prisma.approval.createMany({
    data: [
      {
        companyId: company.id,
        requesterId: staff.id,
        type: 'LEAVE',
        details: JSON.stringify({ reason: 'Sakit flu berat', startDate: '2026-07-13', endDate: '2026-07-14', totalDays: 2 }),
        status: 'PENDING',
      },
      {
        companyId: company.id,
        requesterId: staffSales.id,
        type: 'PURCHASE',
        details: JSON.stringify({ item: 'Laptop Asus i5', price: 8500000, reason: 'Untuk kebutuhan presentasi klien' }),
        status: 'PENDING',
      },
      {
        companyId: company.id,
        requesterId: staff.id,
        approverId: owner.id,
        type: 'REIMBURSEMENT',
        details: JSON.stringify({ reason: 'Reimburse bensin kunjungan klien Cilegon', amount: 350000 }),
        status: 'APPROVED',
      },
    ],
  });

  // 8. Invoices (RECEIVABLE/PAYABLE)
  await prisma.invoice.createMany({
    data: [
      { companyId: company.id, type: 'RECEIVABLE', invoiceNumber: 'INV-2026-001', clientName: 'PT Global Distribusi', clientPhone: '+628122223333', amount: 15000000.0, dueDate: new Date('2026-08-01T00:00:00Z'), status: 'UNPAID' },
      { companyId: company.id, type: 'PAYABLE', invoiceNumber: 'INV-2026-002', clientName: 'CV Media Utama', clientPhone: '+628133334444', amount: 4500000.0, dueDate: new Date('2026-07-10T00:00:00Z'), status: 'OVERDUE' },
      { companyId: company.id, type: 'RECEIVABLE', invoiceNumber: 'INV-2026-003', clientName: 'PT Sentosa Abadi', clientPhone: '+628144445555', amount: 25000000.0, dueDate: new Date('2026-07-20T00:00:00Z'), status: 'PAID' }
    ]
  });

  // 9. Sales Orders & Purchase Requisitions
  const so1 = await prisma.salesOrder.create({
    data: {
      companyId: company.id,
      soNumber: 'SO-2026-001',
      customerName: 'PT Delta Steel',
      itemsJson: JSON.stringify([{ sku: 'BRG-001', name: 'Kertas A4 Sinar Dunia', qty: 20, price: 55000 }]),
      status: 'COMPLETED',
    }
  });

  const so2 = await prisma.salesOrder.create({
    data: {
      companyId: company.id,
      soNumber: 'SO-2026-002',
      customerName: 'PT Jaya Paper',
      itemsJson: JSON.stringify([
        { sku: 'BRG-001', name: 'Kertas A4 Sinar Dunia', qty: 10, price: 55000 },
        { sku: 'BRG-002', name: 'Tinta Printer Epson L3110', qty: 5, price: 95000 }
      ]),
      status: 'PENDING',
    }
  });

  await prisma.purchaseRequisition.createMany({
    data: [
      { companyId: company.id, prNumber: 'PR-2026-001', salesOrderId: null, itemsJson: JSON.stringify([{ name: 'Raw Pulp Material', qty: 500, unit: 'kg' }]), status: 'DRAFT' },
      { companyId: company.id, prNumber: 'PR-2026-002', salesOrderId: so2.id, itemsJson: JSON.stringify([{ name: 'Epson Printer Ink Refill', qty: 5, unit: 'pcs' }]), status: 'SENT_RFQ' }
    ]
  });

  // ── 10. PARSING & SEEDING ALL 142 AI AGENTS FROM jobdesc.html ──────────────────
  console.log('Parsing jobdesc.html dan men-seed seluruh Karyawan AI...');

  const htmlPath = path.join(__dirname, 'jobdesc.html');
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`File ${htmlPath} tidak ditemukan.`);
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);

  const agentsToInsert = [];
  const insertedNames = new Set();

  // Helper untuk menentukan divisi dari pilar kelas
  function getDivisiFromClass(className) {
    if (className.includes('cfo')) return 'FINANCE';
    if (className.includes('coo')) return 'PURCHASING';
    if (className.includes('cmo')) return 'MARKETING';
    if (className.includes('chro')) return 'HR';
    if (className.includes('cto')) return 'TECH';
    if (className.includes('legal')) return 'LEGAL';
    if (className.includes('cx')) return 'CUSTOMER';
    if (className.includes('strat')) return 'STRATEGY';
    return 'FINANCE';
  }

  // Helper untuk menentukan divisi dari dept ID
  function getDivisiFromDeptId(deptId) {
    if (/akun|pajak|treasury|audit/i.test(deptId)) return 'FINANCE';
    if (/prod|qaqc|pengadaan|logistik/i.test(deptId)) return 'PURCHASING';
    if (/digimkt|socmed|visual|brand/i.test(deptId)) return 'MARKETING';
    if (/ta|cb|lnd|hrops/i.test(deptId)) return 'HR';
    if (/infra|soc|uxui|bi/i.test(deptId)) return 'TECH';
    if (/corplegal|erm|aml/i.test(deptId)) return 'LEGAL';
    if (/cs|crm|ecom/i.test(deptId)) return 'CUSTOMER';
    if (/esg|corpstrat|dei/i.test(deptId)) return 'STRATEGY';
    return 'FINANCE';
  }

  // 10.1 Parse Chief Cards (.cc)
  $('.cc').each((i, el) => {
    const title = $(el).find('.ch-title').text().trim();
    const badge = $(el).find('.ch-badge').text().trim();
    const rep = $(el).find('.ch-rep').text().trim();
    const desc = $(el).find('.ch-desc').text().trim();

    const className = $(el).attr('class') || '';
    const divisi = getDivisiFromClass(className);

    // Tanggung Jawab
    const responsibilities = [];
    $(el).find('.sl').first().find('li').each((j, li) => {
      responsibilities.push($(li).text().trim());
    });

    // Alur Kerja
    const workflows = [];
    $(el).find('.sl').eq(1).find('li').each((j, li) => {
      workflows.push($(li).text().trim());
    });

    // Buat SOP Markdown terstruktur
    const sopMarkdown = `# SOP & Job Description: ${title}
**Level:** CHIEF
**Divisi:** ${divisi}
**Lapor ke:** ${rep}

## Deskripsi Posisi
${desc}

## Tanggung Jawab Utama
${responsibilities.map(r => `- ${r}`).join('\n')}

## Ritme / Alur Kerja Harian
${workflows.map(w => `- ${w}`).join('\n')}`;

    let name = `${title} (AI)`;
    if (!insertedNames.has(name)) {
      insertedNames.add(name);
      agentsToInsert.push({
        name,
        role: 'CHIEF',
        divisi,
        goal: desc.slice(0, 200),
        sopMarkdown,
        status: 'IDLE',
        tokenCostUSD: 0.0
      });
    }
  });

  // 10.2 Parse Department Role Cards (.rc)
  $('.db').each((i, dbEl) => {
    const deptId = $(dbEl).attr('id') || '';
    const deptName = $(dbEl).find('.dept-n').text().trim();
    const divisi = getDivisiFromDeptId(deptId);

    $(dbEl).find('.rc').each((j, rcEl) => {
      const level = ($(rcEl).attr('data-level') || 'staff').toUpperCase();
      const roleName = $(rcEl).find('.rt').text().trim();
      const rep = $(rcEl).find('.rr').text().trim();
      const desc = $(rcEl).find('.rd').text().trim();

      // Tanggung Jawab
      const responsibilities = [];
      $(rcEl).find('.rl').find('li').each((k, li) => {
        responsibilities.push($(li).text().trim());
      });

      // Alur Kerja
      const workflows = [];
      $(rcEl).find('.ws').each((k, wsEl) => {
        const stepNum = $(wsEl).find('.wn').text().trim();
        const stepText = $(wsEl).find('.wt').text().trim();
        workflows.push(`${stepNum}. ${stepText}`);
      });

      const sopMarkdown = `# SOP & Job Description: ${roleName}
**Level:** ${level}
**Departemen:** ${deptName}
**Divisi:** ${divisi}
**Lapor ke:** ${rep}

## Deskripsi Posisi
${desc}

## Tanggung Jawab Utama
${responsibilities.map(r => `- ${r}`).join('\n')}

## Ritme / Alur Kerja Harian
${workflows.map(w => `- ${w}`).join('\n')}`;

      // Amankan keunikan nama
      let name = `${roleName} (AI)`;
      if (insertedNames.has(name)) {
        name = `${roleName} - ${deptName} (AI)`;
      }

      if (!insertedNames.has(name)) {
        insertedNames.add(name);
        agentsToInsert.push({
          name,
          role: level,
          divisi,
          goal: desc.slice(0, 200),
          sopMarkdown,
          status: 'IDLE',
          tokenCostUSD: 0.0
        });
      }
    });
  });

  // Insert all agents into database
  for (const agent of agentsToInsert) {
    await prisma.aIAgent.create({ data: agent });
  }

  // ── OBSIDIAN VAULT SINKRONISASI AWAL (STARTUP SYNC) ────────────────
  try {
    const VAULT_ROOT = path.resolve(__dirname, '../obsidian-vault');
    console.log(`[Obsidian] Syncing ${agentsToInsert.length} AI Agents to Obsidian Vault...`);

    const cleanNameForLink = (name) => name.replace(/\(AI\)/g, '').trim().replace(/[\/:*?"<>|]/g, '');

    const safeWriteMarkdown = (subPath, content) => {
      const targetPath = path.resolve(VAULT_ROOT, subPath);
      const relative = path.relative(VAULT_ROOT, targetPath);
      if (relative.includes('..') || path.isAbsolute(relative)) {
        return;
      }
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(targetPath, content, 'utf8');
    };

    // 1. Sync Agents
    agentsToInsert.forEach(agent => {
      const cleanName = cleanNameForLink(agent.name);
      
      let laporKeLink = 'CEO / Owner (Aziz Maulana)';
      const match = agent.sopMarkdown?.match(/Lapor\s*ke:\s*(?:📌\s*Lapor\s*ke:\s*)?([^\n]+)/i);
      if (match) {
        laporKeLink = `[[${cleanNameForLink(match[1])}]]`;
      } else if (agent.role === 'CHIEF') {
        laporKeLink = `[[Aziz Maulana (Human)]]`;
      }

      const mdContent = `# AI Agent: ${cleanName}
**Level:** ${agent.role || 'STAFF'}
**Divisi:** ${agent.divisi || 'FINANCE'}
**Lapor ke:** ${laporKeLink}

## Sasaran Kerja (Goal)
${agent.goal || 'Tidak ada goal tertulis.'}

## Standard Operating Procedure (SOP)
${agent.sopMarkdown || 'Tidak ada SOP tertulis.'}

---
*Generated automatically by AgentFlow Enterprise on ${new Date().toLocaleDateString()}*
`;
      safeWriteMarkdown(`AI-Agents/${cleanName}.md`, mdContent);
    });

    // 2. CEO Profile
    const ceoContent = `# Aziz Maulana (Human)
**Level:** OWNER / CEO
**Divisi:** MANAJEMEN
**Lapor ke:** (Ultimate Owner)

## Sasaran Kerja
Pemilik perusahaan & pengawas utama seluruh operasional koloni AI Agent.

---
*Created on startup*
`;
    safeWriteMarkdown(`AI-Agents/Aziz Maulana (Human).md`, ceoContent);

    // 3. Generate Index
    const divisionBases = ['FINANCE', 'PURCHASING', 'MARKETING', 'HR', 'TECH', 'LEGAL', 'CUSTOMER', 'STRATEGY'];
    let indexContent = `# 🧠 AgentFlow Enterprise — Second Brain

Selamat datang di memori organisasi perusahaan Anda. Folder ini tersambung langsung dengan platform koordinasi Next.js AgentFlow.

## 🏢 Struktur Direktorat & Koloni AI Karyawan

`;

    divisionBases.forEach(div => {
      indexContent += `### 📂 Divisi ${div}\n`;
      const divAgents = agentsToInsert.filter(a => (a.divisi || 'FINANCE').toUpperCase() === div);
      
      const levels = ['CHIEF', 'MANAGER', 'SUPERVISOR', 'SENIOR', 'STAFF', 'INTERN'];
      levels.forEach(lv => {
        const lvAgents = divAgents.filter(a => (a.role || 'STAFF').toUpperCase() === lv);
        if (lvAgents.length > 0) {
          indexContent += `- **${lv}:**\n`;
          lvAgents.forEach(a => {
            indexContent += `  - [[${cleanNameForLink(a.name)}]]\n`;
          });
        }
      });
      indexContent += `\n`;
    });

    indexContent += `---
*Last Sync: ${new Date().toLocaleString()}*
`;
    safeWriteMarkdown('00-Index.md', indexContent);
    console.log(`[Obsidian] Vault synchronization successful.`);
  } catch (err) {
    console.error('[Obsidian] Failed to sync to vault during seed:', err);
  }

  console.log(`\n=========================================`);
  console.log(`\u2705 DATABASE SEEDING BERHASIL!`);
  console.log(`   🏢 Perusahaan : Aziz Tech Automation`);
  console.log(`   👥 Total Karyawan AI Ditambahkan: ${agentsToInsert.length} Karyawan (Dari jobdesc.html)`);
  console.log(`=========================================`);
}

main()
  .catch((e) => {
    console.error('Error saat seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
