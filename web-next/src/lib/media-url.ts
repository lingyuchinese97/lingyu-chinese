/**
 * Nhận diện link nội dung để luyện nghe (dùng cả ở trình duyệt và server). Người dùng không phải chọn "Nguồn".
 * - YouTube (watch, youtu.be, shorts, live, embed, music.youtube): phát bằng trình phát nhúng CHÍNH THỨC của YouTube.
 *   Không tải video/âm thanh, không tách MP3, không cache, không lấy phụ đề.
 * - TikTok (tiktok.com/@…/video/<id>): trình phát nhúng CHÍNH THỨC của TikTok (player/v1), chỉ phát, không tải video.
 * - Link trực tiếp tới file âm thanh / video (podcast, radio có file .mp3/.m4a…): phát bằng thẻ <audio>/<video> của trình duyệt.
 * - Link phát trực tiếp không có đuôi file (radio online, podcast feed audio): người dùng chọn tab Podcast / Radio → link được
 *   gắn đuôi `#lingyu=audio` (`asAudio()`) để luôn phát bằng thẻ <audio>, kể cả khi mở lại bài đã lưu.
 */
export type MediaSource =
  | { kind: "youtube"; videoId: string; url: string }
  | { kind: "tiktok"; videoId: string; url: string }
  | { kind: "audio" | "video"; url: string };

export const AUDIO_MARK = "#lingyu=audio";
/** Đánh dấu link là âm thanh (radio / podcast phát trực tiếp). */
export function asAudio(raw: string) {
  const t = raw.trim().replace(/#lingyu=audio$/, "");
  return t ? `${/^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`}${AUDIO_MARK}` : "";
}

const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac)$/i;
const VIDEO_EXT = /\.(mp4|m4v|webm|mov)$/i;
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

export function parseMediaUrl(raw: string): MediaSource | null {
  const text = raw.trim();
  if (!text) return null;
  let u: URL;
  try {
    u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, first, second] = u.pathname.split("/");
    if (first === "watch") id = u.searchParams.get("v");
    else if (first && ["shorts", "live", "embed", "v"].includes(first)) id = second ?? null;
  }
  if (id !== null)
    return YT_ID.test(id) ? { kind: "youtube", videoId: id, url: `https://www.youtube.com/watch?v=${id}` } : null;
  if (host === "tiktok.com") {
    const m = u.pathname.match(/^\/(?:@[^/]+\/video|player\/v1|embed(?:\/v2)?)\/(\d{8,25})/);
    return m ? { kind: "tiktok", videoId: m[1]!, url: `https://www.tiktok.com/player/v1/${m[1]}` } : null;
  }
  if (u.hash === AUDIO_MARK) return { kind: "audio", url: u.toString() };
  if (AUDIO_EXT.test(u.pathname)) return { kind: "audio", url: u.toString() };
  if (VIDEO_EXT.test(u.pathname)) return { kind: "video", url: u.toString() };
  return null;
}

/** "75.4" giây → "01:15". */
export function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(r).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "01:15" | "1:02:03" | "75" → giây; sai định dạng → null. */
export function parseTime(text: string): number | null {
  const t = text.trim();
  if (!/^\d+(:\d{1,2}){0,2}(\.\d+)?$/.test(t)) return null;
  return t.split(":").reduce((acc, p) => acc * 60 + Number(p), 0);
}
