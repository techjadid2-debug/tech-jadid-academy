"use client";

interface VideoPlayerProps {
  /** Imzolangan video URL (R2/Bunny). null — hali yuklanmagan. */
  signedUrl: string | null;
  /** Bepul preview uchun YouTube ID */
  youtubeId: string | null;
  /** Watermark matni (foydalanuvchi telefoni/emaili) */
  watermark: string;
  /** Kirish huquqi yo'q (preview ham emas) */
  locked: boolean;
}

export function VideoPlayer({ signedUrl, youtubeId, watermark, locked }: VideoPlayerProps) {
  if (locked) {
    return (
      <div className="player-wrap">
        <div className="player-locked">
          <svg viewBox="0 0 24 24">
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Bu dars qulflangan</div>
          <p style={{ opacity: 0.7, fontSize: 14, maxWidth: 300 }}>
            Kursga ariza yuboring. Guruh va to&apos;lov tasdiqlangach dars jadvali ochiladi.
          </p>
        </div>
      </div>
    );
  }

  // Bepul preview — YouTube embed
  if (youtubeId) {
    return (
      <div className="player-wrap">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
          title="Preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <Watermark text={watermark} />
      </div>
    );
  }

  // Himoyalangan video (signed URL). Hali yuklanmagan bo'lsa — placeholder.
  return (
    <div className="player-wrap">
      {signedUrl ? (
        <video controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} playsInline>
          <source src={signedUrl} type="application/x-mpegURL" />
          Brauzeringiz videoni qo&apos;llab-quvvatlamaydi.
        </video>
      ) : (
        <div className="player-locked" style={{ background: "linear-gradient(180deg,#0b0b0d,#1a1a1f)" }}>
          <svg viewBox="0 0 24 24">
            <path d="M4 6h16v12H4zM10 9l5 3-5 3z" />
          </svg>
          <div style={{ fontWeight: 700, fontSize: 17 }}>Video yozuvi hali biriktirilmagan</div>
          <p style={{ opacity: 0.7, fontSize: 13, maxWidth: 320 }}>
            Darsning matnli materiallari ochiq. Ustoz video yozuvini biriktirgach shu yerda ko&apos;rinadi.
          </p>
        </div>
      )}
      <Watermark text={watermark} />
    </div>
  );
}

/** Dinamik watermark — kamera bilan yozib olsa ham kim ko'rgani ma'lum bo'ladi. */
function Watermark({ text }: { text: string }) {
  return (
    <div className="watermark" aria-hidden>
      <span>{text}</span>
      <span style={{ animationDelay: "-9s" }}>{text}</span>
    </div>
  );
}
