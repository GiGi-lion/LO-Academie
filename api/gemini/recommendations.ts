import { GoogleGenAI } from '@google/genai';

async function parseBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
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
  // Handle CORS preflight
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
      console.error("GEMINI_API_KEY ontbreekt in environment variables.");
      return sendJson(res, 500, { 
        error: "De studieadviseur kan momenteel geen verbinding maken: de GEMINI_API_KEY ontbreekt in de omgevingsvariabelen van Vercel. Voeg GEMINI_API_KEY toe in Vercel Project Settings > Environment Variables." 
      });
    }

    const body = await parseBody(req);
    const { userQuery, availableCourses = [] } = body;

    if (!userQuery) {
      return sendJson(res, 400, { error: "Vraag ontbreekt (userQuery is verplicht)." });
    }

    const ai = new GoogleGenAI({ apiKey });

    const courseContext = JSON.stringify((availableCourses || []).map((c: any) => ({
      id: c.id,
      title: c.title,
      date: (c.date && c.date.trim() !== '') ? c.date : "Zonder startdatum",
      organizers: c.organizers || c.organizer,
      region: c.region,
      description: c.description,
      tags: c.tags
    })));

    const prompt = `
      Je bent de 'LO Academie Assistent', de gids voor de scholingskalender van KVLO en ALO Nederland.
      
      Jouw doelen:
      1. Help docenten en professionals bij het vinden van de juiste bijscholing.
      2. Geef deskundige context over vaktermen (bijv. MRT, BSM, bewegend leren) op basis van je eigen kennis.
      3. Communiceer op een vriendelijke, behulpzame en deskundige wijze.

      Hier is de lijst met ACTUELE cursussen in onze database (JSON):
      ${courseContext}

      De gebruiker vraagt: "${userQuery}"

      Richtlijnen voor je antwoord:
      - **GEBRUIK OPMAAK:** Maak je antwoord visueel overzichtelijk en professioneel.
      - Gebruik **dikgedrukte tekst** voor namen van cursussen, datums en kernbegrippen.
      - Gebruik opsommingstekens indien je meerdere opties presenteert.
      - Gebruik kopjes (### Koptekst) voor een heldere structuur.
      - Indien de gebruiker zoekt naar een cursus: Analyseer de JSON en adviseer 1-3 relevante opties. Vermeld titel, datum en locatie.
      - **BELANGRIJK:** Maak van elke aanbevolen cursus een klikbare markdown link met het exacte format: [Titel van Cursus](course:ID_VAN_DE_CURSUS). Gebruik geen backslashes om de link te escaperen. Bijvoorbeeld: [Basiscursus Turnen](course:f47ac10b-58cc-4372-a567-0e02b2c3d479).
      - Je mag GEEN informatie van het internet zoeken. Gebruik UITSLUITEND de meegeleverde JSON data over de cursussen voor het aanbod.
      - Indien er geen passende cursus gevonden wordt: Meld dit vriendelijk en adviseer een alternatief uit de lijst.
      - Spreek de gebruiker altijd aan met "je".
      - Gebruik voor vette tekst altijd ** (twee asterisken), zoals **Belangrijk:**. Gebruik geen enkele asterisk.

      Antwoord nu:
    `;

    let result: any = null;
    let lastError: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });
        break;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err);
        if ((errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand')) && attempt < 3) {
          await new Promise(r => setTimeout(r, attempt * 1000));
          continue;
        }
        throw err;
      }
    }

    const replyText = result?.text || "Excuses, de studieadviseur kon geen antwoord formuleren. Probeer het later nog eens.";
    return sendJson(res, 200, { text: replyText });
  } catch (error: any) {
    console.error("Vercel API Error (recommendations):", error);
    const errorString = error?.message || String(error);

    if (errorString.includes('suspended') || errorString.includes('API_KEY_INVALID') || errorString.includes('403')) {
      return sendJson(res, 500, {
        error: "De studieadviseur is momenteel niet bereikbaar: de Gemini API-sleutel is ongeldig, gepauzeerd of verlopen. Controleer de instellingen in Google AI Studio en in de Vercel Environment Variables."
      });
    }

    return sendJson(res, 500, {
      error: "Excuses, de studieadviseur is tijdelijk niet bereikbaar. Probeer het later nog eens."
    });
  }
}
