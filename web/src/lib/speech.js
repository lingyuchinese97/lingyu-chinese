// Phát âm tiếng Trung bằng Web Speech API (nếu trình duyệt hỗ trợ).
import { toast } from "../components/ui/feedback.js";

export function speak(text) {
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") throw new Error("unsupported");
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.85;
    const zh = synth.getVoices().find((v) => /zh[-_]CN|cmn|Chinese/i.test(v.lang + v.name));
    if (zh) u.voice = zh;
    synth.speak(u);
  } catch {
    toast("Trình duyệt này chưa hỗ trợ phát âm.", "info");
  }
}
