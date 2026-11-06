import assert from "node:assert/strict";
import test from "node:test";
import { parseLessonContent } from "./lesson-content";
import { normalizeHomeworkLink, validHomeworkFileMeta } from "./homework-files";
import { canManageSellerStudent, isSeller } from "./roles";

test("lesson kontenti faqat to'liq va xavfsiz bloklarni qabul qiladi", () => {
  assert.equal(
    parseLessonContent(
      JSON.stringify([
        { type: "paragraph", text: "Nazariya" },
        {
          type: "tools",
          title: "Vositalar",
          items: [{ name: "ChatGPT", free: "Free", pro: "Plus" }],
        },
      ]),
    )?.length,
    2,
  );
  assert.equal(
    parseLessonContent(
      JSON.stringify([
        { type: "image", src: "https://evil.test/a.png", alt: "" },
      ]),
    ),
    null,
  );
  assert.equal(
    parseLessonContent(JSON.stringify([{ type: "steps", title: "Qadam" }])),
    null,
  );
});

test("homework fayl hajmi va MIME turi birga tekshiriladi", () => {
  assert.equal(
    validHomeworkFileMeta({ size: 1024, contentType: "application/pdf" }),
    true,
  );
  assert.equal(
    validHomeworkFileMeta({
      size: 11 * 1024 * 1024,
      contentType: "application/pdf",
    }),
    false,
  );
  assert.equal(
    validHomeworkFileMeta({ size: 1024, contentType: "text/html" }),
    false,
  );
});

test("homework havolasi faqat http/https protokollarini qabul qiladi", () => {
  assert.equal(normalizeHomeworkLink("javascript:alert(1)"), null);
  assert.equal(normalizeHomeworkLink("https://example.com/work")?.startsWith("https://"), true);
});

test("seller faqat o'zi yaratgan studentni boshqaradi, admin esa barcha studentni", () => {
  const seller = { id: "seller-1", role: "seller" as const };
  const admin = { id: "admin-1", role: "admin" as const };
  assert.equal(isSeller({ ...seller, name: "", email: "", phone: "" }), true);
  assert.equal(
    canManageSellerStudent(seller, {
      role: "student",
      createdBy: "seller-1",
    }),
    true,
  );
  assert.equal(
    canManageSellerStudent(seller, {
      role: "student",
      createdBy: "seller-2",
    }),
    false,
  );
  assert.equal(
    canManageSellerStudent(admin, {
      role: "student",
      createdBy: "seller-2",
    }),
    true,
  );
  assert.equal(
    canManageSellerStudent(admin, {
      role: "seller",
      createdBy: "admin-1",
    }),
    false,
  );
});
