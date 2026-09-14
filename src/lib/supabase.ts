import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely, so this
 * (and anything that imports it) must only ever run server-side - Route
 * Handlers, middleware, lib/db/*. The `server-only` import above turns any
 * accidental import from a "use client" component into a build error.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan " +
        "SUPABASE_SERVICE_ROLE_KEY di .env.local.",
    );
  }

  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
