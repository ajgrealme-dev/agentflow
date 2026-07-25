#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import { processInvoice } from './commands/invoice.js';
import { processCuti } from './commands/cuti.js';
import { processRekap } from './commands/rekap.js';
import { processEmails } from './commands/email.js';
import { processWebForm } from './commands/webform.js';

dotenv.config();

const program = new Command();

program
  .name('agentflow')
  .description('Alat kerja otomatisasi admin perkantoran (CLI)')
  .version('1.0.0');

// Fitur 1: Invoice -> CSV
program
  .command('invoice')
  .description('Otomatisasi input dokumen keuangan ke Excel/CSV')
  .argument('<file>', 'Path ke file gambar atau PDF invoice')
  .action((file) => {
    processInvoice(file);
  });

// Fitur 2: Cuti -> CSV
program
  .command('cuti')
  .description('Manajemen cuti karyawan (teks otomatis mengurangi jatah cuti)')
  .argument('<prompt>', 'Perintah natural language, misal: "Budi cuti 2 hari untuk liburan"')
  .action((prompt) => {
    processCuti(prompt);
  });

// Fitur 3: Rekap Harian
program
  .command('rekap')
  .description('Menggabungkan banyak file CSV menjadi satu laporan bersih')
  .argument('<folder>', 'Path ke folder berisi file-file CSV')
  .action((folder) => {
    processRekap(folder);
  });

// Fitur 4: Pengekstrak Email Masuk
program
  .command('fetch-emails')
  .description('Otomatis membaca email baru dan mengambil attachment penting')
  .action(() => {
    processEmails();
  });

// Fitur 5: Pengisi Web Form
program
  .command('fill-form')
  .description('Mengisi form di website secara otomatis berdasarkan data Excel')
  .argument('<file>', 'File CSV berisi data input')
  .argument('<url>', 'URL portal website HR/Keuangan')
  .action((file, url) => {
    processWebForm(file, url);
  });

program.parse(process.argv);
