import { GoogleGenAI } from "@google/genai";
import { Course } from '../types';

// We initialiseren de client NIET hier, maar pas in de functie. 
// Dit voorkomt dat de app crasht bij het laden (White Screen) als de API Key mist of de env nog niet geladen is.

export const getSmartRecommendations = async (userQuery: string, availableCourses: Course[]): Promise<string> => {
  try {
    // Haal API key op. We ondersteunen zowel Vite's import.meta.env als process.env
    const apiKey = process.env.API_KEY;

    if (!apiKey || apiKey === "undefined" || apiKey === "") {
        console.warn("Gemini API Key ontbreekt in environment variables.");
        return "Ik kan helaas geen slimme aanbevelingen doen omdat mijn AI-sleutel ontbreekt. De beheerder moet de API_KEY instellen in de configuratie.";
    }

    // Lazy initialization met de key
    const ai = new GoogleGenAI({ apiKey: apiKey });

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
      Je bent de 'LO Academie Assistent', de slimme gids voor de scholingskalender van KVLO en ALO Nederland.
      
      Jouw doelen:
      1. Help docenten de juiste bijscholing te vinden.
      2. Geef context over vaktermen (bijv. MRT, BSM, bewegend leren) als daarom gevraagd wordt, gebruik hiervoor Google Search.
      3. Wees enthousiast over het vak bewegingsonderwijs.

      Hier is de lijst met ACTUELE cursussen in onze database (JSON):
      ${courseContext}

      De gebruiker vraagt: "${userQuery}"

      Richtlijnen voor je antwoord:
      - **GEBRUIK OPMAAK:** Maak je antwoord visueel aantrekkelijk.
      - Gebruik **dikgedrukte tekst** voor namen van cursussen, datums en belangrijke begrippen.
      - Gebruik lijstjes (bulletpoints) als je meerdere opties noemt.
      - Gebruik kopjes (### Koptekst) om structuur aan te brengen als het antwoord lang is.
      - Als de gebruiker zoekt naar een cursus: Zoek in de JSON en beveel 1-3 opties aan. Noem titel, datum en locatie.
      - Als de gebruiker een algemene vraag stelt (bijv. "Wat is BSM?"): Gebruik Google Search om een korte, correcte definitie te geven en kijk DAN of er cursussen over zijn.
      - Als er geen cursus gevonden is: Zeg dit eerlijk, maar bied aan om algemene info over het onderwerp te zoeken of stel een alternatief voor.
      - Spreek de gebruiker aan met "je/jij".
      - Houd het beknopt (max 150 woorden).

      Antwoord nu:
    `;

    // Gebruik de 'gemini-3-flash-preview' model zoals voorgeschreven voor basistaken met grounding
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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