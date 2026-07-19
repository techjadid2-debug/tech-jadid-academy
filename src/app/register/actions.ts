"use server";

import { redirect } from "next/navigation";
import { emailForLogin, setDemoUser, makeUserId, type AppUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createRequest } from "@/lib/enrollment-requests";
import { AI_FOUNDATIONS } from "@/lib/course-data";
import { isSupabaseConfigured } from "@/lib/env";
import { parseRegistrationForm } from "@/lib/registration";

// ============================================================================
// Ochiq ro'yxatdan o'tish — o'quvchi o'zi hisob yaratadi, lekin bu darsларga
// kirish bermaydi: kursga "ariza" (enrollment_requests, pending) yaratiladi.
// Ustoz cohort va payment order tayyorlaydi; kirish faqat payment paid bo'lgach ochiladi.
// ============================================================================

export async function registerStudent(formData: FormData) {
  const parsed = parseRegistrationForm(formData);
  if (!parsed.ok) redirect(`/register?error=${parsed.error}`);
  const input = parsed.value;

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
    const requested = await createRequest(user.id, courseSlug, input.contact, input.fullName);
    if (!requested) redirect("/register?error=server");
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

  const requested = await createRequest(userId, courseSlug, input.contact, input.fullName);
  if (!requested) {
    await admin.auth.admin.deleteUser(userId);
    redirect("/register?error=server");
  }

  // Yangi hisobga darhol sessiya ochamiz (login sahifasiga qaytmasin).
  const sb = await createSupabaseServer();
  const { error: signInError } = (await sb?.auth.signInWithPassword({ email: emailForLogin(input.login), password: input.password })) ?? { error: new Error("Supabase session unavailable") };
  if (signInError) redirect("/login?registered=1");

  redirect("/dashboard?requested=1");
}
