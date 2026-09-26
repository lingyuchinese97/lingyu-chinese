"use client";
import * as React from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

const noop = () => () => {};

/** Ghi âm giọng người học rồi nghe lại ngay trên máy (MediaRecorder). Không tải lên đâu cả. */
/** Mỗi câu mới dùng `key` khác để bỏ bản ghi cũ. */
export function Recorder() {
  const t = useT();
  const [state, setState] = React.useState<"idle" | "recording">("idle");
  const [url, setUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const rec = React.useRef<MediaRecorder | null>(null);
  // Render server coi như hỗ trợ; trên máy kiểm tra thật.
  const supported = React.useSyncExternalStore(
    noop,
    () => "MediaRecorder" in window && !!navigator.mediaDevices,
    () => true,
  );

  React.useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);
  React.useEffect(() => () => rec.current?.stream.getTracks().forEach((x) => x.stop()), []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const r = new MediaRecorder(stream);
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((x) => x.stop());
        setUrl(URL.createObjectURL(new Blob(chunks, { type: r.mimeType || "audio/webm" })));
        setState("idle");
      };
      rec.current = r;
      r.start();
      setState("recording");
      // Tối đa 10 giây mỗi lần.
      setTimeout(() => r.state === "recording" && r.stop(), 10_000);
    } catch {
      setError(t("pronunciation.practice.micDenied"));
    }
  }

  if (!supported) return <p className="text-[14px] text-text-3">{t("pronunciation.practice.noRecorder")}</p>;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {state === "recording" ? (
          <Button variant="danger" onClick={() => rec.current?.stop()}>
            <Square />
            {t("pronunciation.practice.stop")}
          </Button>
        ) : (
          <Button variant="secondary" onClick={start}>
            <Mic />
            {t("pronunciation.practice.record")}
          </Button>
        )}
        {state === "recording" ? (
          <span role="status" className="flex items-center gap-2 text-[14px] font-semibold text-red">
            <span className="size-2.5 animate-pulse rounded-full bg-red motion-reduce:animate-none" />
            {t("pronunciation.practice.recording")}
          </span>
        ) : null}
      </div>
      {url ? (
        <div className="flex flex-col gap-1">
          <span className="text-[13.5px] font-semibold text-text-2">{t("pronunciation.practice.mine")}</span>
          <audio src={url} controls className="w-full max-w-[360px]" />
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-[14px] text-red">
          {error}
        </p>
      ) : null}
      <p className="text-[13px] text-text-3">{t("pronunciation.practice.recordHint")}</p>
    </div>
  );
}
