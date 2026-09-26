"use client";
import { useT } from "@/i18n/client";
import * as React from "react";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Đọc câu tiếng Trung bằng giọng đọc có sẵn của trình duyệt / hệ điều hành (Web Speech API — không gọi dịch vụ ngoài).
 * Máy không có giọng tiếng Trung → nút bị ẩn.
 */
export function SpeakButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const t = useT();
  const [ok, setOk] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const check = () => setOk(window.speechSynthesis.getVoices().some((v) => /^zh|cmn/i.test(v.lang)));
    check();
    window.speechSynthesis.addEventListener?.("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", check);
  }, []);
  if (!ok) return null;
  function speak() {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.85;
    const voice =
      synth.getVoices().find((v) => /^zh[-_]CN|cmn/i.test(v.lang)) ??
      synth.getVoices().find((v) => /^zh/i.test(v.lang));
    if (voice) u.voice = voice;
    u.onend = u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  }
  return (
    <button
      type="button"
      onClick={speak}
      aria-label={label ?? t("ui.listen", { text })}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-blue-600 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)]",
        speaking && "bg-blue-50",
        className,
      )}
    >
      <Volume2 className="size-5" aria-hidden="true" />
    </button>
  );
}
