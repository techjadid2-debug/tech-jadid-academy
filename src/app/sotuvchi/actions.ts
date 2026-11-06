"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  emailForLogin,
  getCurrentUser,
  isSeller,
  normalizeLogin,
} from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { canManageSellerStudent } from "@/lib/roles";
import {
  addSalesLeadNote,
  claimSalesLead,
  completeSalesLead,
  getSalesLead,
  reassignSalesLead,
  SALES_LEAD_STATUSES,
  updateSalesLead,
  type SalesLeadStatus,
} from "@/lib/sales-leads";
import {
  canEditSalesLead,
  normalizeSalesPhone,
} from "@/lib/sales-lead-validation";

async function requireSellerDb() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/sotuvchi");
  if (!isSeller(user)) redirect("/dashboard");
  const admin = createSupabaseAdmin();
  if (!admin) redirect("/sotuvchi?error=no-service-key");
  return { user, admin };
}

function leadHref(leadId: string, key: "saved" | "error", value: string) {
  return `/sotuvchi/leads/${encodeURIComponent(leadId)}?${key}=${encodeURIComponent(value)}`;
}

export async function claimLead(formData: FormData) {
  const { user } = await requireSellerDb();
  const leadId = String(formData.get("leadId") ?? "");
  if (!leadId || !(await claimSalesLead(leadId, user))) {
    redirect("/sotuvchi?error=claim");
  }
  revalidatePath("/sotuvchi");
  redirect(leadHref(leadId, "saved", "claimed"));
}

