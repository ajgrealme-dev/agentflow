import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const PptxGenJS = (await import('pptxgenjs')).default;
    const pptx = new PptxGenJS();

    pptx.layout = 'LAYOUT_WIDE';

    const BG = '0a0a0f';
    const PRIMARY = '4f46e5';
    const TEAL = '14b8a6';
    const EMERALD = '10b981';
    const ROSE = 'f43f5e';
    const AMBER = 'f59e0b';
    const WHITE = 'ffffff';
    const GRAY = '9ca3af';

    const addBg = (slide: any, accent = TEAL) => {
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: BG } });
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.04, fill: { color: accent } });
      slide.addText('AgentFlow Enterprise', { x: 9.2, y: 0.12, w: 3.1, h: 0.35, fontSize: 9, bold: true, color: TEAL });
    };

    // Slide 1: Welcome
    {
      const s = pptx.addSlide(); addBg(s, PRIMARY);
      s.addText('AgentFlow Enterprise', { x: 1, y: 1.8, w: 10.33, h: 1, fontSize: 40, bold: true, color: WHITE, align: 'center' });
      s.addText('ERP AI Agent Otonom 24/7 untuk Kantor Masa Depan', { x: 1, y: 3, w: 10.33, h: 0.5, fontSize: 16, color: GRAY, align: 'center' });
      s.addText('Otomasi · Efisiensi · Pertumbuhan', { x: 1, y: 3.8, w: 10.33, h: 0.4, fontSize: 13, color: TEAL, bold: true, align: 'center' });
    }

    // Slide 2: Problem
    {
      const s = pptx.addSlide(); addBg(s, ROSE);
      s.addText('Masalah Operasional Kantor', { x: 0.5, y: 0.4, w: 11, h: 0.6, fontSize: 26, bold: true, color: WHITE });
      s.addText('Mengapa Sistem Manual Menghambat Skala Bisnis Anda?', { x: 0.5, y: 1.1, w: 11, h: 0.4, fontSize: 13, color: GRAY });
      [
        ['70% waktu kerja tim habis untuk input data manual, entri bon, dan follow-up tagihan.', AMBER],
        ['Rawan kesalahan manusia (human error) yang memicu salah hitung laporan bulanan.', ROSE],
        ['Biaya operasional tinggi — headcount staf admin bertambah seiring perkembangan bisnis.', ROSE],
      ].forEach(([text, color], i) => {
        s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 2 + i * 1.2, w: 11.33, h: 0.9, fill: { color: '1a1a2e' }, line: { color: '2a2a4e', width: 1 }, rectRadius: 0.1 });
        s.addText(String(text), { x: 0.8, y: 2.15 + i * 1.2, w: 11, h: 0.6, fontSize: 12, color: String(color) });
      });
    }

    // Slide 3: Solution
    {
      const s = pptx.addSlide(); addBg(s, EMERALD);
      s.addText('Solusi: AgentFlow AI Workers', { x: 0.5, y: 0.4, w: 11, h: 0.6, fontSize: 26, bold: true, color: WHITE });
      s.addText('Karyawan AI Otonom yang Bekerja di Latar Belakang Tanpa Lelah', { x: 0.5, y: 1.1, w: 11, h: 0.4, fontSize: 13, color: GRAY });
      [
        'ERP Otonom: AI terhubung langsung ke database Postgres untuk menyelesaikan pekerjaan.',
        'Fleksibilitas SOP: Latih agen secara instan dengan menyunting SOP tertulis di Workbench.',
        'Integrasi Multi-Divisi: Finance AI, HR AI, Purchasing AI bekerja secara kolaboratif.',
      ].forEach((text, i) => {
        s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 2 + i * 1.2, w: 11.33, h: 0.9, fill: { color: '052e16' }, line: { color: '14532d', width: 1 }, rectRadius: 0.1 });
        s.addText(text, { x: 0.8, y: 2.15 + i * 1.2, w: 11, h: 0.6, fontSize: 12, color: EMERALD });
      });
    }

    // Slide 4: ROI
    {
      const s = pptx.addSlide(); addBg(s, AMBER);
      s.addText('Kalkulator ROI & Efisiensi Biaya', { x: 0.5, y: 0.4, w: 11, h: 0.6, fontSize: 26, bold: true, color: WHITE });
      s.addText('Bandingkan Pengeluaran Admin Staf vs Agen AI Otonom', { x: 0.5, y: 1.1, w: 11, h: 0.4, fontSize: 13, color: GRAY });
      const rows = [
        [{ text: '', options: { bold: true, fill: { color: '1f2937' } } }, { text: 'Staf Admin Manual', options: { bold: true, fill: { color: '1f2937' }, color: AMBER } }, { text: 'AgentFlow AI', options: { bold: true, fill: { color: '1f2937' }, color: EMERALD } }],
        ['Biaya Bulanan', 'Rp 15.000.000 (3 staf)', 'Rp 350.000'],
        ['Jam Kerja', '8 jam/hari (kerja)', '24/7 non-stop'],
        ['Error Rate', 'Tinggi (human error)', 'Minimal (<0.1%)'],
        ['Skalabilitas', 'Tambah headcount', 'Instant scale-up'],
        ['ROI Bulanan', '-', 'Hemat Rp 14.650.000+'],
      ];
      s.addTable(rows as any, { x: 0.5, y: 2, w: 11.33, fontSize: 11, border: { pt: 1, color: '374151' }, fill: { color: '111827' }, color: WHITE, rowH: 0.45 });
    }

    // Slide 5: Demo
    {
      const s = pptx.addSlide(); addBg(s, EMERALD);
      s.addText('Simulasi Langsung: Uji Otonom', { x: 0.5, y: 0.4, w: 11, h: 0.6, fontSize: 26, bold: true, color: WHITE });
      s.addText('Saksikan AI menerima perintah, menavigasi sistem, dan bekerja sendiri', { x: 0.5, y: 1.1, w: 11, h: 0.4, fontSize: 13, color: GRAY });
      s.addText('Demo Live:', { x: 2, y: 2.5, w: 8.33, h: 0.4, fontSize: 14, color: GRAY, align: 'center' });
      s.addText('http://localhost:3000', { x: 2, y: 3.1, w: 8.33, h: 0.6, fontSize: 24, bold: true, color: EMERALD, align: 'center' });
      s.addText('Klik "Jalankan Auto-Pilot Demo" di pojok kanan bawah halaman dashboard', { x: 1, y: 4, w: 10.33, h: 0.5, fontSize: 11, color: GRAY, align: 'center', italic: true });
    }

    // Slide 6: Security
    {
      const s = pptx.addSlide(); addBg(s, PRIMARY);
      s.addText('Keamanan Data & Skema BYOK', { x: 0.5, y: 0.4, w: 11, h: 0.6, fontSize: 26, bold: true, color: WHITE });
      s.addText('Keamanan Tingkat Enterprise Berada di Tangan Anda', { x: 0.5, y: 1.1, w: 11, h: 0.4, fontSize: 13, color: GRAY });
      [
        { t: 'BYOK (Bring Your Own Key)', d: 'Hubungkan API Key Gemini perusahaan Anda untuk kontrol penuh.' },
        { t: 'Isolasi Tenant', d: 'Data transaksi dipisahkan dengan aman dalam isolasi baris PostgreSQL.' },
        { t: 'Persetujuan Manual', d: 'Fitur antrean eskalasi membiarkan supervisor mengontrol persetujuan AI.' },
      ].forEach((item, i) => {
        s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 2 + i * 1.2, w: 11.33, h: 1, fill: { color: '1e1b4b' }, line: { color: '3730a3', width: 1 }, rectRadius: 0.1 });
        s.addText(item.t, { x: 0.8, y: 2.1 + i * 1.2, w: 11, h: 0.35, fontSize: 13, bold: true, color: WHITE });
        s.addText(item.d, { x: 0.8, y: 2.5 + i * 1.2, w: 11, h: 0.35, fontSize: 11, color: GRAY });
      });
    }

    // Slide 7: CTA
    {
      const s = pptx.addSlide(); addBg(s, EMERALD);
      s.addText('Mulai Uji Coba Pilot Project', { x: 0.5, y: 0.4, w: 11, h: 0.6, fontSize: 26, bold: true, color: WHITE });
      s.addText('Dapatkan Akses Penuh Uji Coba 14 Hari di Perusahaan Anda', { x: 0.5, y: 1.1, w: 11, h: 0.4, fontSize: 13, color: GRAY });
      [
        'Uji coba gratis di 1 Divisi pilihan (misal: Otomasi Rekap Keuangan).',
        'Pendampingan integrasi SOP lokal ke dalam platform AI.',
        'Hubungi pengembang: hello@agentflow.id',
      ].forEach((text, i) => {
        s.addText(text, { x: 0.7, y: 2.3 + i * 0.9, w: 8, h: 0.6, fontSize: 13, color: i === 2 ? TEAL : EMERALD });
      });
      s.addText('agentflow.id', { x: 9, y: 3.5, w: 3, h: 0.6, fontSize: 22, bold: true, color: EMERALD, align: 'center' });
    }

    const buf = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer;

    return new NextResponse(Buffer.from(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="AgentFlow-PitchDeck.pptx"',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (err: any) {
    console.error('[PPTX] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
