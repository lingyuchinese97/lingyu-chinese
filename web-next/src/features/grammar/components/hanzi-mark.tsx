import * as React from "react";
import { cn } from "@/lib/utils";
import { structureLines } from "../schema";

const HAN = /(\p{Script=Han}+)/u;
const isHan = (c: string) => /\p{Script=Han}/u.test(c);

/** Chữ Hán "từ khoá" của một ngữ pháp: chữ Hán trong tiêu đề (vd "Cách dùng 也" → 也); không có thì lấy từ cấu trúc. */
export function grammarKeys(title: string, structure: string): Set<string> {
  const from = (s: string) => [...s].filter(isHan);
  const k = from(title);
  return new Set(k.length ? k : structureLines(structure).flatMap(from));
}

/**
 * Đoạn chữ lẫn Việt – Hán: mỗi cụm chữ Hán hiện bằng font Kai (đỏ mặc định), phần còn lại giữ nguyên.
 * Không dùng hook → dùng được ở cả server lẫn client component.
 */
export function Marked({ text, hanClass }: { text: string; hanClass?: string }) {
  return (
    <>
      {text.split(HAN).map((part, i) =>
        i % 2 ? (
          <span key={i} lang="zh" className={cn("kai mx-0.5 text-[1.3em] leading-none text-[#E1251B]", hanClass)}>
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

/** Chữ Hán: chữ thuộc từ khoá tô đỏ, còn lại giữ màu chữ xung quanh (xanh đậm). */
export function KeyHan({ text, keys }: { text: string; keys: Set<string> }) {
  return (
    <>
      {[...text].map((c, i) => (
        <span key={i} className={keys.has(c) ? "text-[#E1251B]" : undefined}>
          {c}
        </span>
      ))}
    </>
  );
}
