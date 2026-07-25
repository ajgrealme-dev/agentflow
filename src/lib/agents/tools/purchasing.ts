import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

export const purchasingTools = {
  /**
   * Menghasilkan dokumen Request for Quotation (RFQ) resmi secara otomatis dalam bentuk berkas PDF.
   * Parameter itemsJson harus berupa string JSON array berisi barang (sku, name, qty).
   */
  generateRFQ: async (vendorName: string, itemsJson: string) => {
    console.log(`[Purchasing Tool] Membuat RFQ PDF untuk vendor: ${vendorName}`);
    let browser;
    try {
      let items = [];
      try {
        items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
      } catch {
        items = [{ name: itemsJson, qty: 1 }];
      }

      const rfqId = `RFQ-${Date.now()}`;
      const todayStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
      const dueStr = new Date(Date.now() + 7 * 24 * 3600 * 1000).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

      // Buat HTML Template untuk dokumen RFQ resmi
      const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', Helvetica, Arial, sans-serif; color: #1f2937; padding: 40px; line-height: 1.6; background-color: #ffffff; }
    .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
    .company-title { font-size: 20px; font-weight: 800; color: #1e3a8a; }
    .company-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .rfq-title { font-size: 26px; font-weight: 800; color: #1e3a8a; text-align: right; }
    .rfq-id { font-size: 14px; color: #3b82f6; font-weight: 600; text-align: right; }
    .details-grid { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 40px; }
    .details-block { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .block-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .info-line { font-size: 13px; margin: 4px 0; }
    .info-label { font-weight: 600; color: #475569; }
    .item-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    .item-table th { background-color: #1e3a8a; border: 1px solid #1e3a8a; padding: 12px; text-align: left; font-weight: bold; color: #ffffff; font-size: 12px; text-transform: uppercase; }
    .item-table td { border: 1px solid #e2e8f0; padding: 12px; font-size: 13px; }
    .item-table tr:nth-child(even) { background-color: #f8fafc; }
    .terms { background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; padding: 16px; font-size: 12px; margin-bottom: 40px; }
    .terms-title { font-weight: bold; color: #1e3a8a; margin-bottom: 6px; }
    .sig-section { display: flex; justify-content: space-between; margin-top: 60px; }
    .sig-block { text-align: center; width: 220px; }
    .sig-line { border-top: 1px solid #cbd5e1; margin-top: 60px; padding-top: 8px; font-size: 13px; font-weight: bold; color: #1e3a8a; }
    .sig-title { font-size: 11px; color: #64748b; margin-top: 2px; }
    .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 80px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-title">Aziz Tech Automation</div>
      <div class="company-sub">Divisi Pengadaan &amp; Manajemen Vendor AI</div>
      <div class="company-sub">Gedung Pusat Otomasi Lt. 4, Serang, Banten</div>
    </div>
    <div>
      <div class="rfq-title">REQUEST FOR QUOTATION</div>
      <div class="rfq-id">ID: ${rfqId}</div>
    </div>
  </div>

  <div class="details-grid">
    <div class="details-block">
      <div class="block-title">Informasi Vendor</div>
      <div class="info-line"><span class="info-label">Nama Vendor:</span> ${vendorName}</div>
      <div class="info-line"><span class="info-label">Status Hubungan:</span> Terdaftar / Mitra Resmi</div>
    </div>
    <div class="details-block">
      <div class="block-title">Informasi Pengadaan</div>
      <div class="info-line"><span class="info-label">Tanggal Terbit:</span> ${todayStr}</div>
      <div class="info-line"><span class="info-label">Batas Penawaran:</span> ${dueStr}</div>
      <div class="info-line"><span class="info-label">Pembuat:</span> Procurement Officer AI</div>
    </div>
  </div>

  <table class="item-table">
    <thead>
      <tr>
        <th style="width: 80px;">No</th>
        <th style="width: 150px;">SKU</th>
        <th>Deskripsi Barang</th>
        <th style="width: 120px; text-align: right;">Jumlah (Unit)</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item: any, idx: number) => {
        const name = item.name || item.itemName || 'Barang';
        const qty = item.qty || item.quantity || 1;
        const sku = item.sku || 'N/A';
        return `
          <tr>
            <td>${idx + 1}</td>
            <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${sku}</td>
            <td>${name}</td>
            <td style="text-align: right; font-weight: bold;">${qty}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="terms">
    <div class="terms-title">Syarat &amp; Ketentuan Pengiriman Penawaran (Quotation)</div>
    <ol style="margin: 0; padding-left: 16px; color: #1e40af; line-height: 1.8;">
      <li>Quotation resmi harus dikirimkan sebelum batas waktu penawaran yang tertera di atas.</li>
      <li>Wajib mencantumkan estimasi waktu tunggu pengiriman (Lead Time) dan masa berlaku harga.</li>
      <li>Mohon sebutkan syarat pembayaran/term of payment (TOP) yang diusulkan.</li>
    </ol>
  </div>

  <div class="sig-section">
    <div class="sig-block">
      <div class="sig-line">Mitra Vendor</div>
      <div class="sig-title">Konfirmasi Persetujuan Penerimaan RFQ</div>
    </div>
    <div class="sig-block">
      <div class="sig-line">Aziz Maulana</div>
      <div class="sig-title">Chief Executive Officer</div>
    </div>
  </div>

  <div class="footer">
    Dokumen ini digenerasi secara otonom oleh sistem kecerdasan buatan AgentFlow Enterprise.<br>
    Verifikasi keaslian berkas dan tanda tangan digital dapat diakses di portal ERP internal.
  </div>
</body>
</html>
      `;

      // Simpan berkas PDF ke direktori public/rfqs/
      const publicDir = path.resolve(process.cwd(), 'public');
      const rfqsDir = path.join(publicDir, 'rfqs');
      if (!fs.existsSync(rfqsDir)) {
        fs.mkdirSync(rfqsDir, { recursive: true });
      }

      const filePath = path.join(rfqsDir, `${rfqId}.pdf`);
      
      // Proteksi Directory Traversal
      const relativePath = path.relative(rfqsDir, filePath);
      if (relativePath.includes('..') || path.isAbsolute(relativePath)) {
        return { success: false, error: 'Deteksi Directory Traversal: Akses tidak sah.' };
      }

      // Gunakan Puppeteer headless browser lokal untuk mengubah HTML ke PDF
      console.log(`[Purchasing Tool] Meluncurkan browser untuk cetak PDF...`);
      browser = await puppeteer.launch({
        headless: true,
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
      });

      await browser.close();
      browser = null;

      return {
        success: true,
        rfqId,
        downloadUrl: `/rfqs/${rfqId}.pdf`,
        message: `RFQ ${rfqId} berhasil dicetak sebagai PDF secara otonom untuk vendor ${vendorName}. Unduh berkas PDF di: /rfqs/${rfqId}.pdf`
      };
    } catch (err: any) {
      console.error('[Purchasing Tool Error]', err);
      if (browser) {
        try { await browser.close(); } catch {}
      }
      return { success: false, error: err.message || String(err) };
    }
  },

  /**
   * Mengurutkan penawaran harga dari beberapa vendor untuk mencari yang termurah.
   */
  sortVendorPrices: async (sku: string, quotesJson: string) => {
    console.log(`[Purchasing Tool] Membandingkan harga vendor untuk SKU: ${sku}`);
    try {
      let quotes = [];
      try {
        quotes = typeof quotesJson === 'string' ? JSON.parse(quotesJson) : quotesJson;
      } catch {
        return { success: false, error: 'Gagal melakukan parsing data penawaran harga vendor.' };
      }

      if (!Array.isArray(quotes) || quotes.length === 0) {
        return { success: false, error: 'Daftar penawaran harga kosong atau format salah.' };
      }

      const sorted = [...quotes].sort((a, b) => {
        const priceA = parseFloat(a.price || a.harga || 0);
        const priceB = parseFloat(b.price || b.harga || 0);
        return priceA - priceB;
      });

      const cheapest = sorted[0];

      return {
        success: true,
        sku,
        cheapestVendor: cheapest.vendor || cheapest.supplier || 'N/A',
        cheapestPrice: parseFloat(cheapest.price || cheapest.harga || 0),
        sortedQuotes: sorted.map(q => ({
          vendor: q.vendor || q.supplier,
          price: parseFloat(q.price || q.harga || 0)
        })),
        message: `Audit Harga Selesai. Rekomendasi pembelian SKU ${sku} jatuh ke "${cheapest.vendor}" dengan harga terbaik: Rp ${cheapest.price.toLocaleString('id-ID')}.`
      };
    } catch (err: any) {
      console.error('[Purchasing Tool Error]', err);
      return { success: false, error: err.message || String(err) };
    }
  }
};
