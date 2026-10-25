import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !anon) {
    throw new Error("Google haijaunganishwa kwenye Supabase. Washa provider ya Google, au ingia kwa barua pepe.");
  }
  client = createClient(url, anon, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return client;
}
