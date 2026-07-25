import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { analyzeWithGemini } from './utils/gemini.js';
import {
  prisma,
  getUserByTelegramChatId,
  registerUserTelegram,
  logAudit,
  updateUserQuota,
  hasFinanceAuthority,
  getSupervisorChatId,
  saveInvoiceReceipt,
  saveDailyReportReceipts,
  createLeaveApproval,
  updateApprovalStatus,
  getAllEmployees,
  exportReceiptsToCSV
} from './utils/db.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
if (!process.env.TELEGRAM_BOT_TOKEN) {
  dotenv.config();
}

const isTestEnv = process.env.NODE_ENV === 'test' || process.argv[1]?.includes('test_bot_resilience') || process.argv[1]?.includes('test_api');
const token = process.env.TELEGRAM_BOT_TOKEN || (isTestEnv ? '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11' : null);
const adminChatId = process.env.ADMIN_CHAT_ID;
const managerChatId = process.env.MANAGER_CHAT_ID || adminChatId;

if (!token) {
  console.error('\n[!] ERROR: TELEGRAM_BOT_TOKEN tidak ditemukan di file .env\n');
  process.exit(1);
}

console.log('[Database] Menggunakan PostgreSQL via Prisma Client...');

// Inisialisasi Bot
const bot = new TelegramBot(token, { polling: !isTestEnv });
console.log('✅ AgentFlow Telegram Bot (PostgreSQL Multi-Tenant) sedang berjalan!');

// Penyimpanan sementara untuk dialog edit & data rekonsiliasi
const pendingInvoices = new Map();
const pendingDailyReports = new Map();
const pendingMatches = new Map();
const userStates = new Map();

// Kordinat Pabrik (Contoh Kordinat)
const GEOLOCATION_PABRIK = { lat: -6.1558, lon: 106.2415 };
const MAX_RADIUS_ABSEN_METER = 500;

// Path Folder Data & Slip Gaji
const DATA_DIR = path.resolve(process.cwd(), 'data');
const PAYSLIP_DIR = path.join(DATA_DIR, 'payslips');
if (!fs.existsSync(PAYSLIP_DIR)) fs.mkdirSync(PAYSLIP_DIR, { recursive: true });

// Buat File Panduan Karyawan Otomatis untuk FAQ Helpdesk (Jika Belum Ada)
const handbookPath = path.join(DATA_DIR, 'panduan_karyawan.txt');
if (!fs.existsSync(handbookPath)) {
  const policies = `PANDUAN RESMI KARYAWAN PT INDAH KIAT SERANG:
1. CUTI TAHUNAN: Karyawan memiliki jatah 12 hari cuti setahun. Harus diajukan minimal 3 hari sebelum tanggal cuti lewat Telegram Bot ini.
2. JAM SHIFT KERJA:
   - Shift 1 (Pagi): Jam 07.00 - 15.00 WIB.
   - Shift 2 (Sore): Jam 15.00 - 23.00 WIB.
   - Shift 3 (Malam): Jam 23.00 - 07.00 WIB.
3. KETENTUAN SERAGAM PABRIK:
   - Hari Senin-Rabu: Seragam Kemeja Biru Pabrik, celana panjang hitam, safety shoes, dan Safety Helmet (Helm proyek).
   - Hari Kamis-Jumat: Kemeja Abu-Abu.
4. KLAIM KACAMATA BPJS KARYAWAN:
   - Perusahaan menanggung subsidi kacamata maksimal Rp 500.000 per tahun.
   - Syarat klaim: Kirim foto kwitansi asli dari Optik rekanan beserta surat rujukan BPJS ke HRD.
5. GAJIAN DAN REKENING:
   - Gajian dilakukan setiap tanggal 28 setiap bulannya melalui transfer Bank Mandiri.
   - Slip gaji bulanan bisa diunduh mandiri lewat bot ini menggunakan perintah /slip [bulan].`;
  fs.writeFileSync(handbookPath, policies, 'utf8');
}

// Kirim notifikasi ke admin bahwa bot menyala
if (adminChatId) {
  bot.sendMessage(adminChatId, '🤖 <b>AgentFlow SaaS Bot Aktif!</b>\n\nFitur-fitur multi-tenant siap:\n\n📸 <b>Dokumen Keuangan</b> — Foto/PDF/CSV\n🔄 <b>/cocokkan</b> — Audit Keuangan\n📊 <b>/rekap</b> — Unduh Buku Besar\n👥 <b>/karyawan</b> — Cek sisa cuti & hierarki\n🔑 <b>/register [Email]</b> — Hubungkan Telegram\n🏢 <b>Absen GPS</b> — Kirim Share Location dari HP\n💵 <b>/slip [bulan]</b> — Download Slip Gaji PDF\n📢 <b>/broadcast</b> — Pengumuman target', { parse_mode: 'HTML' }).catch((err) => {
    console.error('Gagal mengirim pesan startup ke admin:', err.message);
  });
}

// ─────────────────────────────────────────────
// ENTERPRISE APPROVAL HELPERS
// ─────────────────────────────────────────────

