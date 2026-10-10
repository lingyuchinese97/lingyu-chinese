import * as React from "react";
import { Marked } from "./hanzi-mark";
import { StructureRows } from "./structure-box";
import { ExampleList } from "./grammar-detail-parts";

/** Các dòng ghi chú (bỏ gạch đầu dòng người dùng gõ). */
export const noteLines = (text: string) =>
  text
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-*]+/, "").trim())
    .filter(Boolean);

type Labels = { meaning: string; structure: string; remember: string; empty: string };

/**
 * Nội dung một ngữ pháp theo thiết kế (dùng chung cho trang chi tiết và popup xem nhanh): dải "Ý nghĩa"; hai cột
 * Cấu trúc + Ghi nhớ | Ví dụ (màn hình hẹp xếp chồng). Không dùng hook → dùng được ở server lẫn client.
 */
export function GrammarBody({
  g,
  labels,
  canEdit,
  menu = true,
}: {
  g: {
    id: string;
    meaning: string;
    structure: string;
    notes: string;
    examples: { id: string; chinese: string; pinyin: string; vietnamese: string }[];
  };
  labels: Labels;
  canEdit: boolean;
  menu?: boolean;
}) {
  // Theo thiết kế: chữ Hán xanh đậm font Kai, không tô đỏ từ khoá.
  const none = new Set<string>();
  const notes = noteLines(g.notes);
  const bar = "rounded-[6px] bg-[#E6F0FC] px-4 py-2.5 text-[20px] font-bold text-navy-900";
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <p className="rounded-[8px] bg-[#E9F2FD] px-5 py-4 text-[17px] whitespace-pre-line [overflow-wrap:anywhere] text-[#172B4D]">
        <strong className="font-bold text-navy-900">{labels.meaning}:</strong>{" "}
        {g.meaning ? (
          <Marked text={g.meaning} hanClass="text-navy-900" />
        ) : (
          <span className="text-text-3">{labels.empty}</span>
        )}
      </p>
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-0">
        <div className="flex min-w-0 flex-col gap-1 lg:border-r lg:border-[#E8EFF7] lg:pr-3">
          <section className="flex flex-col">
            <h3 className={bar}>{labels.structure}</h3>
            {g.structure ? (
              <div className="px-1">
                <StructureRows structure={g.structure} keys={none} />
              </div>
            ) : (
              <p className="px-1 py-4 text-text-3">{labels.empty}</p>
            )}
          </section>
          <section className="rounded-[8px] bg-[#F1F6FD] px-5 py-4">
            <h3 className="text-[18px] font-bold text-navy-900">{labels.remember}</h3>
            {notes.length > 1 ? (
              <ul className="mt-1.5 flex list-disc flex-col gap-1.5 pl-5 text-[16px] [overflow-wrap:anywhere] text-[#172B4D]">
                {notes.map((n, i) => (
                  <li key={i}>
                    <Marked text={n} hanClass="text-navy-900" />
                  </li>
                ))}
              </ul>
            ) : notes.length ? (
              <p className="mt-1.5 text-[16px] [overflow-wrap:anywhere] text-[#172B4D]">
                <Marked text={notes[0]!} hanClass="text-navy-900" />
              </p>
            ) : (
              <p className="mt-1 text-text-3">{labels.empty}</p>
            )}
          </section>
        </div>
        <div className="min-w-0 lg:pl-3">
          <ExampleList examples={g.examples} keys={[]} grammarId={g.id} canEdit={canEdit} menu={menu} />
        </div>
      </div>
    </div>
  );
}
