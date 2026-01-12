import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Laad env variabelen op basis van de huidige modus (development/production)
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    // Polyfill voor process.env om crashes in de browser te voorkomen
    // en om de Vercel Environment Variables beschikbaar te maken in de code.
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});