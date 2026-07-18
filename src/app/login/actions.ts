"use server";

import { redirect } from "next/navigation";
import { setDemoUser, makeUserId, clearUser, emailForLogin, normalizeLogin, type AppUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

function safeNext(next: FormDataEntryValue | null): string {
  const n = String(next ?? "/dashboard");
  // Ochiq redirect'ni oldini olish — faqat ichki yo'llar.
  return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

// ============================================================================
// REAL rejim — admin yaratgan login + parol.
// ============================================================================

export async function signInWithPassword(formData: FormData) {
  const login = normalizeLogin(String(formData.get("login") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!login || !password) redirect(`/login?next=${encodeURIComponent(next)}&error=credentials`);

  const sb = await createSupabaseServer();
  if (!sb) redirect(`/login?next=${encodeURIComponent(next)}`);

  const { error } = await sb.auth.signInWithPassword({ email: emailForLogin(login), password });
  if (error) {
    redirect(`/login?next=${encodeURIComponent(next)}&error=credentials`);
  }
  redirect(next);
}

// ============================================================================
// DEMO rejim — ism + kontakt orqali (Supabase ulanmaganda).
// ============================================================================

export async function demoLogin(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim() || "O'quvchi";
  const contact = String(formData.get("contact") ?? "").trim();
  const next = safeNext(formData.get("next"));

  const isEmail = contact.includes("@");
  const user: AppUser = {
    id: makeUserId(contact || name),
    name,
    email: isEmail ? contact : "",
    phone: isEmail ? "" : contact,
    role: "student",
  };

  await setDemoUser(user);
  redirect(next);
}

export async function logout() {
  await clearUser();
  redirect("/");
}
