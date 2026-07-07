"use server";

import { redirect } from "next/navigation";
import { setDemoUser, makeUserId, clearUser, ADMIN_EMAIL, type AppUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

function safeNext(next: FormDataEntryValue | null): string {
  const n = String(next ?? "/dashboard");
  // Ochiq redirect'ni oldini olish — faqat ichki yo'llar.
  return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

// ============================================================================
// REAL rejim — Supabase email OTP (6 xonali kod).
// Ikki qadam: (1) sendOtp emailga kod yuboradi, (2) verifyOtp kodni tekshiradi.
// ============================================================================

export async function sendOtp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(formData.get("next"));
  if (!email) redirect(`/login?next=${encodeURIComponent(next)}&error=email`);

  const sb = await createSupabaseServer();
  if (!sb) redirect(`/login?next=${encodeURIComponent(next)}`);

  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  const q = new URLSearchParams({ next, email });
  if (error) {
    q.set("error", "send");
    redirect(`/login?${q.toString()}`);
  }
  q.set("stage", "code");
  redirect(`/login?${q.toString()}`);
}

export async function verifyOtp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").trim();
  const next = safeNext(formData.get("next"));

  const sb = await createSupabaseServer();
  if (!sb) redirect(`/login?next=${encodeURIComponent(next)}`);

  const { error } = await sb.auth.verifyOtp({ email, token, type: "email" });

  if (error) {
    const q = new URLSearchParams({ next, email, stage: "code", error: "code" });
    redirect(`/login?${q.toString()}`);
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
    role: contact === ADMIN_EMAIL ? "admin" : "student",
  };

  await setDemoUser(user);
  redirect(next);
}

export async function logout() {
  await clearUser();
  redirect("/");
}
