import { Course } from '../types';

export const extractCourseFromUrl = async (url: string, existingTags: string[] = []): Promise<Partial<Course> | null> => {
  try {
    const response = await fetch('/api/gemini/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, existingTags })
    });

    if (!response.ok) {
      let errorMessage = `Server responded with ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Not JSON
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error("Gemini API Error (extractCourseFromUrl):", errorMsg);
    if (errorMsg.includes('suspended')) {
       throw new Error("De studieadviseur is tijdelijk niet bereikbaar (API key suspended). Neem contact op met de beheerder.");
    }
    return null;
  }
};

export const suggestTags = async (title: string, description: string, existingTags: string[] = []): Promise<string[]> => {
  try {
    const response = await fetch('/api/gemini/suggest-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, existingTags })
    });

    if (!response.ok) throw new Error('Server error');

    return await response.json();
  } catch (error: any) {
    console.error("Gemini API Error (suggestTags):", error.message);
    return [];
  }
};

export const suggestImage = async (title: string, description: string, availableImages: string[]): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/suggest-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, availableImages })
    });

    if (!response.ok) throw new Error('Server error');

    const data = await response.json();
    return data.chosenUrl || availableImages[Math.floor(Math.random() * availableImages.length)];
  } catch (error: any) {
    console.error("Gemini API Error (suggestImage):", error.message);
    return availableImages[Math.floor(Math.random() * availableImages.length)];
  }
};

export const getSmartRecommendations = async (userQuery: string, availableCourses: Course[]): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userQuery, availableCourses })
    });

    if (!response.ok) {
      let errorMessage = `Server responded with ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Not JSON
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error("Gemini API Error:", errorMsg);
    if (errorMsg.includes('suspended')) {
      return "Excuses, de studieadviseur is momenteel niet beschikbaar omdat de API-toegang is stopgezet. Controleer de instellingen in AI Studio.";
    }
    return "Excuses, de studieadviseur is tijdelijk niet bereikbaar. Probeer het later nog eens.";
  }
};