async function routeCutiToNextApprover(employeeId, days, requesterChatId, currentStep, message) {
  const emp = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!emp) return;

  let nextStep = null;
  let targetBossId = null;
  let targetBossName = null;

  if (currentStep === 'admin') {
    nextStep = 'shift';
    targetBossId = emp.kepalaShiftId;
    targetBossName = 'Kepala Shift';
  } else if (currentStep === 'shift') {
    nextStep = 'bagian';
    targetBossId = emp.kepalaBagianId;
    targetBossName = 'Kepala Bagian';
  } else if (currentStep === 'bagian') {
    nextStep = 'divisi';
    targetBossId = emp.kepalaDivisiId;
    targetBossName = 'Kepala Divisi (Final)';
  }

  if (nextStep && targetBossId) {
    const boss = await prisma.user.findUnique({ where: { id: targetBossId } });
    const bossName = boss ? boss.name : targetBossName;
    const { chatId, redirected } = await getSupervisorChatId(targetBossId, bossName, adminChatId);

    if (chatId) {
      const callbackAction = nextStep === 'divisi' ? 'div_app' : `${nextStep}_app`;
      const callbackReject = nextStep === 'divisi' ? 'div_rej' : `${nextStep}_rej`;

      const opts = {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Setujui', callback_data: `${callbackAction}:${employeeId}:${days}:${requesterChatId}` },
              { text: '❌ Tolak', callback_data: `${callbackReject}:${employeeId}:${days}:${requesterChatId}` }
            ]
          ]
        }
      };

      const redirectNotice = redirected ? `\n\n⚠️ <i>[Demo Mode] Diarahkan ke Admin karena ${bossName} belum mendaftarkan Telegram.</i>` : '';

      bot.sendMessage(
        chatId,
        `🔔 <b>[Persetujuan ${targetBossName}] Pengajuan Cuti</b>\n\n👤 Karyawan: <b>${emp.name}</b> (${emp.divisi || 'N/A'})\n📅 Durasi: <b>${days} Hari</b>\n📝 Alasan: <i>${message || 'Urusan keluarga'}</i>${redirectNotice}`,
        opts
      );
      return nextStep;
    }
  }

  await approveCutiFinal(employeeId, days, requesterChatId);
  return 'final';
}

async function approveCutiFinal(employeeId, days, requesterChatId) {
  const emp = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!emp) return;

  const newQuota = Math.max(0, emp.jatahCutiSisa - days);
  await prisma.user.update({
    where: { id: employeeId },
    data: { jatahCutiSisa: newQuota }
  });

  await prisma.approval.create({
    data: {
      companyId: emp.companyId,
      requesterId: employeeId,
      type: 'LEAVE',
      details: JSON.stringify({ durationDays: days, status: 'Final Approved' }),
      status: 'APPROVED'
    }
  });

  await logAudit(requesterChatId, emp.companyId, 'Persetujuan Cuti Final', employeeId, `Cuti ${days} hari disetujui final untuk ${emp.name}. Jatah baru: ${newQuota}`);

  bot.sendMessage(
    requesterChatId,
    `🎉 <b>Cuti Disetujui!</b> Pengajuan cuti Anda selama <b>${days} hari</b> telah <b>DISETUJUI FINAL</b> oleh Kepala Divisi.\n\nSisa jatah cuti: <b>${newQuota} Hari</b>.`,
    { parse_mode: 'HTML' }
  );

  if (requesterChatId.toString() !== adminChatId.toString()) {
    bot.sendMessage(adminChatId, `📢 Cuti <b>${emp.name}</b> (${days} hari) disetujui final oleh Kepala Divisi.`);
  }
}

// ─────────────────────────────────────────────
// PROSES DOKUMEN & REKONSILIASI
// ─────────────────────────────────────────────
async function handleIncomingDocument(chatId, fileBuffer, fileType) {
  const emp = await getUserByTelegramChatId(chatId);
  if (!emp) {
    return bot.sendMessage(chatId, `❌ <b>Akses Ditolak!</b>\n\nAkun Telegram Anda belum terdaftar. Silakan hubungkan Telegram Anda lewat perintah <code>/register [Email]</code>.`, { parse_mode: 'HTML' });
  }

  const hasAuth = await hasFinanceAuthority(chatId, adminChatId);
  if (!hasAuth) {
    return bot.sendMessage(chatId, `❌ <b>Akses Ditolak!</b>\n\nMaaf, hanya divisi <b>Finance</b> atau <b>Admin</b> yang diizinkan untuk mengunggah dokumen keuangan.`, { parse_mode: 'HTML' });
  }

  const statusMsg = await bot.sendMessage(chatId, `⏳ Menerima ${fileType}... Menganalisis dokumen...`);

  try {
    const classificationPrompt = `Analisis gambar/dokumen ini. Tentukan apakah ini:
(a) "bon" (struk belanja tunggal, invoice tunggal)
(b) "laporan" (rekap harian pengeluaran kas kecil dengan banyak transaksi)
Kembalikan HANYA format JSON (tanpa markdown):
{ "tipe": "bon" atau "laporan" }`;

    const customApiKey = emp.company?.geminiApiKey;
    const classification = await analyzeWithGemini(classificationPrompt, fileBuffer, customApiKey);
    const tipeDokumen = classification.tipe || 'bon';

    if (tipeDokumen === 'laporan') {
      await bot.editMessageText(`📋 Laporan Harian terdeteksi. Mengekstrak tabel transaksi... ⏳`, { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'HTML' });
      
      const reportPrompt = `Ekstrak daftar seluruh transaksi pengeluaran/pembelian dari laporan ini. Kembalikan HANYA JSON array berikut (tanpa markdown):\n[ { "tanggal": "DD-MM-YYYY", "nomor_invoice": "STR", "vendor": "STR", "total": "angka bulat", "deskripsi": "STR" } ]`;
      const transactions = await analyzeWithGemini(reportPrompt, fileBuffer, customApiKey);
      const repId = Date.now().toString();
      pendingDailyReports.set(repId, { transactions, requesterChatId: chatId, companyId: emp.companyId, userId: emp.id });
      await sendDailyReportConfirmation(chatId, repId, statusMsg.message_id);

    } else {
      await bot.editMessageText(`🧾 Bon Fisik Tunggal terdeteksi. Mengekstrak data tagihan... ⏳`, { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'HTML' });
      
      const invoicePrompt = `Ekstrak data keuangan dari tagihan ini. Kembalikan HANYA JSON:\n{ "tanggal": "DD-MM-YYYY", "nomor_invoice": "STR", "vendor": "STR", "total": "angka saja", "deskripsi": "STR" }`;
      const data = await analyzeWithGemini(invoicePrompt, fileBuffer, customApiKey);
      const invId = Date.now().toString();
      pendingInvoices.set(invId, {
        tanggal: data.tanggal,
        nomor_invoice: data.nomor_invoice,
        vendor: data.vendor,
        total: data.total,
        deskripsi: data.deskripsi,
        requesterChatId: chatId,
        companyId: emp.companyId,
        userId: emp.id
      });

      await sendInvoiceConfirmation(chatId, invId, statusMsg.message_id);
    }
  } catch (error) {
    console.error(error);
    bot.editMessageText(`❌ Gagal membaca dokumen: ${error.message}`, { chat_id: chatId, message_id: statusMsg.message_id });
  }
}

