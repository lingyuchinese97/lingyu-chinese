"use client";
import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { inputClass } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fold } from "@/lib/fold";
import { useT } from "@/i18n/client";
import { T_LEVELS } from "../schema";
import type { LocalItem } from "../service";
import { ItemExplain } from "./item-explain";

/** Kho câu mẫu: lọc theo cấp, ngữ pháp, dạng; tìm theo chữ Hán / pinyin / nghĩa; mở từng câu để xem giải thích. */
export function BankList({
  items,
  grammar,
  initialGrammar,
}: {
  items: LocalItem[];
  grammar: { id: string; name: string }[];
  initialGrammar?: string;
}) {
  const t = useT();
  const [q, setQ] = React.useState("");
  const [level, setLevel] = React.useState(0);
  const [gid, setGid] = React.useState(initialGrammar ?? "");
  const [type, setType] = React.useState("");
  const [open, setOpen] = React.useState<string | null>(null);
  const needle = fold(q).replace(/\s+/g, "");
  const shown = items.filter(
    (i) =>
      (!level || i.level === level) &&
      (!gid || i.grammar.some((g) => g.id === gid)) &&
      (!type || i.type === type) &&
      (!needle ||
        i.zh.includes(q.trim()) ||
        fold(i.py).replace(/\s+/g, "").includes(needle) ||
        i.accepted.some((a) => fold(a).replace(/\s+/g, "").includes(needle))),
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        role="search"
        aria-label={t("translate.filters")}
        className="grid gap-2 rounded-[var(--radius-xl)] border border-border bg-white p-3 shadow-card md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]"
      >
        <label className="relative">
          <span className="sr-only">{t("translate.bankSearch")}</span>
          <Search className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-3" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("translate.bankSearch")}
            className={cn(inputClass, "pl-10")}
          />
        </label>
        <select
          aria-label={t("translate.level")}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className={cn(inputClass, "cursor-pointer")}
        >
          <option value={0}>{t("translate.bankAllLevels")}</option>
          {T_LEVELS.map((n) => (
            <option key={n} value={n}>
              {t("translate.levelN", { n })}
            </option>
          ))}
        </select>
        <select
          aria-label={t("translate.grammarPick")}
          value={gid}
          onChange={(e) => setGid(e.target.value)}
          className={cn(inputClass, "cursor-pointer")}
        >
          <option value="">{t("translate.bankAllGrammar")}</option>
          {grammar.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          aria-label={t("translate.stepType")}
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={cn(inputClass, "cursor-pointer")}
        >
          <option value="">{t("translate.bankAllTypes")}</option>
          <option value="sentence">{t("translate.typeSentence")}</option>
          <option value="paragraph">{t("translate.typeParagraph")}</option>
        </select>
      </div>
      <p className="text-[15px] font-semibold text-text-2" aria-live="polite">
        {t("translate.bankCount", { count: shown.length })}
      </p>
      {shown.length ? (
        <ul className="grid gap-3">
          {shown.map((i) => {
            const on = open === i.id;
            return (
              <li key={i.id} className="rounded-[var(--radius-xl)] border border-border bg-white shadow-card">
                <button
                  type="button"
                  aria-expanded={on}
                  aria-controls={`bank-${i.id}`}
                  onClick={() => setOpen(on ? null : i.id)}
                  className="flex w-full items-start gap-3 rounded-[var(--radius-xl)] p-4 text-left outline-none focus-visible:[box-shadow:var(--focus-ring)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block hanzi text-[19px] font-bold text-navy-900" lang="zh">
                      {i.zh}
                    </span>
                    <span className="block text-[15px] text-text">{i.translation}</span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5 text-[12.5px] font-semibold">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">HSK {i.level}</span>
                      <span className="rounded-full bg-[#F3EEFF] px-2 py-0.5 text-[#6B46C1]">
                        {t(i.type === "sentence" ? "translate.typeSentence" : "translate.typeParagraph")}
                      </span>
                      {i.grammar.map((g) => (
                        <span key={g.id} className="rounded-full bg-[#FFF3D2] px-2 py-0.5 text-[#8A5300]">
                          {g.name}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[14px] font-semibold text-blue-600">
                    <span className="max-sm:sr-only">
                      {on ? t("translate.hideExplain") : t("translate.showExplain")}
                    </span>
                    <ChevronDown className={cn("size-5 transition-transform", on && "rotate-180")} aria-hidden="true" />
                  </span>
                </button>
                {on ? (
                  <div id={`bank-${i.id}`} className="border-t border-border p-4">
                    <ItemExplain item={i} idPrefix={`bank-${i.id}`} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-[var(--radius-xl)] border border-border bg-white p-6 text-center text-text-2">
          {t("translate.bankEmpty")}
        </p>
      )}
    </div>
  );
}
