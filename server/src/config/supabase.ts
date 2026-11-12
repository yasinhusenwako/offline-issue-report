import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './env';
import { Database } from '../types/database';

// ─── Admin client (service role) — bypasses RLS; server-use only ────────────
let adminClient: SupabaseClient<Database> | null = null;

export function getAdminClient(): SupabaseClient<Database> {
  if (!adminClient) {
    adminClient = createClient<Database>(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return adminClient;
}

// ─── Anon client (respects RLS) ─────────────────────────────────────────────
let anonClient: SupabaseClient<Database> | null = null;

export function getAnonClient(): SupabaseClient<Database> {
  if (!anonClient) {
    anonClient = createClient<Database>(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return anonClient;
}

// Default export — admin client for backend use
export const supabase = getAdminClient();

