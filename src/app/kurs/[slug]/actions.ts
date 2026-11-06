"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createRequest } from "@/lib/enrollment-requests";
import { getPendingPaymentForUser } from "@/lib/payments/db";
import { isPublicRegistrationEnabled } from "@/lib/env";

/** Kirgan, lekin hali ariza yubormagan (yoki rad etilgan) o'quvchi uchun — qayta ariza yuboradi. */
export async function requestEnrollment(formData: FormData) {
  if (!isPublicRegistrationEnabled) redirect("/login?registration=closed");
  const user = await getCurrentUser();
  const slug = String(formData.get("slug") ?? "");
  if (!user || !slug) redirect(`/login?next=${encodeURIComponent(`/kurs/${slug}`)}`);

  await createRequest(user.id, slug, user.phone || user.email || "", user.name);
  redirect(`/kurs/${slug}#narx`);
}

/**
 * Eski CTA'lar uchun moslik: faqat ustoz tayyorlagan shaxsiy order bo'lsa
 * checkout ochiladi, aks holda ariza oqimiga qaytadi.
 */
export async function startCheckout(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/kurs/${slug}`)}`);
  const payment = await getPendingPaymentForUser(user.id, slug);
  if (payment) redirect(`/checkout?order=${payment.id}`);
  if (!isPublicRegistrationEnabled) redirect(`/kurs/${slug}#narx`);
  await createRequest(user.id, slug, user.phone || user.email || "", user.name);
  redirect("/dashboard?requested=1");
}
