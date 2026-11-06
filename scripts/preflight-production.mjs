import { createClient } from "@supabase/supabase-js";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Majburiy env topilmadi: ${missing.join(", ")}`);
  process.exit(1);
}
if (process.env.ENABLE_DEMO_MODE === "true") {
  console.error("Production preflight: ENABLE_DEMO_MODE=false bo'lishi kerak.");
  process.exit(1);
}
if (process.env.PUBLIC_REGISTRATION_ENABLED === "true") {
  console.error(
    "Seller-first production preflight: PUBLIC_REGISTRATION_ENABLED=false bo'lishi kerak.",
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const checks = await Promise.all([
  supabase.from("profiles").select("id, role, created_by").limit(1),
  supabase.from("enrollments").select("id, granted_by").limit(1),
  supabase.from("homework_ai_usage").select("id").limit(1),
  supabase.from("sales_leads").select("id, status, assigned_to").limit(1),
  supabase.from("sales_lead_activities").select("id, activity_type").limit(1),
]);

const errors = checks.map((result) => result.error).filter(Boolean);
if (errors.length) {
  console.error(
    `Production DB preflight muvaffaqiyatsiz: ${errors
      .map((error) => `${error.code ?? "unknown"} ${error.message}`)
      .join(" | ")}`,
  );
  process.exit(1);
}
console.log("Production preflight: env, Supabase auth va 0015–0017 schema tayyor.");
