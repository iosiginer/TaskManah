import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Returns a Supabase client if credentials are configured, null otherwise.
 * The app gracefully falls back to localStorage-only mode when null.
 */
export const supabase =
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
