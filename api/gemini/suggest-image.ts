import { GoogleGenAI } from '@google/genai';

async function parseBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: any) => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res: any, status: number, data: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(data);
  }
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return sendJson(res, 500, { error: "GEMINI_API_KEY ontbreekt in omgevingsvariabelen." });
    }

    const body = await parseBody(req);
    const { title, description, availableImages = [] } = body;

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Je bent een expert in het selecteren van relevante afbeeldingen voor cursussen lichamelijke opvoeding en bewegingsonderwijs.
      Gegeven de volgende titel en omschrijving van een scholing, kies de meest relevante afbeeldings-URL uit de lijst met beschikbare URL's.
      Geef ALLEEN de exacte URL terug, zonder extra tekst of uitleg.

      Titel: ${title || ''}
      Omschrijving: ${description || ''}

      Beschikbare URL's:
      ${availableImages.join('\n')}

      Gekozen URL:
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const chosenUrl = result.text?.trim() || (availableImages.length > 0 ? availableImages[0] : "");
    return sendJson(res, 200, { chosenUrl });
  } catch (error: any) {
    console.error("Vercel API Error (suggest-image):", error);
    return sendJson(res, 500, { error: "Kon geen afbeelding selecteren." });
  }
}
