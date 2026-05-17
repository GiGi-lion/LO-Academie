import { GoogleGenAI, Type } from "@google/genai";
import { Course } from '../types';

// Helper function to safely get the API key without throwing ReferenceError in the browser
const getApiKey = (): string => {
  try {
    if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {}
  
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
      if (process.env.API_KEY) return process.env.API_KEY;
    }
  } catch (e) {}
  
  return "";
};

// Helper function for exponential backoff retries
const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      const errorString = typeof error === 'string' ? error : JSON.stringify(error) + " " + (error?.message || '');
      const isUnavailable = errorString.includes('503') || errorString.includes('UNAVAILABLE') || errorString.includes('high demand');
      
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

// We initialiseren de client NIET hier, maar pas in de functie. 
// Dit voorkomt dat de app crasht bij het laden (White Screen) als de API Key mist of de env nog niet geladen is.

export const extractCourseFromUrl = async (url: string, existingTags: string[] = []): Promise<Partial<Course> | null> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const existingTagsPrompt = existingTags.length > 0 
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

    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: {
        tools: [{ urlContext: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            date: { type: Type.STRING },
            location: { type: Type.STRING },
            price: { type: Type.NUMBER, description: "De standaard prijs (niet-leden) in euro's. Gebruik null als de prijs niet bekend is." },
            memberPrice: { type: Type.NUMBER, description: "De ledenprijs in euro's. Gebruik null als er geen aparte ledenprijs is." },
            sessions: { type: Type.NUMBER },
            organizers: { type: Type.ARRAY, items: { type: Type.STRING } },
            region: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "description", "location", "sessions", "organizers", "region", "tags"]
        }
      }
    }));

    const text = response.text || "";
    const data = JSON.parse(text);
    return data;
  } catch (error: any) {
    const errorString = typeof error === 'string' ? error : JSON.stringify(error) + " " + (error?.message || '');
    console.error("Gemini API Error (extractCourseFromUrl):", errorString);
    // Return a specific error object or null so the UI can handle it
    if (errorString.includes('503') || errorString.includes('UNAVAILABLE') || errorString.includes('high demand')) {
       throw new Error("De AI-service is momenteel erg druk. Probeer het over een paar minuten nog eens.");
    }
    if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED') || errorString.includes('spending cap')) {
       throw new Error("De Gemini API limiet (spending cap) is bereikt. Probeer het later opnieuw of neem contact op met de beheerder.");
    }
    return null;
  }
};

export const suggestTags = async (title: string, description: string, existingTags: string[] = []): Promise<string[]> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
        console.warn("Gemini API Key ontbreekt.");
        return [];
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const existingTagsPrompt = existingTags.length > 0 
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

    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
    }));

    const text = response.text || "";
    // Split by comma, trim whitespace, and filter out empty strings
    const tags = text.split(',').map(t => t.trim()).filter(t => t.length > 0);
    return tags;
  } catch (error: any) {
    const errorString = typeof error === 'string' ? error : JSON.stringify(error) + " " + (error?.message || '');
    console.error("Gemini API Error (suggestTags):", errorString);
    return [];
  }
};

export const suggestImage = async (title: string, description: string, availableImages: string[]): Promise<string> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

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

    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
    }));

    const text = response.text?.trim() || "";
    if (availableImages.includes(text)) {
      return text;
    }
    return availableImages[Math.floor(Math.random() * availableImages.length)];
  } catch (error: any) {
    const errorString = typeof error === 'string' ? error : JSON.stringify(error) + " " + (error?.message || '');
    console.error("Gemini API Error (suggestImage):", errorString);
    return availableImages[Math.floor(Math.random() * availableImages.length)];
  }
};

export const getSmartRecommendations = async (userQuery: string, availableCourses: Course[]): Promise<string> => {
  try {
    // Lazy initialization met de key
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const courseContext = JSON.stringify(availableCourses.map(c => ({
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

    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt
    }));

    let text = response.text || "Excuses, de studieadviseur is tijdelijk niet bereikbaar. Probeer het later nog eens.";

    return text;
  } catch (error: any) {
    const errorString = typeof error === 'string' ? error : JSON.stringify(error) + " " + (error?.message || '');
    console.error("Gemini API Error:", errorString);
    return "Excuses, de studieadviseur is tijdelijk niet bereikbaar. Probeer het later nog eens.";
  }
};