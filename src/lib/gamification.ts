import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

// ============================================================================
// Gamifikatsiya: kunlik streak + ball + nishonlar.
//
// Supabase-only xususiyat (demo rejimda jimgina o'tkazib yuboriladi — xuddi
// to'lov demo rejimda mock bo'lgani kabi). Barcha yozish service role orqali
// bitta yo'ldan o'tadi.
//
// Ball formulasi: +10 dars yakunlanganda, +savol balli (default 10) birinchi
// to'g'ri javobda, +50 bonus kurs 100% bo'lganda (progress.ts chaqiradi).
// ============================================================================

export interface ActivityInput {
  lessonsCompleted?: number;
  quizCorrect?: number;
  points?: number;
}

/**
 * Kunlik faollik jurnalini va jamlangan ball/streak holatini yangilaydi.
 * Streak qoidasi: oxirgi faollik bugun — o'zgarmaydi; kecha — +1; aks holda 1.
 */
export async function recordActivity(userId: string, input: ActivityInput): Promise<void> {
  const admin = createSupabaseAdmin();
  if (!admin) return;

  const { error } = await admin.rpc("record_gamification_activity", {
    p_user_id: userId,
    p_lessons_completed: input.lessonsCompleted ?? 0,
    p_quiz_correct: input.quizCorrect ?? 0,
    p_points: input.points ?? 0,
  });
  if (error) console.error("[gamification] recordActivity failed", error);
}

/** Nishon beradi (allaqachon bo'lsa jim o'tadi). */
export async function awardBadge(userId: string, code: string): Promise<boolean> {
  const admin = createSupabaseAdmin();
  if (!admin) return false;
  const { data, error } = await admin
    .from("user_badges")
    .insert({ user_id: userId, badge_code: code })
    .select("badge_code")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") return false;
    console.error("[gamification] awardBadge failed", error);
    return false;
  }
  return Boolean(data);
}

export interface UserPoints {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
}

export async function getUserPoints(userId: string): Promise<UserPoints | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("user_points")
    .select("total_points, current_streak, longest_streak")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    totalPoints: data.total_points as number,
    currentStreak: data.current_streak as number,
    longestStreak: data.longest_streak as number,
  };
}

export interface UserBadge {
  code: string;
  title: string;
  description: string;
  icon: string | null;
  earnedAt: string;
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const admin = createSupabaseAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("user_badges")
    .select("earned_at, badges ( code, title, description, icon )")
    .eq("user_id", userId)
    .order("earned_at", { ascending: true });
  return (data ?? []).flatMap((r) => {
    const b = r.badges as unknown as { code: string; title: string; description: string; icon: string | null } | null;
    if (!b) return [];
    return [{ code: b.code, title: b.title, description: b.description, icon: b.icon, earnedAt: r.earned_at as string }];
  });
}
