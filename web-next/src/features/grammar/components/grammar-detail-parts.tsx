"use client";
import * as React from "react";
import Link from "next/link";
import { Copy, Eye, EyeOff, Loader2, MoreHorizontal, Pencil, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { toast } from "@/components/ui/toaster";
import { SpeakButton } from "@/components/speak-button";
import { useT } from "@/i18n/client";
import { G_LIMITS } from "../schema";
import { KeyHan } from "./hanzi-mark";
import { savePersonalNoteAction } from "../actions";

async function copy(text: string, ok: string, fail: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(ok);
  } catch {
    toast.error(fail);
  }
}

/** Thao tác thêm của một ví dụ (menu ⋯): sao chép cả ví dụ, chỉ câu, chỉ pinyin, sửa. */
function ExampleMenu({
  n,
  example,
  grammarId,
  canEdit,
}: {
  n: number;
  example: { chinese: string; pinyin: string; vietnamese: string };
  grammarId: string;
  canEdit: boolean;
}) {
  const t = useT();
  const full = [example.chinese, example.pinyin, example.vietnamese].filter(Boolean).join("\n");
  const done = (text: string) => copy(text, t("grammar.detail.copied"), t("grammar.detail.copyFailed"));
  return (
    <Menu>
      <MenuTrigger asChild>
        <button type="button" className={roundBtn} aria-label={t("grammar.detail.moreExample", { n })}>
          <MoreHorizontal />
        </button>
      </MenuTrigger>
      <MenuContent align="end" className="w-[230px]">
        <MenuItem onSelect={() => done(full)}>
          <Copy />
          {t("grammar.detail.copy")}
        </MenuItem>
        <MenuItem onSelect={() => done(example.chinese)}>
          <Copy />
          {t("grammar.detail.copyChinese")}
        </MenuItem>
        {example.pinyin ? (
          <MenuItem onSelect={() => done(example.pinyin)}>
            <Copy />
            {t("grammar.detail.copyPinyin")}
          </MenuItem>
        ) : null}
        {canEdit ? (
          <MenuItem asChild>
            <Link href={`/grammar/${grammarId}/edit`}>
              <Pencil />
              {t("grammar.detail.editExamples")}
            </Link>
          </MenuItem>
        ) : null}
      </MenuContent>
    </Menu>
  );
}

const roundBtn =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[#1668DC] outline-none hover:bg-[#E6F1FD] focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-6";

/**
 * Khối "Ví dụ" (theo thiết kế): công tắc "Ẩn pinyin"; mỗi ví dụ đánh số, câu chữ Kai (chữ từ khoá đỏ), pinyin, nghĩa tiếng
 * Việt và nút nghe (+ menu sao chép / sửa ở trang chi tiết). Màn hình hẹp: câu tự xuống dòng.
 */
export function ExampleList({
  examples,
  keys,
  grammarId,
  canEdit,
  menu = true,
}: {
  examples: { id: string; chinese: string; pinyin: string; vietnamese: string }[];
  keys: string[];
  grammarId: string;
  canEdit: boolean;
  /** Hiện menu ⋯ (sao chép, sửa) — tắt trong popup xem nhanh. */
  menu?: boolean;
}) {
  const t = useT();
  const id = React.useId();
  const [hide, setHide] = React.useState(false);
  const keySet = React.useMemo(() => new Set(keys), [keys]);
  return (
    <section aria-labelledby={`${id}-h`} className="flex min-w-0 flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[6px] bg-[#E6F0FC] px-4 py-1.5">
        <h3 id={`${id}-h`} className="py-1 text-[20px] font-bold text-navy-900">
          {t("grammar.detail.examples")}
        </h3>
        {examples.some((e) => e.pinyin) ? (
          <button
            type="button"
            aria-pressed={hide}
            onClick={() => setHide((h) => !h)}
            className="ml-auto inline-flex min-h-9 items-center gap-2 rounded-full px-2 text-[16px] text-[#172B4D] outline-none hover:bg-white/60 focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-5 [&_svg]:text-[#1668DC]"
          >
            {hide ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            {t("grammar.detail.hidePinyin")}
          </button>
        ) : null}
      </div>
      {examples.length ? (
        <ol className="flex flex-col divide-y divide-[#E8EFF7]">
          {examples.map((e, i) => (
            <li key={e.id} className="flex items-start gap-4 px-1 py-5">
              <span
                aria-hidden="true"
                className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E6F0FC] text-[17px] font-bold text-navy-900"
              >
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="sr-only">{t("grammar.form.example", { n: i + 1 })}: </span>
                <p lang="zh" className="kai text-[26px] leading-snug tracking-[0.06em] [overflow-wrap:anywhere] text-navy-900">
                  <KeyHan text={e.chinese} keys={keySet} />
                </p>
                {e.pinyin && !hide ? (
                  <p className="text-[15.5px] [overflow-wrap:anywhere] text-[#526B91]">{e.pinyin}</p>
                ) : null}
                {e.vietnamese ? (
                  <p className="text-[15.5px] [overflow-wrap:anywhere] text-[#172B4D]">{e.vietnamese}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-center gap-2 sm:flex-row">
                <SpeakButton
                  text={e.chinese}
                  label={t("grammar.detail.listenExample", { n: i + 1 })}
                  className={roundBtn}
                />
                {menu ? (
                  <ExampleMenu
                    n={i + 1}
                    example={{ chinese: e.chinese, pinyin: e.pinyin, vietnamese: e.vietnamese }}
                    grammarId={grammarId}
                    canEdit={canEdit}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="pt-3 text-text-3">{t("grammar.detail.empty")}</p>
      )}
    </section>
  );
}

/** Ghi chú cá nhân: thêm / sửa ngay trên trang (chỉ chủ sở hữu thấy). */
export function PersonalNoteCard({ grammarId, initial }: { grammarId: string; initial: string }) {
  const t = useT();
  const [note, setNote] = React.useState(initial);
  const [draft, setDraft] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  async function save() {
    if (draft === null) return;
    setSaving(true);
    const r = await savePersonalNoteAction(grammarId, draft);
    setSaving(false);
    if (!r.ok) return void toast.error(r.message);
    setNote(r.data);
    setDraft(null);
    toast.success(t("grammar.detail.noteSaved"));
  }
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        {draft !== null ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="gd-note" className="sr-only">
              {t("grammar.detail.personal")}
            </label>
            <Textarea
              id="gd-note"
              autoFocus
              value={draft}
              maxLength={G_LIMITS.personalNote}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("grammar.detail.notePlaceholder")}
              className="bg-white"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-text-3 tabular-nums">
                {draft.length} / {G_LIMITS.personalNote}
              </span>
              <Button type="button" size="sm" variant="secondary" className="ml-auto" onClick={() => setDraft(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="button" size="sm" variant="solid" disabled={saving} onClick={save}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                {t("common.save")}
              </Button>
            </div>
          </div>
        ) : note ? (
          <p className="whitespace-pre-line text-text">{note}</p>
        ) : (
          <p className="text-text-2">{t("grammar.detail.noNote")}</p>
        )}
      </div>
      {draft === null ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0 self-start"
          onClick={() => setDraft(note)}
        >
          {note ? <Pencil /> : <Plus />}
          {note ? t("grammar.detail.editNote") : t("grammar.detail.addNote")}
        </Button>
      ) : null}
    </div>
  );
}
