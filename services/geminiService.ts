import { GoogleGenAI, Type } from "@google/genai";
import { Course } from '../types';

// We initialiseren de client NIET hier, maar pas in de functie. 
// Dit voorkomt dat de app crasht bij het laden (White Screen) als de API Key mist of de env nog niet geladen is.

export const extractCourseFromUrl = async (url: string): Promise<Partial<Course> | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      Je bent een expert in het extraheren van cursusinformatie uit webpagina's.
      Lees de informatie op de volgende webpagina: ${url}
      
      Extraheer de volgende gegevens voor een scholing/cursus:
      - title: De titel van de scholing
      - description: Een duidelijke omschrijving van de scholing. BELANGRIJK: Als uit de originele tekst niet direct duidelijk is waarom deze scholing relevant is voor het beroep of werkveld van bewegingsonderwijs (PO) of lichamelijke opvoeding (VO), voeg dan zelf een of twee zinnen toe aan de omschrijving om deze relevantie te verduidelijken.
      - date: De startdatum in YYYY-MM-DD formaat. Als er geen specifieke datum is, laat dit veld dan leeg ("").
      - location: De locatie waar de scholing plaatsvindt
      - price: De prijs in euro's (alleen het getal, bijv. 150)
      - sessions: Het aantal bijeenkomsten (een getal, standaard 1)
      - organizers: Een array van organisatoren. Kies uit: "KVLO", "ALO Nederland", "Fontys", "HAN", "Hanze", "HHS", "HvA", "Windesheim". Als er een andere organisator is, voeg die dan ook toe aan de array.
      - region: De regio (bijv. "Noord", "Oost", "Zuid", "West", "Midden", "Landelijk")
      - tags: Een array van 3 tot 5 relevante, korte tags (maximaal 2 woorden per tag, bijv. "PO", "VO", "Didactiek", "BSM").
    `;

    const response = await ai.models.generateContent({
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
            price: { type: Type.NUMBER },
            sessions: { type: Type.NUMBER },
            organizers: { type: Type.ARRAY, items: { type: Type.STRING } },
            region: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "description", "location", "price", "sessions", "organizers", "region", "tags"]
        }
      }
    });

    const text = response.text || "";
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.error("Gemini API Error (extractCourseFromUrl):", error);
    return null;
  }
};

export const suggestTags = async (title: string, description: string): Promise<string[]> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
        console.warn("Gemini API Key ontbreekt.");
        return [];
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const prompt = `
      Je bent een expert in het categoriseren van cursussen voor docenten lichamelijke opvoeding (LO) en bewegingsonderwijs.
      Gegeven de volgende titel en omschrijving van een scholing, genereer 3 tot 5 relevante, korte tags (maximaal 2 woorden per tag).
      Geef ALLEEN een komma-gescheiden lijst van tags terug, zonder extra tekst, opsommingstekens of uitleg.
      Voorbeelden van goede tags: PO, VO, Didactiek, BSM, MRT, Turnen, Spel, Zwemmen, EHBO.

      Titel: ${title}
      Omschrijving: ${description}

      Tags:
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
    });

    const text = response.text || "";
    // Split by comma, trim whitespace, and filter out empty strings
    const tags = text.split(',').map(t => t.trim()).filter(t => t.length > 0);
    return tags;
  } catch (error) {
    console.error("Gemini API Error (suggestTags):", error);
    return [];
  }
};

export const suggestImage = async (title: string, description: string, availableImages: string[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
    });

    const text = response.text?.trim() || "";
    if (availableImages.includes(text)) {
      return text;
    }
    return availableImages[Math.floor(Math.random() * availableImages.length)];
  } catch (error) {
    console.error("Gemini API Error (suggestImage):", error);
    return availableImages[Math.floor(Math.random() * availableImages.length)];
  }
};

export const getSmartRecommendations = async (userQuery: string, availableCourses: Course[]): Promise<string> => {
  try {
    // Lazy initialization met de key
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const courseContext = JSON.stringify(availableCourses.map(c => ({
      id: c.id,
      title: c.title,
      date: c.date,
      organizer: c.organizer,
      region: c.region,
      description: c.description,
      tags: c.tags
    })));

    const prompt = `
      Je bent de 'LO Academie Assistent', de gids voor de scholingskalender van KVLO en ALO Nederland.
      
      Jouw doelen:
      1. Help docenten en professionals bij het vinden van de juiste bijscholing.
      2. Geef deskundige context over vaktermen (bijv. MRT, BSM, bewegend leren) indien hierom gevraagd wordt, gebruik hiervoor Google Search.
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
      - Indien de gebruiker een algemene vraag stelt: Gebruik Google Search voor een beknopte, correcte definitie en koppel dit aan relevante cursussen uit de database.
      - Indien er geen passende cursus gevonden wordt: Meld dit vriendelijk en bied aan om algemene informatie te zoeken of adviseer een alternatief.
      - Spreek de gebruiker altijd aan met "je" (informele maar professionele omgangsvorm).
      - Houd het antwoord beknopt en to-the-point (maximaal 150 woorden).

      Antwoord nu:
    `;

    // Gebruik de 'gemini-3.1-flash-lite-preview' model zoals gevraagd
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }] // Enable Grounding with Google Search
      }
    });

    let text = response.text || "Sorry, ik kon op dit moment geen antwoord genereren. Probeer het later opnieuw.";

    // Check for grounding metadata to display sources
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      const uniqueLinks = new Set<string>();
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          uniqueLinks.add(chunk.web.uri);
        }
      });
      
      if (uniqueLinks.size > 0) {
        text += "\n\n### Bronnen\n";
        Array.from(uniqueLinks).forEach((link, index) => {
           text += `- [Bron ${index + 1}](${link})\n`;
        });
      }
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Er is een fout opgetreden bij het ophalen van slimme aanbevelingen. Controleer je internetverbinding of probeer de gewone zoekfilters.";
  }
};