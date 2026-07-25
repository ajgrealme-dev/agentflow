import fs from 'fs';

/**
 * Panggil Google Gemini API 2.0 Flash
 */
export async function analyzeWithGemini(prompt, imageBuffer = null, customApiKey = null) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY tidak ditemukan. Harap hubungkan API Key di Dashboard atau gunakan kuota gratis.');

  const parts = [{ text: prompt }];

  if (imageBuffer) {
    const base64Data = imageBuffer.toString('base64');
    parts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: base64Data
      }
    });
  }

  let availableModels = [];
  try {
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listResponse.ok) {
      const listData = await listResponse.json();
      availableModels = (listData.models || [])
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.replace('models/', ''));
    }
  } catch (err) {
    console.warn(`[Gemini Discovery] Gagal mendeteksi list model: ${err.message}`);
  }

  // Jika gagal mendeteksi secara dinamis, gunakan fallback list ini
  if (availableModels.length === 0) {
    availableModels = [
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash',
      'gemini-2.5-flash'
    ];
  }

  // Urutkan prioritas: 1) Flash 8b (paling murah), 2) Flash biasa, 3) Pro (paling mahal)
  availableModels.sort((a, b) => {
    const score = (modelName) => {
      const name = modelName.toLowerCase();
      if (name.includes('8b')) return 1;      // Prioritas tertinggi (sangat murah)
      if (name.includes('flash')) return 2;   // Prioritas kedua (murah)
      if (name.includes('pro')) return 3;     // Prioritas ketiga (mahal)
      return 4;                               // Lainnya
    };
    return score(a) - score(b);
  });

  console.log(`[Gemini Discovery] Model terpilih berdasarkan kuota/harga terbaik:`, availableModels);

  let lastError = null;

  for (const model of availableModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.1,
              topK: 10,
              topP: 0.9,
            }
          })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Model ${model} Error: ${errText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        return JSON.parse(cleaned);
      } catch (parseError) {
        console.warn(`[Gemini Parse Warning] Gagal parse JSON, return raw text:`, parseError.message);
        return cleaned;
      }
    } catch (e) {
      console.warn(`[Gemini Fallback] Percobaan dengan model ${model} gagal: ${e.message}`);
      lastError = e;
    }
  }

  throw new Error(`Semua model Gemini gagal dipanggil. Error terakhir: ${lastError.message}`);
}
