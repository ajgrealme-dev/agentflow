import fs from 'fs';

/**
 * Panggil Google Gemini API 2.0 Flash
 */
export async function callGemini(prompt, imagePath = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum di-set di file .env');
  }

  const parts = [{ text: prompt }];

  if (imagePath) {
    const fileBytes = fs.readFileSync(imagePath);
    const base64Data = fileBytes.toString('base64');
    let mimeType = 'image/jpeg';
    if (imagePath.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';
    else if (imagePath.toLowerCase().endsWith('.png')) mimeType = 'image/png';

    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: base64Data
      }
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
    throw new Error(`Gemini API Error: ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Clean JSON wrappers if exist
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Gagal parse respons dari AI: ${text}`);
  }
}
