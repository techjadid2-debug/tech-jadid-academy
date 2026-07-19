"use server";

import { redirect } from "next/navigation";
import { emailForLogin, normalizeLogin, setDemoUser, makeUserId, type AppUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createRequest } from "@/lib/enrollment-requests";
import { AI_FOUNDATIONS } from "@/lib/course-data";
import { isSupabaseConfigured } from "@/lib/env";

// ============================================================================
// Ochiq ro'yxatdan o'tish — o'quvchi o'zi hisob yaratadi, lekin bu darsларga
// kirish bermaydi: kursga "ariza" (enrollment_requests, pending) yaratiladi.
// Ustoz cohort va payment order tayyorlaydi; kirish faqat payment paid bo'lgach ochiladi.
// ============================================================================

function readForm(formData: FormData) {
  const login = normalizeLogin(String(formData.get("login") ?? ""));
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  if (!login || password.length < 8 || !fullName) return null;
  return { login, password, fullName, contact };
}

export async function registerStudent(formData: FormData) {
  const input = readForm(formData);
  if (!input) redirect("/register?error=invalid");

  const courseSlug = AI_FOUNDATIONS.slug;

  if (!isSupabaseConfigured) {
    const user: AppUser = {
      id: makeUserId(input.contact || input.login),
      name: input.fullName,
      email: "",
      phone: input.contact,
      role: "student",
    };
    await setDemoUser(user);
    await createRequest(user.id, courseSlug, input.contact, input.fullName);
    redirect("/dashboard?requested=1");
  }

  const admin = createSupabaseAdmin();
  if (!admin) redirect("/register?error=server");

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: emailForLogin(input.login),
    password: input.password,
    email_confirm: true,
  });
  if (authError || !authData.user) {
    redirect("/register?error=duplicate");
  }

  const userId = authData.user.id;
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    login: input.login,
    full_name: input.fullName,
    phone: input.contact || null,
    role: "student",
  });
  if (profileError) {
    console.error("[register] profile insert failed", profileError);
    await admin.auth.admin.deleteUser(userId);
    redirect("/register?error=duplicate");
  }

  await createRequest(userId, courseSlug, input.contact, input.fullName);

  // Yangi hisobga darhol sessiya ochamiz (login sahifasiga qaytmasin).
  const sb = await createSupabaseServer();
  await sb?.auth.signInWithPassword({ email: emailForLogin(input.login), password: input.password });

  redirect("/dashboard?requested=1");
}
