import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/auth";
import { AI_FOUNDATIONS, formatUzs } from "@/lib/course-data";
import { getCourseAdmin, type AdminLesson, type AdminModule } from "@/lib/course";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { listPendingRequests } from "@/lib/enrollment-requests";
import {
  createLesson,
  createStudentAccount,
  deleteQuizQuestion,
  renewMonthlyAccess,
  allowLessonAfterAssessment,
  approveEnrollmentRequest,
  rejectEnrollmentRequest,
  resetStudentPassword,
  updateLesson,
  updatePricing,
  upsertQuizQuestion,
} from "./actions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") {
    return (
      <>
        <SiteNav links={[]} cta={{ href: "/dashboard", label: "Kabinet" }} />
        <main className="shell-narrow" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h1 className="page-title">Ruxsat yo&apos;q</h1>
          <p className="page-sub">Bu sahifa faqat administratorlar uchun.</p>
          <Link href="/dashboard" className="btn btn-primary">Kabinetga qaytish</Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  const course = await getCourseAdmin(AI_FOUNDATIONS.slug);
  const canEdit = course !== null;

  // Tahrirlash mumkin bo'lmasa (demo yoki service key yo'q) — sabab ko'rsatiladi.
  const editBlockReason = !isSupabaseConfigured
    ? "Demo rejim: Supabase ulanmagan — kontent statik (course-data.ts)."
    : !canEdit
      ? "SUPABASE_SERVICE_ROLE_KEY sozlanmagan — tahrirlash uchun .env.local'ga qo'shing."
      : null;

  const lessonCount = course
    ? course.modules.reduce((n, m) => n + m.lessons.length, 0)
    : AI_FOUNDATIONS.modules.reduce((n, m) => n + m.lessons.length, 0);
  const quizCount = course
    ? course.modules.reduce((n, m) => n + m.lessons.reduce((k, l) => k + l.quiz.length, 0), 0)
    : 0;

  const recentPayments = await getRecentPayments();
  const pendingRequests = isSupabaseConfigured ? await listPendingRequests(AI_FOUNDATIONS.slug) : [];

  return (
    <>
      <SiteNav links={[]} cta={{ href: "/dashboard", label: "Kabinet" }} />
      <main className="shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="page-eyebrow">Admin panel</div>
            <h1 className="page-title">Kontent boshqaruvi</h1>
            <p className="page-sub">O&apos;quvchilar, kirishlar, narxlar, darslar va savollarni shu yerdan boshqaring.</p>
          </div>
          <Link href="/admin/homework" className="btn btn-ghost">Uy vazifalarini baholash →</Link>
        </div>

        {saved && (
          <div className="panel" style={{ marginBottom: 16, background: "color-mix(in srgb, var(--green) 10%, var(--card-bg))" }}>
            ✓ Saqlandi.
          </div>
        )}
        {error && (
          <div className="panel" style={{ marginBottom: 16, background: "color-mix(in srgb, var(--red) 10%, var(--card-bg))" }}>
            ⚠️ {error === "invalid" ? "Maydonlar to'liq emas." : error === "duplicate-order" ? "Bu global tartib raqami kursda allaqachon band — boshqa raqam tanlang." : error === "no-service-key" ? "Service key sozlanmagan." : "Saqlashda xatolik yuz berdi."}
          </div>
        )}
        {editBlockReason && (
          <div className="panel" style={{ marginBottom: 16, background: "color-mix(in srgb, var(--yellow) 10%, var(--card-bg))" }}>
            ⚠️ {editBlockReason}
          </div>
        )}

        <section className="panel" id="arizalar" style={{ marginBottom: 16 }}>
          <b>Ro&apos;yxatdan o&apos;tish arizalari {pendingRequests.length > 0 && `(${pendingRequests.length})`}</b>
          <p className="hint" style={{ margin: "8px 0 14px" }}>
            O&apos;quvchi ro&apos;yxatdan o&apos;tgach shu yerda ko&apos;rinadi. Tasdiqlasangiz 1-darsdan boshlab ketma-ket ochiladi.
          </p>
          {pendingRequests.length === 0 ? (
            <p className="hint">Hozircha kutilayotgan ariza yo&apos;q.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingRequests.map((r) => (
                <div
                  key={r.id}
                  className="admin-request-row"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", borderTop: "1px solid var(--line)", paddingTop: 10 }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.fullName ?? "Noma'lum"} {r.login && <span className="hint">@{r.login}</span>}</div>
                    <div className="hint">{r.contact ?? "kontakt yo'q"} · {new Date(r.createdAt).toLocaleString("uz-UZ")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <form action={approveEnrollmentRequest}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="courseSlug" value={r.courseSlug} />
                      <button type="submit" className="btn btn-primary" style={{ padding: "7px 14px", fontSize: 13 }}>Tasdiqlash</button>
                    </form>
                    <form action={rejectEnrollmentRequest}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <button type="submit" className="btn btn-ghost" style={{ padding: "7px 14px", fontSize: 13, color: "var(--red)" }}>Rad etish</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel" id="oquvchi" style={{ marginBottom: 16 }}>
          <b>O&apos;quvchi va kirish</b>
          <p className="hint" style={{ margin: "8px 0 14px" }}>
            Telegram&apos;da chekni tekshirgach login va parol yarating. Ma&apos;lumotlarni xaridorga Telegram orqali yuboring.
          </p>
          {canEdit ? (
            <>
              <form action={createStudentAccount} style={{ display: "grid", gap: 10 }}>
                <input type="hidden" name="courseSlug" value={AI_FOUNDATIONS.slug} />
                <div className="admin-account-grid">
                  <div className="field" style={{ marginBottom: 0 }}><label>Ism</label><input name="fullName" required /></div>
                  <div className="field" style={{ marginBottom: 0 }}><label>Telegram yoki telefon</label><input name="contact" /></div>
                  <div className="field" style={{ marginBottom: 0 }}><label>Login</label><input name="login" pattern="[a-z0-9][a-z0-9_.-]{2,31}" required /></div>
                  <div className="field" style={{ marginBottom: 0 }}><label>Boshlang&apos;ich parol</label><input name="password" type="password" minLength={8} required /></div>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>To&apos;lov tarifi</label>
                  <select name="kind" defaultValue="lifetime">
                    <option value="lifetime">Bir martalik - to&apos;liq 2 oylik kurs</option>
                    <option value="monthly">Oyma-oy - 1-oy</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ justifySelf: "start" }}>Hisob yaratish va kursni ochish</button>
              </form>
              <div className="divider" style={{ margin: "18px 0" }} />
              <div className="admin-tools-grid">
                <form action={renewMonthlyAccess} className="field" style={{ marginBottom: 0 }}>
                  <label>2-oy to&apos;lovini tasdiqlash</label>
                  <input type="hidden" name="courseSlug" value={AI_FOUNDATIONS.slug} />
                  <input name="login" placeholder="o'quvchi login" required />
                  <button type="submit" className="btn btn-ghost" style={{ marginTop: 8 }}>Kirishni 30 kunga uzaytirish</button>
                </form>
                <form action={allowLessonAfterAssessment} id="test-ruxsati" className="field" style={{ marginBottom: 0 }}>
                  <label>Testdan keyin ustoz ruxsati</label>
                  <input type="hidden" name="courseSlug" value={AI_FOUNDATIONS.slug} />
                  <input name="login" placeholder="o'quvchi login" required />
                  <input name="order" type="number" min={1} max={16} placeholder="dars raqami" required style={{ marginTop: 8 }} />
                  <button type="submit" className="btn btn-ghost" style={{ marginTop: 8 }}>Keyingi darsga ruxsat berish</button>
                </form>
                <form action={resetStudentPassword} className="field" style={{ marginBottom: 0 }}>
                  <label>Parolni yangilash</label>
                  <input name="login" placeholder="o'quvchi login" required />
                  <input name="password" type="password" minLength={8} placeholder="yangi parol" required style={{ marginTop: 8 }} />
                  <button type="submit" className="btn btn-ghost" style={{ marginTop: 8 }}>Parolni saqlash</button>
                </form>
              </div>
            </>
          ) : <p className="hint">Bu amal uchun Supabase service key kerak.</p>}
        </section>

        {/* Statistika */}
        <div className="grid-2" style={{ marginBottom: 28 }}>
          <Stat label="Modullar" value={String(course?.modules.length ?? AI_FOUNDATIONS.modules.length)} />
          <Stat label="Darslar" value={String(lessonCount)} />
          <Stat label="Savollar" value={String(quizCount)} />
          <Stat label="Tariflar" value={String(course?.pricing.length ?? AI_FOUNDATIONS.pricing.length)} />
        </div>

        {/* Narxlar */}
        <div className="panel" style={{ marginBottom: 16 }} id="narxlar">
          <b>Narxlar</b>
          {canEdit ? (
            course!.pricing.map((p) => (
              <form key={p.id} action={updatePricing} style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 12 }}>
                <input type="hidden" name="id" value={p.id} />
                <div className="admin-pricing-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                  <div className="field" style={{ marginBottom: 8 }}>
                    <label>Nomi ({p.kind})</label>
                    <input name="label" defaultValue={p.label} required />
                  </div>
                  <div className="field" style={{ marginBottom: 8 }}>
                    <label>Narx (so&apos;m)</label>
                    <input name="priceUzs" type="number" min={0} step={1000} defaultValue={p.priceUzs} required />
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 8 }}>
                  <label>Izoh</label>
                  <input name="note" defaultValue={p.note} />
                </div>
                <button type="submit" className="btn btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }}>Saqlash</button>
              </form>
            ))
          ) : (
            AI_FOUNDATIONS.pricing.map((p) => (
              <div key={p.kind} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--line)", marginTop: 8 }}>
                <span>{p.label}</span>
                <b>{formatUzs(p.priceUzs)}</b>
              </div>
            ))
          )}
        </div>

        {/* Darslar */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <b>{course?.title ?? AI_FOUNDATIONS.title} — dastur</b>
          {canEdit ? (
            <>
              {course!.modules.map((m) => (
                <ModuleEditor key={m.id} module={m} />
              ))}
            </>
          ) : (
            <p className="hint" style={{ marginTop: 10 }}>Tahrirlash uchun Supabase + service key kerak.</p>
          )}
        </div>

        {/* So'nggi to'lovlar */}
        {recentPayments.length > 0 && (
          <div className="panel">
            <b>So&apos;nggi to&apos;lovlar</b>
            {recentPayments.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderTop: "1px solid var(--line)", marginTop: 8, fontSize: 14 }}>
                <span className="hint">{new Date(p.createdAt).toLocaleString("uz-UZ")}</span>
                <span>{p.provider}{p.mock ? " (demo)" : ""} · {p.kind}{p.step === 2 ? " · 2-qism" : ""}</span>
                <b>{formatUzs(p.amountUzs)}</b>
                <span className={`badge ${p.status === "paid" ? "badge-green" : p.status === "pending" ? "badge-blue" : "badge-red"}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

// ---- Modul + dars editorlari (server komponentlar) -------------------------

function ModuleEditor({ module: m }: { module: AdminModule }) {
  const nextOrder = Math.max(0, ...m.lessons.map((l) => l.order)) + 1;
  return (
    <div style={{ marginTop: 18 }}>
      <div className="m-num" style={{ ["--accent" as string]: `var(--${m.accent})` }}>
        {m.code} · {m.title}
      </div>
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
        {m.lessons.map((l) => (
          <LessonEditor key={l.id} lesson={l} />
        ))}
      </div>

      {/* Yangi dars qo'shish */}
      <details style={{ marginTop: 8 }}>
        <summary className="hint" style={{ cursor: "pointer" }}>+ Shu modulga dars qo&apos;shish</summary>
        <form action={createLesson} style={{ marginTop: 10 }}>
          <input type="hidden" name="moduleId" value={m.id} />
          <div className="admin-lesson-create-grid" style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 10 }}>
            <div className="field" style={{ marginBottom: 8 }}>
              <label>Dars nomi</label>
              <input name="title" required />
            </div>
            <div className="field" style={{ marginBottom: 8 }}>
              <label>Global tartib</label>
              <input name="order" type="number" min={1} defaultValue={nextOrder} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>Qo&apos;shish</button>
        </form>
      </details>
    </div>
  );
}

function LessonEditor({ lesson: l }: { lesson: AdminLesson }) {
  const row = (kind: string) => l.rows.find((r) => r.kind === kind)?.text ?? "";
  return (
    <details id={`lesson-${l.id}`} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: "10px 14px" }}>
      <summary style={{ cursor: "pointer", display: "flex", gap: 10, alignItems: "center" }}>
        <span className="li-num">{String(l.order).padStart(2, "0")}</span>
        <span style={{ fontWeight: 600, flex: 1 }}>{l.title}</span>
        <span className="hint">
          {l.isPreview ? "bepul · " : ""}
          Slaydli dars · {l.quiz.length} savol{l.sandboxEnabled ? " · AI" : ""}
        </span>
      </summary>

      <form action={updateLesson} style={{ marginTop: 14 }}>
        <input type="hidden" name="id" value={l.id} />
        <div className="field" style={{ marginBottom: 8 }}>
          <label>Sarlavha</label>
          <input name="title" defaultValue={l.title} required />
        </div>
        <div className="admin-lesson-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Media kaliti (ishlatilmaydi)</label>
            <input name="videoKey" defaultValue={l.videoKey ?? ""} placeholder="ai-asoslari/01" />
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label>YouTube ID (ishlatilmaydi)</label>
            <input name="youtubeId" defaultValue={l.youtubeId ?? ""} />
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Davomiylik (soniya)</label>
            <input name="durationSec" type="number" min={0} defaultValue={l.durationSec} />
          </div>
        </div>
        {(["Nazariy", "Amaliy", "Natija"] as const).map((kind) => (
          <div className="field" key={kind} style={{ marginBottom: 8 }}>
            <label>{kind}</label>
            <textarea name={`row${kind}`} rows={2} defaultValue={row(kind)} />
          </div>
        ))}
        <div className="admin-checkboxes" style={{ display: "flex", gap: 18, alignItems: "center", margin: "10px 0" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <input type="checkbox" name="isPreview" defaultChecked={l.isPreview} /> Bepul preview
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <input type="checkbox" name="sandboxEnabled" defaultChecked={l.sandboxEnabled} /> AI &quot;Sinab ko&apos;ring&quot; maydoni
          </label>
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>Darsni saqlash</button>
      </form>

      {/* Savollar */}
      <div style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
        <b style={{ fontSize: 14 }}>Savollar ({l.quiz.length})</b>
        {l.quiz.map((q) => (
          <details key={q.id} id={`quiz-${q.id}`} style={{ marginTop: 8, border: "1px solid var(--line)", borderRadius: 10, padding: "8px 12px" }}>
            <summary style={{ cursor: "pointer", fontSize: 14 }}>
              {q.order}. {q.prompt} <span className="hint">({q.points} ball)</span>
            </summary>
            <QuizForm lessonId={l.id} question={q} />
            <form action={deleteQuizQuestion} style={{ marginTop: 8 }}>
              <input type="hidden" name="questionId" value={q.id} />
              <button type="submit" className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12, color: "var(--red)" }}>
                Savolni o&apos;chirish
              </button>
            </form>
          </details>
        ))}
        <details style={{ marginTop: 8 }}>
          <summary className="hint" style={{ cursor: "pointer" }}>+ Yangi savol</summary>
          <QuizForm lessonId={l.id} />
        </details>
      </div>
    </details>
  );
}

function QuizForm({
  lessonId,
  question,
}: {
  lessonId: string;
  question?: { id: string; prompt: string; explanation: string | null; points: number; options: { order: number; text: string; isCorrect: boolean }[] };
}) {
  const correctDefault = question?.options.find((o) => o.isCorrect)?.order ?? 1;
  return (
    <form action={upsertQuizQuestion} style={{ marginTop: 10 }}>
      <input type="hidden" name="lessonId" value={lessonId} />
      {question && <input type="hidden" name="questionId" value={question.id} />}
      <div className="field" style={{ marginBottom: 8 }}>
        <label>Savol</label>
        <textarea name="prompt" rows={2} defaultValue={question?.prompt ?? ""} required />
      </div>
      {[1, 2, 3, 4].map((n) => (
        <div key={n} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
          <input
            type="radio"
            name="correct"
            value={n}
            defaultChecked={correctDefault === n}
            title="To'g'ri javob"
            style={{ width: 16, height: 16, flexShrink: 0 }}
          />
          <input
            name={`opt${n}`}
            defaultValue={question?.options.find((o) => o.order === n)?.text ?? ""}
            placeholder={`${n}-variant${n > 2 ? " (ixtiyoriy)" : ""}`}
            style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--mist)", color: "var(--ink)", fontSize: 14, fontFamily: "inherit" }}
          />
        </div>
      ))}
      <div className="admin-quiz-meta" style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: 10 }}>
        <div className="field" style={{ marginBottom: 8 }}>
          <label>Ball</label>
          <input name="points" type="number" min={1} defaultValue={question?.points ?? 10} />
        </div>
        <div className="field" style={{ marginBottom: 8 }}>
          <label>Izoh (javobdan keyin ko&apos;rsatiladi)</label>
          <input name="explanation" defaultValue={question?.explanation ?? ""} />
        </div>
      </div>
      <p className="hint" style={{ margin: "4px 0 8px" }}>Radio — to&apos;g&apos;ri javob belgisi.</p>
      <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
        {question ? "Savolni saqlash" : "Savol qo'shish"}
      </button>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="hint">{label}</div>
    </div>
  );
}

// ---- So'nggi to'lovlar (faqat service key bilan) ----------------------------

interface RecentPayment {
  id: string;
  createdAt: string;
  provider: string;
  kind: string;
  step: number;
  amountUzs: number;
  status: string;
  mock: boolean;
}

async function getRecentPayments(): Promise<RecentPayment[]> {
  const admin = createSupabaseAdmin();
  if (!admin) return [];
  const { data, error } = await admin
    .from("payments")
    .select("id, created_at, provider, kind, step, amount_uzs, status, raw")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) {
    console.error("[admin] recent payments failed", error);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    createdAt: r.created_at as string,
    provider: r.provider as string,
    kind: r.kind as string,
    step: (r.step as number | null) ?? 1,
    amountUzs: r.amount_uzs as number,
    status: r.status as string,
    mock: Boolean((r.raw as { mock?: boolean } | null)?.mock),
  }));
}
