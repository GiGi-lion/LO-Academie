import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Laad env variabelen. We gebruiken process.cwd() veilig.
  // De derde parameter '' zorgt dat alle env vars geladen worden (nodig voor API_KEY zonder VITE_ prefix).
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Injecteer de API Key veilig in de client code.
      // Als env.API_KEY undefined is, gebruiken we een lege string om runtime crashes te voorkomen bij het opstarten.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    }
  };
});