import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === "undefined" || !supabaseAnonKey || supabaseAnonKey === "undefined") {
  console.warn('Supabase URL of Anon Key ontbreekt in de environment variabelen. Real-time updates zullen niet werken.');
}

export const supabase = createClient(
  (!supabaseUrl || supabaseUrl === "undefined") ? 'https://placeholder.supabase.co' : supabaseUrl,
  (!supabaseAnonKey || supabaseAnonKey === "undefined") ? 'placeholder' : supabaseAnonKey
);
