import { createClient } from '@supabase/supabase-js';

// Default to the project's Supabase URL and public publishable key if VITE_* env vars are not set at build time
const DEFAULT_SUPABASE_URL = 'https://kdurnjmiegdqnimsiffp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_1JVu-GHMQq4HnsEdfofM7w_T4GD6SA-';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Client-side singleton Supabase client using only the public publishable anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
});