async function sendInvoiceConfirmation(chatId, invId, existingMessageId = null) {
  const data = pendingInvoices.get(invId);
  if (!data) return;
  const text = `🔍 <b>Hasil Ekstraksi AI (Konfirmasi Bon Fisik):</b>\n\n🏢 <b>Vendor:</b> ${data.vendor}\n📅 <b>Tanggal:</b> ${data.tanggal}\n🧾 <b>No. Invoice:</b> ${data.nomor_invoice}\n💰 <b>Total:</b> Rp ${parseInt(data.total || 0).toLocaleString('id-ID')}\n📝 <b>Keterangan:</b> ${data.deskripsi}\n\nApakah data bon di atas sudah benar?`;
  const opts = {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Simpan Ke Database', callback_data: `inv_app:${invId}` },
        { text: '✏️ Edit Data', callback_data: `inv_edt:${invId}` },
        { text: '❌ Batalkan', callback_data: `inv_rej:${invId}` }
      ]]
    }
  };

  if (existingMessageId) await bot.editMessageText(text, { chat_id: chatId, message_id: existingMessageId, ...opts });
  else await bot.sendMessage(chatId, text, opts);
}

async function sendDailyReportConfirmation(chatId, repId, existingMessageId = null) {
  const data = pendingDailyReports.get(repId);
  if (!data) return;
  let text = `🔍 <b>Hasil Ekstraksi AI (Konfirmasi Laporan Harian):</b>\n\n`;
  data.transactions.forEach((tx, idx) => {
    text += `${idx + 1}. <b>${tx.vendor}</b> | ${tx.tanggal} | Rp ${parseInt(tx.total || 0).toLocaleString('id-ID')}\n   Keterangan: <i>${tx.deskripsi}</i>\n\n`;
  });
  text += `Apakah seluruh data transaksi di atas sudah benar?`;
  const opts = {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Simpan Laporan', callback_data: `rep_app:${repId}` },
        { text: '✏️ Edit Laporan', callback_data: `rep_edt:${repId}` },
        { text: '❌ Batalkan', callback_data: `rep_rej:${repId}` }
      ]]
    }
  };
  if (existingMessageId) await bot.editMessageText(text, { chat_id: chatId, message_id: existingMessageId, ...opts });
  else await bot.sendMessage(chatId, text, opts);
}

// ─────────────────────────────────────────────
// HANDLERS (FOTO & DOKUMEN)
// ─────────────────────────────────────────────
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  try {
    const photo = msg.photo[msg.photo.length - 1];
    const fileInfo = await bot.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    await handleIncomingDocument(chatId, Buffer.from(arrayBuffer), 'Foto');
  } catch (err) {
    bot.sendMessage(chatId, `❌ Gagal memproses gambar: ${err.message}`);
  }
});

bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const doc = msg.document;

  try {
    const fileInfo = await bot.getFile(doc.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    if (doc.file_name.endsWith('.csv')) {
      const emp = await getUserByTelegramChatId(chatId);
      if (!emp) return bot.sendMessage(chatId, '❌ Anda belum terdaftar.');
      
      const hasAuth = await hasFinanceAuthority(chatId, adminChatId);
      if (!hasAuth) return bot.sendMessage(chatId, '❌ Anda tidak memiliki izin.');
      
      const statusMsg = await bot.sendMessage(chatId, '⚙️ Mengonversi file CSV Laporan Harian... ⏳');
      const csvText = fileBuffer.toString('utf8');
      const csvPrompt = `Ekstrak daftar transaksi dari file CSV ini. Kembalikan HANYA JSON array (tanpa markdown):\n${csvText}`;
      const customApiKey = emp.company?.geminiApiKey;
      const transactions = await analyzeWithGemini(csvPrompt, null, customApiKey);
      const repId = Date.now().toString();
      pendingDailyReports.set(repId, { transactions, requesterChatId: chatId, companyId: emp.companyId, userId: emp.id });
      await sendDailyReportConfirmation(chatId, repId, statusMsg.message_id);
      return;
    }

    if (doc.mime_type?.includes('pdf') || doc.mime_type?.includes('image')) {
      await handleIncomingDocument(chatId, fileBuffer, 'PDF');
    }
  } catch (err) {
    bot.sendMessage(chatId, `❌ Gagal memproses file: ${err.message}`);
  }
});

