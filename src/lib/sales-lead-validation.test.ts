import assert from "node:assert/strict";
import test from "node:test";
import {
  canEditSalesLead,
  normalizeSalesPhone,
  parsePublicLeadForm,
} from "./sales-lead-validation";

test("CRM telefon raqamini +998 formatiga keltiradi", () => {
  assert.equal(normalizeSalesPhone("90 123 45 67"), "+998901234567");
  assert.equal(normalizeSalesPhone("+998 (90) 123-45-67"), "+998901234567");
  assert.equal(normalizeSalesPhone("+99890"), null);
  assert.equal(normalizeSalesPhone("@telegram"), null);
});

test("public lead formasi faqat qisqa va rozilik berilgan ma'lumotni qabul qiladi", () => {
  const form = new FormData();
  form.set("fullName", "  Abdulaziz   Karimov ");
  form.set("phone", "90 123 45 67");
  form.set("courseSlug", "ai-builder");
  form.set("consent", "on");
  assert.deepEqual(parsePublicLeadForm(form, ["ai-builder"]), {
    ok: true,
    value: {
      fullName: "Abdulaziz Karimov",
      phone: "+998901234567",
      courseSlug: "ai-builder",
    },
  });

  form.set("company", "spam");
  assert.deepEqual(parsePublicLeadForm(form, ["ai-builder"]), {
    ok: false,
    error: "invalid",
  });
});

test("leadni faqat egasi yoki admin tahrirlaydi", () => {
  assert.equal(
    canEditSalesLead(
      { id: "seller-1", role: "seller" },
      { assignedTo: "seller-1" },
    ),
    true,
  );
  assert.equal(
    canEditSalesLead(
      { id: "seller-2", role: "seller" },
      { assignedTo: "seller-1" },
    ),
    false,
  );
  assert.equal(
    canEditSalesLead(
      { id: "admin-1", role: "admin" },
      { assignedTo: "seller-1" },
    ),
    true,
  );
});
