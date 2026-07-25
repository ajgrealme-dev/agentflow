import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma };

// 1. Dapatkan user berdasarkan Telegram Chat ID
export async function getUserByTelegramChatId(chatId) {
  if (!chatId) return null;
  return prisma.user.findUnique({
    where: { telegramChatId: chatId.toString() },
    include: { company: true }
  });
}

// 2. Hubungkan Telegram Chat ID ke email yang terdaftar
export async function registerUserTelegram(email, telegramChatId) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (!user) {
    return { success: false, message: `Email "<b>${email}</b>" tidak terdaftar di sistem Web ERP.` };
  }

  if (user.telegramChatId) {
    if (user.telegramChatId === telegramChatId.toString()) {
      return { success: false, message: `Akun Telegram Anda sudah terhubung dengan email: <b>${email}</b>.` };
    }
    return { success: false, message: `Akun <b>${user.name}</b> sudah terhubung dengan Telegram lain.` };
  }

  // Periksa apakah Chat ID ini sudah dipakai oleh email lain
  const existing = await prisma.user.findUnique({
    where: { telegramChatId: telegramChatId.toString() }
  });
  if (existing) {
    return { success: false, message: `Akun Telegram ini sudah terhubung dengan user lain: <b>${existing.name}</b>.` };
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { telegramChatId: telegramChatId.toString() },
    include: { company: true }
  });

  await logAudit(telegramChatId, updated.companyId, 'Registrasi Telegram', updated.id, `Telegram ID dihubungkan ke email ${updated.email} (${updated.name})`);

  return { success: true, employee: {
    id: updated.id,
    nama: updated.name,
    divisi: updated.divisi || 'N/A',
    jatah_cuti_sisa: updated.jatahCutiSisa
  } };
}

// 3. Log Audit Trail
export async function logAudit(telegramChatId, companyId, action, targetId, details) {
  try {
    let user = null;
    if (telegramChatId) {
      user = await prisma.user.findUnique({
        where: { telegramChatId: telegramChatId.toString() }
      });
    }
    
    await prisma.auditLog.create({
      data: {
        companyId: companyId || user?.companyId || null,
        actorId: user?.id || telegramChatId?.toString() || 'System',
        action,
        targetId: targetId?.toString() || null,
        details
      }
    });
  } catch (err) {
    console.error('[logAudit Error]', err.message);
  }
}

// 4. Update Sisa Cuti Karyawan
export async function updateUserQuota(userId, daysToSubtract) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user) return null;
  const newQuota = Math.max(0, user.jatahCutiSisa - daysToSubtract);
  return prisma.user.update({
    where: { id: userId },
    data: { jatahCutiSisa: newQuota }
  });
}

// 5. Cek Otoritas Divisi Finance / Admin
export async function hasFinanceAuthority(chatId, adminChatId) {
  const isAdmin = (adminChatId && chatId.toString() === adminChatId.toString());
  if (isAdmin) return true;

  const user = await prisma.user.findUnique({
    where: { telegramChatId: chatId.toString() }
  });
  
  if (!user) return false;
  return user.role === 'OWNER' || user.role === 'SUPERVISOR' || user.divisi?.toLowerCase() === 'finance';
}

// 6. Mendapatkan Telegram Chat ID Atasan
export async function getSupervisorChatId(supervisorId, fallbackName, adminChatId) {
  if (!supervisorId) return { chatId: adminChatId, redirected: true, name: fallbackName };
  const supervisor = await prisma.user.findUnique({
    where: { id: supervisorId }
  });
  
  if (supervisor && supervisor.telegramChatId) {
    return { chatId: supervisor.telegramChatId, redirected: false };
  }
  return { chatId: adminChatId, redirected: true, name: supervisor?.name || fallbackName };
}

// 7. Simpan Transaksi Bon Tunggal (FinancialReceipt)
export async function saveInvoiceReceipt(receiptData, companyId, uploadedById) {
  return prisma.financialReceipt.create({
    data: {
      companyId,
      uploadedById,
      merchantName: receiptData.vendor,
      totalAmount: parseFloat(receiptData.total || 0),
      transactionDate: receiptData.tanggal ? parseDate(receiptData.tanggal) : new Date(),
      rawAiAnalysis: JSON.stringify(receiptData)
    }
  });
}

// 8. Simpan Laporan Harian (Banyak Transaksi Bon)
export async function saveDailyReportReceipts(transactions, companyId, uploadedById) {
  const created = [];
  for (const tx of transactions) {
    const rec = await prisma.financialReceipt.create({
      data: {
        companyId,
        uploadedById,
        merchantName: tx.vendor,
        totalAmount: parseFloat(tx.total || 0),
        transactionDate: tx.tanggal ? parseDate(tx.tanggal) : new Date(),
        rawAiAnalysis: JSON.stringify(tx)
      }
    });
    created.push(rec);
  }
  return created;
}

// 9. Simpan Pengajuan Cuti (Approval)
export async function createLeaveApproval(companyId, requesterId, days, reason) {
  return prisma.approval.create({
    data: {
      companyId,
      requesterId,
      type: 'LEAVE',
      details: JSON.stringify({
        durationDays: days,
        reason: reason
      }),
      status: 'PENDING'
    }
  });
}

// 10. Update Status Approval Cuti/Keuangan
export async function updateApprovalStatus(approvalId, approverId, status) {
  return prisma.approval.update({
    where: { id: approvalId },
    data: {
      approverId,
      status // APPROVED or REJECTED
    }
  });
}

// 11. Dapatkan Log Karyawan untuk Keperluan List
export async function getAllEmployees(companyId) {
  return prisma.user.findMany({
    where: { companyId },
    orderBy: { name: 'asc' }
  });
}

function sanitizeCsvField(val) {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    return `'${str}`;
  }
  return str;
}

// Helper: Parser tanggal format DD-MM-YYYY ke Objek Date JS
function parseDate(dateStr) {
  try {
    if (typeof dateStr !== 'string') return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[2]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[0]);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }
  } catch (err) {}
  return new Date();
}

// 12. Rekap Buku Besar Keuangan ke CSV (SaaS scope)
export async function exportReceiptsToCSV(companyId) {
  const DATA_DIR = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

  const receipts = await prisma.financialReceipt.findMany({
    where: { companyId },
    include: { uploadedBy: true },
    orderBy: { createdAt: 'desc' }
  });

  if (receipts.length === 0) return null;

  const csvPath = path.join(DATA_DIR, `Buku_Besar_${companyId}.csv`);
  let csvContent = 'ID,Tanggal Transaksi,Merchant/Vendor,Total,Keterangan,Diunggah Oleh\n';

  receipts.forEach(r => {
    const dateStr = r.transactionDate ? r.transactionDate.toLocaleDateString('id-ID') : '-';
    let detailObj = {};
    try {
      detailObj = JSON.parse(r.rawAiAnalysis || '{}');
    } catch (e) {}

    const desc = detailObj.deskripsi || '-';
    const uploader = r.uploadedBy ? r.uploadedBy.name : 'System';

    const sanitizedMerchant = sanitizeCsvField(r.merchantName || '-');
    const sanitizedDesc = sanitizeCsvField(desc);
    const sanitizedUploader = sanitizeCsvField(uploader);

    csvContent += `"${r.id}","${dateStr}","${sanitizedMerchant.replace(/"/g, '""')}","${r.totalAmount || 0}","${sanitizedDesc.replace(/"/g, '""')}","${sanitizedUploader.replace(/"/g, '""')}"\n`;
  });

  fs.writeFileSync(csvPath, csvContent, 'utf8');
  return csvPath;
}
