export type RegistrationError = "invalid" | "contact" | "password" | "consent";

export interface RegistrationInput {
  login: string;
  password: string;
  fullName: string;
  contact: string;
}

export function normalizeContact(value: string): string | null {
  const contact = value.trim();
  const telegram = contact.match(/^(?:https?:\/\/)?(?:www\.)?t\.me\/([a-zA-Z0-9_]{5,32})\/?$/i)
    ?? contact.match(/^@([a-zA-Z0-9_]{5,32})$/);
  if (telegram) return `@${telegram[1]}`;

  const digits = contact.replace(/[^0-9+]/g, "");
  const normalized = digits.startsWith("+") ? digits : digits.length === 9 ? `+998${digits}` : `+${digits}`;
  return /^\+998\d{9}$/.test(normalized) ? normalized : null;
}

export function parseRegistrationForm(formData: FormData):
  | { ok: true; value: RegistrationInput }
  | { ok: false; error: RegistrationError } {
  const rawLogin = String(formData.get("login") ?? "").trim().toLowerCase();
  const login = /^[a-z0-9][a-z0-9_.-]{2,31}$/.test(rawLogin) ? rawLogin : null;
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
  const contact = normalizeContact(String(formData.get("contact") ?? ""));

  if (!login || fullName.length < 2 || password.length < 8) return { ok: false, error: "invalid" };
  if (!contact) return { ok: false, error: "contact" };
  if (password !== passwordConfirm) return { ok: false, error: "password" };
  if (formData.get("consent") !== "on") return { ok: false, error: "consent" };
  return { ok: true, value: { login, password, fullName, contact } };
}
