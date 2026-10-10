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
import { alignPinyin } from "../align";
import { cn } from "@/lib/utils";
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
  "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#D6E6F7] bg-white text-blue-600 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px]";

/**
 * Khối "Ví dụ" (theo thiết kế): nút Ẩn / Hiện pinyin; mỗi ví dụ đánh số, câu chữ Kai lớn (chữ từ khoá màu đỏ),
 * pinyin dưới từng từ, nghĩa tiếng Việt, nút nghe và menu thao tác. Màn hình hẹp: các từ tự xuống dòng.
 */
export function ExampleList({
  examples,
  keys,
  grammarId,
  canEdit,
  title,
}: {
  examples: { id: string; chinese: string; pinyin: string; vietnamese: string }[];
  keys: string[];
  grammarId: string;
  canEdit: boolean;
  title: string;
}) {
  const t = useT();
  const [hide, setHide] = React.useState(false);
  const keySet = React.useMemo(() => new Set(keys), [keys]);
  return (
    <section
      aria-labelledby="gd-examples"
      className="flex min-w-0 flex-col gap-3 rounded-[20px] border border-border bg-white p-4 shadow-[0_4px_18px_rgba(34,93,150,.05)] md:p-5"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id="gd-examples" className="text-[19px] font-bold text-navy-900">
          {title}
        </h2>
        {examples.some((e) => e.pinyin) ? (
          <button
            type="button"
            aria-pressed={hide}
            onClick={() => setHide((h) => !h)}
            className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D6E6F7] bg-white px-4 text-[14.5px] font-semibold text-blue-700 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px]"
          >
            {hide ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
            {hide ? t("grammar.detail.showPinyin") : t("grammar.detail.hidePinyin")}
          </button>
        ) : null}
      </div>
      {examples.length ? (
        <ol className="flex flex-col divide-y divide-border">
          {examples.map((e, i) => (
            <li key={e.id} className="flex items-start gap-3 py-4 first:pt-1 last:pb-1 md:gap-4">
              <span
                aria-hidden="true"
                className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[15px] font-bold text-blue-600"
              >
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="sr-only">{t("grammar.form.example", { n: i + 1 })}: </span>
                <KaiSentence chinese={e.chinese} pinyin={hide ? "" : e.pinyin} keys={keySet} />
                {e.vietnamese ? (
                  <p className="text-[15.5px] [overflow-wrap:anywhere] text-text-2">{e.vietnamese}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-center gap-2 sm:flex-row">
                <SpeakButton
                  text={e.chinese}
                  label={t("grammar.detail.listenExample", { n: i + 1 })}
                  className={roundBtn}
                />
                <ExampleMenu
                  n={i + 1}
                  example={{ chinese: e.chinese, pinyin: e.pinyin, vietnamese: e.vietnamese }}
                  grammarId={grammarId}
                  canEdit={canEdit}
                />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-text-3">{t("grammar.detail.empty")}</p>
      )}
    </section>
  );
}

/** Câu ví dụ chữ Kai: mỗi từ có pinyin ngay bên dưới (không ghép được → câu rồi pinyin một dòng). */
function KaiSentence({ chinese, pinyin, keys }: { chinese: string; pinyin: string; keys: Set<string> }) {
  const parts = pinyin ? alignPinyin(chinese, pinyin) : null;
  const han = "kai-bold text-[20px] leading-tight text-navy-900 md:text-[22px]";
  if (!parts)
    return (
      <div className="min-w-0">
        <p lang="zh" className={cn(han, "[overflow-wrap:anywhere]")}>
          <KeyHan text={chinese} keys={keys} />
        </p>
        {pinyin ? <p className="text-[15px] [overflow-wrap:anywhere] pinyin">{pinyin}</p> : null}
      </div>
    );
  return (
    <p className="flex flex-wrap items-end gap-x-2.5 gap-y-2">
      <span className="sr-only" lang="zh">
        {chinese}
      </span>
      {parts.map((p, i) => (
        <span key={i} aria-hidden="true" className="inline-flex flex-col items-center">
          <span lang="zh" className={han}>
            <KeyHan text={p.zh} keys={keys} />
          </span>
          <span className="text-[14px] leading-tight pinyin">{p.py}</span>
        </span>
      ))}
      <span className="sr-only">{pinyin}</span>
    </p>
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