// Helper: Hitung Jarak Kordinat (Haversine Formula) untuk Absen GPS
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// ─────────────────────────────────────────────
// HANDLER 4: ABSENSI LOKASI GPS (LOCATION)
// ─────────────────────────────────────────────
bot.on('location', async (msg) => {
  const chatId = msg.chat.id.toString();
  const { latitude, longitude } = msg.location;

  try {
    const emp = await getUserByTelegramChatId(chatId);
    if (!emp) {
      return bot.sendMessage(chatId, '⚠️ <b>Absensi Ditolak!</b>\n\nAkun Telegram Anda belum terdaftar. Silakan registrasi terlebih dahulu menggunakan <code>/register [Email]</code>.', { parse_mode: 'HTML' });
    }

    const distance = getDistanceInMeters(latitude, longitude, GEOLOCATION_PABRIK.lat, GEOLOCATION_PABRIK.lon);
    const timestamp = new Date().toLocaleString('id-ID');

    if (distance <= MAX_RADIUS_ABSEN_METER) {
      await prisma.absensi.create({
        data: {
          companyId: emp.companyId,
          userId: emp.id,
          latitude,
          longitude,
          statusKehadiran: 'Hadir'
        }
      });
      await logAudit(chatId, emp.companyId, 'Absensi GPS Masuk', emp.id, `Absensi sukses. Jarak: ${Math.round(distance)}m`);
      
      bot.sendMessage(
        chatId,
        `✅ <b>Absensi Berhasil!</b>\n\n👤 Nama: <b>${emp.name}</b> (${emp.divisi || 'N/A'})\n⏰ Pukul: <b>${timestamp}</b>\n📍 Jarak: <b>${Math.round(distance)} meter</b> dari Pabrik\n\nKehadiran Anda hari ini telah dicatat dengan status: <b>HADIR</b>.`,
        { parse_mode: 'HTML' }
      );
    } else {
      await prisma.absensi.create({
        data: {
          companyId: emp.companyId,
          userId: emp.id,
          latitude,
          longitude,
          statusKehadiran: 'Ditolak (Luar Area)'
        }
      });
      await logAudit(chatId, emp.companyId, 'Absensi GPS Ditolak', emp.id, `Absen gagal. Jarak terlalu jauh: ${Math.round(distance)}m`);

      bot.sendMessage(
        chatId,
        `❌ <b>Absensi Ditolak!</b>\n\nJarak Anda: <b>${Math.round(distance)} meter</b> dari Pabrik.\n⚠️ Batas radius maksimal absensi adalah <b>${MAX_RADIUS_ABSEN_METER} meter</b>.\n\nSilakan lakukan absen ulang saat Anda sudah berada di dalam kawasan pabrik.`,
        { parse_mode: 'HTML' }
      );
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, `❌ Terjadi kesalahan absen: ${err.message}`);
  }
});

