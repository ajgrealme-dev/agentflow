import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { base64Image, mimeType } = body;

    if (!base64Image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    let apiKey = process.env.GEMINI_API_KEY;
    try {
      const company = await db.company.findFirst();
      if (company?.geminiApiKey) {
        apiKey = company.geminiApiKey;
      }
    } catch (e) {
      console.error("Failed to fetch geminiApiKey from db in OCR:", e);
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key tidak dikonfigurasi' }, { status: 500 });
    }

    const prompt = `Kamu adalah AI specialist untuk ekstraksi data dokumen keuangan kantor di Indonesia.

Analisis dokumen ini dan ekstrak semua informasi penting. Kembalikan HANYA JSON tanpa penjelasan tambahan.

Format response:
{
  "documentType": "Jenis dokumen (Invoice/PO/Kwitansi/Bon/Laporan/dll)",
  "confidence": <angka 0-100>,
  "extractedData": {
    "field_name": "value"
    // tambahkan semua field yang relevan
  },
  "summary": "Ringkasan singkat dokumen dalam 1-2 kalimat",
  "issues": ["daftar masalah atau hal yang perlu diverifikasi manual"] // kosong jika tidak ada
}

Untuk invoice/PO, pastikan ekstrak: nomor dokumen, tanggal, nama vendor/buyer, item-item, subtotal, pajak, total.
Untuk laporan keuangan: periode, total pendapatan, total pengeluaran, laba/rugi.
Untuk bon/kwitansi: tanggal, item, jumlah, total.

Jika ada angka uang, tampilkan dengan format Rupiah jika dalam IDR.
Jika confidence < 70%, tambahkan ke array issues mengapa data mungkin tidak akurat.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType || 'image/jpeg',
                  data: base64Image,
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.95,
          }
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API error:', err);
      return NextResponse.json({ error: 'Gemini API gagal', detail: err }, { status: 502 });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Clean JSON from markdown code blocks if present
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // If not valid JSON, return raw text
      return NextResponse.json({
        documentType: 'Unknown',
        confidence: 50,
        extractedData: { 'Raw Response': raw },
        summary: 'Gagal parse JSON dari AI response',
        issues: ['Format response tidak sesuai, perlu review manual'],
      });
    }

    // SIMPAN KE POSTGRESQL MULTI-TENANT (FINANCIAL_RECEIPTS)
    try {
      // Ambil companyId pertama sebagai fallback atau dari header
      let companyId = req.headers.get("x-company-id") || body.companyId;
      if (!companyId) {
        const firstCompany = await db.company.findFirst();
        if (firstCompany) {
          companyId = firstCompany.id;
        }
      }

      if (companyId && parsed && parsed.extractedData) {
        const ext = parsed.extractedData;
        const totalText = ext.Total || ext.total || ext["Total Pembayaran"] || "0";
        const numericTotal = parseFloat(totalText.toString().replace(/[^0-9]/g, '')) || 0;
        const merchant = ext.Vendor || ext.vendor || ext.Merchant || ext.merchant || ext["Nama Toko"] || "Toko Umum";
        
        await db.financialReceipt.create({
          data: {
            companyId,
            merchantName: merchant,
            totalAmount: numericTotal,
            transactionDate: new Date(),
            rawAiAnalysis: JSON.stringify(parsed)
          }
        });
      }
    } catch (dbErr) {
      console.error("[OCR DB Save Error]", dbErr);
      // Tetap lanjutkan meskipun gagal simpan ke DB agar UI tidak error
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error('OCR route error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
