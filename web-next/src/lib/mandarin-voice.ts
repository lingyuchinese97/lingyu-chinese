/**
 * Chọn giọng đọc tiếng Trung PHỔ THÔNG (Mandarin) trong các giọng của trình duyệt / hệ điều hành.
 * Không nhận giọng Quảng Đông (zh-HK, zh-MO, yue…): chữ Hán đọc bằng tiếng Quảng Đông sẽ khác hẳn pinyin hiển thị.
 */
type VoiceLike = { lang: string; name: string };

const CANTONESE = /^(yue|zh-(hk|mo|yue))\b|cantonese|粤|粵|廣東|广东/i;

/** Hạng ưu tiên (nhỏ = tốt), null = không phải giọng Phổ thông. */
export function mandarinRank(v: VoiceLike): number | null {
  const lang = v.lang.replace(/_/g, "-").toLowerCase();
  if (CANTONESE.test(lang) || CANTONESE.test(v.name)) return null;
  if (/^(zh-cn|zh-hans-cn|cmn-hans-cn|cmn-cn)\b/.test(lang)) return 0;
  if (/^(cmn|zh-hans|zh-sg)\b/.test(lang)) return 1;
  if (/^(zh-tw|zh-hant-tw|cmn-hant)\b/.test(lang)) return 2;
  if (lang === "zh") return 3;
  return null;
}

/** Giọng Phổ thông tốt nhất (ưu tiên zh-CN), hoặc null nếu máy không có. */
export function pickMandarinVoice<V extends VoiceLike>(voices: readonly V[]): V | null {
  let best: V | null = null;
  let bestRank = Infinity;
  for (const v of voices) {
    const r = mandarinRank(v);
    if (r !== null && r < bestRank) {
      best = v;
      bestRank = r;
    }
  }
  return best;
}
