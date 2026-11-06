import "server-only";

import type { AppUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export interface SellerStudent {
  id: string;
  login: string;
  fullName: string;
  contact: string | null;
  courses: { slug: string; title: string }[];
}

export interface SellerAccount {
  id: string;
  login: string;
  fullName: string;
  createdAt: string;
}

export async function listSellerStudents(viewer: AppUser): Promise<SellerStudent[]> {
  const admin = createSupabaseAdmin();
  if (!admin || (viewer.role !== "seller" && viewer.role !== "admin")) return [];

  let query = admin
    .from("profiles")
    .select("id, login, full_name, phone")
    .eq("role", "student")
    .not("created_by", "is", null)
    .order("created_at", { ascending: false });
  if (viewer.role === "seller") query = query.eq("created_by", viewer.id);

  const { data: profiles, error } = await query;
  if (error || !profiles?.length) {
    if (error) console.error("[seller] student list failed", error);
    return [];
  }

  const userIds = profiles.map((profile) => profile.id as string);
  const { data: enrollments, error: enrollmentError } = await admin
    .from("enrollments")
    .select("user_id, courses!inner(slug, title)")
    .in("user_id", userIds);
  if (enrollmentError) console.error("[seller] enrollment list failed", enrollmentError);

  const byUser = new Map<string, { slug: string; title: string }[]>();
  for (const row of enrollments ?? []) {
    const course = row.courses as unknown as { slug: string; title: string };
    const userId = row.user_id as string;
    byUser.set(userId, [...(byUser.get(userId) ?? []), course]);
  }

  return profiles.map((profile) => ({
    id: profile.id as string,
    login: profile.login as string,
    fullName: (profile.full_name as string | null) ?? "O'quvchi",
    contact: (profile.phone as string | null) ?? null,
    courses: byUser.get(profile.id as string) ?? [],
  }));
}

export async function listSellerAccounts(): Promise<SellerAccount[]> {
  const admin = createSupabaseAdmin();
  if (!admin) return [];
  const { data, error } = await admin
    .from("profiles")
    .select("id, login, full_name, created_at")
    .eq("role", "seller")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[admin] seller list failed", error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    login: row.login as string,
    fullName: (row.full_name as string | null) ?? "Sotuvchi",
    createdAt: row.created_at as string,
  }));
}
