"use client";
/**
 * Bút highlight dùng chung (Đọc hiểu, Luyện giao tiếp): lớp canvas phủ lên vùng chữ — nét to, trong (multiply), 5 màu —
 * và nhóm nút trên thanh công cụ (bật bút, chọn màu, hoàn tác, xoá). Nét vẽ chỉ nằm trên máy, không lưu lên máy chủ.
 */
import * as React from "react";
import { Highlighter, Trash2, Undo2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Màu bút highlight (dạ quang): nét to, trong, chữ bên dưới vẫn rõ. */
export const INKS = [
  { key: "yellow", color: "#FFD43B" },
  { key: "green", color: "#69DB7C" },
  { key: "pink", color: "#FF8EC2" },
  { key: "blue", color: "#74C0FC" },
  { key: "orange", color: "#FFA94D" },
] as const;
export type Ink = (typeof INKS)[number]["key"];
/** Nét vẽ: toạ độ chia theo bề rộng tờ giấy để giữ đúng chỗ khi đổi cỡ màn hình. */
export type Stroke = { ink: Ink; pts: [number, number][] };

/** Lớp highlight trên tờ giấy: chỉ nhận chuột / chạm khi bật Bút highlight. */
export function InkLayer({
  strokes,
  setStrokes,
  pen,
  ink,
}: {
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
  pen: boolean;
  ink: Ink;
}) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef<Stroke | null>(null);
  const [box, setBox] = React.useState({ w: 0, h: 0 });

  React.useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const paint = React.useCallback(() => {
    const c = ref.current;
    if (!c || !box.w) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = box.w * dpr;
    c.height = box.h * dpr;
    const g = c.getContext("2d");
    if (!g) return;
    g.scale(dpr, dpr);
    g.lineCap = "round";
    g.lineJoin = "round";
    // Nét cao ~2/3 ô chữ; độ trong do cả lớp canvas đảm nhận (opacity + multiply) nên nét chồng nhau không đậm dần.
    g.lineWidth = Math.min(30, Math.max(14, box.w * 0.045));
    for (const s of drawing.current ? [...strokes, drawing.current] : strokes) {
      g.strokeStyle = INKS.find((i) => i.key === s.ink)?.color ?? INKS[0].color;
      g.beginPath();
      s.pts.forEach(([x, y], i) => (i ? g.lineTo(x * box.w, y * box.w) : g.moveTo(x * box.w, y * box.w)));
      if (s.pts.length === 1) g.lineTo(s.pts[0]![0] * box.w + 0.1, s.pts[0]![1] * box.w);
      g.stroke();
    }
  }, [strokes, box]);
  React.useEffect(paint, [paint]);

  const at = (e: React.PointerEvent): [number, number] => {
    const r = ref.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.width];
  };
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      data-ink
      className={cn(
        "absolute inset-0 z-[2] size-full opacity-45 mix-blend-multiply",
        pen ? "cursor-crosshair touch-none" : "pointer-events-none",
      )}
      onPointerDown={(e) => {
        if (!pen) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drawing.current = { ink, pts: [at(e)] };
        paint();
      }}
      onPointerMove={(e) => {
        if (!drawing.current) return;
        drawing.current.pts.push(at(e));
        paint();
      }}
      onPointerUp={() => {
        const s = drawing.current;
        drawing.current = null;
        if (s) setStrokes((x) => [...x, s]);
      }}
      onPointerCancel={() => {
        drawing.current = null;
        paint();
      }}
    />
  );
}

const tool =
  "inline-flex h-10 items-center gap-2 rounded-[12px] border px-3 text-[14px] font-semibold outline-none focus-visible:shadow-[var(--focus-ring)] disabled:opacity-50 [&_svg]:size-[18px]";

/** Nút trên thanh công cụ: Bút highlight · 5 màu · Hoàn tác · Xóa. */
export function InkTools({
  pen,
  setPen,
  ink,
  setInk,
  strokes,
  setStrokes,
  compact,
}: {
  pen: boolean;
  setPen: React.Dispatch<React.SetStateAction<boolean>>;
  ink: Ink;
  setInk: (i: Ink) => void;
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
  /** Ẩn Hoàn tác / Xóa (chỉ bút + màu). */
  compact?: boolean;
}) {
  const t = useT();
  return (
    <>
      <button
        type="button"
        onClick={() => setPen((x) => !x)}
        aria-pressed={pen}
        className={cn(
          tool,
          pen ? "border-blue-600 bg-blue-50 text-blue-700" : "border-border bg-white text-navy-900 hover:bg-blue-50",
        )}
      >
        <Highlighter className="text-[#E8A400]" aria-hidden="true" />
        {t("reading.pen")}
      </button>
      <div role="radiogroup" aria-label={t("reading.pen")} className="flex items-center gap-1">
        {INKS.map((i) => {
          const name = t("reading.penColor", { color: t(`reading.inkColors.${i.key}`) });
          return (
            <button
              key={i.key}
              type="button"
              role="radio"
              aria-checked={ink === i.key}
              aria-label={name}
              title={name}
              onClick={() => {
                setInk(i.key);
                setPen(true);
              }}
              className="flex size-8 items-center justify-center rounded-full outline-none focus-visible:shadow-[var(--focus-ring)]"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "block size-5 rounded-full",
                  ink === i.key && pen && "ring-2 ring-white ring-offset-2 ring-offset-[#9DB3CC]",
                )}
                style={{ background: i.color }}
              />
            </button>
          );
        })}
      </div>
      {compact ? null : (
        <>
          <button
            type="button"
            onClick={() => setStrokes((x) => x.slice(0, -1))}
            disabled={!strokes.length}
            aria-label={t("reading.undoInkLabel")}
            title={t("reading.undoInkLabel")}
            className={cn(tool, "border-border bg-white px-2.5 text-navy-900 hover:bg-blue-50")}
          >
            <Undo2 className="text-text-2" aria-hidden="true" />
            <span className="sr-only md:not-sr-only">{t("reading.undoInk")}</span>
          </button>
          <button
            type="button"
            onClick={() => setStrokes([])}
            disabled={!strokes.length}
            aria-label={t("reading.clearInkLabel")}
            className={cn(tool, "border-border bg-white text-navy-900 hover:bg-red-50")}
          >
            <Trash2 className="text-text-2" aria-hidden="true" />
            {t("reading.clearInk")}
          </button>
        </>
      )}
    </>
  );
}
