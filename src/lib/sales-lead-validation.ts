export type PublicLeadError = "invalid" | "phone" | "consent" | "course";

export interface PublicLeadInput {
  fullName: string;
  phone: string;
  courseSlug: string;
}

export function normalizeSalesPhone(value: string): string | null {
  const raw = value.trim();
  const digits = raw.replace(/\D/g, "");
  const normalized =
    digits.length === 9
      ? `+998${digits}`
      : digits.length === 12 && digits.startsWith("998")
        ? `+${digits}`
        : raw.startsWith("+") && digits.length === 12
          ? `+${digits}`
          : "";
  return /^\+998\d{9}$/.test(normalized) ? normalized : null;
}

export function parsePublicLeadForm(
  formData: FormData,
  validCourseSlugs: readonly string[],
):
  | { ok: true; value: PublicLeadInput }
  | { ok: false; error: PublicLeadError } {
  const fullName = String(formData.get("fullName") ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
  const phone = normalizeSalesPhone(String(formData.get("phone") ?? ""));
  const courseSlug = String(formData.get("courseSlug") ?? "");

  if (String(formData.get("company") ?? "").trim()) {
    return { ok: false, error: "invalid" };
  }
  if (fullName.length < 2) return { ok: false, error: "invalid" };
  if (!phone) return { ok: false, error: "phone" };
  if (!validCourseSlugs.includes(courseSlug)) return { ok: false, error: "course" };
  if (formData.get("consent") !== "on") return { ok: false, error: "consent" };

  return { ok: true, value: { fullName, phone, courseSlug } };
}

export function canEditSalesLead(
  viewer: { id: string; role: string },
  lead: { assignedTo: string | null },
): boolean {
  return viewer.role === "admin" || lead.assignedTo === viewer.id;
}
