const puppeteer = require('puppeteer');

async function main() {
  console.log("Meluncurkan browser...");
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log("Membuka login...");
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log("Mengisi kredensial...");
  await page.type('#username-input', 'Aziz Maulana');
  await page.type('#password-input', 'password');
  await page.click('#login-submit-btn');

  console.log("Menunggu redirect ke meja kerja...");
  await new Promise(resolve => setTimeout(resolve, 6000));

  const url = page.url();
  console.log(`URL saat ini: ${url}`);

  console.log("Mencari element node di canvas...");
  const nodeCount = await page.evaluate(() => {
    return document.querySelectorAll('.interactive-node').length;
  });
  
  console.log(`Ditemukan ${nodeCount} node karyawan AI di DOM!`);

  // Log teks dari node-node yang ditemukan jika ada
  if (nodeCount > 0) {
    const nodeTexts = await page.evaluate(() => {
      const elms = document.querySelectorAll('.interactive-node');
      return Array.from(elms).slice(0, 5).map(e => e.innerText.trim());
    });
    console.log("Sampel teks dari 5 node pertama:", nodeTexts);
  }

  await browser.close();
}

main().catch(console.error);
