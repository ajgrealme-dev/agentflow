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

  console.log("Mengekstrak informasi koordinat dan CSS dari DOM...");
  const debugData = await page.evaluate(() => {
    const parent = document.querySelector('.origin-top-left');
    const nodes = document.querySelectorAll('.interactive-node');
    
    if (!parent) {
      return { error: "Parent container .origin-top-left tidak ditemukan!" };
    }

    const parentStyle = window.getComputedStyle(parent);
    
    const nodeInfos = Array.from(nodes).slice(0, 10).map(node => {
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return {
        label: node.innerText.replace(/\n/g, ' ').trim(),
        inlineLeft: node.style.left,
        inlineTop: node.style.top,
        computedPosition: style.position,
        computedDisplay: style.display,
        rectLeft: rect.left,
        rectTop: rect.top,
        rectWidth: rect.width,
        rectHeight: rect.height
      };
    });

    return {
      parentDisplay: parentStyle.display,
      parentPosition: parentStyle.position,
      parentWidth: parentStyle.width,
      parentHeight: parentStyle.height,
      nodesCount: nodes.length,
      nodes: nodeInfos
    };
  });

  console.log("Hasil Debug DOM:");
  console.log(JSON.stringify(debugData, null, 2));

  await browser.close();
}

main().catch(console.error);
