"use client";
import * as React from "react";
import { Popover } from "radix-ui";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, checkboxClass } from "@/components/ui/badges";
import { VOCAB } from "@/lib/limits";
import { useT } from "@/i18n/client";

/** Chọn nhiều tag có sẵn + tạo tag mới ngay trong danh sách (như bản cũ). */
export function TagPicker({
  value,
  onChange,
  allTags,
  labelId,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  allTags: string[];
  labelId: string;
}) {
  const tr = useT();
  const [extra, setExtra] = React.useState<string[]>([]);
  const [draft, setDraft] = React.useState("");
  const names = [
    ...allTags,
    ...[...extra, ...value].filter((e, i, arr) => arr.findIndex((x) => x.toLowerCase() === e.toLowerCase()) === i),
  ].filter((t, i, arr) => arr.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i);
  const has = (t: string) => value.some((x) => x.toLowerCase() === t.toLowerCase());
  const toggle = (t: string) =>
    onChange(has(t) ? value.filter((x) => x.toLowerCase() !== t.toLowerCase()) : [...value, t]);
  const add = () => {
    const t = draft.trim().slice(0, VOCAB.MAX_TAG);
    if (!t) return;
    if (!names.some((x) => x.toLowerCase() === t.toLowerCase())) setExtra((e) => [...e, t]);
    if (!has(t)) onChange([...value, t]);
    setDraft("");
  };

  return (
    <Popover.Root>
      <div className="flex min-h-12 w-full flex-wrap items-center gap-1.5 rounded-md border-[1.5px] border-border bg-white px-2 py-1.5 hover:border-border-strong">
        {value.map((t) => (
          <Tag key={t} name={t} onRemove={() => onChange(value.filter((x) => x !== t))} />
        ))}
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-labelledby={labelId}
            className="ml-auto inline-flex min-h-9 flex-1 items-center justify-between gap-2 rounded-md px-2 text-left text-[15px] text-text-3 outline-none focus-visible:shadow-[var(--focus-ring)]"
          >
            <span>{value.length ? tr("vocab.tags.addTag") : tr("vocab.tags.chooseTag")}</span>
            <ChevronDown className="size-5 text-text-2" />
          </button>
        </Popover.Trigger>
      </div>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-[60] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-24px)] min-w-[280px] rounded-lg border border-border bg-white p-2 shadow-card"
        >
          <div role="group" aria-label={tr("vocab.tags.list")} className="flex max-h-[240px] flex-col overflow-y-auto">
            {names.length ? (
              names.map((t) => (
                <label
                  key={t}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-blue-50"
                >
                  <input type="checkbox" className={checkboxClass} checked={has(t)} onChange={() => toggle(t)} />
                  <Tag name={t} />
                </label>
              ))
            ) : (
              <p className="p-2 text-sm text-text-3">{tr("vocab.tags.none")}</p>
            )}
          </div>
          <div className="mt-2 flex gap-2 border-t border-border pt-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">{tr("vocab.tags.newName")}</span>
              <Input
                value={draft}
                maxLength={VOCAB.MAX_TAG}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    add();
                  }
                }}
                placeholder={tr("vocab.tags.newPlaceholder")}
                className="h-10"
              />
            </label>
            <Button type="button" size="sm" variant="ghost" onClick={add}>
              <Plus />
              {tr("vocab.tags.add")}
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
