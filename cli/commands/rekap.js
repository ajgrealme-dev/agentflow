import fs from 'fs';
import path from 'path';

export async function processRekap(folderPath) {
  try {
    const fullPath = path.resolve(process.cwd(), folderPath);
    if (!fs.existsSync(fullPath) || !fs.lstatSync(fullPath).isDirectory()) {
      console.error(`[-] Folder tidak ditemukan: ${fullPath}`);
      return;
    }

    console.log(`[+] Mulai membaca file CSV di folder: ${folderPath}`);
    const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.csv'));

    if (files.length === 0) {
      console.log(`[-] Tidak ada file CSV di folder tersebut.`);
      return;
    }

    let mergedData = [];
    let header = '';

    files.forEach((file, index) => {
      const content = fs.readFileSync(path.join(fullPath, file), 'utf8');
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      if (index === 0 && lines.length > 0) {
        header = lines[0]; // Ambil header dari file pertama
      }
      
      // Ambil isi tanpa header
      const dataLines = lines.slice(1);
      mergedData.push(...dataLines);
    });

    // Cleaning data (Hapus duplikat sederhana)
    const uniqueData = [...new Set(mergedData)];

    const outputPath = path.resolve(process.cwd(), 'Laporan_Akhir_Clean.csv');
    fs.writeFileSync(outputPath, `${header}\n${uniqueData.join('\n')}\n`);

    console.log(`[+] Berhasil menggabungkan ${files.length} file CSV!`);
    console.log(`[+] Total baris bersih (tanpa duplikat): ${uniqueData.length}`);
    console.log(`[+] File output disimpan di: ${outputPath} ✅`);

  } catch (error) {
    console.error(`[-] Gagal melakukan rekap:`, error.message);
  }
}
