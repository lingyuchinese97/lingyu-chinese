"use client";
import * as React from "react";
import { useLocale } from "@/i18n/client";
import type { L } from "@/data/pronunciation";

/** Chọn chữ theo ngôn ngữ đang hiển thị cho nội dung song ngữ `{ vi, en }`. */
export function useL() {
  const locale = useLocale();
  return React.useCallback((l: L) => l[locale] ?? l.vi, [locale]);
}

/** Máy có giọng đọc tiếng Trung không (Web Speech API). Ban đầu false để khớp render server. */
export function useChineseVoice() {
  const [ok, setOk] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const check = () => setOk(window.speechSynthesis.getVoices().some((v) => /^zh|cmn/i.test(v.lang)));
    check();
    window.speechSynthesis.addEventListener?.("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", check);
  }, []);
  return ok;
}

/** Tốc độ đọc (1 = bình thường): chậm để người học nghe rõ từng âm. */
export const SPEECH_RATE = { normal: 0.7, slow: 0.45, syllable: 0.55 } as const;

/**
 * Đọc bằng giọng tiếng Trung của máy. Truyền mảng → đọc từng phần tách rời (vd từng chữ, để nghe thanh gốc trước biến điệu).
 * Không có giọng → không làm gì.
 */
export function speakZh(text: string | string[], rate: number = SPEECH_RATE.normal) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const voices = synth.getVoices();
  const voice = voices.find((v) => /^zh[-_]CN|cmn/i.test(v.lang)) ?? voices.find((v) => /^zh/i.test(v.lang));
  for (const part of Array.isArray(text) ? text : [text]) {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = "zh-CN";
    u.rate = rate;
    if (voice) u.voice = voice;
    synth.speak(u);
  }
}
