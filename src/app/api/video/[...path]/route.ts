import { NextRequest, NextResponse } from "next/server";
import { env, isVideoConfigured } from "@/lib/env";
import { verifyVideoToken } from "@/lib/video";
import { getCurrentUser } from "@/lib/auth";

// ============================================================================
// Himoyalangan video proxy — R2'dagi HLS fayllarni imzo tekshiruvi bilan beradi.
//
// URL: /api/video/<videoKey...>/<fayl>?u=<userId>&e=<expiresAt>&t=<token>
// Imzo <videoKey> (dars papkasi) darajasida. Ko'p-renditionli (ABR) HLS'da
// variant playlistlar/segmentlar pastki papkalarda bo'ladi (masalan
// ai-asoslari/01/720p/seg1.ts) — shuning uchun token so'ralgan yo'lning
// istalgan ota-papka prefiksi bo'yicha qabul qilinadi (dars papkasiga imzo
// uning pastki papkalarini ham qamraydi; boshqa darsga o'tmaydi).
//
// m3u8 qayta yozish: nisbiy segment/playlist qatorlariga HAM, #EXT-X-MAP /
// #EXT-X-KEY kabi teglardagi URI="..." qiymatlariga HAM kelgan imzo qo'shiladi
// (fMP4 va shifrlangan HLS ishlashi uchun).
// ============================================================================

const M3U8_TYPE = "application/vnd.apple.mpegurl";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/video/[...path]">) {
  const { path } = await ctx.params;
  if (!isVideoConfigured) {
    return NextResponse.json({ error: "Video hosting ulanmagan" }, { status: 404 });
  }
  if (!Array.isArray(path) || path.length < 2) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const file = path[path.length - 1];
  const dirs = path.slice(0, -1);

  const sp = req.nextUrl.searchParams;
  const userId = sp.get("u") ?? "";
  const expiresAt = Number(sp.get("e") ?? 0);
  const token = sp.get("t") ?? "";

  // Papkadan tashqariga chiqishga urinishni bloklaymiz.
  if (path.some((seg) => seg.includes("..") || seg.includes("\\"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Token yo'lning istalgan ota-papka prefiksiga imzolangan bo'lishi mumkin.
  let verified = false;
  if (userId && token) {
    for (let k = dirs.length; k >= 1; k--) {
      if (verifyVideoToken(dirs.slice(0, k).join("/"), userId, expiresAt, token)) {
        verified = true;
        break;
      }
    }
  }
  if (!verified) {
    return NextResponse.json({ error: "Ruxsat yo'q yoki muddat tugagan" }, { status: 403 });
  }
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.id !== userId) {
    return NextResponse.json({ error: "Sessiya mos emas" }, { status: 403 });
  }

  const upstream = await fetch(`${env.r2PublicBase}/${dirs.join("/")}/${file}`);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Video topilmadi" }, { status: 404 });
  }

  // Playlist — havolalarga KELGAN imzoni (qayta hisoblamasdan) qo'shib qayta yozamiz.
  if (file.endsWith(".m3u8")) {
    const query = `u=${encodeURIComponent(userId)}&e=${expiresAt}&t=${encodeURIComponent(token)}`;
    const withQuery = (uri: string) =>
      /^https?:/i.test(uri) ? uri : `${uri}${uri.includes("?") ? "&" : "?"}${query}`;

    const text = await upstream.text();
    const rewritten = text
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        if (trimmed.startsWith("#")) {
          // #EXT-X-MAP:URI="init.mp4", #EXT-X-KEY:...,URI="key.bin" va h.k.
          return line.replace(/URI="([^"]+)"/g, (_m, uri: string) => `URI="${withQuery(uri)}"`);
        }
        // Nisbiy segment/variant-playlist havolasi (seg_001.ts, 720p/index.m3u8, ...)
        return withQuery(trimmed);
      })
      .join("\n");
    return new NextResponse(rewritten, {
      headers: {
        "content-type": M3U8_TYPE,
        "cache-control": "private, no-store",
      },
    });
  }

  // Segment (.ts/.m4s/.mp4...) — oqim sifatida uzatamiz.
  return new NextResponse(upstream.body, {
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "video/mp2t",
      "cache-control": "private, max-age=300",
    },
  });
}
