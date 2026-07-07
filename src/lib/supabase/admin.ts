import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";

// ============================================================================
// Service-role klient — RLS'ni chetlab o'tadi.
// FAQAT server tomonda (webhook, enrollment yozish, ichki lookuplar) ishlatiladi.
// Service key yo'q bo'lsa null → kod DEMO rejimda qoladi.
// ============================================================================
export function createSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured || !env.supabaseServiceKey) return null;
  return createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
