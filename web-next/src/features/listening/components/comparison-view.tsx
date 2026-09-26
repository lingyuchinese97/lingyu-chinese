"use client";
import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { Comparison, DiffPart } from "@/lib/dictation-compare";

/**
 * Hiển thị kết quả so sánh (dùng chung: màn luyện nghe, popup lưu, Bài làm của tôi).
 * Màu ở đây là TRẠNG THÁI SO SÁNH (đúng / sai / thiếu / thừa), không phải màu người dùng tự tô.
 */
export const DIFF_CLASS = {
  correct: "text-green-700",
  wrong: "rounded-[4px] bg-red-100 text-red",
  extra: "rounded-[4px] bg-[#ECEFF4] text-[#6B7A90] line-through decoration-[#9AA8BC]",
  missing: "rounded-[4px] border border-dashed border-amber bg-amber-50 px-0.5 text-[#9A5B00]",
  neutral: "",
} as const;

export function DiffText({ parts, plain, className }: { parts: DiffPart[]; plain?: boolean; className?: string }) {
  const t = useT();
  return (
    <p
      lang="zh"
      className={cn("font-cn text-[19px] leading-[1.9] break-words whitespace-pre-wrap text-text", className)}
    >
      {parts.map((p, i) =>
        p.kind === "missing" ? (
          <mark
            key={i}
            className={cn(DIFF_CLASS.missing, "mx-px")}
            title={t("listening.result.missingTitle", { text: p.text })}
          >
            <span className="sr-only">{t("listening.result.missingTitle", { text: p.text })}</span>
            <span aria-hidden="true">{p.text}</span>
          </mark>
        ) : p.status === "neutral" || (plain && p.status === "correct") ? (
          <React.Fragment key={i}>{p.text}</React.Fragment>
        ) : p.status === "wrong" ? (
          <mark
            key={i}
            data-status="wrong"
            className={DIFF_CLASS.wrong}
            title={t("listening.result.wrongTitle", { expected: p.expected ?? "" })}
          >
            {p.text}
            <span className="sr-only"> ({t("listening.result.wrongTitle", { expected: p.expected ?? "" })})</span>
          </mark>
        ) : p.status === "extra" ? (
          <mark key={i} data-status="extra" className={DIFF_CLASS.extra} title={t("listening.result.extraTitle")}>
            {p.text}
            <span className="sr-only"> ({t("listening.result.extraTitle")})</span>
          </mark>
        ) : (
          <span key={i} data-status="correct" className={DIFF_CLASS.correct}>
            {p.text}
          </span>
        ),
      )}
    </p>
  );
}

/** Pinyin của bài làm (chữ Hán → âm tiết), âm tiết của chữ sai / thừa tô cùng màu. Nạp pinyin-pro khi cần. */
export function DiffPinyin({ parts }: { parts: DiffPart[] }) {
  type Syl = { text: string; status: string };
  const [st, setSt] = React.useState<{ key: string; syl: Syl[] } | null>(null);
  const key = parts.map((p) => (p.kind === "text" ? `${p.status}:${p.text}` : "")).join("|");
  const han = parts.some((p) => p.kind === "text" && /\p{Script=Han}/u.test(p.text));
  React.useEffect(() => {
    if (!han) return;
    let alive = true;
    import("pinyin-pro").then(({ pinyin }) => {
      if (!alive) return;
      const out: { text: string; status: string }[] = [];
      for (const p of parts) {
        if (p.kind !== "text") continue;
        const chars = [...p.text];
        const arr = pinyin(p.text, { type: "array", toneType: "symbol", nonZh: "consecutive" }) as string[];
        // pinyin-pro trả 1 phần tử / chữ Hán, các ký tự khác gộp lại.
        let ci = 0;
        for (const s of arr) {
          const isHan = /\p{Script=Han}/u.test(chars[ci] ?? "");
          ci += isHan ? 1 : [...s].length;
          const txt = isHan
            ? s
            : s
                .replace(/[，、]/g, ",")
                .replace(/。/g, ".")
                .replace(/！/g, "!")
                .replace(/？/g, "?")
                .trim();
          if (txt) out.push({ text: txt, status: isHan ? p.status : "neutral" });
        }
      }
      setSt({ key, syl: out });
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, han]);
  const syl = han && st?.key === key ? st.syl : null;
  if (!syl?.length) return null;
  return (
    <p className="text-[15px] leading-relaxed break-words text-pinyin" aria-hidden="true">
      {syl.map((s, i) => (
        <React.Fragment key={i}>
          {i && !/^[,.!?;:]$/.test(s.text) ? " " : ""}
          <span
            className={cn(s.status === "wrong" && "font-semibold text-red", s.status === "extra" && "text-[#8A97AA]")}
          >
            {s.text}
          </span>
        </React.Fragment>
      ))}
    </p>
  );
}

export function ScoreLine({
  c,
  className,
}: {
  c: Pick<Comparison, "correct" | "total" | "percent">;
  className?: string;
}) {
  const t = useT();
  const tone = c.percent >= 80 ? "text-green-700" : c.percent >= 50 ? "text-[#B86E00]" : "text-red";
  return (
    <p className={cn("flex items-center gap-2 font-bold", tone, className)}>
      <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
      {t("listening.result.score", { correct: c.correct, total: c.total, percent: c.percent })}
    </p>
  );
}

export function Legend({ className }: { className?: string }) {
  const t = useT();
  const items = [
    ["correct", "bg-green"],
    ["wrong", "bg-red"],
    ["missing", "bg-amber"],
    ["extra", "bg-[#A5B1C2]"],
  ] as const;
  return (
    <ul
      aria-label={t("listening.result.legendLabel")}
      className={cn("flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-text-2", className)}
    >
      {items.map(([k, dot]) => (
        <li key={k} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", dot)} aria-hidden="true" />
          {t(`listening.result.legend.${k}`)}
        </li>
      ))}
    </ul>
  );
}
