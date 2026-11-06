import "server-only";

import type { AppUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { sendTelegramMessage, telegramConfigured } from "@/lib/telegram";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCourseId } from "@/lib/supabase/db";
import type { PricingKind } from "@/lib/types";
import { canEditSalesLead } from "@/lib/sales-lead-validation";

export const SALES_LEAD_STATUSES = [
  "new",
  "contacted",
  "follow_up",
  "payment_pending",
  "paid",
  "lost",
] as const;

export type SalesLeadStatus = (typeof SALES_LEAD_STATUSES)[number];

export const SALES_LEAD_STATUS_LABELS: Record<SalesLeadStatus, string> = {
  new: "Yangi",
  contacted: "Bog'lanildi",
  follow_up: "Qayta qo'ng'iroq",
  payment_pending: "To'lov kutilmoqda",
  paid: "To'landi",
  lost: "Yopildi",
};

export interface SalesLead {
  id: string;
  courseSlug: string;
  courseTitle: string;
  fullName: string;
  phone: string;
  secondaryPhone: string | null;
  age: number | null;
  extraInfo: string | null;
  status: SalesLeadStatus;
  assignedTo: string | null;
  assignedName: string | null;
  customerUserId: string | null;
  customerLogin: string | null;
  pricingKind: PricingKind | null;
  amountUzs: number | null;
  firstContactedAt: string | null;
  nextFollowUpAt: string | null;
  paidAt: string | null;
  createdAt: string;
  lastSubmittedAt: string;
  updatedAt: string;
  resubmissionCount: number;
}