// ─────────────────────────────────────────────
// HANDLER 5: TEKS BEBAS (REGISTRASI, CUTI, FAQ, BROADCAST, SLIP)
// ─────────────────────────────────────────────
bot.on('text', async (msg) => {
  const chatId = msg.chat.id.toString();
  const text = msg.text ? msg.text.trim() : '';
  const lower = text.toLowerCase();

  try {
    // Mode Bypass Command Telegram bot API jika mengandung path commands
    if (lower.startsWith('/')) {
      // Jalankan parsing perintah
    } else if (userStates.has(chatId)) {
      // A. INTERSEPSI MODE EDIT (BON/LAPORAN)
      const stateObj = userStates.get(chatId);
      userStates.delete(chatId);
      
      const emp = await getUserByTelegramChatId(chatId);
      if (!emp) return;

      const statusMsg = await bot.sendMessage(chatId, '⚙️ Menerapkan koreksi Anda menggunakan AI... ⏳');

      try {
        const customApiKey = emp.company?.geminiApiKey;
        if (stateObj.state === 'waiting_for_session_directive') {
          const nextAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const apiUrl = `${nextAppUrl}/api/agents/session`;
          
          await bot.editMessageText('📤 Mengirimkan direktif Anda ke Next.js Agent Engine... ⏳', { chat_id: chatId, message_id: statusMsg.message_id });
          
          const patchRes = await fetch(apiUrl, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-company-id': emp.companyId
            },
            body: JSON.stringify({
              sessionId: stateObj.sessionId,
              userInput: text
            })
          });

          if (patchRes.ok) {
            await bot.editMessageText('✅ <b>Direktif Rapat Terkirim!</b> Sesi rapat koordinasi telah dilanjutkan kembali secara otonom.', { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'HTML' });
          } else {
            const errBody = await patchRes.text();
            throw new Error(errBody || 'HTTP error');
          }
          return;
        } else if (stateObj.state === 'waiting_for_invoice_edit') {
          const originalData = pendingInvoices.get(stateObj.invId);
          const prompt = `Data: ${JSON.stringify(originalData)}\nKoreksi: "${text}"\nKembalikan HANYA JSON perbaikan:\n{ "tanggal": "DD-MM-YYYY", "nomor_invoice": "STR", "vendor": "STR", "total": "angka", "deskripsi": "STR" }`;
          const updatedData = await analyzeWithGemini(prompt, null, customApiKey);
          pendingInvoices.set(stateObj.invId, { ...originalData, ...updatedData });
          await sendInvoiceConfirmation(chatId, stateObj.invId, statusMsg.message_id);
          
        } else if (stateObj.state === 'waiting_for_report_edit') {
          const originalData = pendingDailyReports.get(stateObj.repId);
          const prompt = `Transaksi: ${JSON.stringify(originalData.transactions)}\nKoreksi: "${text}"\nKembalikan HANYA JSON array perbaikan:\n[ { "tanggal": "DD-MM-YYYY", "nomor_invoice": "STR", "vendor": "STR", "total": "angka", "deskripsi": "STR" } ]`;
          const updatedTransactions = await analyzeWithGemini(prompt, null, customApiKey);
          pendingDailyReports.set(stateObj.repId, { ...originalData, transactions: updatedTransactions });
          await sendDailyReportConfirmation(chatId, stateObj.repId, statusMsg.message_id);
        }
        return;
      } catch (e) {
        bot.editMessageText('❌ Gagal perbaikan data.', { chat_id: chatId, message_id: statusMsg.message_id });
        return;
      }
    }

    // B. UTILITY COMMANDS

    // /start atau /help
    if (lower === '/start' || lower === '/help') {
      return bot.sendMessage(chatId,
        `🤖 <b>Halo! Saya AgentFlow SaaS ERP Bot.</b>\n\nSaya asisten keuangan, absensi & cuti perusahaan Anda.\n\n🔑 <b>/register [Email]</b> — Hubungkan Telegram ke akun Web ERP Anda\n🏢 <b>Absen GPS</b> — Kirim Share Location dari HP Anda\n💵 <b>/slip [bulan]</b> — Download Slip Gaji PDF privat\n📸 <b>Kirim Bon / Laporan Harian</b> — Deteksi dokumen & struk otomatis\n📊 <b>/rekap</b> — Unduh Buku Besar (Rekap Bulanan) CSV\n👥 <b>/karyawan</b> — Cek sisa cuti & atasan Anda\n\n<i>Powered by PostgreSQL & Gemini AI 🤖</i>`,
        { parse_mode: 'HTML' }
      );
    }

    // /register [Email]
    if (lower.startsWith('/register')) {
      const parts = text.split(' ');
      if (parts.length < 2) return bot.sendMessage(chatId, '⚠️ Format salah. Contoh: <code>/register budi@example.com</code>', { parse_mode: 'HTML' });
      const emailStr = parts.slice(1).join(' ').trim();
      const result = await registerUserTelegram(emailStr, chatId);
      if (result.success) {
        return bot.sendMessage(chatId, `🎉 <b>Registrasi Berhasil!</b>\n\nAkun Telegram Anda terhubung dengan email: <b>${emailStr}</b>\n👤 Nama: <b>${result.employee.nama}</b>\n🏢 Divisi: <b>${result.employee.divisi}</b>\n📊 Jatah Cuti Sisa: <b>${result.employee.jatah_cuti_sisa} Hari</b>`, { parse_mode: 'HTML' });
      } else {
        return bot.sendMessage(chatId, `❌ <b>Registrasi Gagal!</b>\n\n${result.message}`, { parse_mode: 'HTML' });
      }
    }

    // /slip [bulan] [tahun]
    if (lower.startsWith('/slip')) {
      const parts = text.split(' ');
      if (parts.length < 2) {
        return bot.sendMessage(chatId, '⚠️ Format salah. Contoh: <code>/slip Juni</code> atau <code>/slip Juni 2026</code>', { parse_mode: 'HTML' });
      }
      const bulan = parts[1].trim();
      const tahun = parts[2] ? parts[2].trim() : '2026';

      const safeRegex = /^[a-zA-Z0-9]+$/;
      if (!safeRegex.test(bulan) || !safeRegex.test(tahun)) {
        return bot.sendMessage(chatId, '❌ <b>Akses Ditolak!</b>\nParameter bulan atau tahun tidak valid.', { parse_mode: 'HTML' });
      }

      const emp = await getUserByTelegramChatId(chatId);
      if (!emp) {
        return bot.sendMessage(chatId, '❌ <b>Akses Ditolak!</b>\nAnda belum melakukan registrasi Telegram. Gunakan perintah <code>/register [Email]</code> terlebih dahulu.', { parse_mode: 'HTML' });
      }

      const payslipFileName = `${emp.id}_${bulan}_${tahun}.pdf`;
      const payslipPath = path.join(PAYSLIP_DIR, payslipFileName);

      // Verify path is within PAYSLIP_DIR
      const relativePath = path.relative(PAYSLIP_DIR, payslipPath);
      if (relativePath.includes('..') || path.isAbsolute(relativePath)) {
        return bot.sendMessage(chatId, '❌ <b>Akses Ditolak!</b>\nParameter tidak valid.', { parse_mode: 'HTML' });
      }

      if (!fs.existsSync(payslipPath)) {
        const mockContent = `SLIP GAJI BULANAN\n\nID Karyawan: ${emp.id}\nNama: ${emp.name}\nBulan: ${bulan} ${tahun}\n\nGaji Pokok: Rp 5.000.000\nBonus Operasional: Rp 500.000\nPotongan BPJS: -Rp 100.000\n\nTAKE HOME PAY FINAL: Rp 5.400.000\n\nStatus: LUNAS DIKIRIM OLEH FINANCE ✅`;
        fs.writeFileSync(payslipPath, mockContent, 'utf8');
      }

      await bot.sendMessage(chatId, `📁 Mengirimkan Slip Gaji Anda untuk periode <b>${bulan} ${tahun}</b>...`, { parse_mode: 'HTML' });
      await bot.sendDocument(chatId, payslipPath, { caption: `Slip Gaji ${emp.name} - Periode ${bulan} ${tahun}` });
      await logAudit(chatId, emp.companyId, 'Unduh Slip Gaji', emp.id, `Mengunduh slip gaji periode ${bulan} ${tahun}`);
      return;
    }

    // /broadcast [all/divisi] [target] [pesan]
    if (lower.startsWith('/broadcast')) {
      const emp = await getUserByTelegramChatId(chatId);
      if (!emp) return bot.sendMessage(chatId, '❌ Anda belum terdaftar.');

      const isAuth = await hasFinanceAuthority(chatId, adminChatId);
      const isHR = emp.divisi?.toLowerCase() === 'hrd';
      const isAdmin = (adminChatId && chatId === adminChatId.toString());

      if (!isAdmin && !isHR && !isAuth) {
        return bot.sendMessage(chatId, '❌ <b>Akses Ditolak!</b>\nHanya Admin Utama, divisi HRD, atau Finance yang diizinkan melakukan broadcast.', { parse_mode: 'HTML' });
      }

      const parts = text.split(' ');
      if (parts.length < 3) {
        return bot.sendMessage(chatId, '⚠️ Format salah.\n\nContoh:\n• <code>/broadcast all Rapat koordinasi jam 2</code>\n• <code>/broadcast divisi IT Info migrasi sistem</code>', { parse_mode: 'HTML' });
      }

      const targetType = parts[1].toLowerCase();
      let targets = [];
      let messageText = '';

      if (targetType === 'all') {
        targets = await prisma.user.findMany({
          where: { companyId: emp.companyId, telegramChatId: { not: null } }
        });
        messageText = parts.slice(2).join(' ');
      } else if (targetType === 'divisi') {
        const targetDivisi = parts[2];
        targets = await prisma.user.findMany({
          where: { companyId: emp.companyId, telegramChatId: { not: null }, divisi: { equals: targetDivisi, mode: 'insensitive' } }
        });
        messageText = parts.slice(3).join(' ');
      }

      if (targets.length === 0) {
        return bot.sendMessage(chatId, '❌ Tidak ada akun karyawan terdaftar yang memiliki Telegram untuk tujuan broadcast.');
      }

      let successCount = 0;
      for (const t of targets) {
        try {
          await bot.sendMessage(t.telegramChatId, `📢 <b>PENGUMUMAN RESMI PERUSAHAAN:</b>\n\n${messageText}`, { parse_mode: 'HTML' });
          successCount++;
        } catch (err) {
          console.warn(`Gagal kirim broadcast ke ${t.name}: ${err.message}`);
        }
      }

      await logAudit(chatId, emp.companyId, 'Broadcast Pengumuman', targetType, `Mengirim broadcast ke ${successCount} karyawan. Target: ${targetType}`);
      return bot.sendMessage(chatId, `✅ <b>Broadcast Selesai!</b>\n\nBerhasil mengirimkan pengumuman ke <b>${successCount} karyawan</b>.`, { parse_mode: 'HTML' });
    }

    // /rekap — Buku Besar Keuangan CSV
    if (lower === '/rekap') {
      const emp = await getUserByTelegramChatId(chatId);
      if (!emp) return bot.sendMessage(chatId, '❌ Anda belum terdaftar.');

      const hasAuth = await hasFinanceAuthority(chatId, adminChatId);
      if (!hasAuth) return bot.sendMessage(chatId, '❌ Akses ditolak.');
      
      bot.sendMessage(chatId, '📊 Mengekspor data rekap bulanan Buku Besar dari SQL... ⏳');
      const filePath = await exportReceiptsToCSV(emp.companyId);
      if (filePath) {
        await bot.sendDocument(chatId, filePath);
      } else {
        await bot.sendMessage(chatId, '❌ Buku besar pengeluaran perusahaan masih kosong.');
      }
      return;
    }

    // /karyawan
    if (lower === '/karyawan') {
      const emp = await getUserByTelegramChatId(chatId);
      if (!emp) return bot.sendMessage(chatId, '❌ Anda belum terdaftar.');

      const employees = await getAllEmployees(emp.companyId);
      let replyText = '👥 <b>Daftar Karyawan & Hierarki:</b>\n\n';
      for (const e of employees) {
        let bossName = '-';
        if (e.kepalaDivisiId) {
          const boss = await prisma.user.findUnique({ where: { id: e.kepalaDivisiId } });
          if (boss) bossName = boss.name;
        }
        replyText += `• <b>${e.name}</b> (${e.email})\n  Divisi: <b>${e.divisi || 'Staff'}</b> | Sisa Cuti: <b>${e.jatahCutiSisa} Hari</b>\n  Atasan Utama: <b>${bossName}</b>\n\n`;
      }
      return bot.sendMessage(chatId, replyText, { parse_mode: 'HTML' });
    }

    // C. DETEKSI CHAT BEBAS: PILIH ANTARA (PENGAJUAN CUTI) VS (FAQ HELPDESK)
    const statusMsg = await bot.sendMessage(chatId, '🤔 Menganalisis pesan Anda... ⏳');

    try {
      const emp = await getUserByTelegramChatId(chatId);
      if (!emp) {
        return bot.editMessageText(`⚠️ <b>Anda Belum Terdaftar!</b>\n\nSilakan hubungkan akun Telegram Anda terlebih dahulu menggunakan perintah:\n<code>/register [Email]</code>`, { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'HTML' });
      }

      // Tanya Gemini kategori pesan: pengajuan cuti, FAQ peraturan, atau obrolan biasa
      const classifierPrompt = `User berkata: "${text}"
  
  Klasifikasikan tipe kalimat ini:
  (a) "cuti" (Pengajuan/pencatatan cuti baru, misal: "Saya mau cuti 2 hari", "Dewi cuti sakit besok")
  (b) "faq" (Pertanyaan tentang aturan perusahaan, seragam, klaim kacamata BPJS, slip gaji, jam shift, tanggal gajian)
  (c) "obrolan" (Sapaan santai seperti halo, terima kasih, dll)
  
  Kembalikan HANYA format JSON (tanpa markdown):
  { "kategori": "cuti" atau "faq" atau "obrolan" }`;

      const customApiKey = emp.company?.geminiApiKey;
      const classification = await analyzeWithGemini(classifierPrompt, null, customApiKey);
      const kategori = classification.kategori || 'obrolan';

      if (kategori === 'faq') {
        await bot.editMessageText('📖 Membuka Panduan Resmi Karyawan... ⏳', { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'HTML' });
        
        const handbookText = fs.readFileSync(handbookPath, 'utf8');
        const faqPrompt = `Kamu adalah AI HR Helpdesk di perusahaan. Jawab pertanyaan karyawan dengan ramah, sopan, dan jelas berdasarkan panduan resmi berikut.
  Jika informasi tidak ada dalam panduan, jawab dengan sopan bahwa informasi tersebut belum terdaftar.
  
  [PANDUAN RESMI]
  ${handbookText}
  
  Pertanyaan Karyawan: "${text}"
  Jawab dalam Bahasa Indonesia yang baik dan profesional:`;

        const responseText = await analyzeWithGemini(faqPrompt, null, customApiKey);
        const finalReply = typeof responseText === 'string' ? responseText : responseText.raw_text || 'Maaf, saya tidak dapat merumuskan jawaban saat ini.';

        await bot.editMessageText(finalReply, { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'HTML' });

      } else if (kategori === 'cuti') {
        await bot.editMessageText('📝 Pengajuan cuti terdeteksi. Menganalisis detail pengajuan... ⏳', { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'HTML' });
        
        const cutiPrompt = `User berkata: "${text}"\nEkstrak data cuti. Kembalikan HANYA JSON:\n{ "nama": "nama karyawan (isi hanya jika disebut, jika tidak tulis Karyawan Mandiri)", "jumlah_hari": 0, "alasan": "alasan" }`;
        const data = await analyzeWithGemini(cutiPrompt, null, customApiKey);

        if (emp.jatahCutiSisa < data.jumlah_hari) {
          return bot.editMessageText(`❌ <b>Jatah Cuti Tidak Cukup!</b>\n\nJatah Anda: <b>${emp.jatahCutiSisa} Hari</b>\n⚠️ Mengajukan: <b>${data.jumlah_hari} Hari</b>`, { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'HTML' });
        }

        const opts = {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Lanjutkan ke Atasan', callback_data: `adm_app:${emp.id}:${data.jumlah_hari}:${chatId}` },
              { text: '❌ Tolak Pengajuan', callback_data: `adm_rej:${emp.id}:${data.jumlah_hari}:${chatId}` }
            ]]
          }
        };

        bot.sendMessage(
          adminChatId,
          `🔍 <b>[Review Admin] Pengajuan Cuti Berjenjang</b>\n\n👤 Karyawan: <b>${emp.name}</b> (${emp.divisi || 'N/A'})\n📅 Durasi: <b>${data.jumlah_hari} Hari</b>\n📝 Alasan: <i>${data.alasan}</i>\n\nApakah valid untuk diteruskan ke Kepala Shift?`,
          opts
        );

        bot.editMessageText(`⏳ <b>Pengajuan Terkirim!</b>\n\nSedang ditinjau oleh Admin untuk diteruskan ke jajaran atasan Anda.`, { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'HTML' });

      } else {
        bot.editMessageText(`🤖 Halo! Saya asisten pintar ERP.\n\nKetik pertanyaan Anda tentang peraturan perusahaan, atau ketik permohonan cuti (contoh: <i>"Saya mau cuti 2 hari mulai besok"</i>) untuk dibantu.`, { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'HTML' });
      }
    } catch (e) {
      console.error(e);
      bot.editMessageText(`❌ Terjadi kesalahan: ${e.message}`, { chat_id: chatId, message_id: statusMsg.message_id });
    }
  } catch (err) {
    console.error('[Text Handler Error]', err);
    try {
      await bot.sendMessage(chatId, `❌ Terjadi kesalahan: ${err.message}`);
    } catch {}
  }
});

