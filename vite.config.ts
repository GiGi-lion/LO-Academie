import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Laad env variabelen (zoals uit .env bestand)
  const env = loadEnv(mode, process.cwd(), '');

  // -----------------------------------------------------------------------
  // HELPER: Als je het .env bestand niet kunt openen of vinden,
  // plak je Google Gemini API Key dan hieronder tussen de aanhalingstekens.
  // -----------------------------------------------------------------------
  const FALLBACK_KEY = "AIzaSyAI1RuX5VYeLUK1JMaQIZyJaSHT_67B3xM"; 

  // We kijken eerst of er een key in .env staat, en anders gebruiken we de FALLBACK_KEY hierboven.
  const finalApiKey = env.API_KEY || (FALLBACK_KEY !== "PLAK_HIER_JE_KEY_ALS_ENV_NIET_WERKT" ? FALLBACK_KEY : "");

  return {
    plugins: [react()],
    define: {
      // Dit zorgt dat 'process.env.API_KEY' beschikbaar is in je React code
      'process.env.API_KEY': JSON.stringify(finalApiKey),
    }
  };
});