"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { submitLead, type LeadFormState } from "@/app/lead-actions";

const INITIAL_STATE: LeadFormState = { status: "idle", message: "" };

export function LeadForm({
  courses,
  defaultCourseSlug,
}: {
  courses: { slug: string; title: string; previewHref: string }[];
  defaultCourseSlug: string;
}) {
  const [state, action] = useActionState(submitLead, INITIAL_STATE);
  const selected =
    courses.find((course) => course.slug === (state.courseSlug ?? defaultCourseSlug)) ??
    courses[0];

  if (state.status === "success") {
    return (
      <div className="lead-success" role="status">
        <span aria-hidden="true">✓</span>
        <div>
          <h3>So&apos;rovingiz qabul qilindi</h3>
          <p>{state.message}</p>
          <Link href={selected.previewHref} className="btn btn-ghost">
            Bepul 1-darsni ko&apos;rish →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="lead-form">
      {state.status === "error" && (
        <p className="lead-form-error" role="alert" aria-live="polite">
          {state.message}
        </p>
      )}
      <div className="lead-form-grid">
        <div className="field">
          <label htmlFor="lead-name">Ismingiz</label>
          <input
            id="lead-name"
            name="fullName"
            placeholder="Masalan: Abdulaziz"
            autoComplete="name"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="lead-phone">Telefon raqamingiz</label>
          <input
            id="lead-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="+998 90 123 45 67"
            autoComplete="tel"
            required
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="lead-course">Qaysi kursga qiziqasiz?</label>
        <select id="lead-course" name="courseSlug" defaultValue={selected.slug} required>
          {courses.map((course) => (
            <option key={course.slug} value={course.slug}>
              {course.title}
            </option>
          ))}
        </select>
      </div>
      <div className="lead-honeypot" aria-hidden="true">
        <label htmlFor="lead-company">Kompaniya</label>
        <input id="lead-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="consent-row">
        <input type="checkbox" name="consent" required />
        <span>
          Sotuvchi kurs bo&apos;yicha menga telefon qilishi va ma&apos;lumotlarimdan
          shu murojaat uchun foydalanishiga roziman.
        </span>
      </label>
      <SubmitButton
        pendingLabel="Yuborilmoqda…"
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center" }}
      >
        Qo&apos;ng&apos;iroq so&apos;rash
      </SubmitButton>
      <p className="lead-form-note">To&apos;lov qilishdan oldin barcha savollaringizga javob beramiz.</p>
    </form>
  );
}
