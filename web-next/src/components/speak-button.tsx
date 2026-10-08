"use client";
import { useT } from "@/i18n/client";
import * as React from "react";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEECH_RATE } from "@/lib/speech-rate";
import { pickMandarinVoice } from "@/lib/mandarin-voice";

/**
 * Đọc câu tiếng Trung bằng giọng đọc có sẵn của trình duyệt / hệ điều hành (Web Speech API — không gọi dịch vụ ngoài).
 * Máy không có giọng tiếng Trung → nút bị ẩn.
 */
const pick = (voices: SpeechSynthesisVoice[], lang: "zh" | "vi") =>
  lang === "vi" ? (voices.find((v) => /^vi\b/i.test(v.lang.replace(/_/g, "-"))) ?? null) : pickMandarinVoice(voices);

export function SpeakButton({
  text,
  label,
  className,
  children,
  rate,
  voice: lang = "zh",
}: {
  text: string;
  /** Giọng đọc: tiếng Trung Phổ thông (mặc định) hoặc tiếng Việt (đọc nghĩa). */
  voice?: "zh" | "vi";
  /** Tốc độ đọc (mặc định tốc độ chung của app). */
  rate?: number;
  label?: string;
  className?: string;
  /** Chữ hiển thị cạnh biểu tượng (vd "Nghe"); không có thì chỉ hiện biểu tượng. */
  children?: React.ReactNode;
}) {
  const t = useT();
  const [ok, setOk] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const check = () => setOk(!!pick(window.speechSynthesis.getVoices(), lang));
    check();
    window.speechSynthesis.addEventListener?.("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", check);
  }, [lang]);
  if (!ok) return null;
  function speak() {
    const synth = window.speechSynthesis;
    const voice = pick(synth.getVoices(), lang);
    if (!voice) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate ?? SPEECH_RATE.normal;
    u.onend = u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  }
  return (
    <button
      type="button"
      onClick={speak}
      aria-label={children ? undefined : (label ?? t("ui.listen", { text }))}
      title={children ? (label ?? t("ui.listen", { text })) : undefined}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-blue-600 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)]",
        speaking && "bg-blue-50",
        className,
      )}
    >
      <Volume2 className="size-5" aria-hidden="true" />
      {children}
    </button>
  );
}
