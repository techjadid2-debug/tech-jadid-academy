import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const login = (process.env.ADMIN_LOGIN ?? "").trim().toLowerCase();
const password = process.env.ADMIN_INITIAL_PASSWORD ?? "";
const fullName = (process.env.ADMIN_NAME ?? "Tech Jadid Admin").trim();

if (!url || !serviceKey || !/^[a-z0-9][a-z0-9_.-]{2,31}$/.test(login) || password.length < 8) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_LOGIN va kamida 8 belgili ADMIN_INITIAL_PASSWORD kerak.");
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const email = `${login}@users.techjadid.local`;

const { data: existing } = await admin.from("profiles").select("id").eq("login", login).maybeSingle();
if (existing) {
  console.log(`Administrator allaqachon mavjud: ${login}`);
  process.exit(0);
}

const { data: authData, error: authError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (authError || !authData.user) throw authError ?? new Error("Admin Auth foydalanuvchisi yaratilmadi.");

const { error: profileError } = await admin.from("profiles").insert({
  id: authData.user.id,
  login,
  full_name: fullName,
  role: "admin",
});
if (profileError) {
  await admin.auth.admin.deleteUser(authData.user.id);
  throw profileError;
}

console.log(`Administrator yaratildi: ${login}`);
