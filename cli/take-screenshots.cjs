const puppeteer = require('puppeteer');
const path = require('path');

async function main() {
  console.log("Meluncurkan headless browser Puppeteer...");
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER RUNTIME ERROR:', err.toString()));

  const artifactDir = "C:\\Users\\L15 RYZEN\\.gemini\\antigravity\\brain\\8056daad-9a3e-4980-9902-737d7f37d5d4";

  try {
    // 1. Login
    console.log("Membuka halaman login...");
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 15000 });
    console.log("Menunggu hidrasi React...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log("Memasukkan kredensial...");
    await page.type('#username-input', 'Aziz Maulana');
    await page.type('#password-input', 'password');
    await page.click('#login-submit-btn');
    console.log("Menunggu redirect ke Meja Kerja (Dark Mode)...");
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Klik node IT Infrastructure Manager (AI) untuk memicu detail card
    console.log("Mencari node IT Infrastructure Manager...");
    const nodeHandleDark = await page.evaluateHandle(() => {
      const spans = Array.from(document.querySelectorAll('.interactive-node span'));
      const match = spans.find(el => el.textContent.includes('IT Infrastructure Manager'));
      return match ? match.closest('.interactive-node') : null;
    });
    if (nodeHandleDark && nodeHandleDark.asElement()) {
      console.log("Mengklik node IT Infrastructure Manager (Dark Mode)...");
      await nodeHandleDark.asElement().click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // A. Ambil screenshot Dark Mode
    const workbenchDark = path.join(artifactDir, 'workbench_dark.png');
    console.log(`Mengambil screenshot Workbench (Dark) ke: ${workbenchDark}`);
    await page.screenshot({ path: workbenchDark });

    console.log("Navigasi ke Dashboard (Dark Mode)...");
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    const dashboardDark = path.join(artifactDir, 'dashboard_dark.png');
    console.log(`Mengambil screenshot Dashboard (Dark) ke: ${dashboardDark}`);
    await page.screenshot({ path: dashboardDark });

    // B. Alihkan ke Light Mode & Ambil screenshot Light Mode
    console.log("Mengubah tema ke Light Mode...");
    const toggleSelector = 'button[title="Switch to Light Mode"]';
    await page.waitForSelector(toggleSelector, { timeout: 5000 });
    await page.click(toggleSelector);
    console.log("Menunggu render ulang tema Light Mode... (3 detik)");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Ambil screenshot Dashboard (Light Mode)
    const dashboardLight = path.join(artifactDir, 'dashboard_light.png');
    console.log(`Mengambil screenshot Dashboard (Light) ke: ${dashboardLight}`);
    await page.screenshot({ path: dashboardLight });
    await page.screenshot({ path: path.join(artifactDir, 'dashboard.png') });

    console.log("Navigasi kembali ke Meja Kerja (Light Mode)...");
    await page.goto('http://localhost:3000/workbench', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Klik node IT Infrastructure Manager (AI) untuk memicu detail card
    console.log("Mencari node IT Infrastructure Manager...");
    const nodeHandleLight = await page.evaluateHandle(() => {
      const spans = Array.from(document.querySelectorAll('.interactive-node span'));
      const match = spans.find(el => el.textContent.includes('IT Infrastructure Manager'));
      return match ? match.closest('.interactive-node') : null;
    });
    if (nodeHandleLight && nodeHandleLight.asElement()) {
      console.log("Mengklik node IT Infrastructure Manager (Light Mode)...");
      await nodeHandleLight.asElement().click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const workbenchLight = path.join(artifactDir, 'workbench_light.png');
    console.log(`Mengambil screenshot Workbench (Light) ke: ${workbenchLight}`);
    await page.screenshot({ path: workbenchLight });
    await page.screenshot({ path: path.join(artifactDir, 'workbench.png') });

    console.log("Navigasi ke Settings (Light Mode)...");
    await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    const settingsLight = path.join(artifactDir, 'settings_light.png');
    console.log(`Mengambil screenshot Settings (Light) ke: ${settingsLight}`);
    await page.screenshot({ path: settingsLight });
    await page.screenshot({ path: path.join(artifactDir, 'settings.png') });

  } catch (e) {
    console.error("Terjadi error selama proses screenshot:", e);
  }

  await browser.close();
  console.log("Proses screenshot selesai!");
}

main().catch(console.error);
