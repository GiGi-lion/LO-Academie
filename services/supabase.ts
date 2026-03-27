import { createClient } from '@supabase/supabase-js';

// Suppress specific Supabase refresh token errors globally
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Refresh Token Not Found') || args[0].includes('Invalid Refresh Token'))
  ) {
    return; // Suppress
  }
  if (
    args[0] &&
    args[0].message &&
    (args[0].message.includes('Refresh Token Not Found') || args[0].message.includes('Invalid Refresh Token'))
  ) {
    return; // Suppress
  }
  originalConsoleError(...args);
};

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      event.reason.message &&
      (event.reason.message.includes('Refresh Token Not Found') ||
        event.reason.message.includes('Invalid Refresh Token'))
    ) {
      event.preventDefault(); // Suppress the error
      try {
        // Forcefully clear Supabase auth tokens from local storage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {}
    }
  });
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL of Anon Key ontbreekt in de environment variabelen.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
