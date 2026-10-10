import { cn } from "@/lib/utils";
import { structureLines } from "../schema";

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
 * Khối "Cấu trúc" ở trang chi tiết (theo thiết kế): mỗi dòng cấu trúc một hàng đánh số; các phần nối bằng "+",
 * phần chữ Hán (từ khoá) đỏ font Kai, phần còn lại xanh đậm. Màn hình hẹp: các phần tự xuống dòng.
 */
export function StructureRows({ structure }: { structure: string }) {
  const lines = structureLines(structure).map(splitStructure);
  if (!lines.length) return null;
  return (
    <ol className="flex flex-col gap-2.5">
      {lines.map((l, i) => (
        <li
          key={i}
          className="flex items-start gap-3 rounded-[14px] border border-[#F1E3C8] bg-[#FFFBF3] px-3.5 py-3 md:px-4"
        >
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FFE9C2] text-[13.5px] font-bold text-[#C2570C]"
          >
            {i + 1}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {l.label ? <span className="text-[14px] font-semibold text-text-2">{l.label}</span> : null}
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[17px] leading-snug font-bold text-navy-900 md:text-[18px]">
              {formulaParts(l.formula).map((p, k) => (
                <span key={k} className="inline-flex min-w-0 items-baseline gap-x-2 [overflow-wrap:anywhere]">
                  {k ? (
                    <span className="font-semibold text-text-3">+</span>
                  ) : null}
                  <span
                    lang={/\p{Script=Han}/u.test(p) ? "zh" : undefined}
                    className={cn(/\p{Script=Han}/u.test(p) && "kai-bold text-[1.12em] text-[#D9261C]")}
                  >
                    {p}
                  </span>
                </span>
              ))}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
