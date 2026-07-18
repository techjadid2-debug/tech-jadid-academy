"use server";

import { redirect } from "next/navigation";
import { getCourseAsync } from "@/lib/course";
import { getCurrentUser } from "@/lib/auth";
import { createRequest } from "@/lib/enrollment-requests";
import type { PricingKind } from "@/lib/types";

/** Kirgan, lekin hali ariza yubormagan (yoki rad etilgan) o'quvchi uchun — qayta ariza yuboradi. */
export async function requestEnrollment(formData: FormData) {
  const user = await getCurrentUser();
  const slug = String(formData.get("slug") ?? "");
  if (!user || !slug) redirect(`/login?next=${encodeURIComponent(`/kurs/${slug}`)}`);

  await createRequest(user.id, slug, user.phone || user.email || "", user.name);
  redirect(`/kurs/${slug}#narx`);
}

/**
 * Qo'lda to'lov ko'rsatmasiga yo'naltiradi. Hisob faqat admin tasdiqlagach
 * yaratiladi, shuning uchun xarid bosqichida login talab qilinmaydi.
 */
export async function startCheckout(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const kind = String(formData.get("kind") ?? "lifetime") as PricingKind;
  const step: "1" | "2" = formData.get("step") === "2" ? "2" : "1";

  const course = await getCourseAsync(slug);
  if (!course) redirect("/");

  const effectiveKind: PricingKind = step === "2" ? "installment2" : kind;
  const option = course.pricing.find((p) => p.kind === effectiveKind) ?? course.pricing[0];
  const params = new URLSearchParams({ slug, kind: option.kind, step });
  redirect(`/checkout?${params.toString()}`);
}
