"use client";
import * as React from "react";
import { Loader2, NotebookPen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/i18n/client";
import { PRONUNCIATION } from "@/lib/limits";
import { cn } from "@/lib/utils";
import { saveNoteAction } from "../actions";

/** Lưu ghi chú của một mục (topic). Trả nội dung mới (rỗng = đã xoá) hoặc null nếu lỗi. */
export async function saveTopicNote(topic: string, content: string, t: ReturnType<typeof useT>) {
  const r = await saveNoteAction({ topic, content });
  if (!r.ok) {
    toast.error(r.message);
    return null;
  }
  toast.success(r.data ? t("pronunciation.note.saved") : t("pronunciation.note.removed"));
  return r.data?.content ?? "";
}

/**
 * Nút "Ghi chú" của một mục (âm, ví dụ biến điệu...): mở hộp thoại để viết / sửa; để trống = xoá.
 * `value` / `onChange` do cha giữ để hiện nội dung ghi chú ngay bên dưới.
 */
export function TopicNoteButton({
  topic,
  label,
  value,
  onChange,
  compact,
  className,
}: {
  topic: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
  className?: string;
}) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const [saving, setSaving] = React.useState(false);
  const id = React.useId();
  async function save() {
    setSaving(true);
    const next = await saveTopicNote(topic, draft, t);
    setSaving(false);
    if (next === null) return;
    onChange(next);
    setOpen(false);
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(value);
      }}
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label={compact ? t("pronunciation.note.title", { label }) : undefined}
        title={compact ? t("pronunciation.note.title", { label }) : undefined}
        onClick={() => setOpen(true)}
        className={cn(
          value && "border-green-100 bg-green-50 text-green-700 hover:bg-green-100",
          compact && "px-2.5",
          className,
        )}
      >
        <NotebookPen />
        {compact ? null : t("pronunciation.sound.note")}
      </Button>
      <DialogContent
        title={t("pronunciation.note.title", { label })}
        description={t("pronunciation.note.desc")}
        icon={<NotebookPen />}
      >
        <label htmlFor={id} className="sr-only">
          {t("pronunciation.note.label")}
        </label>
        <Textarea
          id={id}
          autoFocus
          rows={5}
          value={draft}
          maxLength={PRONUNCIATION.MAX_TEXT}
          placeholder={t("pronunciation.note.placeholder")}
          onChange={(e) => setDraft(e.target.value)}
        />
        <span className="-mt-2 text-right text-[13px] text-text-3 tabular-nums">
          {draft.length} / {PRONUNCIATION.MAX_TEXT}
        </span>
        <DialogActions>
          <DialogClose asChild>
            <Button variant="secondary">{t("common.cancel")}</Button>
          </DialogClose>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {t("pronunciation.note.save")}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
