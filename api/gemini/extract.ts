import { GoogleGenAI, Type } from '@google/genai';

function cleanHtml(html: string): string {
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');

  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&eacute;/g, 'é')
    .replace(/&euml;/g, 'ë')
    .replace(/&iuml;/g, 'ï');

  text = text.replace(/\s+/g, ' ').trim();
  return text.substring(0, 15000);
}

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
    const { url, existingTags = [] } = body;

    if (!url) {
      return sendJson(res, 400, { error: "URL is verplicht." });
    }

    let pageContent = "";
    try {
      const fetchRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      if (fetchRes.ok) {
        const html = await fetchRes.text();
        pageContent = cleanHtml(html);
      }
    } catch (e: any) {
      pageContent = `(Kon URL inhoud niet direct ophalen: ${e?.message})`;
    }

    const existingTagsPrompt = existingTags?.length > 0 
      ? `\n BELANGRIJK VOOR TAGS: Reeds bestaande tags: ${existingTags.join(', ')}. Kies bij voorkeur uit deze bestaande tags.`
      : '';

    const prompt = `
      Je bent een expert in het extraheren van cursusinformatie uit webpagina's voor LO Academie (lichamelijke opvoeding).
      Hier is de weblink: ${url}
      Hier is de webpagina tekst:
      ${pageContent}

      Extraheer:
      - title: De titel van de scholing
      - description: Een duidelijke omschrijving (voeg relevantie voor LO/bewegingsonderwijs toe indien niet expliciet).
      - date: Startdatum YYYY-MM-DD of leeg ""
      - location: Locatie
      - price: Prijs niet-leden (getal) of null
      - memberPrice: Ledenprijs (getal) of null
      - sessions: Aantal bijeenkomsten (getal, default 1)
      - organizers: Array van organisatoren (bijv. KVLO, ALO Nederland, HAN, Fontys, etc.)
      - region: Regio (bijv. Noord, Oost, Zuid, West, Midden, Landelijk)
      - tags: Array van 3 tot 5 tags${existingTagsPrompt}
    `;

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            date: { type: Type.STRING },
            location: { type: Type.STRING },
            price: { type: Type.NUMBER },
            memberPrice: { type: Type.NUMBER },
            sessions: { type: Type.NUMBER },
            organizers: { type: Type.ARRAY, items: { type: Type.STRING } },
            region: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "description", "location", "sessions", "organizers", "region", "tags"]
        }
      }
    });

    if (!result.text) {
      return sendJson(res, 500, { error: "AI antwoord is leeg." });
    }

    const extractedData = JSON.parse(result.text);
    extractedData.url = url;
    return sendJson(res, 200, extractedData);
  } catch (error: any) {
    console.error("Vercel API Error (extract):", error);
    return sendJson(res, 500, { error: "Er is een fout opgetreden bij het omzetten van de weblink." });
  }
}
