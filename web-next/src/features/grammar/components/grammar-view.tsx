import * as React from "react";
import { FileText, Lightbulb } from "lucide-react";
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
  keys,
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
  keys: string[];
  labels: Labels;
  canEdit: boolean;
  menu?: boolean;
}) {
  const keySet = new Set(keys);
  const notes = noteLines(g.notes);
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <p className="flex items-start gap-3 rounded-[12px] bg-[#EEF5FE] px-4 py-3.5 text-[16.5px] whitespace-pre-line [overflow-wrap:anywhere] text-[#172B4D] md:px-5">
        <Lightbulb aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-[#1668DC]" />
        <span className="min-w-0 flex-1">
          <strong className="font-bold text-navy-900">{labels.meaning}:</strong>{" "}
          {g.meaning ? <Marked text={g.meaning} /> : <span className="text-text-3">{labels.empty}</span>}
        </span>
      </p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-0">
        <div className="flex min-w-0 flex-col gap-4 lg:border-r lg:border-[#E8EFF7] lg:pr-6">
          <section className="flex flex-col gap-3">
            <h3 className="text-[22px] font-bold text-navy-900">{labels.structure}</h3>
            {g.structure ? (
              <StructureRows structure={g.structure} keys={keySet} />
            ) : (
              <p className="text-text-3">{labels.empty}</p>
            )}
          </section>
          <section className="flex gap-3 rounded-[12px] bg-[#F1F6FD] px-4 py-4">
            <FileText aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-[#1668DC]" />
            <div className="min-w-0 flex-1">
              <h3 className="text-[17px] font-bold text-navy-900">{labels.remember}:</h3>
              {notes.length ? (
                <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-[15.5px] [overflow-wrap:anywhere] text-[#172B4D] marker:text-navy-900">
                  {notes.map((n, i) => (
                    <li key={i}>
                      <Marked text={n} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-text-3">{labels.empty}</p>
              )}
            </div>
          </section>
        </div>
        <div className="min-w-0 lg:pl-6">
          <ExampleList examples={g.examples} keys={keys} grammarId={g.id} canEdit={canEdit} menu={menu} />
        </div>
      </div>
    </div>
  );
}