export async function saveLeadDetails(formData: FormData) {
  const { user } = await requireSellerDb();
  const leadId = String(formData.get("leadId") ?? "");
  const fullName = String(formData.get("fullName") ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
  const phone = normalizeSalesPhone(String(formData.get("phone") ?? ""));
  const secondaryRaw = String(formData.get("secondaryPhone") ?? "").trim();
  const secondaryPhone = secondaryRaw ? normalizeSalesPhone(secondaryRaw) : null;
  const ageRaw = String(formData.get("age") ?? "").trim();
  const age = ageRaw ? Number(ageRaw) : null;
  const extraInfo = String(formData.get("extraInfo") ?? "").trim().slice(0, 2000) || null;
  const statusRaw = String(formData.get("status") ?? "") as SalesLeadStatus;
  const followUpRaw = String(formData.get("nextFollowUpAt") ?? "").trim();
  const nextFollowUpAt =
    followUpRaw && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(followUpRaw)
      ? new Date(`${followUpRaw}:00+05:00`).toISOString()
      : null;

  if (
    !leadId ||
    fullName.length < 2 ||
    !phone ||
    (secondaryRaw && !secondaryPhone) ||
    (age !== null && (!Number.isInteger(age) || age < 12 || age > 100)) ||
    !SALES_LEAD_STATUSES.includes(statusRaw) ||
    (statusRaw === "follow_up" && !nextFollowUpAt)
  ) {
    redirect(leadHref(leadId, "error", "invalid"));
  }

  const saved = await updateSalesLead({
    leadId,
    actor: user,
    fullName,
    phone,
    secondaryPhone,
    age,
    extraInfo,
    status: statusRaw,
    nextFollowUpAt,
  });
  if (!saved) redirect(leadHref(leadId, "error", "forbidden"));
  revalidatePath("/sotuvchi");
  revalidatePath(`/sotuvchi/leads/${leadId}`);
  redirect(leadHref(leadId, "saved", "details"));
}

export async function addLeadNote(formData: FormData) {
  const { user } = await requireSellerDb();
  const leadId = String(formData.get("leadId") ?? "");
  const body = String(formData.get("body") ?? "");
  if (!leadId || !(await addSalesLeadNote(leadId, user, body))) {
    redirect(leadHref(leadId, "error", "note"));
  }
  revalidatePath(`/sotuvchi/leads/${leadId}`);
  redirect(leadHref(leadId, "saved", "note"));
}

export async function assignLead(formData: FormData) {
  const { user } = await requireSellerDb();
  const leadId = String(formData.get("leadId") ?? "");
  const sellerId = String(formData.get("sellerId") ?? "") || null;
  if (!leadId || !(await reassignSalesLead(leadId, user, sellerId))) {
    redirect(leadHref(leadId, "error", "assign"));
  }
  revalidatePath("/sotuvchi");
  revalidatePath(`/sotuvchi/leads/${leadId}`);
  redirect(leadHref(leadId, "saved", "assigned"));
}

export interface CompleteSaleState {
  status: "idle" | "success" | "error";
  message: string;
  login?: string;
  temporaryPassword?: string;
  created?: boolean;
}

export async function completeLeadSale(
  _previous: CompleteSaleState,
  formData: FormData,
): Promise<CompleteSaleState> {
  const { user, admin } = await requireSellerDb();
  const leadId = String(formData.get("leadId") ?? "");
  const login = normalizeLogin(String(formData.get("login") ?? ""));
  const password = String(formData.get("password") ?? "");
  const amountUzs = Number(String(formData.get("amountUzs") ?? "").replace(/\D/g, ""));
  const kind = formData.get("kind") === "monthly" ? "monthly" : "lifetime";
  if (!leadId || !login || !Number.isInteger(amountUzs) || amountUzs <= 0) {
    return { status: "error", message: "Login, tarif yoki to'lov summasi noto'g'ri." };
  }

  const lead = await getSalesLead(leadId);
  if (!lead || !canEditSalesLead(user, lead) || lead.status === "paid") {
    return { status: "error", message: "Bu leadni yakunlashga ruxsat yo'q yoki u allaqachon to'langan." };
  }

  const { data: existing, error: lookupError } = await admin
    .from("profiles")
    .select("id, role, created_by")
    .eq("login", login)
    .maybeSingle();
  if (lookupError) {
    return { status: "error", message: "O'quvchi hisobini tekshirib bo'lmadi." };
  }

  let userId: string;
  let created = false;
  if (existing) {
    if (
      !canManageSellerStudent(user, {
        role: existing.role as string,
        createdBy: (existing.created_by as string | null) ?? null,
      })
    ) {
      return { status: "error", message: "Bu login boshqa hisob yoki sotuvchiga tegishli." };
    }
    userId = existing.id as string;
  } else {
    if (password.length < 8) {
      return { status: "error", message: "Yangi hisob uchun kamida 8 belgili vaqtinchalik parol kiriting." };
    }
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: emailForLogin(login),
      password,
      email_confirm: true,
    });
    if (authError || !authData.user) {
      return { status: "error", message: "Login band yoki hisob yaratilmadi." };
    }
    userId = authData.user.id;
    created = true;
    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      login,
      full_name: lead.fullName,
      phone: lead.phone,
      role: "student",
      created_by: user.id,
    });
    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      return { status: "error", message: "O'quvchi profilini yaratib bo'lmadi." };
    }
  }

  const paymentId = await completeSalesLead({
    leadId,
    userId,
    amountUzs,
    kind,
    actor: user,
    login,
  });
  if (!paymentId) {
    if (created) await admin.auth.admin.deleteUser(userId);
    return {
      status: "error",
      message: "To'lov yoki kurs kirishini saqlab bo'lmadi. Hisob ochilmadi.",
    };
  }

  revalidatePath("/sotuvchi");
  revalidatePath(`/sotuvchi/leads/${leadId}`);
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: "To'lov saqlandi va kurs ochildi.",
    login,
    temporaryPassword: created ? password : undefined,
    created,
  };
}

export async function resetOwnedStudentPassword(formData: FormData) {
  const { user, admin } = await requireSellerDb();
  const studentId = String(formData.get("studentId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!studentId || !leadId || password.length < 8) {
    redirect(leadHref(leadId, "error", "password"));
  }

  let query = admin
    .from("profiles")
    .select("id")
    .eq("id", studentId)
    .eq("role", "student");
  if (user.role === "seller") query = query.eq("created_by", user.id);
  const { data: student } = await query.maybeSingle();
  if (!student) redirect(leadHref(leadId, "error", "forbidden"));

  const { error } = await admin.auth.admin.updateUserById(studentId, { password });
  if (error) redirect(leadHref(leadId, "error", "password"));
  redirect(leadHref(leadId, "saved", "password"));
}
