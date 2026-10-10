import { cn } from "@/lib/utils";
import { structureLines } from "../schema";
import { KeyHan } from "./hanzi-mark";

/** "Câu phủ định: A + 不是 + B" → nhãn + công thức (nhãn không chứa chữ Hán, tối đa 30 ký tự). */
export function splitStructure(line: string): { label: string; formula: string } {
  const m = /^([^:：]{1,30})[:：]\s*(.+)$/.exec(line);
  if (m && !/\p{Script=Han}/u.test(m[1]!)) return { label: m[1]!.trim(), formula: m[2]!.trim() };
  return { label: "", formula: line };
}

/** Vai trò của một phần công thức → màu + nhãn (S, V, O, thời gian, nơi chốn, chữ Hán = từ khoá…). */
type Role = "subj" | "time" | "place" | "verb" | "obj" | "noun" | "adj" | "key" | "other";
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
 * Khối "Cấu trúc" (trang chi tiết + popup xem nhanh, theo thiết kế): mỗi dòng cấu trúc một hàng — số thứ tự trong ô tròn,
 * công thức trong ô vàng kem (chữ Hán font Kai), giải thích (phần "nhãn:" của dòng) bên dưới. Màn hình hẹp: tự xuống dòng.
 */
export function StructureRows({ structure, keys }: { structure: string; keys: Set<string> }) {
  const lines = structureLines(structure).map(splitStructure);
  if (!lines.length) return null;
  return (
    <ol className="flex flex-col divide-y divide-[#E8EFF7]">
      {lines.map((l, i) => (
        <li key={i} className="flex items-start gap-4 py-4">
          <span
            aria-hidden="true"
            className="mt-1.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E6F0FC] text-[17px] font-bold text-navy-900"
          >
            {i + 1}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="rounded-[6px] bg-[#FFF4E3] px-4 py-2.5">
              <FormulaLine formula={l.formula} keys={keys} className="text-[18px] text-[#172B4D]" />
            </div>
            {l.label ? <p className="px-1 text-[15.5px] text-[#526B91]">{l.label}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Một công thức "Chủ ngữ + 也 + Động từ": phần chữ Việt xám xanh, "+" xám, chữ Hán Kai lớn (từ khoá đỏ). */
export function FormulaLine({ formula, keys, className }: { formula: string; keys: Set<string>; className?: string }) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-[16px] leading-snug text-[#3B4A6B] [overflow-wrap:anywhere]",
        className,
      )}
    >
      {formulaParts(formula).map((p, k) => (
        <span key={k} className="inline-flex min-w-0 items-center gap-x-2">
          {k ? <span>+</span> : null}
          {/\p{Script=Han}/u.test(p) ? (
            <span lang="zh" className="kai text-[1.5em] leading-none text-navy-900">
              <KeyHan text={p} keys={keys} />
            </span>
          ) : (
            <span>{p}</span>
          )}
        </span>
      ))}
    </p>
  );
}
