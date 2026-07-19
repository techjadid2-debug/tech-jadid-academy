import assert from "node:assert/strict";
import test from "node:test";
import { normalizeContact, parseRegistrationForm } from "./registration";

test("Telegram username'ni bir xil ko'rinishga keltiradi", () => {
  assert.equal(normalizeContact(" @Tech_Jadid "), "@Tech_Jadid");
  assert.equal(normalizeContact("https://t.me/Tech_Jadid"), "@Tech_Jadid");
});

test("O'zbekiston telefon raqamini xalqaro ko'rinishga keltiradi", () => {
  assert.equal(normalizeContact("90 123 45 67"), "+998901234567");
  assert.equal(normalizeContact("998 (90) 123-45-67"), "+998901234567");
});

test("Noto'g'ri kontaktni rad etadi", () => {
  assert.equal(normalizeContact("telegram"), null);
  assert.equal(normalizeContact("+99890"), null);
});

test("Ro'yxatdan o'tish formasini normalizatsiya qiladi", () => {
  const form = new FormData();
  form.set("fullName", "  Abdulaziz   Karimov ");
  form.set("contact", "90 123 45 67");
  form.set("login", "Abdulaziz_01");
  form.set("password", "mustahkam-parol");
  form.set("passwordConfirm", "mustahkam-parol");
  form.set("consent", "on");
  assert.deepEqual(parseRegistrationForm(form), {
    ok: true,
    value: {
      fullName: "Abdulaziz Karimov",
      contact: "+998901234567",
      login: "abdulaziz_01",
      password: "mustahkam-parol",
    },
  });
});

test("Mos kelmagan parol va roziliksiz formani rad etadi", () => {
  const form = new FormData();
  form.set("fullName", "Abdulaziz");
  form.set("contact", "@abdulaziz");
  form.set("login", "abdulaziz");
  form.set("password", "mustahkam-parol");
  form.set("passwordConfirm", "boshqa-parol");
  form.set("consent", "on");
  assert.deepEqual(parseRegistrationForm(form), { ok: false, error: "password" });

  form.set("passwordConfirm", "mustahkam-parol");
  form.delete("consent");
  assert.deepEqual(parseRegistrationForm(form), { ok: false, error: "consent" });
});
