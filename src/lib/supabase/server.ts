import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, isSupabaseConfigured } from "@/lib/env";

// Server tomon Supabase klienti (real rejim uchun tayyor).
// Env sozlanmaguncha null qaytaradi — kod DEMO rejimda ishlaydi.
export async function createSupabaseServer() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component ichida yozib bo'lmaydi — middleware sessiyani yangilaydi.
        }
      },
    },
  });
}