export interface SalesLeadActivity {
  id: string;
  activityType: string;
  body: string | null;
  actorId: string | null;
  actorName: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SalesLeadDetail extends SalesLead {
  activities: SalesLeadActivity[];
}

export interface SalesDashboardStats {
  newToday: number;
  unassigned: number;
  followUpDue: number;
  paidThisMonth: number;
}

export interface SalesLeadFilters {
  status?: SalesLeadStatus;
  assignedTo?: string;
  courseSlug?: string;
  query?: string;
}

interface DbLeadRow {
  id: string;
  full_name: string;
  phone: string;
  secondary_phone: string | null;
  age: number | null;
  extra_info: string | null;
  status: string;
  assigned_to: string | null;
  customer_user_id: string | null;
  pricing_kind: string | null;
  amount_uzs: number | null;
  first_contacted_at: string | null;
  next_follow_up_at: string | null;
  paid_at: string | null;
  created_at: string;
  last_submitted_at: string;
  updated_at: string;
  resubmission_count: number;
  courses: { slug: string; title: string } | null;
}

const LEAD_SELECT =
  "id, full_name, phone, secondary_phone, age, extra_info, status, assigned_to, customer_user_id, pricing_kind, amount_uzs, first_contacted_at, next_follow_up_at, paid_at, created_at, last_submitted_at, updated_at, resubmission_count, courses(slug, title)";

async function profileMap(ids: (string | null)[]) {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map<string, { name: string; login: string | null }>();
  const admin = createSupabaseAdmin();
  if (!admin) return new Map<string, { name: string; login: string | null }>();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, login")
    .in("id", unique);
  return new Map(
    (data ?? []).map((row) => [
      row.id as string,
      {
        name: (row.full_name as string | null) ?? "Noma'lum",
        login: (row.login as string | null) ?? null,
      },
    ]),
  );
}

function mapLead(
  row: DbLeadRow,
  profiles: Map<string, { name: string; login: string | null }>,
): SalesLead {
  const course = row.courses;
  const assignee = row.assigned_to ? profiles.get(row.assigned_to) : null;
  const customer = row.customer_user_id ? profiles.get(row.customer_user_id) : null;
  return {
    id: row.id,
    courseSlug: course?.slug ?? "",
    courseTitle: course?.title ?? "Noma'lum kurs",
    fullName: row.full_name,
    phone: row.phone,
    secondaryPhone: row.secondary_phone,
    age: row.age,
    extraInfo: row.extra_info,
    status: row.status as SalesLeadStatus,
    assignedTo: row.assigned_to,
    assignedName: assignee?.name ?? null,
    customerUserId: row.customer_user_id,
    customerLogin: customer?.login ?? null,
    pricingKind: row.pricing_kind as PricingKind | null,
    amountUzs: row.amount_uzs,
    firstContactedAt: row.first_contacted_at,
    nextFollowUpAt: row.next_follow_up_at,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    lastSubmittedAt: row.last_submitted_at,
    updatedAt: row.updated_at,
    resubmissionCount: row.resubmission_count,
  };
}

export async function submitPublicSalesLead(input: {
  courseSlug: string;
  fullName: string;
  phone: string;
}): Promise<string | null> {
  const admin = createSupabaseAdmin();
  const courseId = await getCourseId(input.courseSlug);
  if (!admin || !courseId) return null;
  const { data, error } = await admin.rpc("submit_sales_lead", {
    p_course_id: courseId,
    p_full_name: input.fullName,
    p_phone: input.phone,
  });
  if (error || !data) {
    console.error("[sales] submit lead failed", error);
    return null;
  }
  return data as string;
}

export async function notifyAdminsOfSalesLead(
  input: { courseSlug: string; fullName: string; phone: string },
  leadId: string,
) {
  if (telegramConfigured()) {
    const leadUrl = env.appUrl ? `${env.appUrl}/sotuvchi/leads/${leadId}` : "";
    const text = [
      "📞 Yangi CRM lead",
      `Ism: ${input.fullName}`,
      `Telefon: ${input.phone}`,
      `Kurs: ${input.courseSlug}`,
      leadUrl,
    ].filter(Boolean).join("\n");
    await Promise.all(
      env.telegramAdminIds.map((adminId) => sendTelegramMessage(adminId, text)),
    );
  }
}

export async function listSalesLeads(
  filters: SalesLeadFilters = {},
): Promise<{ available: boolean; leads: SalesLead[] }> {
  const admin = createSupabaseAdmin();
  if (!admin) return { available: false, leads: [] };
  let request = admin
    .from("sales_leads")
    .select(LEAD_SELECT)
    .order("last_submitted_at", { ascending: false })
    .limit(500);
  if (filters.status) request = request.eq("status", filters.status);
  if (filters.assignedTo === "unassigned") request = request.is("assigned_to", null);
  else if (filters.assignedTo) request = request.eq("assigned_to", filters.assignedTo);
  const { data, error } = await request;
  if (error) {
    if (error.code !== "42P01") console.error("[sales] lead list failed", error);
    return { available: false, leads: [] };
  }
  const rows = (data ?? []) as unknown as DbLeadRow[];
  const profiles = await profileMap(
    rows.flatMap((row) => [row.assigned_to, row.customer_user_id]),
  );
  let leads = rows.map((row) => mapLead(row, profiles));
  const query = filters.query?.trim().toLocaleLowerCase("uz-UZ");
  if (query) {
    leads = leads.filter(
      (lead) =>
        lead.fullName.toLocaleLowerCase("uz-UZ").includes(query) ||
        lead.phone.includes(query),
    );
  }
  if (filters.courseSlug) {
    leads = leads.filter((lead) => lead.courseSlug === filters.courseSlug);
  }
  return { available: true, leads };
}

export async function getSalesDashboardStats(): Promise<SalesDashboardStats> {
  const { leads } = await listSalesLeads();
  const now = new Date();
  const tashkentNow = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const todayKey = tashkentNow.toISOString().slice(0, 10);
  const monthKey = todayKey.slice(0, 7);
  return {
    newToday: leads.filter(
      (lead) =>
        new Date(new Date(lead.lastSubmittedAt).getTime() + 5 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10) === todayKey,
    ).length,
    unassigned: leads.filter(
      (lead) => !lead.assignedTo && lead.status !== "paid" && lead.status !== "lost",
    ).length,
    followUpDue: leads.filter(
      (lead) =>
        lead.status === "follow_up" &&
        Boolean(lead.nextFollowUpAt) &&
        new Date(lead.nextFollowUpAt!).getTime() <= now.getTime(),
    ).length,
    paidThisMonth: leads.filter(
      (lead) => lead.paidAt?.slice(0, 7) === monthKey,
    ).length,
  };
}

export async function getSalesLead(leadId: string): Promise<SalesLeadDetail | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const [{ data: row, error }, { data: activities, error: activityError }] =
    await Promise.all([
      admin.from("sales_leads").select(LEAD_SELECT).eq("id", leadId).maybeSingle(),
      admin
        .from("sales_lead_activities")
        .select("id, actor_id, activity_type, body, metadata, created_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
    ]);
  if (error || activityError || !row) {
    if (error) console.error("[sales] lead read failed", error);
    if (activityError) console.error("[sales] activity read failed", activityError);
    return null;
  }
  const typedRow = row as unknown as DbLeadRow;
  const actorIds = (activities ?? []).map((activity) => activity.actor_id as string | null);
  const profiles = await profileMap([
    typedRow.assigned_to,
    typedRow.customer_user_id,
    ...actorIds,
  ]);
  return {
    ...mapLead(typedRow, profiles),
    activities: (activities ?? []).map((activity) => ({
      id: activity.id as string,
      activityType: activity.activity_type as string,
      body: (activity.body as string | null) ?? null,
      actorId: (activity.actor_id as string | null) ?? null,
      actorName: activity.actor_id
        ? profiles.get(activity.actor_id as string)?.name ?? "Noma'lum"
        : null,
      metadata: (activity.metadata as Record<string, unknown> | null) ?? {},
      createdAt: activity.created_at as string,
    })),
  };
}

export async function claimSalesLead(leadId: string, actor: AppUser): Promise<boolean> {
  const admin = createSupabaseAdmin();
  if (!admin || (actor.role !== "seller" && actor.role !== "admin")) return false;
  const { data, error } = await admin
    .from("sales_leads")
    .update({ assigned_to: actor.id, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .is("assigned_to", null)
    .not("status", "in", '("paid","lost")')
    .select("id")
    .maybeSingle();
  if (error || !data) return false;
  await admin.from("sales_lead_activities").insert({
    lead_id: leadId,
    actor_id: actor.id,
    activity_type: "claimed",
    body: `${actor.name} leadni o'ziga oldi.`,
  });
  return true;
}

async function requireEditableLead(leadId: string, actor: AppUser) {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("sales_leads")
    .select("id, assigned_to, status, first_contacted_at")
    .eq("id", leadId)
    .maybeSingle();
  if (!data) return null;
  const lead = {
    assignedTo: (data.assigned_to as string | null) ?? null,
    status: data.status as SalesLeadStatus,
    firstContactedAt: (data.first_contacted_at as string | null) ?? null,
  };
  return canEditSalesLead(actor, lead) ? { admin, lead } : null;
}

export async function updateSalesLead(input: {
  leadId: string;
  actor: AppUser;
  fullName: string;
  phone: string;
  secondaryPhone: string | null;
  age: number | null;
  extraInfo: string | null;
  status: SalesLeadStatus;
  nextFollowUpAt: string | null;
}): Promise<boolean> {
  const access = await requireEditableLead(input.leadId, input.actor);
  if (!access || access.lead.status === "paid") return false;
  const now = new Date().toISOString();
  const statusChanged = access.lead.status !== input.status;
  const { error } = await access.admin
    .from("sales_leads")
    .update({
      full_name: input.fullName,
      phone: input.phone,
      secondary_phone: input.secondaryPhone,
      age: input.age,
      extra_info: input.extraInfo,
      status: input.status,
      next_follow_up_at: input.status === "follow_up" ? input.nextFollowUpAt : null,
      first_contacted_at:
        input.status !== "new" && !access.lead.firstContactedAt
          ? now
          : access.lead.firstContactedAt,
      updated_at: now,
    })
    .eq("id", input.leadId);
  if (error) {
    console.error("[sales] lead update failed", error);
    return false;
  }
  await access.admin.from("sales_lead_activities").insert({
    lead_id: input.leadId,
    actor_id: input.actor.id,
    activity_type: statusChanged ? "status_changed" : "updated",
    body: statusChanged
      ? `Holat: ${SALES_LEAD_STATUS_LABELS[input.status]}.`
      : "Mijoz ma'lumotlari yangilandi.",
    metadata: statusChanged
      ? { from: access.lead.status, to: input.status }
      : {},
  });
  return true;
}

export async function addSalesLeadNote(
  leadId: string,
  actor: AppUser,
  body: string,
): Promise<boolean> {
  const admin = createSupabaseAdmin();
  if (!admin || (actor.role !== "seller" && actor.role !== "admin")) return false;
  const note = body.trim().slice(0, 4000);
  if (!note) return false;
  const { data: lead } = await admin
    .from("sales_leads")
    .select("id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return false;
  const { error } = await admin.from("sales_lead_activities").insert({
    lead_id: leadId,
    actor_id: actor.id,
    activity_type: "note",
    body: note,
  });
  return !error;
}

export async function reassignSalesLead(
  leadId: string,
  actor: AppUser,
  assignedTo: string | null,
): Promise<boolean> {
  const admin = createSupabaseAdmin();
  if (!admin || actor.role !== "admin") return false;
  if (assignedTo) {
    const { data: seller } = await admin
      .from("profiles")
      .select("id")
      .eq("id", assignedTo)
      .eq("role", "seller")
      .maybeSingle();
    if (!seller) return false;
  }
  const { error } = await admin
    .from("sales_leads")
    .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .neq("status", "paid");
  if (error) return false;
  await admin.from("sales_lead_activities").insert({
    lead_id: leadId,
    actor_id: actor.id,
    activity_type: "reassigned",
    body: assignedTo ? "Lead boshqa sotuvchiga biriktirildi." : "Lead umumiy navbatga qaytarildi.",
    metadata: { assigned_to: assignedTo },
  });
  return true;
}

export async function completeSalesLead(input: {
  leadId: string;
  userId: string;
  amountUzs: number;
  kind: "lifetime" | "monthly";
  actor: AppUser;
  login: string;
}): Promise<string | null> {
  const access = await requireEditableLead(input.leadId, input.actor);
  if (!access || access.lead.status === "paid") return null;
  const { data, error } = await access.admin.rpc("complete_sales_lead", {
    p_lead_id: input.leadId,
    p_user_id: input.userId,
    p_amount_uzs: input.amountUzs,
    p_kind: input.kind,
    p_actor_id: input.actor.id,
    p_raw: {
      source: "sales_crm",
      seller_id: input.actor.id,
      login: input.login,
    },
  });
  if (error || !data) {
    console.error("[sales] complete sale failed", error);
    return null;
  }
  return data as string;
}
