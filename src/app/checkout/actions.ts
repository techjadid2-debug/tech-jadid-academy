"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getActiveEnrollment, grantAccess, unlockFullAccess } from "@/lib/access";
import { allLessons } from "@/lib/course-data";
import { getCourseAsync } from "@/lib/course";
import { isPaymentConfigured } from "@/lib/env";
import type { EnrollmentSource, PaymentProvider, PricingKind } from "@/lib/types";

/**
 * DEMO to'lovni yakunlaydi — real provayder webhook o'rniga.
 * Real rejimda buni /api/webhooks/{provider} bajaradi (grantAccess bilan bir xil).
 */
export async function completeMockPayment(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const kind = String(formData.get("kind") ?? "lifetime") as PricingKind;
  const provider = String(formData.get("provider") ?? "payme") as PaymentProvider;
  const step = formData.get("step") === "2" ? "2" : "1";

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/kurs/${slug}`)}`);

  const course = await getCourseAsync(slug);
  if (!course) redirect("/");

  // Haqiqiy provayder kalitlari ulangan bo'lsa, demo (bepul) tasdiqlashga yo'l qo'ymaymiz —
  // real to'lov faqat webhook orqali kirish ochishi kerak.
  if (isPaymentConfigured(provider)) {
    redirect(`/kurs/${slug}?checkout=unavailable`);
  }

  if (kind === "installment2" && step === "2") {
    // "2 bo'lib to'lash"ning 2-to'lovi — avvalgi (qisman) yozilishni to'liq ochamiz.
    const existing = await getActiveEnrollment(user.id, slug);
    if (!existing) redirect(`/kurs/${slug}#narx`);
    await unlockFullAccess(user.id, slug);
    redirect(`/dashboard?unlocked=1`);
  }

  // Kirishni ochamiz (lifetime/installment2-1qism → umrbod struktura, monthly → 30 kun).
  await grantAccess(user.id, slug, kind as EnrollmentSource);

  const first = allLessons(course)[0];
  redirect(`/learn/${slug}/${first.order}?welcome=1`);
}
