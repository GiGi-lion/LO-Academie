import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Laad env variabelen (zoals uit .env bestand)
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Dit zorgt dat 'process.env.API_KEY' beschikbaar is in je React code
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  };
});