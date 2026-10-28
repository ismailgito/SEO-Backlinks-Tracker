import { createClient } from '@supabase/supabase-js';

export function isSupabaseAdminConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && serviceKey && url.startsWith('http') && serviceKey.length > 20);
}

let adminClient = null;

export function getSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }
  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
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

// A throwaway client for one-off credential checks. signInWithPassword keeps
// the resulting session on the client instance, so the shared singleton below
// must never be used for it (one request's session would be visible to the next).
export function createEphemeralAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || !url.startsWith('http') || anonKey.length < 10) {
    return null;
  }
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

let anonClient = null;

export function getSupabaseAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || !url.startsWith('http') || anonKey.length < 10) {
    return null;
  }
  if (!anonClient) {
    anonClient = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return anonClient;
}
