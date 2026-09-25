"use client";
import * as React from "react";
import type HanziWriter from "hanzi-writer";
import { PenLine, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type State = "loading" | "ready" | "missing" | "quiz" | "done";

/** Khung chữ + animation nét viết (hanzi-writer, dữ liệu nét lấy từ /api/hanzi/[char] — tự host). */
export function StrokeWriter({ char, size = 200, className }: { char: string; size?: number; className?: string }) {
  const box = React.useRef<HTMLDivElement>(null);
  const writer = React.useRef<HanziWriter | null>(null);
  const [state, setState] = React.useState<State>("loading");
  const [mistakes, setMistakes] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    const el = box.current;
    if (!el) return;
    el.innerHTML = "";
    const t = setTimeout(() => {
      setState("loading");
      setMistakes(0);
    }, 0);
    void import("hanzi-writer").then(({ default: HW }) => {
      if (!alive) return;
      writer.current = HW.create(el, char, {
        width: size,
        height: size,
        padding: 8,
        showOutline: true,
        strokeColor: "#073b8c",
        radicalColor: "#d71920",
        outlineColor: "#dceaf6",
        highlightColor: "#1595f5",
        drawingColor: "#0b7be0",
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 250,
        charDataLoader: (c, onLoad, onError) => {
          fetch(`/api/hanzi/${encodeURIComponent(c)}`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
            .then(onLoad, onError);
        },
        onLoadCharDataSuccess: () => alive && setState("ready"),
        onLoadCharDataError: () => alive && setState("missing"),
      });
    });
    return () => {
      alive = false;
      clearTimeout(t);
      writer.current = null;
      el.innerHTML = "";
    };
  }, [char, size]);

  const animate = () => {
    setState("ready");
    void writer.current?.animateCharacter();
  };
  const quiz = () => {
    setMistakes(0);
    setState("quiz");
    void writer.current?.quiz({
      onMistake: () => setMistakes((m) => m + 1),
      onComplete: () => setState("done"),
    });
  };
  const reset = () => {
    writer.current?.cancelQuiz();
    void writer.current?.showCharacter();
    setState("ready");
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className="relative rounded-3xl border-2 border-dashed border-[#A9D3F8] bg-blue-50"
        style={{ width: size + 4, height: size + 4 }}
      >
        {/* Lưới ô chữ điền */}
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full text-[#C9E2F8]">
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeDasharray="4 4" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeDasharray="4 4" />
        </svg>
        <div
          ref={box}
          role="img"
          aria-label={`Chữ ${char}${state === "quiz" ? " — vẽ từng nét vào khung" : ""}`}
          className={cn("relative touch-none", state === "missing" && "hidden")}
        />
        {state === "missing" ? (
          <span
            className="absolute inset-0 flex items-center justify-center hanzi text-navy"
            style={{ fontSize: size * 0.65 }}
            lang="zh"
          >
            {char}
          </span>
        ) : null}
      </div>
      <div aria-live="polite" className="min-h-5 text-center text-sm text-text-2">
        {state === "loading" && "Đang tải nét viết..."}
        {state === "missing" && "Chưa có dữ liệu nét viết cho chữ này."}
        {state === "quiz" && `Vẽ từng nét theo đúng thứ tự.${mistakes ? ` Sai ${mistakes} lần.` : ""}`}
        {state === "done" && `Hoàn thành! ${mistakes ? `Sai ${mistakes} lần.` : "Không sai nét nào."}`}
      </div>
      {state !== "missing" ? (
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" variant="solid" onClick={animate} disabled={state === "loading"}>
            <Play />
            Xem nét viết
          </Button>
          {state === "quiz" || state === "done" ? (
            <Button size="sm" variant="secondary" onClick={reset}>
              <RotateCcw />
              Làm lại
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={quiz} disabled={state === "loading"}>
              <PenLine />
              Luyện viết
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
