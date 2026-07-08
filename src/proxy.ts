import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ============================================================================
// Proxy (Next.js 16 — avvalgi "middleware"). Har so'rovda Supabase sessiya
// tokenini yangilaydi va cookie'larni javobga yozadi.
// Supabase ulanmagan bo'lsa (DEMO rejim) — hech narsa qilmaydi (passthrough).
// ============================================================================
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });
  if (!url || !key) return response; // DEMO rejim

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // MUHIM: getUser() sessiyani tekshiradi va kerak bo'lsa tokenni yangilaydi.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Statik fayllar va rasm optimizatsiyasidan tashqari hamma yo'l.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