// ─────────────────────────────────────────────
// CALLBACK QUERY HANDLER: PERSATUAN TOMBOL (ALL)
// ─────────────────────────────────────────────
bot.on('callback_query', async (callbackQuery) => {
  try {
    const actionData = callbackQuery.data;
    const message = callbackQuery.message;
    const currentChatId = message.chat.id.toString();

    const parts = actionData.split(':');
    const action = parts[0];

    // Auth verification: CLICKING user must be authorized
    const clickerChatId = callbackQuery.from.id.toString();
    const clicker = await getUserByTelegramChatId(clickerChatId);
    const isAdmin = (adminChatId && clickerChatId === adminChatId.toString());
    const isManager = (managerChatId && clickerChatId === managerChatId.toString());

    let isAuthorized = false;
    if (isAdmin || isManager) {
      isAuthorized = true;
    } else if (clicker) {
      if (action === 'sess_dir') {
        isAuthorized = true;
      } else if (action.startsWith('inv_') || action.startsWith('rep_') || action.startsWith('mtc_')) {
        isAuthorized = (clicker.role === 'OWNER' || clicker.role === 'SUPERVISOR' || clicker.divisi?.toLowerCase() === 'finance');
      } else if (action.startsWith('adm_')) {
        isAuthorized = (clicker.role === 'OWNER' || clicker.role === 'SUPERVISOR' || clicker.divisi?.toLowerCase() === 'hrd');
      } else {
        // Cuti approval steps: shift_, bagian_, div_
        const [empId] = parts.slice(1);
        const emp = await prisma.user.findUnique({ where: { id: empId } });
        if (emp) {
          if (action.startsWith('shift_')) {
            isAuthorized = (clicker.id === emp.kepalaShiftId);
          } else if (action.startsWith('bagian_')) {
            isAuthorized = (clicker.id === emp.kepalaBagianId);
          } else if (action.startsWith('div_')) {
            isAuthorized = (clicker.id === emp.kepalaDivisiId);
          }
        }
      }
    }

    if (!isAuthorized) {
      try {
        await bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Anda tidak memiliki wewenang untuk tindakan ini!', show_alert: true });
      } catch {}
      return;
    }

    // 0. SESS_DIR DIRECTIVE ACTION
    if (action === 'sess_dir') {
      const sessionId = parts[1];
      bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: currentChatId, message_id: message.message_id });
      userStates.set(currentChatId, { state: 'waiting_for_session_directive', sessionId });
      bot.sendMessage(currentChatId, `✍️ <b>Mode Input Direktif Rapat (AI):</b>\n\nSilakan ketik direktif atau tanggapan Anda untuk melanjutkan rapat ini:`, { parse_mode: 'HTML' });
      bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // 1. REKONSILIASI COMMIT SQL
    if (action === 'mtc_app' || action === 'mtc_rej') {
      const matchId = parts[1];
      const matchData = pendingMatches.get(matchId);
      bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: currentChatId, message_id: message.message_id });

      if (!matchData) {
        bot.answerCallbackQuery(callbackQuery.id);
        return bot.sendMessage(currentChatId, '❌ Sesi rekonsiliasi kedaluwarsa.');
      }

      if (action === 'mtc_app') {
        const cocok = matchData.cocok;
        for (const c of cocok) {
          await prisma.financialReceipt.create({
            data: {
              companyId: matchData.companyId,
              merchantName: c.laporan.vendor,
              totalAmount: parseFloat(c.laporan.total || 0),
              transactionDate: new Date(),
              rawAiAnalysis: JSON.stringify({ ...c.laporan, statusAudit: 'Cocok (Audit)' })
            }
          });
        }
        bot.editMessageText(`✅ <b>Audit Rekonsiliasi Selesai!</b>\n\nBerhasil memindahkan <b>${cocok.length} transaksi cocok</b> ke database master.`, { chat_id: currentChatId, message_id: message.message_id, parse_mode: 'HTML' });
      } else {
        bot.editMessageText('❌ Audit dibatalkan.', { chat_id: currentChatId, message_id: message.message_id });
      }

      pendingMatches.delete(matchId);
      bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // 2. KONFIRMASI LAPORAN HARIAN
    if (action === 'rep_app' || action === 'rep_rej' || action === 'rep_edt') {
      const repId = parts[1];
      const reportData = pendingDailyReports.get(repId);
      if (!reportData) {
        bot.answerCallbackQuery(callbackQuery.id);
        return bot.sendMessage(currentChatId, '❌ Sesi laporan harian kedaluwarsa.');
      }

      if (action === 'rep_edt') {
        bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: currentChatId, message_id: message.message_id });
        userStates.set(currentChatId, { state: 'waiting_for_report_edit', repId });
        bot.sendMessage(currentChatId, `✍️ <b>Mode Edit Laporan (AI):</b>\n\nKetik perbaikan Anda, misal: <i>"Kopi Kenangan ganti totalnya jadi 69300"</i>`);
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: currentChatId, message_id: message.message_id });

      if (action === 'rep_app') {
        await saveDailyReportReceipts(reportData.transactions, reportData.companyId, reportData.userId);
        bot.editMessageText(`✅ <b>Laporan Harian Tersimpan di Database!</b>\n\nTotal <b>${reportData.transactions.length} transaksi</b> siap dicocokkan.`, { chat_id: currentChatId, message_id: message.message_id, parse_mode: 'HTML' });
      } else {
        bot.editMessageText('❌ Input Laporan Harian dibatalkan.', { chat_id: currentChatId, message_id: message.message_id });
      }

      pendingDailyReports.delete(repId);
      bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // 3. KONFIRMASI BON TUNGGAL
    if (action === 'inv_app' || action === 'inv_rej' || action === 'inv_edt') {
      const invId = parts[1];
      const invoiceData = pendingInvoices.get(invId);
      if (!invoiceData) {
        bot.answerCallbackQuery(callbackQuery.id);
        return bot.sendMessage(currentChatId, '❌ Sesi bon kedaluwarsa.');
      }

      if (action === 'inv_edt') {
        bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: currentChatId, message_id: message.message_id });
        userStates.set(currentChatId, { state: 'waiting_for_invoice_edit', invId });
        bot.sendMessage(currentChatId, `✍️ <b>Mode Edit Bon (AI):</b>\n\nKetik perbaikan Anda, misal: <i>"vendornya ganti jadi PT Maju"</i>`);
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: currentChatId, message_id: message.message_id });

      if (action === 'inv_app') {
        await saveInvoiceReceipt(invoiceData, invoiceData.companyId, invoiceData.userId);
        bot.editMessageText(`✅ <b>Bon Tersimpan di Database!</b>\n\n💰 Total: Rp ${parseInt(invoiceData.total || 0).toLocaleString('id-ID')}\n📂 <i>Masuk ke laporan pengeluaran.</i>`, { chat_id: currentChatId, message_id: message.message_id, parse_mode: 'HTML' });
      } else {
        bot.editMessageText('❌ Input Bon dibatalkan.', { chat_id: currentChatId, message_id: message.message_id });
      }

      pendingInvoices.delete(invId);
      bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // 4. ALUR PERSETUJUAN CUTI 3-LANGKAH
    const [empId, daysStr, requesterChatId] = parts.slice(1);
    const days = parseInt(daysStr);
    const emp = await prisma.user.findUnique({ where: { id: empId } });

    if (!emp) {
      bot.answerCallbackQuery(callbackQuery.id);
      return bot.sendMessage(currentChatId, '❌ Karyawan tidak ditemukan.');
    }

    bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: currentChatId, message_id: message.message_id });

    if (action === 'adm_app') {
      bot.sendMessage(currentChatId, `✅ <b>Review Admin Selesai!</b> Meneruskan ke Kepala Shift...`);
      await routeCutiToNextApprover(empId, days, requesterChatId, 'admin');

    } else if (action === 'adm_rej') {
      bot.sendMessage(currentChatId, `❌ Anda menolak pengajuan cuti <b>${emp.name}</b>.`);
      bot.sendMessage(requesterChatId, `❌ <b>Pengajuan Cuti Ditolak!</b>\n\nDibatalkan oleh Admin.`, { parse_mode: 'HTML' });

    } else if (action === 'shift_app') {
      bot.sendMessage(currentChatId, `✅ <b>Persetujuan Kepala Shift Disetujui!</b> Meneruskan ke Kepala Bagian...`);
      await routeCutiToNextApprover(empId, days, requesterChatId, 'shift');

    } else if (action === 'shift_rej') {
      bot.sendMessage(currentChatId, `❌ Anda menolak pengajuan cuti <b>${emp.name}</b>.`);
      bot.sendMessage(requesterChatId, `❌ <b>Pengajuan Cuti Ditolak!</b>\n\nDibatalkan oleh Kepala Shift.`, { parse_mode: 'HTML' });

    } else if (action === 'bagian_app') {
      bot.sendMessage(currentChatId, `✅ <b>Persetujuan Kepala Bagian Disetujui!</b> Meneruskan ke Kepala Divisi...`);
      await routeCutiToNextApprover(empId, days, requesterChatId, 'bagian');

    } else if (action === 'bagian_rej') {
      bot.sendMessage(currentChatId, `❌ Anda menolak pengajuan cuti <b>${emp.name}</b>.`);
      bot.sendMessage(requesterChatId, `❌ <b>Pengajuan Cuti Ditolak!</b>\n\nDibatalkan oleh Kepala Bagian.`, { parse_mode: 'HTML' });

    } else if (action === 'div_app') {
      bot.sendMessage(currentChatId, `✅ <b>Persetujuan Final Selesai!</b> Anda menyetujui pengajuan cuti <b>${emp.name}</b>.`);
      await approveCutiFinal(empId, days, requesterChatId);

    } else if (action === 'div_rej') {
      bot.sendMessage(currentChatId, `❌ Anda menolak final pengajuan cuti <b>${emp.name}</b>.`);
      bot.sendMessage(requesterChatId, `❌ <b>Pengajuan Cuti Ditolak Final!</b>\n\nDibatalkan oleh Kepala Divisi.`, { parse_mode: 'HTML' });
    }

    bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error('[Callback Query Error]', err);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: `❌ Terjadi kesalahan: ${err.message}`, show_alert: true });
    } catch {}
  }
});

bot.on('polling_error', (error) => {
  console.error('[Polling Error]', error.message);
});

process.on('SIGINT', () => {
  console.log('\n[+] Bot dihentikan.');
  bot.stopPolling();
  process.exit(0);
});

export { bot };
