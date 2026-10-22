import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// True only when both settings were added (in Vercel or in .env.local).
export const isConfigured = Boolean(url && key);

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-key'
);
