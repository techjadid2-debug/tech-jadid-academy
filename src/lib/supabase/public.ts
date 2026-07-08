import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";

// ============================================================================
// Anon-kalitli klient — RLS'ga bo'ysunadi. Ommaviy kontent (kurs/modul/dars/narx —
// barchasi `select using(true)` policy'ga ega) o'qish uchun; service-role talab
// qilmaydi, shuning uchun SUPABASE_SERVICE_ROLE_KEY sozlanmagan bo'lsa ham ishlaydi.
// ============================================================================
export function createSupabasePublic(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
