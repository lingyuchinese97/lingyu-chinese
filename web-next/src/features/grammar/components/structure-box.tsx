"use client";
import * as React from "react";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import { structureLines } from "../schema";

/**
 * Khung cấu trúc ngữ pháp (thẻ danh sách + trang chi tiết): nền vàng nhạt, biểu tượng cam, chữ đỏ đậm —
 * mỗi dòng là một cấu trúc (1 dòng chính + tối đa 3 dòng thêm).
 */
export function StructureBox({ structure, size = "md" }: { structure: string; size?: "md" | "lg" }) {
  const lines = structureLines(structure);
  if (!lines.length) return null;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[14px] border border-[#F7DC9A] bg-[linear-gradient(135deg,#FFF8E1_0%,#FFF1CC_100%)] px-3.5 py-3",
        size === "lg" && "gap-4 px-4 py-3.5",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-[#FFE2A8] text-[#E07A00]",
          size === "lg" ? "size-12" : "size-10",
        )}
      >
        <Layers className={size === "lg" ? "size-[26px]" : "size-[22px]"} />
      </span>
      <ul
        lang="zh"
        className={cn(
          "flex min-w-0 flex-1 flex-col self-center font-cn leading-snug font-bold [overflow-wrap:anywhere] text-[#D92D20]",
          size === "lg" ? "gap-2 text-[20px]" : "gap-1.5 text-[17px]",
          lines.length > 1 && "divide-y divide-[#F3D58C]",
        )}
      >
        {lines.map((l, i) => (
          <li key={i} className={cn(lines.length > 1 && i > 0 && "pt-1.5")}>
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "Câu phủ định: A + 不是 + B" → nhãn + công thức (nhãn không chứa chữ Hán, tối đa 30 ký tự). */
export function splitStructure(line: string): { label: string; formula: string } {
  const m = /^([^:：]{1,30})[:：]\s*(.+)$/.exec(line);
  if (m && !/\p{Script=Han}/u.test(m[1]!)) return { label: m[1]!.trim(), formula: m[2]!.trim() };
  return { label: "", formula: line };
}

/** Cấu trúc ở trang chi tiết: mỗi dòng một khung (nhãn + công thức), chữ xanh đậm theo thiết kế. */
export function StructureDetail({ structure }: { structure: string }) {
  const lines = structureLines(structure);
  if (!lines.length) return null;
  return (
    <ul className="flex flex-col gap-2.5">
      {lines.map((l, i) => {
        const { label, formula } = splitStructure(l);
        return (
          <li
            key={i}
            className="flex w-fit max-w-full flex-wrap items-baseline gap-x-5 gap-y-1 rounded-[14px] border border-dashed border-[#F2C96B] bg-[#FFF8E6] px-5 py-3"
          >
            {label ? <span className="text-[17px] font-semibold text-navy">{label}:</span> : null}
            <span
              lang="zh"
              className="font-cn text-[22px] leading-snug font-bold [overflow-wrap:anywhere] text-navy md:text-[26px]"
            >
              {formula}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Vai trò của một phần công thức → màu + nhãn (S, V, O, thời gian, nơi chốn, chữ Hán = từ khoá…). */
type Role = "subj" | "time" | "place" | "verb" | "obj" | "noun" | "adj" | "key" | "other";
const ROLE_CLS: Record<Role, string> = {
  subj: "border-[#FFC9D1] bg-[#FFECEF] text-[#E0302F]",
  time: "border-[#FCE3A6] bg-[#FFF5D9] text-[#B26B00]",
  place: "border-[#C8EED6] bg-[#E6F8EE] text-[#1E8A4C]",
  verb: "border-[#CFE1FB] bg-[#EAF3FF] text-[#1F5FCC]",
  obj: "border-[#E2D8FF] bg-[#F1ECFF] text-[#6B3FD0]",
  noun: "border-[#C8EDED] bg-[#E6F8F8] text-[#0B7A7A]",
  adj: "border-[#FFE0C7] bg-[#FFF1E6] text-[#C2570C]",
  key: "border-[#FFC9D1] bg-[#FFF1F3] text-[#D92D20]",
  other: "border-border bg-white text-navy",
};
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
export function roleOf(part: string): Role {
  const p = part.trim();
  if (/\p{Script=Han}/u.test(p)) return "key";
  const f = fold(p);
  if (/^(s|chu ngu|subject)$/.test(f)) return "subj";
  if (/^(v|v\d|dong tu|verb)$/.test(f)) return "verb";
  if (/^(o|tan ngu|object)$/.test(f)) return "obj";
  if (/^(n|danh tu|noun)$/.test(f)) return "noun";
  if (/^(adj|a|tinh tu|adjective)$/.test(f)) return "adj";
  if (/thoi gian|time|khi nao/.test(f)) return "time";
  if (/noi chon|dia diem|place|o dau/.test(f)) return "place";
  return "other";
}

/** Tách công thức theo dấu "+" (giữ nguyên nếu chỉ có một phần). */
export const formulaParts = (formula: string) =>
  formula
    .split(/\s*[+＋]\s*/)
    .map((x) => x.trim())
    .filter(Boolean);

/**
 * Cấu trúc ở trang chi tiết (theo thiết kế): mỗi dòng cấu trúc là một tab đánh số ("Tên: công thức" → tên tab);
 * tab đang chọn hiện công thức thành các ô màu theo vai trò, kèm nhãn vai trò bên dưới.
 */
export function StructureTabs({ structure }: { structure: string }) {
  const t = useT();
  const labels = {
    tab: (n: number) => (n === 1 ? t("grammar.detail.formulaBasic") : t("grammar.detail.formulaN", { n })),
    role: (r: Role) => t(`grammar.detail.roles.${r as "subj"}`),
  };
  const lines = structureLines(structure).map(splitStructure);
  const [on, setOn] = React.useState(0);
  if (!lines.length) return null;
  const cur = lines[Math.min(on, lines.length - 1)]!;
  const parts = formulaParts(cur.formula);
  return (
    <div className="flex flex-col gap-3">
      {lines.length > 1 ? (
        <div role="tablist" aria-label={t("grammar.detail.structure")} className="flex flex-wrap gap-2">
          {lines.map((l, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === on}
              onClick={() => setOn(i)}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-[12px] border-[1.5px] px-3 text-[14.5px] font-semibold",
                i === on
                  ? "border-blue-600 bg-white text-blue-700"
                  : "border-[#F2DDA6] bg-white/70 text-text-2 hover:bg-white",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-[12.5px] font-bold",
                  i === on ? "bg-blue-600 text-white" : "bg-[#EEF2F7] text-text-2",
                )}
              >
                {i + 1}
              </span>
              {l.label || labels.tab(i + 1)}
            </button>
          ))}
        </div>
      ) : cur.label ? (
        <p className="font-semibold text-navy">{cur.label}</p>
      ) : null}
      <div
        role={lines.length > 1 ? "tabpanel" : undefined}
        className="w-fit max-w-full rounded-[16px] border border-[#F2DDA6] bg-white p-3 md:p-4"
      >
        <ol className="flex flex-wrap items-start gap-x-2 gap-y-3">
          {parts.map((p, i) => {
            const r = roleOf(p);
            return (
              <li key={i} className="flex items-start gap-2">
                {i ? (
                  <span aria-hidden="true" className="pt-2 text-[18px] font-bold text-text-3">
                    +
                  </span>
                ) : null}
                <span className="flex min-w-[64px] flex-col items-center gap-1 text-center">
                  <span
                    lang="zh"
                    className={cn(
                      "rounded-[10px] border px-4 py-1.5 font-cn text-[19px] font-bold [overflow-wrap:anywhere] md:text-[21px]",
                      ROLE_CLS[r],
                    )}
                  >
                    {p}
                  </span>
                  {r !== "other" ? <span className="text-[13px] text-text-2">{labels.role(r)}</span> : null}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
