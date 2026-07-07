"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { grantAccess } from "@/lib/access";
import { getCourse, allLessons } from "@/lib/course-data";
import type { PricingKind } from "@/lib/types";

/**
 * DEMO to'lovni yakunlaydi — real provayder webhook o'rniga.
 * Real rejimda buni /api/webhooks/{provider} bajaradi (grantAccess bilan bir xil).
 */
export async function completeMockPayment(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const kind = String(formData.get("kind") ?? "lifetime") as PricingKind;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/kurs/${slug}`)}`);

  const course = getCourse(slug);
  if (!course) redirect("/");

  // Kirishni ochamiz (lifetime → umrbod, monthly → 30 kun).
  await grantAccess(user.id, slug, kind === "monthly" ? "monthly" : "lifetime");

  const first = allLessons(course)[0];
  redirect(`/learn/${slug}/${first.order}?welcome=1`);
}
