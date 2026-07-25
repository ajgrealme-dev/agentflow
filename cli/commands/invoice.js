import fs from 'fs';
import path from 'path';
import { callGemini } from '../utils/gemini.js';

export async function processInvoice(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`[-] File tidak ditemukan: ${filePath}`);
      return;
    }

    console.log(`[+] Menganalisis dokumen dengan Gemini AI...`);
    const prompt = `Ekstrak data keuangan dari dokumen ini.
Kembalikan HANYA format JSON berikut (tanpa markdown):
{
  "tanggal": "YYYY-MM-DD",
  "nomor_invoice": "STR",
  "vendor": "STR",
  "total": "NUMERIC_STRING_TANPA_TITIK_KOMA",
  "deskripsi": "STR"
}`;

    const data = await callGemini(prompt, filePath);
    console.log(`[+] Data berhasil diekstrak:`, data);

    const csvPath = path.resolve(process.cwd(), 'Rekap_Keuangan.csv');
    const isNewFile = !fs.existsSync(csvPath);
    
    let csvLine = '';
    if (isNewFile) {
      csvLine += 'Tanggal,No_Invoice,Vendor,Total,Deskripsi\n';
    }
    csvLine += `${data.tanggal},${data.nomor_invoice},"${data.vendor}",${data.total},"${data.deskripsi}"\n`;

    fs.appendFileSync(csvPath, csvLine);
    console.log(`[+] Berhasil ditambahkan ke: ${csvPath} ✅`);

  } catch (error) {
    console.error(`[-] Gagal memproses invoice:`, error.message);
  }
}
