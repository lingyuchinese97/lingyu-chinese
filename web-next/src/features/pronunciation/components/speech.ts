"use client";
import * as React from "react";
import { useLocale } from "@/i18n/client";
import type { L } from "@/data/pronunciation";
import { pickMandarinVoice } from "@/lib/mandarin-voice";

/** Chọn chữ theo ngôn ngữ đang hiển thị cho nội dung song ngữ `{ vi, en }`. */
export function useL() {
  const locale = useLocale();
  return React.useCallback((l: L) => l[locale] ?? l.vi, [locale]);
}

/** Máy có giọng đọc tiếng Trung Phổ thông không (không tính giọng Quảng Đông). Ban đầu false để khớp render server. */
export function useChineseVoice() {
  const [ok, setOk] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const check = () => setOk(!!pickMandarinVoice(window.speechSynthesis.getVoices()));
    check();
    window.speechSynthesis.addEventListener?.("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", check);
  }, []);
  return ok;
}

// ---------- Tốc độ đọc của module Phát âm (người học tự chỉnh, lưu trong trình duyệt) ----------

/** Các mức tốc độ (1 = tốc độ bình thường của giọng máy). Mặc định 0,3 — chậm hơn 50% so với các nút Nghe khác. */
export const PRON_SPEEDS = [0.2, 0.3, 0.45, 0.6, 0.8, 1] as const;
export const PRON_DEFAULT_SPEED = 0.3;
/** "Nghe chậm" và "nghe từng chữ" chậm hơn tốc độ đang chọn. */
const MODE_FACTOR = { normal: 1, slow: 0.65, syllable: 0.85 } as const;
export type SpeakMode = keyof typeof MODE_FACTOR;

const KEY = "lingyu-pron-speed";
const listeners = new Set<() => void>();
export function getPronSpeed(): number {
  try {
    const v = Number(localStorage.getItem(KEY));
    return (PRON_SPEEDS as readonly number[]).includes(v) ? v : PRON_DEFAULT_SPEED;
  } catch {
    return PRON_DEFAULT_SPEED;
  }
}
export function setPronSpeed(v: number) {
  try {
    localStorage.setItem(KEY, String(v));
  } catch {
    /* bộ nhớ trình duyệt bị chặn: chỉ đổi trong phiên này */
  }
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
export const usePronSpeed = () => React.useSyncExternalStore(subscribe, getPronSpeed, () => PRON_DEFAULT_SPEED);
export const rateFor = (mode: SpeakMode, speed = getPronSpeed()) =>
  Math.max(0.1, Math.round(speed * MODE_FACTOR[mode] * 100) / 100);

/**
 * Đọc bằng giọng tiếng Trung Phổ thông của máy. Truyền mảng → đọc từng phần tách rời (vd từng chữ, để nghe thanh gốc
 * trước biến điệu). Không có giọng Phổ thông → không đọc (tránh đọc sai bằng giọng Quảng Đông).
 */
export function speakZh(text: string | string[], mode: SpeakMode = "normal") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  const voice = pickMandarinVoice(synth.getVoices());
  if (!voice) return;
  synth.cancel();
  const rate = rateFor(mode);
  for (const part of Array.isArray(text) ? text : [text]) {
    const u = new SpeechSynthesisUtterance(part);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate;
    synth.speak(u);
  }
}
