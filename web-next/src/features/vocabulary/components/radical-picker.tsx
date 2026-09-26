"use client";
import * as React from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VOCAB } from "@/lib/limits";
import {
  radicalByNum,
  radicalGlyph,
  radicalLabel,
  radicalMeaning,
  radicalName,
  radicalsOfText,
  searchRadicals,
  type Radical,
} from "@/lib/radicals";
import { useLocale, useT } from "@/i18n/client";

/**
 * Ô chọn bộ thủ: gõ tiếng Việt (thủy, nước, người...) → chọn trong danh sách gợi ý.
 * Bàn phím: ↑/↓ di chuyển, Enter chọn, Esc đóng, Backspace (ô trống) bỏ bộ cuối.
 * Bên dưới có gợi ý bộ thủ nhận ra từ chữ Hán đang nhập.
 */
export function RadicalPicker({
  value,
  onChange,
  hanzi,
  id = "radical-input",
  describedBy,
}: {
  value: number[];
  onChange: (v: number[]) => void;
  hanzi: string;
  id?: string;
  describedBy?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listId = `${id}-list`;

  const matches: Radical[] = q.trim()
    ? searchRadicals(q)
        .filter((r) => !value.includes(r.num))
        .slice(0, 8)
    : [];
  const add = (n: number) => {
    if (value.includes(n) || value.length >= VOCAB.MAX_RADICALS) return;
    onChange([...value, n]);
    setQ("");
    setOpen(false);
  };
  const remove = (n: number) => onChange(value.filter((x) => x !== n));

  const detected = radicalsOfText(hanzi).slice(0, 8);
  const seen = new Set<number>();
  const suggestions = detected.filter(
    (x): x is { char: string; radical: Radical } =>
      !!x.radical && !value.includes(x.radical.num) && !seen.has(x.radical.num) && !!seen.add(x.radical.num),
  );
  const unknown = detected.filter((x) => !x.radical);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div
          className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-md border-[1.5px] border-border bg-white px-2 py-1.5 transition-[border-color,box-shadow] focus-within:border-blue focus-within:shadow-[var(--focus-ring)] hover:border-border-strong"
          onClick={() => inputRef.current?.focus()}
        >
          <div role="list" aria-label={t("vocab.radicalPicker.selected")} className="contents">
            {value.map((n) => {
              const r = radicalByNum(n);
              if (!r) return null;
              return (
                <span
                  role="listitem"
                  key={n}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 py-1 pr-1 pl-2.5 text-sm font-medium text-blue-700"
                >
                  <span className="hanzi text-base" lang="zh">
                    {radicalGlyph(r)}
                  </span>
                  {radicalLabel(r, locale)}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(n);
                      inputRef.current?.focus();
                    }}
                    aria-label={t("vocab.radicalPicker.remove", { name: radicalName(r, locale) })}
                    className="inline-flex size-6 items-center justify-center rounded-full hover:bg-blue-100"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              );
            })}
          </div>
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open && !!q.trim()}
            aria-controls={listId}
            aria-activedescendant={open && matches[active] ? `${id}-opt-${matches[active].num}` : undefined}
            aria-describedby={describedBy}
            autoComplete="off"
            spellCheck={false}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "ArrowDown" && matches.length) {
                e.preventDefault();
                setActive((a) => (a + 1) % matches.length);
              } else if (e.key === "ArrowUp" && matches.length) {
                e.preventDefault();
                setActive((a) => (a - 1 + matches.length) % matches.length);
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (matches[active]) add(matches[active].num);
              } else if (e.key === "Escape" && open) {
                e.stopPropagation();
                setOpen(false);
              } else if (e.key === "Backspace" && !q && value.length) {
                onChange(value.slice(0, -1));
              }
            }}
            placeholder={value.length ? t("vocab.radicalPicker.addMore") : t("vocab.radicalPicker.placeholder")}
            className="min-h-9 min-w-[160px] flex-1 border-0 bg-transparent px-1.5 text-[15.5px] outline-none placeholder:text-[#9AAAC0] focus-visible:shadow-none max-md:text-base"
          />
        </div>
        {open && q.trim() ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={t("vocab.radicalPicker.matches")}
            className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-[320px] overflow-y-auto rounded-lg border border-border bg-white p-1.5 shadow-card"
          >
            {matches.length ? (
              matches.map((r, i) => (
                <li
                  key={r.num}
                  id={`${id}-opt-${r.num}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault(); // giữ focus ở ô nhập
                    add(r.num);
                    inputRef.current?.focus();
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "grid cursor-pointer grid-cols-[64px_1fr_auto] items-center gap-2 rounded-md px-2 py-2 max-md:grid-cols-[64px_1fr]",
                    i === active && "bg-blue-50",
                  )}
                >
                  <span className="text-center hanzi text-xl whitespace-nowrap text-navy" lang="zh">
                    {radicalGlyph(r)}
                  </span>
                  <span className="min-w-0">
                    <strong className="text-text">{radicalName(r, locale)}</strong>{" "}
                    <span className="text-text-2">{radicalMeaning(r, locale)}</span>
                  </span>
                  <span className="text-[13px] text-text-3 max-md:hidden">
                    {t("vocab.radicalPicker.meta", { num: r.num, strokes: r.strokes })}
                  </span>
                </li>
              ))
            ) : (
              <li className="px-3 py-3 text-sm text-text-2">{t("vocab.radicalPicker.notFound", { q: q.trim() })}</li>
            )}
          </ul>
        ) : null}
      </div>
      {suggestions.length || unknown.length ? (
        <div className="flex flex-wrap items-center gap-1.5 text-[13.5px]">
          {suggestions.length ? <span className="text-text-2">{t("vocab.radicalPicker.suggestFrom")}</span> : null}
          {suggestions.map(({ char, radical: r }) => (
            <button
              type="button"
              key={r.num}
              onClick={() => add(r.num)}
              title={t("vocab.radicalPicker.add", { name: radicalName(r, locale) })}
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-dashed border-[#A9D3F8] bg-white px-2.5 text-blue-700 hover:bg-blue-50"
            >
              <span className="hanzi" lang="zh">
                {char}
              </span>
              →
              <span className="hanzi font-semibold" lang="zh">
                {radicalGlyph(r)}
              </span>
              {radicalLabel(r, locale)}
              <Plus className="size-3.5" />
            </button>
          ))}
          {unknown.length ? (
            <span className="text-text-3">
              {t("vocab.radicalPicker.unknown", { chars: unknown.map((x) => x.char).join(" ") })}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
