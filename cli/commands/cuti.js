import fs from 'fs';
import path from 'path';
import { callGemini } from '../utils/gemini.js';

export async function processCuti(promptTeks) {
  try {
    console.log(`[+] Menganalisis niat pengajuan cuti dengan Gemini AI...`);
    const prompt = `User berkata: "${promptTeks}".
Tugasmu adalah mengekstrak data cuti. 
Kembalikan HANYA format JSON berikut (tanpa markdown):
{
  "nama": "STR",
  "jumlah_hari": NUM,
  "alasan": "STR",
  "tanggal_mulai": "YYYY-MM-DD atau Tidak Disebut"
}`;

    const data = await callGemini(prompt);
    console.log(`[+] Data cuti terdeteksi:`, data);

    const dbPath = path.resolve(process.cwd(), 'Database_Cuti.csv');
    const isNewFile = !fs.existsSync(dbPath);
    
    let csvLine = '';
    if (isNewFile) {
      csvLine += 'Timestamp,Nama,Tanggal_Mulai,Jumlah_Hari,Alasan,Status\n';
    }
    const timestamp = new Date().toISOString();
    csvLine += `${timestamp},"${data.nama}",${data.tanggal_mulai},${data.jumlah_hari},"${data.alasan}",Disetujui\n`;

    fs.appendFileSync(dbPath, csvLine);
    console.log(`[+] Pengajuan cuti berhasil dicatat di: ${dbPath} ✅`);
    console.log(`[+] Sisa cuti ${data.nama} (simulasi) telah dikurangi ${data.jumlah_hari} hari.`);

  } catch (error) {
    console.error(`[-] Gagal memproses pengajuan cuti:`, error.message);
  }
}
