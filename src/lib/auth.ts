import "server-only";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

// ============================================================================
// Autentifikatsiya qatlami (dual-mode).
//
// REAL rejim (Supabase ulangan): getCurrentUser Supabase Auth sessiyasidan
// o'qiydi. O'quvchilar admin yaratgan login + parol bilan kiradi.
//
// DEMO rejim (Supabase ulanmagan): foydalanuvchi `tj_user` cookie'da saqlanadi —
// tashqi xizmatlarsiz to'liq oqimni sinash uchun.
//
// Ikkala rejimda ham API shakli bir xil.
// ============================================================================

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "student" | "instructor" | "admin";
}

const USER_COOKIE = "tj_user";
const LOGIN_EMAIL_DOMAIN = "users.techjadid.local";

export function normalizeLogin(value: string): string | null {
  const login = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_.-]{2,31}$/.test(login) ? login : null;
}

/** Supabase Auth email talab qiladi, lekin o'quvchining shaxsiy emaili kerak emas. */
export function emailForLogin(login: string): string {
  return `${login}@${LOGIN_EMAIL_DOMAIN}`;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  return isSupabaseConfigured ? getSupabaseUser() : getDemoUser();
}

// ---- REAL rejim ----------------------------------------------------------

async function getSupabaseUser(): Promise<AppUser | null> {
  const sb = await createSupabaseServer();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const profile = await getProfile(user.id);
  return {
    id: user.id,
    name: profile.full_name || user.email || "O'quvchi",
    email: user.email ?? "",
    phone: profile.phone ?? "",
    role: profile.role === "admin" || profile.role === "instructor" ? profile.role : "student",
  };
}

interface ProfileRow {
  full_name: string | null;
  phone: string | null;
  role: string | null;
}

/** Profil server tomonda o'qiladi; sessiyani o'qish paytida DB yozmaymiz. */
async function getProfile(id: string): Promise<ProfileRow> {
  const admin = createSupabaseAdmin();
  if (!admin) return { full_name: null, phone: null, role: "student" };

  const { data, error } = await admin
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("[auth] profile lookup failed", error);
  return (data as ProfileRow) ?? { full_name: null, phone: null, role: "student" };
}

// ---- DEMO rejim ----------------------------------------------------------

async function getDemoUser(): Promise<AppUser | null> {
  const store = await cookies();
  const raw = store.get(USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AppUser;
    if (!parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Server Action ichida chaqiriladi — demo foydalanuvchini o'rnatadi. */
export async function setDemoUser(user: AppUser): Promise<void> {
  const store = await cookies();
  store.set(USER_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Chiqish — real rejimda Supabase sessiyasini yopadi, demoda cookie'ni o'chiradi. */
export async function clearUser(): Promise<void> {
  if (isSupabaseConfigured) {
    const sb = await createSupabaseServer();
    await sb?.auth.signOut();
    return;
  }
  const store = await cookies();
  store.delete(USER_COOKIE);
}

/** Telefon/email'dan barqaror demo ID yasaydi. */
export function makeUserId(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return "u_" + Math.abs(h).toString(36);
}
