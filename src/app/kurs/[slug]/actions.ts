"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCourseAsync } from "@/lib/course";
import { createCheckout } from "@/lib/payments";
import type { PaymentProvider, PricingKind } from "@/lib/types";

/**
 * Kurs sahifasidagi "Sotib olish" tugmasi. Foydalanuvchi kirmagan bo'lsa —
 * login sahifasiga; aks holda checkout yaratib, to'lov sahifasiga yo'naltiradi.
 */
export async function startCheckout(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const kind = String(formData.get("kind") ?? "lifetime") as PricingKind;
  const provider = String(formData.get("provider") ?? "payme") as PaymentProvider;
  const step = formData.get("step") === "2" ? "2" : "1";

  const course = await getCourseAsync(slug);
  if (!course) redirect("/");

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/kurs/${slug}?plan=${kind}`)}`);
  }

  const option = course.pricing.find((p) => p.kind === kind) ?? course.pricing[0];

  const checkout = createCheckout({
    provider,
    userId: user.id,
    courseSlug: slug,
    kind: option.kind,
    amountUzs: option.priceUzs,
    step,
  });

  redirect(checkout.redirectUrl);
}
