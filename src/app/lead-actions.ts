"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { COURSES } from "@/lib/course-data";
import { parsePublicLeadForm } from "@/lib/sales-lead-validation";
import {
  notifyAdminsOfSalesLead,
  submitPublicSalesLead,
} from "@/lib/sales-leads";

export interface LeadFormState {
  status: "idle" | "success" | "error";
  message: string;
  courseSlug?: string;
}

export async function submitLead(
  _previous: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const parsed = parsePublicLeadForm(
    formData,
    COURSES.map((course) => course.slug),
  );
  if (!parsed.ok) {
    const messages = {
      invalid: "Ismingizni to'liq kiriting.",
      phone: "Telefon raqamini +998 90 123 45 67 ko'rinishida kiriting.",
      consent: "Qo'ng'iroq qilishimiz uchun rozilikni belgilang.",
      course: "Kursni tanlang.",
    };
    return { status: "error", message: messages[parsed.error] };
  }

  const leadId = await submitPublicSalesLead(parsed.value);
  if (!leadId) {
    return {
      status: "error",
      message: "So'rovni saqlab bo'lmadi. Birozdan so'ng qayta urinib ko'ring.",
    };
  }
  after(() => notifyAdminsOfSalesLead(parsed.value, leadId));
  revalidatePath("/sotuvchi");
  return {
    status: "success",
    message: "Ma'lumotingiz qabul qilindi. Sotuvchi sizga tez orada qo'ng'iroq qiladi.",
    courseSlug: parsed.value.courseSlug,
  };
}
