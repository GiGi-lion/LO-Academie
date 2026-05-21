import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

  app.use(express.json());

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      mode: process.env.NODE_ENV || "development",
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      geminiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0
    });
  });

  // Gemini API Initialization (Server-side)
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("DEBUG: GEMINI_API_KEY is missing from environment variables.");
      throw new Error("GEMINI_API_KEY environment variable is not set on the server.");
    }
    console.log("DEBUG: Initializing Gemini client with key length:", apiKey.length);
    return new GoogleGenAI({ 
      apiKey,
    });
  };

  // Helper for retries
  const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> => {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        attempt++;
        const errorString = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
        const isUnavailable = errorString.includes('503') || errorString.includes('UNAVAILABLE') || errorString.includes('high demand');
        const isSuspended = errorString.includes('suspended') || errorString.includes('403');
        
        if (isUnavailable && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.warn(`Gemini API unavailable (503). Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    throw new Error("Max retries reached");
  };

  // API Routes
  app.post("/api/gemini/extract", async (req, res) => {
    try {
      const { url, existingTags } = req.body;
      const ai = getAiClient();
      
      const existingTagsPrompt = existingTags?.length > 0 
        ? `\n      BELANGRIJK VOOR TAGS: Hier is een lijst van reeds bestaande tags: ${existingTags.join(', ')}. 
        Kies bij voorkeur uit deze bestaande tags. Gebruik algemenere categorieën (bijv. "Racketsporten" i.p.v. "Padel", "Beweegonderwijs" i.p.v. "Bewegingsonderwijs"). Verzin ALLEEN een nieuwe, unieke tag als er echt een belangrijke categorie ontbreekt.`
        : '';

      const prompt = `
        Je bent een expert in het extraheren van cursusinformatie uit webpagina's.
        Lees de informatie op de volgende webpagina: ${url}
        
        Extraheer de volgende gegevens voor een scholing/cursus:
        - title: De titel van de scholing
        - description: Een duidelijke omschrijving van de scholing. BELANGRIJK: Als uit de originele tekst niet direct duidelijk is waarom deze scholing relevant is voor het beroep of werkveld van bewegingsonderwijs (PO) of lichamelijke opvoeding (VO), voeg dan zelf een of twee zinnen toe aan de omschrijving om deze relevantie te verduidelijken.
        - date: De startdatum in YYYY-MM-DD formaat. Als er geen specifieke datum is, laat dit veld dan leeg ("").
        - location: De locatie waar de scholing plaatsvindt
        - price: De standaard prijs voor NIET-LEDEN in euro's (alleen het getal, bijv. 150). Laat leeg of gebruik null als de prijs (nog) niet bekend is.
        - memberPrice: De speciale prijs voor LEDEN (meestal KVLO-leden) in euro's. Als er maar één prijs is, gebruik die dan voor 'price' en laat 'memberPrice' leeg of null.
        - sessions: Het aantal bijeenkomsten (een getal, standaard 1)
        - organizers: Een array van organisatoren. Kies uit: "KVLO", "ALO Nederland", "Fontys", "HAN", "Hanze", "HHS", "HvA", "Windesheim". Als er een andere organisator is, voeg die dan ook toe aan de array.
        - region: De regio (bijv. "Noord", "Oost", "Zuid", "West", "Midden", "Landelijk")
        - tags: Een array van 3 tot 5 relevante, korte tags (maximaal 2 woorden per tag, bijv. "PO", "VO", "Didactiek", "BSM"). Zorg dat de tags beginnen met een hoofdletter.${existingTagsPrompt}
      `;

      const result = await withRetry(() => ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
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
      }));

      let extractedData;
      try {
        extractedData = JSON.parse(result.text);
      } catch (parseError) {
        console.error("JSON Parse Error (extract):", result.text);
        throw new Error("Het antwoord van de AI kon niet correct worden verwerkt. Probeer het opnieuw.");
      }

      res.json(extractedData);
    } catch (error: any) {
      console.error("Server API Error (extract):", error);
      const errorString = error?.message || String(error);
      if (errorString.includes('suspended')) {
        return res.status(403).json({ error: "De Gemini API key is geschorst. Controleer de instellingen in AI Studio." });
      }
      res.status(500).json({ error: "Er is een fout opgetreden bij het omzetten van de weblink. Mogelijk is de URL niet toegankelijk." });
    }
  });

  app.post("/api/gemini/suggest-tags", async (req, res) => {
    try {
      const { title, description, existingTags } = req.body;
      const ai = getAiClient();

      const existingTagsPrompt = existingTags?.length > 0 
        ? `\n      BELANGRIJK: Hier is een lijst van reeds bestaande tags: ${existingTags.join(', ')}. 
        Kies bij voorkeur uit deze bestaande tags. Gebruik algemenere categorieën (bijv. "Racketsporten" i.p.v. "Padel", "Beweegonderwijs" i.p.v. "Bewegingsonderwijs"). Verzin ALLEEN een nieuwe, unieke tag als er echt een belangrijke categorie ontbreekt.`
        : '';

      const prompt = `
        Je bent een expert in het categoriseren van cursussen voor docenten lichamelijke opvoeding (LO) en bewegingsonderwijs.
        Gegeven de volgende titel en omschrijving van een scholing, genereer 3 tot 5 relevante, korte tags (maximaal 2 woorden per tag).
        Geef ALLEEN een komma-gescheiden lijst van tags terug, zonder extra tekst, opsommingstekens of uitleg. Zorg dat de tags beginnen met een hoofdletter.
        Voorbeelden van goede tags: PO, VO, Didactiek, BSM, MRT, Turnen, Spel, Zwemmen, EHBO.${existingTagsPrompt}

        Titel: ${title}
        Omschrijving: ${description}

        Tags:
      `;

      const result = await withRetry(() => ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      }));

      const tags = (result.text || "").split(',').map(t => t.trim()).filter(t => t.length > 0);
      res.json(tags);
    } catch (error: any) {
      console.error("Server API Error (suggest-tags):", error);
      const errorString = error?.message || String(error);
      if (errorString.includes('suspended')) {
        return res.status(403).json({ error: "Gemini API key suspended." });
      }
      res.status(500).json({ error: "Onmogelijk om tags te genereren." });
    }
  });

  app.post("/api/gemini/suggest-image", async (req, res) => {
    try {
      const { title, description, availableImages } = req.body;
      const ai = getAiClient();

      const prompt = `
        Je bent een expert in het selecteren van relevante afbeeldingen voor cursussen lichamelijke opvoeding en bewegingsonderwijs.
        Gegeven de volgende titel en omschrijving van een scholing, kies de meest relevante afbeeldings-URL uit de lijst met beschikbare URL's.
        Geef ALLEEN de exacte URL terug, zonder extra tekst of uitleg.

        Titel: ${title}
        Omschrijving: ${description}

        Beschikbare URL's:
        ${availableImages.join('\n')}

        Gekozen URL:
      `;

      const result = await withRetry(() => ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      }));

      const chosenUrl = result.text?.trim() || "";
      res.json({ chosenUrl });
    } catch (error: any) {
      console.error("Server API Error (suggest-image):", error);
      res.status(500).json({ error: "Kon geen afbeelding selecteren." });
    }
  });

  app.post("/api/gemini/recommendations", async (req, res) => {
    try {
      const { userQuery, availableCourses } = req.body;
      const ai = getAiClient();

      const courseContext = JSON.stringify(availableCourses.map((c: any) => ({
        id: c.id,
        title: c.title,
        date: (c.date && c.date.trim() !== '') ? c.date : "Zonder startdatum",
        organizers: c.organizers,
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
        - **BELANGRIJK:** Maak van elke aanbevolen cursus een klikbare link met het exacte format: [Titel van Cursus](course:ID_VAN_DE_CURSUS). Gebruik hiervoor exact de waarde van het 'id' veld uit de JSON. Bijvoorbeeld: [Basiscursus Turnen](course:f47ac10b-58cc-4372-a567-0e02b2c3d479).
        - Je mag GEEN informatie van het internet zoeken. Gebruik UITSLUITEND de meegeleverde JSON data over de cursussen voor het aanbod.
        - Indien er geen passende cursus gevonden wordt: Meld dit vriendelijk en adviseer een alternatief uit de lijst.
        - Spreek de gebruiker altijd aan met "je" (informele maar professionele omgangsvorm).
        - Houd het antwoord beknopt en to-the-point (maximaal 150 woorden).

        Antwoord nu:
      `;

      const result = await withRetry(() => ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
      }));

      res.json({ text: result.text || "Excuses, de studieadviseur is tijdelijk niet bereikbaar. Probeer het later nog eens." });
    } catch (error: any) {
      console.error("Server API Error (recommendations):", error);
      const errorString = error?.message || String(error);
      let userMessage = "Excuses, de studieadviseur is tijdelijk niet bereikbaar. Probeer het later nog eens.";
      
      if (errorString.includes('suspended')) {
        userMessage = "Excuses, de studieadviseur is tijdelijk niet bereikbaar (API key gezwenkt). Controleer de instellingen in AI Studio.";
      }
      
      res.status(500).json({ error: userMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("Critical Server Startup Error:", error);
}
}

// Global Rejection Handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

startServer().catch(err => {
  console.error("Fatal startup error in startServer():", err);
});
