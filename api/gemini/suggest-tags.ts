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
    const { title, description, existingTags = [] } = body;

    const ai = new GoogleGenAI({ apiKey });

    const existingTagsPrompt = existingTags?.length > 0 
      ? `\n BELANGRIJK: Hier is een lijst van reeds bestaande tags: ${existingTags.join(', ')}. 
      Kies bij voorkeur uit deze bestaande tags. Gebruik algemenere categorieën (bijv. "Racketsporten" i.p.v. "Padel", "Beweegonderwijs" i.p.v. "Bewegingsonderwijs"). Verzin ALLEEN een nieuwe, unieke tag als er echt een belangrijke categorie ontbreekt.`
      : '';

    const prompt = `
      Je bent een assistent voor het categoriseren van cursussen voor docenten lichamelijke opvoeding (LO).
      Gegeven de volgende titel en omschrijving van een cursus, genereer maximaal 3 relevante, korte tags (maximaal 2 woorden per tag, bijv. "PO", "VO", "Didactiek", "BSM").
      ${existingTagsPrompt}

      Titel: ${title || ''}
      Omschrijving: ${description || ''}

      Geef de tags terug als een door komma's gescheiden lijst, zonder extra tekst of uitleg. Bijvoorbeeld: PO, Turnen, Didactiek.
      Zorg dat de tags beginnen met een hoofdletter.
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const tags = (result.text || "").split(',').map((t: string) => t.trim()).filter(Boolean);
    return sendJson(res, 200, tags);
  } catch (error: any) {
    console.error("Vercel API Error (suggest-tags):", error);
    return sendJson(res, 500, { error: "Kon geen tags genereren." });
  }
}
