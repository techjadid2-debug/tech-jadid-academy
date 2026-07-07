"use client";

import { createBrowserClient } from "@supabase/ssr";

// Brauzer tomon Supabase klienti (real rejim uchun tayyor).
export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
