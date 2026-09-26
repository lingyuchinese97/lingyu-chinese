"use client";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
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
