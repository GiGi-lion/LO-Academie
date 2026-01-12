import { GoogleGenAI } from "@google/genai";
import { Course } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartRecommendations = async (userQuery: string, availableCourses: Course[]): Promise<string> => {
  try {
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
      - Als de gebruiker zoekt naar een cursus: Zoek in de JSON en beveel 1-3 opties aan. Noem titel, datum en locatie.
      - Als de gebruiker een algemene vraag stelt (bijv. "Wat is BSM?"): Gebruik Google Search om een korte, correcte definitie te geven en kijk DAN of er cursussen over zijn.
      - Als er geen cursus gevonden is: Zeg dit eerlijk, maar bied aan om algemene info over het onderwerp te zoeken of stel een alternatief voor.
      - Spreek de gebruiker aan met "je/jij".
      - Houd het beknopt (max 150 woorden).

      Antwoord nu:
    `;

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
        text += "\n\nBronnen:";
        Array.from(uniqueLinks).forEach((link, index) => {
           text += `\n[${index + 1}] ${link}`;
        });
      }
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Er is een fout opgetreden bij het ophalen van slimme aanbevelingen. Probeer de gewone zoekfilters.";
  }
};