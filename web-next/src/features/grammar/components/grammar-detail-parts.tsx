"use client";
import * as React from "react";
import Link from "next/link";
import { Copy, Loader2, MoreHorizontal, Pencil, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { toast } from "@/components/ui/toaster";
import { SpeakButton } from "@/components/speak-button";
import { useT } from "@/i18n/client";
import { G_LIMITS } from "../schema";
import { savePersonalNoteAction } from "../actions";

async function copy(text: string, ok: string, fail: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(ok);
  } catch {
    toast.error(fail);
  }
}

/** Nút của một ví dụ: Nghe (giọng đọc của máy) · Sao chép · Thêm (chỉ chép câu, chép pinyin, sửa). */
export function ExampleActions({
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
  const iconBtn =
    "inline-flex size-10 items-center justify-center rounded-[12px] border border-border bg-white text-text-2 outline-none hover:border-[#A9D3F8] hover:text-blue-600 focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px]";
  return (
    <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
      <SpeakButton
        text={example.chinese}
        label={t("grammar.detail.listenExample", { n })}
        className="h-10 w-auto gap-2 rounded-[12px] border border-[#CFE3F7] bg-blue-50 px-4 text-[15px] font-semibold hover:bg-blue-100"
      >
        {t("grammar.detail.listen")}
      </SpeakButton>
      <div className="flex gap-2">
        <button
          type="button"
          className={iconBtn}
          aria-label={t("grammar.detail.copyExample", { n })}
          title={t("grammar.detail.copy")}
          onClick={() => copy(full, t("grammar.detail.copied"), t("grammar.detail.copyFailed"))}
        >
          <Copy />
        </button>
        <Menu>
          <MenuTrigger asChild>
            <button type="button" className={iconBtn} aria-label={t("grammar.detail.moreExample", { n })}>
              <MoreHorizontal />
            </button>
          </MenuTrigger>
          <MenuContent align="end" className="w-[230px]">
            <MenuItem
              onSelect={() => copy(example.chinese, t("grammar.detail.copied"), t("grammar.detail.copyFailed"))}
            >
              <Copy />
              {t("grammar.detail.copyChinese")}
            </MenuItem>
            {example.pinyin ? (
              <MenuItem
                onSelect={() => copy(example.pinyin, t("grammar.detail.copied"), t("grammar.detail.copyFailed"))}
              >
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
      </div>
    </div>
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
